<?php

declare(strict_types=1);

namespace Yatra\PaymentGateways;

/**
 * End-user safe messages for payment gateway errors (no internal config hints).
 */
final class GatewayUserMessages
{
    public static function gatewayNotConfigured(PaymentGatewayInterface $gateway): string
    {
        $title = self::displayTitle($gateway);

        return sprintf(
            /* translators: %s: Payment gateway display name, e.g. Square, Stripe */
            __('The selected gateway (%s) is not properly configured. Please contact your website administrator.', 'yatra'),
            $title
        );
    }

    private static function displayTitle(PaymentGatewayInterface $gateway): string
    {
        $config = $gateway->getConfig();
        $custom = isset($config['title']) ? trim((string) $config['title']) : '';

        return $custom !== '' ? $custom : $gateway->getTitle();
    }
}
