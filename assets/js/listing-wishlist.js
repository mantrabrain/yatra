// Wishlist functionality for trip listing / single / similar trips.

// Translation helpers — idempotent shim matching the other frontend bundles.
(function () {
    if (typeof window.__ === 'function') return;
    if (window.wp && window.wp.i18n && typeof window.wp.i18n.__ === 'function') {
        window.__ = function (text, domain) { return window.wp.i18n.__(text, domain || 'yatra'); };
        window._n = function (s, p, n, domain) { return window.wp.i18n._n(s, p, n, domain || 'yatra'); };
        window._x = function (text, ctx, domain) { return window.wp.i18n._x(text, ctx, domain || 'yatra'); };
        window.sprintf = window.sprintf || (window.wp.i18n.sprintf || function (fmt) { return fmt; });
    } else {
        window.__ = function (text) { return text; };
        window._n = function (s, p, n) { return n === 1 ? s : p; };
        window._x = function (text) { return text; };
        window.sprintf = window.sprintf || function (fmt) { return fmt; };
    }
})();

class TripListingWishlist {
    constructor() {
        const cfg = window.yatraWishlistConfig || {};
        const base = (cfg.restUrl || '').replace(/\/$/, '');
        this.apiUrl = base
            || (window.location && window.location.origin
                ? window.location.origin + '/wp-json/yatra/v1'
                : '/wp-json/yatra/v1');
        this.nonce = cfg.nonce || '';
        this.isLoggedIn = !!cfg.isLoggedIn;
        this.loginUrl = cfg.loginUrl || '/wp-login.php';

        // Server-localized strings — fall back to JS-side __() so the bundle
        // still works if the PHP localizer didn't ship the i18n bag.
        const i = cfg.i18n || {};
        this.strings = {
            loginRequired: i.loginRequired || __('Login Required', 'yatra'),
            loginPrompt:   i.loginPrompt   || __('Please login to save trips to your wishlist.', 'yatra'),
            login:         i.login         || __('Login', 'yatra'),
            cancel:        i.cancel        || __('Cancel', 'yatra'),
            genericError:  i.genericError  || __('An error occurred. Please try again.', 'yatra'),
            saved:         i.saved         || __('Trip saved to wishlist', 'yatra'),
            removed:       i.removed       || __('Trip removed from wishlist', 'yatra'),
            saveFailed:    i.saveFailed    || __('Failed to save trip', 'yatra'),
            removeFailed:  i.removeFailed  || __('Failed to remove trip', 'yatra'),
            addAria:       i.addAria       || __('Add to favorites', 'yatra'),
            removeAria:    i.removeAria    || __('Remove from favorites', 'yatra'),
        };

        // Per-button in-flight guard so rapid double-clicks don't fire two
        // requests. Keyed by trip ID.
        this.inFlight = new Set();

        this.init();
    }

