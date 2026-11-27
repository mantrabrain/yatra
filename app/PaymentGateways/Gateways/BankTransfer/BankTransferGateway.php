<?php

declare(strict_types=1);

namespace Yatra\PaymentGateways\Gateways\BankTransfer;

use Yatra\PaymentGateways\AbstractPaymentGateway;
use Yatra\PaymentGateways\GatewayUserMessages;

/**
 * Bank Transfer — free since Yatra 3.2 (it was a Yatra Pro gateway before).
 *
 * Same id and the same stored settings as the Pro gateway it replaces, so a
 * site that already used it keeps its bank details. An older Yatra Pro that
 * still registers its own copy replaces this one in the registry; this copy
 * then stays silent (see isActiveCopy()) so the bank details never show twice.
 */
class BankTransferGateway extends AbstractPaymentGateway
{
    protected string $id = 'bank_transfer';
    protected string $title = 'Bank Transfer';
    protected string $description = 'Accept manual bank transfer payments';
    protected string $icon = 'bank_transfer.svg';
    protected bool $isOffline = true;
    protected array $supports = ['bank_transfer'];

    /**
     * Translatable display title. The raw `$title` property can't carry a
     * `__()` call (PHP property defaults must be constant), so the customer-
     * facing label is translated here. An admin-set custom title (via gateway
     * config) still takes precedence in PaymentGatewayRegistry::getForCheckout().
     */
    public function getTitle(): string
    {
        return __('Bank Transfer', 'yatra');
    }

    /**
     * Translatable description shown under the gateway option at checkout.
     */
    public function getDescription(): string
    {
        // Shown to customers at checkout (it read like an admin label).
        return __('Pay by bank transfer. Our bank details are shown after you book and sent by email.', 'yatra');
    }

    public function __construct()
    {
        parent::__construct();

        // Hook into confirmation page to display bank details
        add_action('yatra_booking_confirmation_after_details', [$this, 'renderConfirmationDetails'], 10, 1);

        // Supply bank-transfer payment instructions to the (pro-forma) invoice
        // for bank_transfer bookings, so the customer receives an invoice that
        // tells them where and how to pay. Free renders whatever this returns.
        add_filter('yatra_invoice_payment_instructions', [$this, 'invoicePaymentInstructions'], 10, 2);
    }

    /**
     * Provide structured bank-transfer payment instructions for the invoice.
     *
     * @param mixed  $instructions Existing value (array|empty) from prior filters.
     * @param object $booking      Booking/payment-like object (has payment_gateway, id, reference, amount_due).
     * @return mixed Array with title/rows/note, or the untouched $instructions.
     */
    public function invoicePaymentInstructions($instructions, $booking)
    {
        $gateway = is_object($booking) ? (string) ($booking->payment_gateway ?? '') : '';
        if ($gateway !== 'bank_transfer' || !$this->isActiveCopy() || !$this->isProperlyConfigured()) {
            return $instructions;
        }

        // Only when there is still a balance to pay — a fully-paid booking's
        // invoice is a receipt and does not need "please transfer" details.
        $amountDue = is_object($booking) ? (float) ($booking->amount_due ?? $booking->booking_amount_due ?? 0) : 0.0;
        if ($amountDue <= 0.0 && (is_object($booking) && isset($booking->amount_due))) {
            return $instructions;
        }

        $bookingId = is_object($booking) ? (int) ($booking->id ?? $booking->booking_id ?? 0) : 0;
        $ref = is_object($booking) ? (string) ($booking->reference ?? $booking->booking_reference ?? '') : '';
        $reference = $ref !== '' ? $ref : ('BOOKING-' . $bookingId);

        // Deliberately the SAME msgids the confirmation page uses
        // (confirmation-details.php). These labels previously read "Bank",
        // "Routing / SWIFT" etc. — different strings for identical labels — so an
        // operator who had translated the confirmation page still saw an English
        // invoice and had no obvious way to fix it. Sharing the msgids means one
        // translation covers both surfaces. The invoice template normalises the
        // trailing colon, so it renders correctly either way.
        $rows = [];
        $accounts = $this->accountsFor(is_object($booking) ? (string) ($booking->currency ?? '') : '');
        foreach ($accounts as $n => $acc) {
            if (count($accounts) > 1) {
                $heading = $acc['label'] !== '' ? $acc['label'] : sprintf(/* translators: %d: account number in the list */ __('Account %d', 'yatra'), $n + 1);
                if ($acc['currency'] !== '') {
                    $heading .= ' (' . $acc['currency'] . ')';
                }
                $rows[] = ['label' => $heading, 'value' => ''];
            }
            if ($acc['bank_name'] !== '') {
                $rows[] = ['label' => __('Bank Name:', 'yatra'), 'value' => $acc['bank_name']];
            }
            if ($acc['account_name'] !== '') {
                $rows[] = ['label' => __('Account Name:', 'yatra'), 'value' => $acc['account_name']];
            }
            if ($acc['account_number'] !== '') {
                $rows[] = ['label' => __('Account Number:', 'yatra'), 'value' => $acc['account_number']];
            }
            if ($acc['routing_code'] !== '') {
                $rows[] = ['label' => __('Routing/SWIFT Code:', 'yatra'), 'value' => $acc['routing_code']];
            }
        }
        $rows[] = ['label' => __('Payment Reference:', 'yatra'), 'value' => $reference];

        $note = trim((string) ($this->config['instructions'] ?? ''));
        if ($note === '') {
            $note = __('Please transfer the amount due to the account above and include the payment reference so we can match your booking.', 'yatra');
        }

        return [
            'title' => __('Bank Transfer Details', 'yatra'),
            'rows'  => $rows,
            'note'  => $note,
        ];
    }

