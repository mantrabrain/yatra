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
        
        <?php
        // 3.3: one or more accounts (per currency). Older callers pass only $bank_details.
        $yatra_accounts = isset($bank_accounts) && is_array($bank_accounts) && $bank_accounts !== []
            ? $bank_accounts
            : [array_merge(['label' => '', 'currency' => ''], $bank_details)];
        $yatra_many = count($yatra_accounts) > 1;
        ?>
        <?php if ($yatra_many) : ?>
            <p class="yatra-bank-intro yatra-bank-intro--many"><?php esc_html_e('Pay into any one of these accounts:', 'yatra'); ?></p>
        <?php endif; ?>
        <?php foreach ($yatra_accounts as $yatra_i => $yatra_acc) : ?>
        <div class="yatra-bank-info-grid yatra-bank-account"<?php echo $yatra_many ? ' style="margin-bottom:12px;"' : ''; ?>>
            <?php if ($yatra_many) : ?>
            <div class="yatra-bank-info-item yatra-bank-account-title">
                <span class="yatra-bank-label"><strong><?php
                    $yatra_title = ($yatra_acc['label'] ?? '') !== '' ? $yatra_acc['label'] : sprintf(/* translators: %d: account number in the list */ __('Account %d', 'yatra'), $yatra_i + 1);
                    echo esc_html($yatra_title . (($yatra_acc['currency'] ?? '') !== '' ? ' (' . $yatra_acc['currency'] . ')' : ''));
                ?></strong></span>
                <span class="yatra-bank-value"></span>
            </div>
            <?php endif; ?>
            <?php if (!empty($yatra_acc['bank_name'])) : ?>
            <div class="yatra-bank-info-item">
                <span class="yatra-bank-label"><?php esc_html_e('Bank Name:', 'yatra'); ?></span>
                <span class="yatra-bank-value"><?php echo esc_html($yatra_acc['bank_name']); ?></span>
            </div>
            <?php endif; ?>
            <?php if (!empty($yatra_acc['account_name'])) : ?>
            <div class="yatra-bank-info-item">
                <span class="yatra-bank-label"><?php esc_html_e('Account Name:', 'yatra'); ?></span>
                <span class="yatra-bank-value"><?php echo esc_html($yatra_acc['account_name']); ?></span>
            </div>
            <?php endif; ?>
            <?php if (!empty($yatra_acc['account_number'])) : ?>
            <div class="yatra-bank-info-item">
                <span class="yatra-bank-label"><?php esc_html_e('Account Number:', 'yatra'); ?></span>
                <span class="yatra-bank-value"><strong><?php echo esc_html($yatra_acc['account_number']); ?></strong></span>
            </div>
            <?php endif; ?>
            <?php if (!empty($yatra_acc['routing_code'])) : ?>
            <div class="yatra-bank-info-item">
                <span class="yatra-bank-label"><?php esc_html_e('Routing/SWIFT Code:', 'yatra'); ?></span>
                <span class="yatra-bank-value"><?php echo esc_html($yatra_acc['routing_code']); ?></span>
            </div>
            <?php endif; ?>
        </div>
        <?php endforeach; ?>

        <div class="yatra-bank-info-grid">
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
        
        <?php
        // The same deadline the booking email gives: unpaid bookings are
        // cancelled after "Booking Expiry Hours".
        $yatra_bt_deadline = '';
        if ((string) ($booking->status ?? '') === 'pending' && !empty($booking->created_at)) {
            $yatra_bt_hours = (int) \Yatra\Services\SettingsService::get('booking_expiry_hours', 24);
            $yatra_bt_created = strtotime((string) $booking->created_at);
            if ($yatra_bt_hours > 0 && $yatra_bt_created) {
                $yatra_bt_deadline = wp_date(
                    \Yatra\Services\SettingsService::getString('date_format', 'Y-m-d') . ' ' . \Yatra\Services\SettingsService::getString('time_format', 'H:i'),
                    $yatra_bt_created + $yatra_bt_hours * HOUR_IN_SECONDS - (int) (get_option('gmt_offset', 0) * HOUR_IN_SECONDS)
                );
            }
        }
        ?>
        <?php if (empty($bank_details['instructions']) || $yatra_bt_deadline !== '') : ?>
        <div class="yatra-bank-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <p>
                <?php
                // Your own instructions usually ask for the reference already: say it once.
                if (empty($bank_details['instructions'])) {
                    esc_html_e('Important: Please include your booking reference in the payment description so we can verify your payment quickly.', 'yatra');
                }
                if ($yatra_bt_deadline !== '') {
                    echo ' ' . esc_html(sprintf(
                        /* translators: %s: date and time the payment must arrive by. */
                        __('Please pay by %s, or the booking may be cancelled.', 'yatra'),
                        $yatra_bt_deadline
                    ));
                }
                ?>
            </p>
        </div>
        <?php endif; ?>
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
