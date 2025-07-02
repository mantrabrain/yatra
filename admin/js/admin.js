/**
 * Yatra Admin JavaScript
 */

(function($) {
    'use strict';

    // Yatra Admin namespace
    window.YatraAdmin = window.YatraAdmin || {};

    // Initialize when document is ready
    $(document).ready(function() {
        YatraAdmin.init();
    });

    // Main initialization
    YatraAdmin.init = function() {
        this.initEventListeners();
        this.initAjaxHandlers();
        this.initFormValidation();
        this.initDataTables();
        this.initDatePickers();
        this.initTooltips();
    };

    // Event listeners
    YatraAdmin.initEventListeners = function() {
        // Delete confirmations
        $(document).on('click', '.yatra-delete-btn', function(e) {
            if (!confirm(yatraAdmin.strings.confirmDelete)) {
                e.preventDefault();
                return false;
            }
        });

        // Form submissions
        $(document).on('submit', '.yatra-form', function(e) {
            var $form = $(this);
            var $submitBtn = $form.find('button[type="submit"]');
            
            if ($submitBtn.hasClass('yatra-loading')) {
                e.preventDefault();
                return false;
            }

            $submitBtn.addClass('yatra-loading').text(yatraAdmin.strings.saving);
        });

        // Tab navigation
        $(document).on('click', '.yatra-tab-nav a', function(e) {
            e.preventDefault();
            var target = $(this).attr('href');
            $('.yatra-tab-nav a').removeClass('active');
            $(this).addClass('active');
            $('.yatra-tab-content').removeClass('active');
            $(target).addClass('active');
        });

        // Bulk actions
        $(document).on('change', '.yatra-bulk-action', function() {
            var action = $(this).val();
            if (action) {
                $('.yatra-bulk-submit').removeClass('yatra-hidden');
            } else {
                $('.yatra-bulk-submit').addClass('yatra-hidden');
            }
        });

        // Select all checkboxes
        $(document).on('change', '.yatra-select-all', function() {
            var isChecked = $(this).is(':checked');
            $('.yatra-item-checkbox').prop('checked', isChecked);
        });
    };

    // AJAX handlers
    YatraAdmin.initAjaxHandlers = function() {
        // Booking status update
        $(document).on('change', '.yatra-booking-status', function() {
            var $select = $(this);
            var bookingId = $select.data('booking-id');
            var newStatus = $select.val();
            var $row = $select.closest('tr');

            $.ajax({
                url: yatraAdmin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'yatra_update_booking_status',
                    booking_id: bookingId,
                    status: newStatus,
                    nonce: yatraAdmin.nonce
                },
                beforeSend: function() {
                    $select.prop('disabled', true);
                    $row.addClass('yatra-loading');
                },
                success: function(response) {
                    if (response.success) {
                        YatraAdmin.showAlert('success', response.data.message);
                        $row.removeClass('yatra-loading');
                    } else {
                        YatraAdmin.showAlert('error', response.data.message);
                        $select.val($select.data('original-status'));
                    }
                },
                error: function() {
                    YatraAdmin.showAlert('error', yatraAdmin.strings.error);
                    $select.val($select.data('original-status'));
                },
                complete: function() {
                    $select.prop('disabled', false);
                    $row.removeClass('yatra-loading');
                }
            });
        });

        // Trip availability check
        $(document).on('change', '.yatra-trip-date', function() {
            var $select = $(this);
            var tripId = $select.data('trip-id');
            var dateId = $select.val();
            var $availability = $('.yatra-availability-info');

            if (!dateId) {
                $availability.html('');
                return;
            }

            $.ajax({
                url: yatraAdmin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'yatra_check_availability',
                    trip_id: tripId,
                    date_id: dateId,
                    nonce: yatraAdmin.nonce
                },
                beforeSend: function() {
                    $availability.html('<span class="yatra-loading"></span> Checking availability...');
                },
                success: function(response) {
                    if (response.success) {
                        var data = response.data;
                        $availability.html(
                            '<strong>Available Seats:</strong> ' + data.available_seats + '<br>' +
                            '<strong>Price:</strong> $' + data.price
                        );
                    } else {
                        $availability.html('<span class="yatra-alert-error">' + response.data.message + '</span>');
                    }
                },
                error: function() {
                    $availability.html('<span class="yatra-alert-error">Error checking availability</span>');
                }
            });
        });
    };

    // Form validation
    YatraAdmin.initFormValidation = function() {
        $('.yatra-form').each(function() {
            var $form = $(this);
            
            $form.on('submit', function(e) {
                var isValid = true;
                var $requiredFields = $form.find('[required]');

                $requiredFields.each(function() {
                    var $field = $(this);
                    var value = $field.val().trim();

                    if (!value) {
                        $field.addClass('yatra-error');
                        isValid = false;
                    } else {
                        $field.removeClass('yatra-error');
                    }
                });

                if (!isValid) {
                    e.preventDefault();
                    YatraAdmin.showAlert('error', 'Please fill in all required fields.');
                    return false;
                }
            });

            // Remove error class on input
            $form.find('input, textarea, select').on('input change', function() {
                $(this).removeClass('yatra-error');
            });
        });
    };

    // Data tables
    YatraAdmin.initDataTables = function() {
        if (typeof $.fn.DataTable !== 'undefined') {
            $('.yatra-data-table').DataTable({
                responsive: true,
                pageLength: 25,
                order: [[0, 'desc']],
                language: {
                    search: "Search:",
                    lengthMenu: "Show _MENU_ entries",
                    info: "Showing _START_ to _END_ of _TOTAL_ entries",
                    infoEmpty: "Showing 0 to 0 of 0 entries",
                    infoFiltered: "(filtered from _MAX_ total entries)",
                    paginate: {
                        first: "First",
                        last: "Last",
                        next: "Next",
                        previous: "Previous"
                    }
                }
            });
        }
    };

    // Date pickers
    YatraAdmin.initDatePickers = function() {
        if (typeof $.fn.datepicker !== 'undefined') {
            $('.yatra-datepicker').datepicker({
                dateFormat: 'yy-mm-dd',
                changeMonth: true,
                changeYear: true,
                yearRange: '-10:+10'
            });
        }
    };

    // Tooltips
    YatraAdmin.initTooltips = function() {
        $('[data-tooltip]').each(function() {
            var $element = $(this);
            var tooltipText = $element.data('tooltip');
            
            $element.attr('title', tooltipText);
        });
    };

    // Show alert message
    YatraAdmin.showAlert = function(type, message) {
        var alertClass = 'yatra-alert-' + type;
        var $alert = $('<div class="yatra-alert ' + alertClass + '">' + message + '</div>');
        
        $('.yatra-alerts-container').append($alert);
        
        // Auto remove after 5 seconds
        setTimeout(function() {
            $alert.fadeOut(function() {
                $(this).remove();
            });
        }, 5000);
    };

    // Show loading state
    YatraAdmin.showLoading = function($element) {
        $element.addClass('yatra-loading');
    };

    // Hide loading state
    YatraAdmin.hideLoading = function($element) {
        $element.removeClass('yatra-loading');
    };

    // Format currency
    YatraAdmin.formatCurrency = function(amount, currency) {
        currency = currency || 'USD';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount);
    };

    // Format date
    YatraAdmin.formatDate = function(dateString) {
        var date = new Date(dateString);
        return date.toLocaleDateString();
    };

    // Confirm action
    YatraAdmin.confirm = function(message, callback) {
        if (confirm(message)) {
            callback();
        }
    };

    // Refresh page
    YatraAdmin.refresh = function() {
        location.reload();
    };

    // Export data
    YatraAdmin.exportData = function(type, data) {
        var filename = 'yatra-export-' + new Date().toISOString().split('T')[0] + '.' + type;
        
        if (type === 'csv') {
            var csvContent = "data:text/csv;charset=utf-8,";
            csvContent += data.map(function(row) {
                return row.join(',');
            }).join('\n');
            
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

})(jQuery); 