    /**
     * Is this the Bank Transfer gateway Yatra uses? False when an older Yatra
     * Pro registered its own copy over this one.
     */
    private function isActiveCopy(): bool
    {
        return \Yatra\PaymentGateways\PaymentGatewayRegistry::getInstance()->get('bank_transfer') === $this;
    }

    public function getConfigFields(): array
    {
        return [
            [
                'id' => 'bank_name',
                'type' => 'text',
                'label' => __('Bank Name', 'yatra'),
                'description' => __('Name of your bank', 'yatra'),
                'placeholder' => 'e.g., Chase Bank, HSBC...',
                'default' => '',
            ],
            [
                'id' => 'account_name',
                'type' => 'text',
                'label' => __('Account Name', 'yatra'),
                'description' => __('Name on the bank account', 'yatra'),
                'placeholder' => 'e.g., Yatra Travel Company',
                'default' => '',
            ],
            [
                'id' => 'account_number',
                'type' => 'text',
                'label' => __('Account Number', 'yatra'),
                'description' => __('Bank account number', 'yatra'),
                'placeholder' => 'e.g., 1234567890',
                'default' => '',
            ],
            [
                'id' => 'routing_code',
                'type' => 'text',
                'label' => __('Routing/SWIFT Code', 'yatra'),
                'description' => __('Bank routing number or SWIFT/BIC code', 'yatra'),
                'placeholder' => 'e.g., 021000021 or CHASUS33',
                'default' => '',
            ],
            [
                'id' => 'account_currency',
                'type' => 'text',
                'label' => __('Account currency (optional)', 'yatra'),
                'description' => __('Show this account only for bookings in this currency, e.g. EUR. Leave empty for every booking.', 'yatra'),
                'placeholder' => 'e.g., EUR',
                'default' => '',
            ],
            [
                'id' => 'extra_accounts',
                'type' => 'bank_accounts',
                'label' => __('More bank accounts', 'yatra'),
                'description' => __('Other accounts customers can pay into — for example one per currency or country. Each shows only for bookings in its currency (or for every booking when the currency is empty).', 'yatra'),
                'default' => [],
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

    /**
     * The accounts to show for a booking in this currency: the main account
     * and the extra accounts whose currency is empty or matches. When none
     * matches, the main account (the old single-account behaviour).
     *
     * @since 3.3.0
     * @return list<array{label:string,bank_name:string,account_name:string,account_number:string,routing_code:string,currency:string}>
     */
    public function accountsFor(string $currency): array
    {
        $currency = strtoupper(trim($currency));
        $main = [
            'label' => '',
            'bank_name' => trim((string) ($this->config['bank_name'] ?? '')),
            'account_name' => trim((string) ($this->config['account_name'] ?? '')),
            'account_number' => trim((string) ($this->config['account_number'] ?? '')),
            'routing_code' => trim((string) ($this->config['routing_code'] ?? '')),
            'currency' => strtoupper(trim((string) ($this->config['account_currency'] ?? ''))),
        ];
        $all = [$main];
        $extra = $this->config['extra_accounts'] ?? [];
        if (is_string($extra)) {
            $decoded = json_decode($extra, true);
            $extra = is_array($decoded) ? $decoded : [];
        }
        foreach (is_array($extra) ? $extra : [] as $row) {
            if (!is_array($row)) {
                continue;
            }
            $acc = [
                'label' => sanitize_text_field((string) ($row['label'] ?? '')),
                'bank_name' => sanitize_text_field((string) ($row['bank_name'] ?? '')),
                'account_name' => sanitize_text_field((string) ($row['account_name'] ?? '')),
                'account_number' => sanitize_text_field((string) ($row['account_number'] ?? '')),
                'routing_code' => sanitize_text_field((string) ($row['routing_code'] ?? '')),
                'currency' => strtoupper(sanitize_text_field((string) ($row['currency'] ?? ''))),
            ];
            if ($acc['account_number'] !== '' || $acc['bank_name'] !== '') {
                $all[] = $acc;
            }
        }
        $shown = array_values(array_filter($all, static function ($a) use ($currency) {
            return ($a['account_number'] !== '' || $a['bank_name'] !== '')
                && ($a['currency'] === '' || $currency === '' || $a['currency'] === $currency);
        }));

        /**
         * Bank accounts shown to a customer for a booking in this currency.
         *
         * @since 3.3.0
         */
        $shown = (array) apply_filters('yatra_bank_transfer_accounts', $shown !== [] ? $shown : [$main], $currency, $this);

        return array_values($shown);
    }

    public function isProperlyConfigured(): bool
    {
        return !empty(trim((string) ($this->config['bank_name'] ?? '')))
            && !empty(trim((string) ($this->config['account_number'] ?? '')));
    }

    public function processPayment(array $paymentData): array
    {
        if (!$this->isProperlyConfigured()) {
            return [
                'success' => false,
                'error' => GatewayUserMessages::gatewayNotConfigured($this),
            ];
        }

        $bookingId = $paymentData['booking_id'] ?? 0;
        
        return [
            'success' => true,
            'payment_method' => 'bank_transfer',
            'status' => 'pending',
            'bank_details' => [
                'bank_name' => $this->config['bank_name'] ?? '',
                'account_name' => $this->config['account_name'] ?? '',
                'account_number' => $this->config['account_number'] ?? '',
                'routing_code' => $this->config['routing_code'] ?? '',
            ],
            'instructions' => $this->config['instructions'] ?? __('Please transfer the amount to the bank account above and include your booking reference in the payment description.', 'yatra'),
            'reference' => 'BOOKING-' . $bookingId,
        ];
    }

    public function verifyPayment(string $transactionId): array
    {
        // Bank transfers settle out of band: the operator confirms the funds
        // manually once they land. There is nothing to verify online here, so
        // this MUST NOT report success — callers such as confirm_payment() /
        // handle_callback() treat a successful verify as a captured payment and
        // would otherwise mark the booking paid + completed the moment a booking
        // is created, before any money has actually arrived.
        return [
            'success' => false,
            'status' => 'pending_verification',
            'error' => __('Bank transfer payments are confirmed manually once funds are received.', 'yatra'),
        ];
    }

    /**
     * Render bank transfer details on booking confirmation page
     * 
     * @param object $booking Booking object
     */
    public function renderConfirmationDetails($booking): void
    {
        // Only render if this booking used bank transfer
        if ($booking->payment_gateway !== 'bank_transfer' || !$this->isActiveCopy()) {
            return;
        }

        $bank_accounts = $this->accountsFor((string) ($booking->currency ?? ''));
        $bank_details = [
            'bank_name' => $this->config['bank_name'] ?? '',
            'account_name' => $this->config['account_name'] ?? '',
            'account_number' => $this->config['account_number'] ?? '',
            'routing_code' => $this->config['routing_code'] ?? '',
            'instructions' => $this->config['instructions'] ?? __('Please transfer the amount to the bank account above and include your booking reference in the payment description.', 'yatra'),
        ];

        $amount_due = $booking->amount_due > 0 ? $booking->amount_due : $booking->total_amount;

        // Include the template
        include __DIR__ . '/confirmation-details.php';
    }
}

