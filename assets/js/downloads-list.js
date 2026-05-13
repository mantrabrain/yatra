/**
 * Downloads List JavaScript
 * Handles download functionality for the list view with visibility checks
 */

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

document.addEventListener('DOMContentLoaded', function() {
    // Use centralized API helper
    if (typeof window.YatraApiHelper === 'undefined') {
        console.error('YatraApiHelper not loaded');
        return;
    }
    
    // Handle download button clicks
    const downloadButtons = document.querySelectorAll('.yatra-download-btn:not(.yatra-download-btn-disabled)');
    
    downloadButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const downloadId = this.getAttribute('data-download-id');
            const visibility = this.getAttribute('data-visibility');
            
            if (!downloadId) {
                console.error('No download ID found');
                return;
            }
            
            // Show loading state
            const originalContent = this.innerHTML;
            this.innerHTML = '<span class="yatra-download-spinner"></span> ' + __('Getting download...', 'yatra');
            this.disabled = true;
            
            // For booked_only downloads, we need to get booking ID
            // In a real implementation, you'd get this from user's bookings
            if (visibility === 'booked_only') {
                // For demo purposes, we'll try without booking ID first
                // The API will tell us if booking is required
            }
            
            // Make API request to get download URL using centralized helper
            window.YatraApiHelper.getDownloadUrl(downloadId)
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.message || __('Download failed', 'yatra'));
                    });
                }
                return response.json();
            })
            .then(data => {
                if (data.download_url) {
                    // Create temporary link and trigger download
                    const link = document.createElement('a');
                    link.href = data.download_url;
                    link.download = data.filename || 'download';
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else {
                    throw new Error(__('No download URL provided', 'yatra'));
                }
            })
            .catch(error => {
                console.error('Download error:', error);
                
                // Show user-friendly error message
                let errorMessage = __('Download failed. Please try again.', 'yatra');
                if (error.message.includes('booking')) {
                    errorMessage = __('This download requires a booking. Please book this trip first.', 'yatra');
                } else if (error.message.includes('login')) {
                    errorMessage = __('Please log in to download this file.', 'yatra');
                } else if (error.message.includes('permission')) {
                    errorMessage = __('You do not have permission to download this file.', 'yatra');
                }
                
                alert(errorMessage);
            })
            .finally(() => {
                // Restore button state
                this.innerHTML = originalContent;
                this.disabled = false;
            });
        });
    });
    
    // Handle disabled button clicks - show appropriate message
    const disabledButtons = document.querySelectorAll('.yatra-download-btn-disabled');
    
    disabledButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const visibility = this.getAttribute('data-visibility');
            let message = __('Download not available.', 'yatra');

            if (visibility === 'logged_in') {
                message = __('Please log in to download this file.', 'yatra');
            } else if (visibility === 'booked_only') {
                message = __('This download requires a booking for this trip.', 'yatra');
            }
            
            alert(message);
        });
    });
    
    // Add CSS for spinner if not already present
    if (!document.querySelector('#yatra-downloads-spinner-styles')) {
        const style = document.createElement('style');
        style.id = 'yatra-downloads-spinner-styles';
        style.textContent = `
            .yatra-download-spinner {
                display: inline-block;
                width: 16px;
                height: 16px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-top: 2px solid white;
                border-radius: 50%;
                animation: yatra-spin 1s linear infinite;
            }
            
            @keyframes yatra-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
});
