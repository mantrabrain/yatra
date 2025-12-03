<?php
/**
 * Bank Transfer Confirmation Details Template
 * 
 * @package Yatra
 * @var object $booking Booking object
 * @var array $bank_details Bank account details
 * @var float $amount_due Amount to transfer
 */

if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="yatra-confirmation-card yatra-bank-transfer-card">
    <h3 class="yatra-card-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="5" width="20" height="14" rx="2"></rect>
            <line x1="2" y1="10" x2="22" y2="10"></line>
        </svg>
        <?php esc_html_e('Bank Transfer Details', 'yatra'); ?>
    </h3>
    
    <div class="yatra-bank-details">
        <p class="yatra-bank-intro">
            <?php esc_html_e('Please transfer the amount to the following bank account:', 'yatra'); ?>
        </p>
        
        <div class="yatra-bank-info-grid">
            <?php if (!empty($bank_details['bank_name'])) : ?>
            <div class="yatra-bank-info-item">
                <span class="yatra-bank-label"><?php esc_html_e('Bank Name:', 'yatra'); ?></span>
                <span class="yatra-bank-value"><?php echo esc_html($bank_details['bank_name']); ?></span>
            </div>
            <?php endif; ?>
            
            <?php if (!empty($bank_details['account_name'])) : ?>
            <div class="yatra-bank-info-item">
                <span class="yatra-bank-label"><?php esc_html_e('Account Name:', 'yatra'); ?></span>
                <span class="yatra-bank-value"><?php echo esc_html($bank_details['account_name']); ?></span>
            </div>
            <?php endif; ?>
            
            <?php if (!empty($bank_details['account_number'])) : ?>
            <div class="yatra-bank-info-item">
                <span class="yatra-bank-label"><?php esc_html_e('Account Number:', 'yatra'); ?></span>
                <span class="yatra-bank-value"><strong><?php echo esc_html($bank_details['account_number']); ?></strong></span>
            </div>
            <?php endif; ?>
            
            <?php if (!empty($bank_details['routing_code'])) : ?>
            <div class="yatra-bank-info-item">
                <span class="yatra-bank-label"><?php esc_html_e('Routing/SWIFT Code:', 'yatra'); ?></span>
                <span class="yatra-bank-value"><?php echo esc_html($bank_details['routing_code']); ?></span>
            </div>
            <?php endif; ?>
            
            <div class="yatra-bank-info-item yatra-bank-reference">
                <span class="yatra-bank-label"><?php esc_html_e('Payment Reference:', 'yatra'); ?></span>
                <span class="yatra-bank-value"><strong><?php echo esc_html($booking->reference); ?></strong></span>
            </div>
            
            <div class="yatra-bank-info-item yatra-bank-amount">
                <span class="yatra-bank-label"><?php esc_html_e('Amount to Transfer:', 'yatra'); ?></span>
                <span class="yatra-bank-value yatra-bank-amount-value">
                    <strong><?php echo esc_html(yatra_format_price($amount_due)); ?></strong>
                </span>
            </div>
        </div>
        
        <?php if (!empty($bank_details['instructions'])) : ?>
        <div class="yatra-bank-instructions">
            <p><?php echo wp_kses_post(nl2br($bank_details['instructions'])); ?></p>
        </div>
        <?php endif; ?>
        
        <div class="yatra-bank-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <p><?php esc_html_e('Important: Please include your booking reference in the payment description so we can verify your payment quickly.', 'yatra'); ?></p>
        </div>
    </div>
</div>

<style>
.yatra-bank-transfer-card {
    background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    border: 2px solid #0ea5e9;
    margin-bottom: 2rem;
}

.yatra-bank-transfer-card .yatra-card-title {
    color: #0c4a6e;
    border-bottom-color: #bae6fd;
}

.yatra-bank-details {
    padding: 0.5rem 0;
}

.yatra-bank-intro {
    font-size: 1rem;
    color: #0c4a6e;
    margin-bottom: 1.5rem;
    font-weight: 500;
}

.yatra-bank-info-grid {
    display: grid;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.yatra-bank-info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: white;
    border-radius: 0.5rem;
    border: 1px solid #bae6fd;
}

.yatra-bank-label {
    font-weight: 500;
    color: #0c4a6e;
}

.yatra-bank-value {
    color: #0369a1;
    font-weight: 500;
}

.yatra-bank-reference,
.yatra-bank-amount {
    background: #e0f2fe;
    border-color: #7dd3fc;
}

.yatra-bank-amount-value {
    font-size: 1.25rem;
    color: #0c4a6e;
}

.yatra-bank-instructions {
    padding: 1rem;
    background: #f0f9ff;
    border-left: 4px solid #0ea5e9;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
}

.yatra-bank-instructions p {
    margin: 0;
    color: #0c4a6e;
    line-height: 1.6;
}

.yatra-bank-notice {
    display: flex;
    gap: 0.75rem;
    padding: 1rem;
    background: #fef3c7;
    border: 1px solid #fbbf24;
    border-radius: 0.5rem;
    align-items: flex-start;
}

.yatra-bank-notice svg {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    color: #d97706;
}

.yatra-bank-notice p {
    margin: 0;
    color: #78350f;
    font-size: 0.9rem;
    line-height: 1.5;
}

@media (max-width: 768px) {
    .yatra-bank-info-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
    }
}
</style>