    init() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.yatra-favorite-btn, .yatra-similar-favorite-btn');
            if (btn) {
                e.preventDefault();
                e.stopPropagation();
                this.handleWishlistClick(btn);
            }
        });

        if (this.isLoggedIn) {
            this.checkAllSavedStatus();
        }
    }

    // Hydrate the saved/unsaved state for every wishlist button on the page.
    // We Promise.all the lookups so errors aren't swallowed by `forEach(async)`
    // and the caller can await full settling if needed.
    async checkAllSavedStatus() {
        const buttons = Array.from(document.querySelectorAll(
            '.yatra-favorite-btn[data-trip-id], .yatra-similar-favorite-btn[data-trip-id]'
        ));
        if (buttons.length === 0) return;

        // Dedupe — multiple buttons can point at the same trip (hero +
        // similar-trips card). One lookup, many DOM updates.
        const byId = new Map();
        for (const btn of buttons) {
            const id = parseInt(btn.getAttribute('data-trip-id'), 10);
            if (!id || id <= 0) continue;
            if (!byId.has(id)) byId.set(id, []);
            byId.get(id).push(btn);
        }

        await Promise.all(Array.from(byId.entries()).map(async ([tripId, btns]) => {
            try {
                const response = await fetch(
                    `${this.apiUrl}/saved-trips/check/${tripId}`,
                    {
                        method: 'GET',
                        headers: { 'X-WP-Nonce': this.nonce },
                        credentials: 'same-origin',
                    }
                );
                if (!response.ok) return;
                const data = await response.json();
                if (data && data.success && data.data && data.data.is_saved) {
                    btns.forEach((b) => this.updateButtonState(b, true));
                }
            } catch (error) {
                // Silent — page still functions, button just shows unsaved.
                if (window.console && console.warn) {
                    console.warn('Yatra wishlist: status check failed for trip', tripId, error);
                }
            }
        }));
    }

    handleWishlistClick(btn) {
        if (!this.isLoggedIn) {
            this.showLoginPopup();
            return;
        }

        const tripId = parseInt(btn.getAttribute('data-trip-id'), 10);
        if (!tripId || tripId <= 0) {
            return;
        }

        // Idempotent guard: ignore clicks while a request for this trip is in
        // flight. Prevents double-POSTs from rapid taps / accidental dbl-click.
        if (this.inFlight.has(tripId)) return;

        const isSaved = btn.classList.contains('saved');
        if (isSaved) {
            this.removeFromWishlist(btn, tripId);
        } else {
            this.addToWishlist(btn, tripId);
        }
    }

    // Mirror the new state across every button on the page pointing at this
    // trip ID so the hero + card + similar-trips all stay in sync.
    syncAllButtonsForTrip(tripId, isSaved) {
        document.querySelectorAll(
            `.yatra-favorite-btn[data-trip-id="${tripId}"], .yatra-similar-favorite-btn[data-trip-id="${tripId}"]`
        ).forEach((b) => this.updateButtonState(b, isSaved));
    }

    async addToWishlist(btn, tripId) {
        this.inFlight.add(tripId);
        btn.disabled = true;
        btn.classList.add('loading');

        try {
            const params = new URLSearchParams();
            params.set('trip_id', String(tripId));
            const response = await fetch(`${this.apiUrl}/saved-trips`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-WP-Nonce': this.nonce,
                },
                credentials: 'same-origin',
                body: params.toString(),
            });

            const data = await response.json().catch(() => ({}));
            if (response.ok && data && data.success) {
                this.syncAllButtonsForTrip(tripId, true);
                this.showMessage(data.message || this.strings.saved, 'success', btn);
            } else {
                this.showMessage((data && data.message) || this.strings.saveFailed, 'error', btn);
            }
        } catch (error) {
            if (window.console && console.error) {
                console.error('Yatra wishlist: save failed', error);
            }
            this.showMessage(this.strings.genericError, 'error', btn);
        } finally {
            btn.disabled = false;
            btn.classList.remove('loading');
            this.inFlight.delete(tripId);
        }
    }

    async removeFromWishlist(btn, tripId) {
        this.inFlight.add(tripId);
        btn.disabled = true;
        btn.classList.add('loading');

        try {
            const response = await fetch(`${this.apiUrl}/saved-trips/${tripId}`, {
                method: 'DELETE',
                headers: { 'X-WP-Nonce': this.nonce },
                credentials: 'same-origin',
            });

            const data = await response.json().catch(() => ({}));
            if (response.ok && data && data.success) {
                this.syncAllButtonsForTrip(tripId, false);
                this.showMessage(data.message || this.strings.removed, 'success', btn);
            } else {
                this.showMessage((data && data.message) || this.strings.removeFailed, 'error', btn);
            }
        } catch (error) {
            if (window.console && console.error) {
                console.error('Yatra wishlist: remove failed', error);
            }
            this.showMessage(this.strings.genericError, 'error', btn);
        } finally {
            btn.disabled = false;
            btn.classList.remove('loading');
            this.inFlight.delete(tripId);
        }
    }

    updateButtonState(btn, isSaved) {
        // Visual state is driven entirely by CSS — see
        // `.yatra-favorite-btn.saved` / `.yatra-favorite-btn.is-saved` rules.
        // We only toggle classes + a11y attributes here so the markup
        // stays clean and the CSS can be edited in one place.
        if (isSaved) {
            btn.classList.add('saved', 'is-saved');
            btn.setAttribute('aria-label', this.strings.removeAria);
            btn.setAttribute('title', this.strings.removeAria);
        } else {
            btn.classList.remove('saved', 'is-saved');
            btn.setAttribute('aria-label', this.strings.addAria);
            btn.setAttribute('title', this.strings.addAria);
        }

        // Clear any inline styles a previous version of this script may have
        // left behind so the CSS rules can take effect cleanly.
        if (btn.style.color) btn.style.color = '';
        const svg = btn.querySelector('svg');
        if (svg) {
            if (svg.style.fill)   svg.style.fill = '';
            if (svg.style.stroke) svg.style.stroke = '';
        }
    }

    // Build a login URL that returns the user back to the page they were on
    // after authenticating, rather than dropping them on the dashboard.
    buildLoginUrl() {
        const here = (window.location && window.location.href) || '/';
        try {
            const u = new URL(this.loginUrl, window.location.origin);
            u.searchParams.set('redirect_to', here);
            return u.toString();
        } catch (_e) {
            const sep = this.loginUrl.indexOf('?') >= 0 ? '&' : '?';
            return this.loginUrl + sep + 'redirect_to=' + encodeURIComponent(here);
        }
    }

    // Inject the modal stylesheet once per page. Uses Yatra design tokens
    // (--yatra-primary, --yatra-text-*, --yatra-radius-*, --yatra-shadow-*)
    // from common.css with safe fallbacks if the stylesheet hasn't loaded.
    ensureModalStyles() {
        if (document.getElementById('yatra-login-modal-styles')) return;
        const style = document.createElement('style');
        style.id = 'yatra-login-modal-styles';
        style.textContent = `
            .yatra-login-modal {
                position: fixed; inset: 0; z-index: 100000;
                display: flex; align-items: center; justify-content: center;
                font-family: inherit;
                animation: yatraLoginFade .18s ease-out;
            }
            .yatra-login-modal__overlay {
                position: absolute; inset: 0;
                background: rgba(17, 24, 39, 0.55);
                backdrop-filter: blur(3px);
                -webkit-backdrop-filter: blur(3px);
            }
            .yatra-login-modal__panel {
                position: relative;
                background: var(--yatra-bg-white, #ffffff);
                border-radius: var(--yatra-radius-lg, 16px);
                box-shadow: var(--yatra-shadow-lg, 0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -4px rgba(0,0,0,.1));
                padding: var(--yatra-space-xl, 32px) var(--yatra-space-lg, 24px) var(--yatra-space-lg, 24px);
                max-width: 420px; width: calc(100% - 32px);
                text-align: center; box-sizing: border-box;
                animation: yatraLoginPop .22s cubic-bezier(.2,.9,.4,1.2);
            }
            .yatra-login-modal__close {
                position: absolute; top: var(--yatra-space-sm, 8px); right: var(--yatra-space-sm, 8px);
                width: 32px; height: 32px; border-radius: 50%; border: 0;
                background: transparent; cursor: pointer;
                color: var(--yatra-text-muted, #6b7280);
                display: inline-flex; align-items: center; justify-content: center;
                transition: background .15s ease, color .15s ease;
                padding: 0;
            }
            .yatra-login-modal__close:hover,
            .yatra-login-modal__close:focus-visible {
                background: var(--yatra-bg-gray-100, #f3f4f6);
                color: var(--yatra-text-primary, #1f2937);
                outline: none;
            }
            .yatra-login-modal__icon {
                width: 56px; height: 56px; border-radius: 50%;
                background: var(--yatra-primary-light-soft, #eff6ff);
                color: var(--yatra-primary, #3b82f6);
                display: inline-flex; align-items: center; justify-content: center;
                margin: var(--yatra-space-xs, 4px) auto var(--yatra-space-md, 16px);
            }
            .yatra-login-modal__icon svg { width: 28px; height: 28px; fill: currentColor; }
            .yatra-login-modal__title {
                margin: 0 0 var(--yatra-space-sm, 8px);
                font-size: 20px; font-weight: 700;
                color: var(--yatra-text-primary, #1f2937);
                line-height: 1.3; letter-spacing: -.01em;
            }
            .yatra-login-modal__body {
                margin: 0 0 var(--yatra-space-lg, 24px);
                font-size: 14.5px;
                color: var(--yatra-text-secondary, #4b5563);
                line-height: 1.55;
            }
            .yatra-login-modal__actions {
                display: flex; gap: var(--yatra-space-sm, 10px);
                justify-content: center; flex-wrap: wrap;
            }
            .yatra-login-modal__btn {
                display: inline-flex; align-items: center; justify-content: center;
                min-width: 120px;
                padding: 11px var(--yatra-space-lg, 22px);
                font-size: 14.5px; font-weight: 600;
                border-radius: var(--yatra-radius, 8px);
                cursor: pointer; border: 1px solid transparent;
                transition: transform .08s ease, box-shadow .15s ease, background .15s ease, color .15s ease, border-color .15s ease;
                text-decoration: none; line-height: 1;
                font-family: inherit; box-sizing: border-box;
            }
            .yatra-login-modal__btn:active { transform: translateY(1px); }
            .yatra-login-modal__btn--primary {
                background: var(--yatra-primary, #3b82f6);
                color: var(--yatra-bg-white, #ffffff);
                box-shadow: var(--yatra-shadow-md, 0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -2px rgba(0,0,0,.1));
            }
            .yatra-login-modal__btn--primary:hover,
            .yatra-login-modal__btn--primary:focus-visible {
                background: var(--yatra-primary-dark, #2563eb);
                color: var(--yatra-bg-white, #ffffff);
                outline: none;
            }
            .yatra-login-modal__btn--ghost {
                background: var(--yatra-bg-white, #ffffff);
                color: var(--yatra-text-secondary, #4b5563);
                border-color: var(--yatra-border-color, #e5e7eb);
            }
            .yatra-login-modal__btn--ghost:hover,
            .yatra-login-modal__btn--ghost:focus-visible {
                background: var(--yatra-bg-gray-50, #f9fafb);
                color: var(--yatra-text-primary, #1f2937);
                border-color: var(--yatra-text-light, #9ca3af);
                outline: none;
            }
            @keyframes yatraLoginFade { from { opacity: 0 } to { opacity: 1 } }
            @keyframes yatraLoginPop {
                from { opacity: 0; transform: translateY(8px) scale(.96) }
                to   { opacity: 1; transform: translateY(0)   scale(1) }
            }
            @media (max-width: 480px) {
                .yatra-login-modal__panel {
                    padding: var(--yatra-space-lg, 24px) var(--yatra-space-md, 18px) var(--yatra-space-md, 18px);
                    border-radius: var(--yatra-radius-md, 12px);
                }
                .yatra-login-modal__btn { min-width: 0; flex: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    showLoginPopup() {
        this.ensureModalStyles();

        // Remove an existing instance first to avoid stacking modals.
        const existing = document.getElementById('yatra-login-modal');
        if (existing) existing.remove();

        const loginHref = this.buildLoginUrl();

        const modal = document.createElement('div');
        modal.id = 'yatra-login-modal';
        modal.className = 'yatra-login-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'yatra-login-modal-title');
        modal.setAttribute('aria-describedby', 'yatra-login-modal-body');

        const overlay = document.createElement('div');
        overlay.className = 'yatra-login-modal__overlay';

        const panel = document.createElement('div');
        panel.className = 'yatra-login-modal__panel';

        const closeX = document.createElement('button');
        closeX.type = 'button';
        closeX.className = 'yatra-login-modal__close';
        closeX.setAttribute('aria-label', this.strings.cancel);
        closeX.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

        const iconWrap = document.createElement('div');
        iconWrap.className = 'yatra-login-modal__icon';
        iconWrap.setAttribute('aria-hidden', 'true');
        iconWrap.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7.5-4.5-9.5-9.2C1.1 8.6 2.7 5 6.2 5c2 0 3.3 1 3.8 2 .5-1 1.8-2 3.8-2 3.5 0 5.1 3.6 3.7 6.8C19.5 16.5 12 21 12 21z"/></svg>';

        const title = document.createElement('h3');
        title.id = 'yatra-login-modal-title';
        title.className = 'yatra-login-modal__title';
        title.textContent = this.strings.loginRequired;

        const body = document.createElement('p');
        body.id = 'yatra-login-modal-body';
        body.className = 'yatra-login-modal__body';
        body.textContent = this.strings.loginPrompt;

        const actions = document.createElement('div');
        actions.className = 'yatra-login-modal__actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'yatra-login-modal__btn yatra-login-modal__btn--ghost';
        cancelBtn.textContent = this.strings.cancel;

        const loginLink = document.createElement('a');
        loginLink.href = loginHref;
        loginLink.className = 'yatra-login-modal__btn yatra-login-modal__btn--primary';
        loginLink.textContent = this.strings.login;

        // Cancel on the left, Login (primary action) on the right — matches
        // standard dialog conventions on web/macOS.
        actions.appendChild(cancelBtn);
        actions.appendChild(loginLink);
        panel.appendChild(closeX);
        panel.appendChild(iconWrap);
        panel.appendChild(title);
        panel.appendChild(body);
        panel.appendChild(actions);
        modal.appendChild(overlay);
        modal.appendChild(panel);

        const prevOverflow = document.body.style.overflow;
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        const closeModal = () => {
            modal.remove();
            document.body.style.overflow = prevOverflow;
            document.removeEventListener('keydown', onKey);
        };
        const onKey = (e) => {
            if (e.key === 'Escape') closeModal();
            // Trap Tab focus within the dialog.
            if (e.key === 'Tab') {
                const focusables = [closeX, cancelBtn, loginLink];
                const idx = focusables.indexOf(document.activeElement);
                if (e.shiftKey) {
                    if (idx <= 0) { e.preventDefault(); focusables[focusables.length - 1].focus(); }
                } else {
                    if (idx === focusables.length - 1) { e.preventDefault(); focusables[0].focus(); }
                }
            }
        };

        overlay.addEventListener('click', closeModal);
        closeX.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);
        document.addEventListener('keydown', onKey);

        // Focus the primary action so keyboard users can press Enter to log in.
        setTimeout(() => { try { loginLink.focus(); } catch (_e) {} }, 0);
    }

    showMessage(message, type, button) {
        const existingToast = document.getElementById('yatra-wishlist-toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.id = 'yatra-wishlist-toast';
        toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
        toast.textContent = message;

        const rect = button.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        toast.style.cssText = `
            position: absolute;
            top: ${rect.bottom + scrollTop + 10}px;
            left: ${rect.left + scrollLeft}px;
            padding: 10px 16px;
            border-radius: 8px;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
            white-space: nowrap;
            font-size: 14px;
            pointer-events: none;
            background-color: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: #ffffff;
            opacity: 0;
            transform: translateY(-10px);
        `;

        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            setTimeout(() => { if (toast.parentNode) toast.remove(); }, 300);
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const cfg = window.yatraWishlistConfig || {};
    if (!cfg.enabled) return;
    window.tripListingWishlist = new TripListingWishlist();
});
