/**
 * Yatra reCAPTCHA v3 helper.
 *
 * Exposes window.yatraRecaptcha.execute(action) -> Promise<token> and
 * window.yatraRecaptcha.protects(form) -> bool. Form submit handlers call
 * execute() right before sending, then include the token as `recaptcha_token`.
 *
 * The config object (siteKey, enabled, forms) is injected by
 * wp_localize_script before this file runs; we augment it with methods.
 *
 * @package Yatra
 */
(function () {
    var cfg = (window.yatraRecaptcha = window.yatraRecaptcha || {});

    /**
     * Get a fresh v3 token for the given action. Resolves to '' (never rejects)
     * if reCAPTCHA is unavailable, so a script/network failure can be handled by
     * the caller / server rather than throwing in the submit path.
     *
     * @param {string} action
     * @returns {Promise<string>}
     */
    cfg.execute = function (action) {
        return new Promise(function (resolve) {
            try {
                if (!cfg.enabled || !cfg.siteKey || typeof grecaptcha === 'undefined') {
                    resolve('');
                    return;
                }
                grecaptcha.ready(function () {
                    grecaptcha
                        .execute(cfg.siteKey, { action: action || 'submit' })
                        .then(function (token) {
                            resolve(token || '');
                        })
                        .catch(function () {
                            resolve('');
                        });
                });
            } catch (e) {
                resolve('');
            }
        });
    };

    /**
     * Whether a given form is configured to be protected.
     * @param {string} form
     * @returns {boolean}
     */
    cfg.protects = function (form) {
        return !!(cfg.enabled && cfg.forms && cfg.forms[form]);
    };
})();
