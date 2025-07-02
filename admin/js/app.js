/**
 * Yatra Admin Application
 * Modern SaaS-style admin interface for Yatra travel booking plugin
 */

console.log('Yatra admin JS file loaded!');

(function($) {
    'use strict';

    console.log('Yatra admin JS function started!');

    class YatraAdmin {
        constructor() {
            console.log('YatraAdmin constructor called!');
            this.currentPage = 'dashboard';
            this.isDarkMode = localStorage.getItem('yatra-dark-mode') === 'true';
            this.init();
        }

        init() {
            console.log('YatraAdmin init() called!');
            this.setupEventListeners();
            this.applyTheme();
            this.setupNavigation();
        }

        setupEventListeners() {
            // Theme toggle
            $('#theme-toggle').on('click', () => {
                this.toggleTheme();
            });

            // Handle browser back/forward
            $(window).on('popstate', (e) => {
                this.handlePopState(e);
            });
        }

        setupNavigation() {
            console.log('setupNavigation() called!');
            // Add no-transition to sidebar to prevent flicker
            $('.yatra-sidebar').addClass('no-transition');
            setTimeout(function() {
                $('.yatra-sidebar').removeClass('no-transition');
            }, 50);

            // Get current page from URL parameter or data attribute
            const urlParams = new URLSearchParams(window.location.search);
            const subpage = urlParams.get('subpage');
            const currentPage = subpage || $('#yatra-app').data('current-page') || 'dashboard';
            
            console.log('URL params:', urlParams.toString());
            console.log('Subpage from URL:', subpage);
            console.log('Current page detected:', currentPage);
            
            this.currentPage = currentPage;
            this.updateActiveNavigation();
            this.setupSubmenuHandlers();
            this.expandCurrentSubmenu();
            
            // Initialize page components for the current page
            this.initializePageComponents(currentPage);
        }

        setupSubmenuHandlers() {
            // Handle submenu toggle clicks
            $(document).on('click', '.yatra-nav-item.has-submenu > .yatra-nav-link', (e) => {
                e.preventDefault();
                const $navItem = $(e.currentTarget).parent();
                const $submenu = $navItem.find('.yatra-submenu');
                
                // Toggle active state
                $navItem.toggleClass('active');
                
                // If submenu is now active, close other submenus
                if ($navItem.hasClass('active')) {
                    $('.yatra-nav-item.has-submenu').not($navItem).removeClass('active');
                }
            });
            
            // Handle submenu item clicks
            $(document).on('click', '.yatra-submenu-link', (e) => {
                e.preventDefault();
                const href = $(e.currentTarget).attr('href');
                if (href) {
                    window.location.href = href;
                }
            });
            
            // Auto-expand submenu if current page is in it
            this.expandCurrentSubmenu();
        }

        expandCurrentSubmenu() {
            const currentPage = this.currentPage;
            // Remove all .active from submenus first
            $('.yatra-nav-item.has-submenu').removeClass('active');
            // Find all submenus that contain the current page and open them
            $('.yatra-submenu-link').each((index, element) => {
                const $link = $(element);
                const href = $link.attr('href');
                const urlParams = new URLSearchParams(href.split('?')[1]);
                const subpage = urlParams.get('subpage');
                if (subpage === currentPage) {
                    $link.closest('.yatra-nav-item.has-submenu').addClass('active');
                    $('.yatra-submenu-link').removeClass('active');
                    $link.addClass('active');
                }
            });
        }

        updateActiveNavigation() {
            console.log('updateActiveNavigation() called!');
            
            // Update page title
            $('.yatra-page-title').text(this.capitalizeFirst(this.currentPage));
        }

        initializePageComponents(page) {
            console.log('initializePageComponents called with page:', page);
            // Initialize page-specific components
            switch (page) {
                case 'dashboard':
                    this.initDashboard();
                    break;
                case 'trips':
                    this.initTrips();
                    break;
                case 'bookings':
                    this.initBookings();
                    break;
                case 'settings':
                    console.log('Settings case matched, calling initSettings');
                    this.initSettings();
                    break;
                default:
                    console.log('No matching case for page:', page);
            }
        }

        initDashboard() {
            // Initialize dashboard components
            this.loadDashboardStats();
        }

        initTrips() {
            // Initialize trips page components
            console.log('Trips page initialized');
        }

        initBookings() {
            // Initialize bookings page components
            console.log('Bookings page initialized');
        }

        initSettings() {
            // Initialize settings page components
            console.log('Settings page initialized');
            console.log('Looking for .yatra-ajax-save-btn elements:', $('.yatra-ajax-save-btn').length);
            console.log('Looking for .yatra-ajax-form elements:', $('.yatra-ajax-form').length);
            
            // Handle tab switching and URL updates
            this.initSettingsTabs();
            
            // Handle Save button clicks
            $(document).on('click', '.yatra-ajax-save-btn', (e) => {
                console.log('Save button clicked!');
                e.preventDefault();
                this.saveSettings();
            });
            
            // Handle form submission
            $(document).on('submit', '.yatra-ajax-form', (e) => {
                console.log('Form submitted!');
                e.preventDefault();
                this.saveSettings();
            });
        }

        initSettingsTabs() {
            // Handle tab clicks
            $(document).on('click', '.yatra-settings-tab', (e) => {
                e.preventDefault();
                const $tab = $(e.currentTarget);
                const tabId = $tab.data('tab');
                
                // Update active tab
                $('.yatra-settings-tab').removeClass('active');
                $tab.addClass('active');
                
                // Update hidden input
                $('input[name="active_tab"]').val(tabId);
                
                // Update URL
                const currentUrl = new URL(window.location);
                currentUrl.searchParams.set('tab', tabId);
                window.history.pushState({ tab: tabId }, '', currentUrl.toString());
                
                // Show/hide sections
                $('.yatra-settings-section').hide();
                $(`.yatra-settings-section[data-tab-content="${tabId}"]`).show();
            });
            
            // Initialize tab from URL
            const urlParams = new URLSearchParams(window.location.search);
            const tab = urlParams.get('tab');
            if (tab) {
                const $tabElement = $(`.yatra-settings-tab[data-tab="${tab}"]`);
                if ($tabElement.length) {
                    $tabElement.click();
                }
            }
        }

        saveSettings() {
            console.log('saveSettings method called');
            const $form = $('.yatra-ajax-form');
            const $saveBtn = $('.yatra-ajax-save-btn');
            const $activeTab = $('input[name="active_tab"]');
            
            console.log('Form found:', $form.length);
            console.log('Save button found:', $saveBtn.length);
            console.log('Active tab input found:', $activeTab.length);
            
            // Get the active tab
            const activeTab = $activeTab.val();
            console.log('Active tab:', activeTab);
            
            // Show loading state
            $saveBtn.prop('disabled', true).text('Saving...');
            this.showLoading();
            
            // Collect form data
            const formData = new FormData($form[0]);
            formData.append('action', 'yatra_save_settings');
            formData.append('active_tab', activeTab);
            
            console.log('Submitting form data...');
            
            // Submit via AJAX to REST API
            $.ajax({
                url: '/wp-json/yatra/v1/settings',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                headers: {
                    'X-WP-Nonce': yatraAdmin.nonce
                },
                success: (response) => {
                    console.log('AJAX success:', response);
                    this.hideLoading();
                    $saveBtn.prop('disabled', false).text('Save Settings');
                    
                    if (response.success) {
                        this.showNotification('Settings saved successfully!', 'success');
                        
                        // Update the active tab input value
                        $activeTab.val(activeTab);
                        
                        // Show success message in the form
                        this.showFormMessage('Settings saved successfully!', 'success');
                    } else {
                        this.showNotification('Failed to save settings. Please try again.', 'error');
                        this.showFormMessage('Failed to save settings. Please try again.', 'error');
                    }
                },
                error: (xhr, status, error) => {
                    console.log('AJAX error:', {xhr, status, error});
                    this.hideLoading();
                    $saveBtn.prop('disabled', false).text('Save Settings');
                    
                    let errorMessage = 'Failed to save settings. Please try again.';
                    
                    // Try to get error message from response
                    if (xhr.responseJSON && xhr.responseJSON.message) {
                        errorMessage = xhr.responseJSON.message;
                    } else if (xhr.responseText) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            if (response.message) {
                                errorMessage = response.message;
                            }
                        } catch (e) {
                            // Ignore parsing errors
                        }
                    }
                    
                    this.showNotification(errorMessage, 'error');
                    this.showFormMessage(errorMessage, 'error');
                }
            });
        }

        showFormMessage(message, type = 'info') {
            // Remove existing messages
            $('.yatra-form-message').remove();
            
            const messageClass = type === 'success' ? 'yatra-form-success' : 'yatra-form-error';
            const messageHtml = `<div class="yatra-form-message ${messageClass}" style="margin-bottom: 18px;">${message}</div>`;
            
            // Insert message after the form header
            $('.yatra-settings-main').prepend(messageHtml);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                $('.yatra-form-message').fadeOut(() => {
                    $('.yatra-form-message').remove();
                });
            }, 5000);
        }

        loadDashboardStats() {
            // Load dashboard statistics via AJAX
            $.ajax({
                url: yatraAdmin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'yatra_get_dashboard_stats',
                    nonce: yatraAdmin.nonce
                },
                success: (response) => {
                    if (response.success) {
                        this.updateDashboardStats(response.data);
                    }
                }
            });
        }

        updateDashboardStats(stats) {
            // Update dashboard statistics
            $('.yatra-stat-number').each(function() {
                const $this = $(this);
                const label = $this.siblings('.yatra-stat-label').text().toLowerCase();
                
                if (label.includes('bookings')) {
                    $this.text(stats.totalBookings || 0);
                } else if (label.includes('revenue')) {
                    $this.text('$' + (stats.totalRevenue || 0));
                } else if (label.includes('trips')) {
                    $this.text(stats.activeTrips || 0);
                } else if (label.includes('customers')) {
                    $this.text(stats.totalCustomers || 0);
                }
            });
        }

        toggleTheme() {
            this.isDarkMode = !this.isDarkMode;
            localStorage.setItem('yatra-dark-mode', this.isDarkMode);
            this.applyTheme();
        }

        applyTheme() {
            const $body = $('body');
            const $themeIcon = $('.theme-icon');
            
            if (this.isDarkMode) {
                $body.addClass('yatra-dark-mode');
                $themeIcon.text('☀️');
            } else {
                $body.removeClass('yatra-dark-mode');
                $themeIcon.text('🌙');
            }
        }

        capitalizeFirst(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        // Utility methods
        showNotification(message, type = 'info') {
            const notification = $(`
                <div class="yatra-notification yatra-notification-${type}">
                    <span class="yatra-notification-message">${message}</span>
                    <button class="yatra-notification-close">&times;</button>
                </div>
            `);
            
            $('body').append(notification);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                notification.fadeOut(() => notification.remove());
            }, 5000);
            
            // Close button
            notification.find('.yatra-notification-close').on('click', () => {
                notification.fadeOut(() => notification.remove());
            });
        }

        showLoading() {
            $('body').append('<div class="yatra-loading-overlay"><div class="yatra-loading-spinner"></div></div>');
        }

        hideLoading() {
            $('.yatra-loading-overlay').fadeOut(() => {
                $('.yatra-loading-overlay').remove();
            });
        }
    }

    // Initialize when DOM is ready
    $(document).ready(() => {
        console.log('DOM ready! Initializing YatraAdmin...');
        window.yatraAdminApp = new YatraAdmin();
        console.log('YatraAdmin initialized!');
    });

    // Make YatraAdmin available globally for debugging
    window.YatraAdmin = YatraAdmin;

})(jQuery); 