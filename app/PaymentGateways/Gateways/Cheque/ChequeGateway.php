<?php

declare(strict_types=1);

namespace Yatra\PaymentGateways\Gateways\Cheque;

use Yatra\PaymentGateways\AbstractPaymentGateway;

/**
 * Cheque — an offline method like Bank Transfer (3.3).
 *
 * The customer books and posts a cheque; the operator records the payment
 * when it clears ("Record payment" on the booking). Nothing is charged online,
 * and verifyPayment() never reports a payment.
 */
class ChequeGateway extends AbstractPaymentGateway
{
    protected string $id = 'cheque';
    protected string $title = 'Cheque';
    protected string $description = 'Pay by cheque';
    protected string $icon = 'cheque.svg';
    protected bool $isOffline = true;
    protected array $supports = ['cheque'];

    public function __construct()
    {
        parent::__construct();
        add_action('yatra_booking_confirmation_after_details', [$this, 'renderConfirmationDetails'], 10, 1);
        add_filter('yatra_invoice_payment_instructions', [$this, 'invoicePaymentInstructions'], 10, 2);
    }

    public function getTitle(): string
    {
        return __('Cheque', 'yatra');
    }

    public function getDescription(): string
    {
        return __('Pay by cheque. Where to send it is shown after you book and sent by email.', 'yatra');
    }

    public function getConfigFields(): array
    {
        return [
            [
                'id' => 'payee',
                'type' => 'text',
                'label' => __('Make cheques payable to', 'yatra'),
                'description' => __('The name on your account, as it must appear on the cheque.', 'yatra'),
                'default' => '',
            ],
            [
                'id' => 'address',
                'type' => 'textarea',
                'label' => __('Send cheques to', 'yatra'),
                'description' => __('The postal address customers send the cheque to.', 'yatra'),
                'default' => '',
            ],
            [
                'id' => 'instructions',
                'type' => 'textarea',
                'label' => __('Additional Instructions', 'yatra'),
                'description' => __('Additional instructions shown to customers', 'yatra'),
                'default' => '',
            ],
        ];
    }

    public function getIcon(): string
    {
        return defined('YATRA_PLUGIN_URL') ? YATRA_PLUGIN_URL . 'assets/images/payment-gateways/cheque.svg' : '';
    }

    public function isProperlyConfigured(): bool
    {
        return trim((string) ($this->config['payee'] ?? '')) !== ''
            && trim((string) ($this->config['address'] ?? '')) !== '';
    }

    public function processPayment(array $paymentData): array
    {
        return [
            'success' => true,
            'payment_method' => 'cheque',
            'status' => 'pending',
        ];
    }

    public function verifyPayment(string $transactionId): array
    {
        // Settles out of band: the operator records it when the cheque clears.
        return [
            'success' => false,
            'status' => 'pending_verification',
            'error' => __('Cheque payments are recorded manually once the cheque clears.', 'yatra'),
        ];
    }

    /** @return array{title:string,rows:array<int,array{label:string,value:string}>,note:string}|mixed */
    public function invoicePaymentInstructions($instructions, $booking)
    {
        if (!is_object($booking) || (string) ($booking->payment_gateway ?? '') !== 'cheque' || !$this->isProperlyConfigured()) {
            return $instructions;
        }
        if (isset($booking->amount_due) && (float) $booking->amount_due <= 0) {
            return $instructions;
        }
        $reference = (string) ($booking->reference ?? $booking->booking_reference ?? ('BOOKING-' . (int) ($booking->id ?? 0)));

        return [
            'title' => __('Paying by cheque', 'yatra'),
            'rows' => [
                ['label' => __('Make cheques payable to:', 'yatra'), 'value' => (string) $this->config['payee']],
                ['label' => __('Send to:', 'yatra'), 'value' => (string) $this->config['address']],
                ['label' => __('Payment Reference:', 'yatra'), 'value' => $reference],
            ],
            'note' => trim((string) ($this->config['instructions'] ?? '')) !== ''
                ? (string) $this->config['instructions']
                : __('Please write the payment reference on the back of the cheque.', 'yatra'),
        ];
    }

    /** @param object $booking */
    public function renderConfirmationDetails($booking): void
    {
        if (!is_object($booking) || (string) ($booking->payment_gateway ?? '') !== 'cheque' || !$this->isProperlyConfigured()) {
            return;
        }
        $amountDue = (float) ($booking->amount_due ?? 0) > 0 ? (float) $booking->amount_due : (float) ($booking->total_amount ?? 0);
        ?>
        <div class="yatra-confirmation-card yatra-cheque-card">
            <h3 class="yatra-card-title"><?php esc_html_e('Paying by cheque', 'yatra'); ?></h3>
            <div class="yatra-bank-details">
                <div class="yatra-bank-info-grid">
                    <div class="yatra-bank-info-item">
                        <span class="yatra-bank-label"><?php esc_html_e('Make cheques payable to:', 'yatra'); ?></span>
                        <span class="yatra-bank-value"><strong><?php echo esc_html((string) $this->config['payee']); ?></strong></span>
                    </div>
                    <div class="yatra-bank-info-item">
                        <span class="yatra-bank-label"><?php esc_html_e('Send to:', 'yatra'); ?></span>
                        <span class="yatra-bank-value"><?php echo nl2br(esc_html((string) $this->config['address'])); ?></span>
                    </div>
                    <div class="yatra-bank-info-item yatra-bank-reference">
                        <span class="yatra-bank-label"><?php esc_html_e('Payment Reference:', 'yatra'); ?></span>
                        <span class="yatra-bank-value"><strong><?php echo esc_html((string) ($booking->reference ?? '')); ?></strong></span>
                    </div>
                    <div class="yatra-bank-info-item yatra-bank-amount">
                        <span class="yatra-bank-label"><?php esc_html_e('Amount:', 'yatra'); ?></span>
                        <span class="yatra-bank-value"><strong><?php echo esc_html(yatra_format_price($amountDue, (string) ($booking->currency ?? ''))); ?></strong></span>
                    </div>
                </div>
                <?php if (trim((string) ($this->config['instructions'] ?? '')) !== '') : ?>
                    <div class="yatra-bank-instructions"><p><?php echo nl2br(esc_html((string) $this->config['instructions'])); ?></p></div>
                <?php else : ?>
                    <p class="yatra-bank-notice"><?php esc_html_e('Please write the payment reference on the back of the cheque.', 'yatra'); ?></p>
                <?php endif; ?>
            </div>
        </div>
        <?php
    }
}
