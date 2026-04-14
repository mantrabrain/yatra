/**
 * Yatra API Helper
 * Handles API endpoint URL construction based on WordPress permalink structure
 */

window.YatraApiHelper = {
    /**
     * Get the correct API URL based on WordPress permalink structure
     * @param {string} endpoint - The API endpoint (e.g., '/downloads/1869/download-url')
     * @returns {string} The full API URL
     */
    getApiUrl(endpoint) {
        // Check if WordPress uses pretty permalinks
        const currentUrl = window.location.href;
        const usesPrettyPermalinks = this.detectPrettyPermalinks(currentUrl);
        
        if (window.yatraConfig?.debug) {
            console.log('Yatra API Helper - Using permalinks:', usesPrettyPermalinks ? 'Pretty' : 'Plain');
        }
        
        if (usesPrettyPermalinks) {
            return `/wp-json/yatra/v1${endpoint}`;
        } else {
            return `/index.php?rest_route=/yatra/v1${endpoint}`;
        }
    },

    /**
     * Detect if WordPress uses pretty permalinks
     * @param {string} url - Current page URL
     * @returns {boolean} True if pretty permalinks are detected
     */
    detectPrettyPermalinks(url) {
        // Method 1: Use WordPress provided data (most reliable)
        const yatraData = window.yatraTripData || window.yatraBookingData || {};
        if (yatraData.permalinkStructure !== undefined) {
            const isPlain = yatraData.permalinkStructure === 'plain';
            if (window.yatraConfig?.debug) {
                console.log('Yatra API Helper - WordPress permalink structure:', yatraData.permalinkStructure, 'isPlain:', isPlain);
            }
            return !isPlain; // Return true if NOT plain (i.e., pretty)
        }
        
        // Method 2: Check WordPress REST API settings
        const wpApiSettings = window.wpApiSettings || {};
        if (wpApiSettings.root) {
            // If root ends with /wp-json/, pretty permalinks are working
            const usesPretty = wpApiSettings.root.includes('/wp-json/');
            if (window.yatraConfig?.debug) {
                console.log('Yatra API Helper - WP API settings root:', wpApiSettings.root, 'usesPretty:', usesPretty);
            }
            return usesPretty;
        }
        
        // Method 3: Check current URL structure
        const hasPrettyStructure = 
            url.includes('/trip/') ||           // Trip URLs
            url.includes('/category/') ||       // Category URLs  
            url.includes('/tag/') ||            // Tag URLs
            (url.includes('/') && !url.includes('?') && !url.includes('='));
            
        if (window.yatraConfig?.debug) {
            console.log('Yatra API Helper - URL structure analysis:', hasPrettyStructure);
        }
        
        // Method 4: Default to plain since we know pretty permalinks aren't working
        if (window.yatraConfig?.debug) {
            console.log('Yatra API Helper - Defaulting to plain permalinks (fallback)');
        }
        return false;
    },

    /**
     * Get WordPress nonce from available sources
     * @returns {string} WordPress nonce
     */
    getNonce() {
        // Try multiple sources for the nonce
        const sources = [
            window.yatraTripData?.nonce,
            window.yatraBookingData?.nonce,
            window.yatraVars?.nonce,
            window.wpApiSettings?.nonce,
            window.yatraConfig?.nonce
        ];
        
        // Return the first available nonce
        for (const nonce of sources) {
            if (nonce && nonce !== '') {
                if (window.yatraConfig?.debug) {
                    console.log('Yatra API Helper - Using nonce from source:', sources.indexOf(nonce));
                }
                return nonce;
            }
        }
        
        if (window.yatraConfig?.debug) {
            console.warn('Yatra API Helper - No nonce found, API requests may fail');
        }
        return '';
    },

    /**
     * Make API request with automatic URL handling
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Fetch options
     * @returns {Promise} Fetch promise
     */
    async apiRequest(endpoint, options = {}) {
        const url = this.getApiUrl(endpoint);
        
        // Only add nonce for authenticated requests or when user is logged in
        const nonce = this.shouldUseNonce() ? this.getNonce() : null;
        
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(nonce && { 'X-WP-Nonce': nonce })
            }
        };
        
        const fetchOptions = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, fetchOptions);
            return response;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },

    /**
     * Determine if nonce should be used for the request
     * @returns {boolean} Whether to use nonce
     */
    shouldUseNonce() {
        // Check if user is logged in (WordPress sets this in the body class)
        const body = document.body;
        const isLoggedIn = body && body.classList.contains('logged-in');
        
        // Also check if we have user data indicating logged in status
        const hasUserData = window.yatraTripData?.userId || window.yatraBookingData?.userId;
        
        const shouldUse = isLoggedIn || hasUserData;
        if (window.yatraConfig?.debug) {
            console.log('Yatra API Helper - User logged in:', shouldUse);
        }
        return shouldUse;
    },

    /**
     * Get download URL for a specific download ID
     * @param {number} downloadId - Download ID
     * @param {number} bookingId - Optional booking ID
     * @returns {Promise} API response
     */
    getDownloadUrl(downloadId, bookingId = 0) {
        let endpoint = `/downloads/${downloadId}/download-url`;
        if (bookingId > 0) {
            endpoint += `?booking_id=${bookingId}`;
        }
        return this.apiRequest(endpoint);
    },

    /**
     * Get download file info
     * @param {number} downloadId - Download ID
     * @returns {Promise} API response
     */
    getDownloadInfo(downloadId) {
        return this.apiRequest(`/downloads/${downloadId}/download`);
    }
};

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // API Helper is ready for use
    // Debug logging can be enabled by setting window.yatraConfig.debug = true
    if (window.yatraConfig?.debug) {
        console.log('Yatra API Helper - Initialized');
        const detectedStructure = window.YatraApiHelper.detectPrettyPermalinks(window.location.href);
        console.log('Yatra API Helper - Permalink structure:', detectedStructure ? 'Pretty' : 'Plain');
    }
});
