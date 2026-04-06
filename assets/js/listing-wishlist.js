// Wishlist functionality for trip listing page (Yatra Pro + setting)
class TripListingWishlist {
    constructor() {
        var cfg = window.yatraWishlistConfig || {};
        var base = (cfg.restUrl || '').replace(/\/$/, '');
        this.apiUrl = base || (window.location && window.location.origin ? window.location.origin + '/wp-json/yatra/v1' : '/wp-json/yatra/v1');
        this.nonce = cfg.nonce || '';
        this.isLoggedIn = !!cfg.isLoggedIn;
        
        // Debug logging
        
        
        this.init();
    }

    init() {
        // Handle wishlist button clicks
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.yatra-favorite-btn, .yatra-similar-favorite-btn');
            if (btn) {
                e.preventDefault();
                e.stopPropagation();
                this.handleWishlistClick(btn);
            }
        });

        // Check saved status for all trips if logged in
        if (this.isLoggedIn) {
            this.checkAllSavedStatus();
        }
    }

    async checkAllSavedStatus() {
        const buttons = document.querySelectorAll('.yatra-favorite-btn[data-trip-id], .yatra-similar-favorite-btn[data-trip-id]');
        buttons.forEach(async (btn) => {
            const tripId = btn.getAttribute('data-trip-id');
            if (tripId) {
                try {
                    const response = await fetch(
                        `${this.apiUrl}/saved-trips/check/${tripId}`,
                        {
                            method: 'GET',
                            headers: {
                                'X-WP-Nonce': this.nonce
                            },
                            credentials: 'same-origin'
                        }
                    );

                    const data = await response.json();
                    if (data.success && data.data.is_saved) {
                        this.updateButtonState(btn, true);
                    }
                } catch (error) {
                    console.error('Error checking wishlist status:', error);
                }
            }
        });
    }

    handleWishlistClick(btn) {
        if (!this.isLoggedIn) {
            this.showLoginPopup();
            return;
        }

        const tripId = btn.getAttribute('data-trip-id');
        if (!tripId) {
            console.error('Trip ID not found');
            return;
        }

        const isSaved = btn.classList.contains('saved');
        if (isSaved) {
            this.removeFromWishlist(btn, tripId);
        } else {
            this.addToWishlist(btn, tripId);
        }
    }

    async addToWishlist(btn, tripId) {
        btn.disabled = true;
        btn.classList.add('loading');

        try {
            const params = new URLSearchParams();
            params.set('trip_id', String(parseInt(tripId, 10)));
            const response = await fetch(`${this.apiUrl}/saved-trips`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-WP-Nonce': this.nonce
                },
                credentials: 'same-origin',
                body: params.toString()
            });

            const data = await response.json();
            if (data.success) {
                this.updateButtonState(btn, true);
                this.showMessage(data.message || 'Trip saved to wishlist', 'success', btn);
            } else {
                this.showMessage(data.message || 'Failed to save trip', 'error', btn);
            }
        } catch (error) {
            console.error('Error saving trip:', error);
            this.showMessage('An error occurred. Please try again.', 'error', btn);
        } finally {
            btn.disabled = false;
            btn.classList.remove('loading');
        }
    }

    async removeFromWishlist(btn, tripId) {
        btn.disabled = true;
        btn.classList.add('loading');

        try {
            const response = await fetch(`${this.apiUrl}/saved-trips/${tripId}`, {
                method: 'DELETE',
                headers: {
                    'X-WP-Nonce': this.nonce
                },
                credentials: 'same-origin'
            });

            const data = await response.json();
            if (data.success) {
                this.updateButtonState(btn, false);
                this.showMessage(data.message || 'Trip removed from wishlist', 'success', btn);
            } else {
                this.showMessage(data.message || 'Failed to remove trip', 'error', btn);
            }
        } catch (error) {
            console.error('Error removing trip:', error);
            this.showMessage('An error occurred. Please try again.', 'error', btn);
        } finally {
            btn.disabled = false;
            btn.classList.remove('loading');
        }
    }

    updateButtonState(btn, isSaved) {
        if (isSaved) {
            btn.classList.add('saved', 'is-saved');
            btn.setAttribute('aria-label', 'Remove from favorites');
            btn.setAttribute('title', 'Remove from favorites');
            // Fill the heart icon and change color
            const svg = btn.querySelector('svg');
            if (svg) {
                svg.style.fill = 'currentColor';
                svg.style.stroke = 'currentColor';
                btn.style.color = '#ef4444';
            }
        } else {
            btn.classList.remove('saved', 'is-saved');
            btn.setAttribute('aria-label', 'Add to favorites');
            btn.setAttribute('title', 'Add to favorites');
            // Unfill the heart icon
            const svg = btn.querySelector('svg');
            if (svg) {
                svg.style.fill = 'none';
                svg.style.stroke = 'currentColor';
                btn.style.color = '';
            }
        }
    }

    showLoginPopup() {
        // Create a simple modal for login prompt
        const modal = document.createElement('div');
        modal.className = 'yatra-login-modal';
        modal.innerHTML = `
            <div class="yatra-login-modal-overlay"></div>
            <div class="yatra-login-modal-content">
                <div class="yatra-login-prompt">
                    <h3>Login Required</h3>
                    <p>Please login to save trips to your wishlist.</p>
                    <div class="yatra-login-buttons">
                        <a href="${window.yatraAdmin?.login_url || '/wp-login.php'}" class="yatra-btn yatra-btn-primary">Login</a>
                        <button type="button" class="yatra-btn yatra-btn-secondary yatra-close-modal">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        // Add styles
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        const overlay = modal.querySelector('.yatra-login-modal-overlay');
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
        `;
        
        const content = modal.querySelector('.yatra-login-modal-content');
        content.style.cssText = `
            position: relative;
            background: white;
            border-radius: 8px;
            padding: 40px;
            max-width: 400px;
            width: 90%;
            text-align: center;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
        
        // Handle close
        const closeModal = () => {
            modal.remove();
            document.body.style.overflow = '';
        };
        
        overlay.addEventListener('click', closeModal);
        modal.querySelector('.yatra-close-modal').addEventListener('click', closeModal);
    }

    showMessage(message, type, button) {
        // Remove existing toast if any
        const existingToast = document.getElementById('yatra-wishlist-toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Create toast near the button
        const toast = document.createElement('div');
        toast.id = 'yatra-wishlist-toast';
        toast.textContent = message;
        
        // Position relative to button
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
        
        // Animate in
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        // Remove after delay
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    var cfg = window.yatraWishlistConfig || {};
    if (!cfg.enabled) {
        return;
    }
    window.tripListingWishlist = new TripListingWishlist();
});
