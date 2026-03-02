/**
 * Downloads List JavaScript
 * Handles download functionality for the list view with visibility checks
 */

document.addEventListener('DOMContentLoaded', function() {
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
            this.innerHTML = '<span class="yatra-download-spinner"></span> Getting download...';
            this.disabled = true;
            
            // Build API URL with booking ID if needed
            let apiUrl = `/wp-json/yatra/v1/downloads/${downloadId}/download-url`;
            
            // For booked_only downloads, we need to get booking ID
            // In a real implementation, you'd get this from user's bookings
            if (visibility === 'booked_only') {
                // For demo purposes, we'll try without booking ID first
                // The API will tell us if booking is required
            }
            
            // Make API request to get download URL
            fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'X-WP-Nonce': yatraVars?.nonce || ''
                }
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => {
                        throw new Error(err.message || 'Download failed');
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
                    throw new Error('No download URL provided');
                }
            })
            .catch(error => {
                console.error('Download error:', error);
                
                // Show user-friendly error message
                let errorMessage = 'Download failed. Please try again.';
                if (error.message.includes('booking')) {
                    errorMessage = 'This download requires a booking. Please book this trip first.';
                } else if (error.message.includes('login')) {
                    errorMessage = 'Please log in to download this file.';
                } else if (error.message.includes('permission')) {
                    errorMessage = 'You do not have permission to download this file.';
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
            let message = 'Download not available.';
            
            if (visibility === 'logged_in') {
                message = 'Please log in to download this file.';
            } else if (visibility === 'booked_only') {
                message = 'This download requires a booking for this trip.';
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
