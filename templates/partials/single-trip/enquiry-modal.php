<?php
if (!defined('ABSPATH')) {
    exit;
}

// Enquiry Modal
// Expected variables: $trip
?>
<!-- Enquiry Modal -->
<div class="yatra-enquiry-modal" id="enquiry-modal" role="dialog" aria-modal="true" aria-label="<?php esc_attr_e('Make Enquiry', 'yatra'); ?>">
    <div class="yatra-enquiry-modal-overlay"></div>
    <div class="yatra-enquiry-modal-content">
        <button type="button" class="yatra-enquiry-modal-close" aria-label="<?php esc_attr_e('Close Enquiry Form', 'yatra'); ?>">
            <svg class="yatra-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
        </button>
        <div class="yatra-enquiry-modal-header">
            <h2 class="yatra-enquiry-modal-title"><?php esc_html_e('Make an Enquiry', 'yatra'); ?></h2>
            <p class="yatra-enquiry-modal-subtitle"><?php esc_html_e('Fill out the form below and we\'ll get back to you as soon as possible', 'yatra'); ?></p>
        </div>
        <form class="yatra-enquiry-form" id="enquiry-form">
            <input type="hidden" name="action" value="yatra_submit_enquiry">
            <input type="hidden" name="trip_id" value="<?php echo esc_attr((int) $trip->getId()); ?>">
            <?php wp_nonce_field('yatra_submit_enquiry', 'yatra_enquiry_nonce'); ?>

            <div class="yatra-enquiry-message" id="enquiry-message-box" style="display: none;"></div>

            <div class="yatra-enquiry-form-grid">
                <div class="yatra-enquiry-field">
                    <label for="enquiry-name" class="yatra-enquiry-label"><?php esc_html_e('Full Name', 'yatra'); ?> <span class="yatra-enquiry-required">*</span></label>
                    <input type="text" id="enquiry-name" name="name" class="yatra-enquiry-input" placeholder="<?php esc_attr_e('Enter your full name', 'yatra'); ?>" required>
                </div>

                <div class="yatra-enquiry-field">
                    <label for="enquiry-email" class="yatra-enquiry-label"><?php esc_html_e('Email Address', 'yatra'); ?> <span class="yatra-enquiry-required">*</span></label>
                    <input type="email" id="enquiry-email" name="email" class="yatra-enquiry-input" placeholder="<?php esc_attr_e('your.email@example.com', 'yatra'); ?>" required>
                </div>

                <div class="yatra-enquiry-field">
                    <label for="enquiry-phone" class="yatra-enquiry-label"><?php esc_html_e('Phone Number', 'yatra'); ?></label>
                    <input type="tel" id="enquiry-phone" name="phone" class="yatra-enquiry-input" placeholder="<?php esc_attr_e('+1 (234) 567-8900', 'yatra'); ?>">
                </div>
            </div>

            <div class="yatra-enquiry-field-group">
                <div class="yatra-enquiry-field">
                    <label for="enquiry-travel-date" class="yatra-enquiry-label"><?php esc_html_e('Preferred Travel Date', 'yatra'); ?></label>
                    <div class="yatra-booking-field-select">
                        <div class="yatra-booking-field-icon">
                            <?php echo yatra_svg_icon('calendar', 'yatra-icon-sm'); ?>
                        </div>
                        <input type="text" id="enquiry-travel-date" name="travel_date" class="yatra-booking-select yatra-enquiry-datepicker" placeholder="<?php esc_attr_e('Select date', 'yatra'); ?>" readonly>
                        <svg class="yatra-select-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                        </svg>
                    </div>
                </div>

                <div class="yatra-enquiry-field">
                    <label for="enquiry-adults" class="yatra-enquiry-label"><?php esc_html_e('Number of Travelers', 'yatra'); ?></label>
                    <input type="number" 
                           id="enquiry-adults" 
                           name="adults" 
                           class="yatra-enquiry-input yatra-enquiry-travelers" 
                           value="1" 
                           min="1" 
                           max="20" 
                           placeholder="<?php esc_attr_e('Enter number of travelers', 'yatra'); ?>">
                </div>
            </div>

            <div class="yatra-quantity-note"><?php esc_html_e('Ages 3 and younger are not permitted.', 'yatra'); ?></div>

            <div class="yatra-enquiry-field">
                <label for="enquiry-message" class="yatra-enquiry-label"><?php esc_html_e('Message', 'yatra'); ?> <span class="yatra-enquiry-required">*</span></label>
                <textarea id="enquiry-message" name="message" class="yatra-enquiry-textarea" rows="3" placeholder="<?php esc_attr_e('Tell us about your travel plans, special requirements, or any questions you have...', 'yatra'); ?>" required></textarea>
            </div>

            <div class="yatra-enquiry-actions">
                <button type="button" class="yatra-enquiry-cancel" id="close-enquiry-modal">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                    <?php echo esc_html__('Cancel', 'yatra'); ?>
                </button>
                <button type="submit" class="yatra-enquiry-submit">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                    </svg>
                    <?php echo esc_html__('Send Enquiry', 'yatra'); ?>
                </button>
            </div>
        </form>
    </div>
</div>
