<?php
/**
 * Debug script to check payment gateway settings
 */

// Include WordPress
require_once('../../../wp-config.php');

// Get payment gateway settings
$payment_gateways = get_option('yatra_payment_gateways', []);
$gateway_configs = get_option('yatra_gateway_configs', []);

echo "=== Payment Gateway Debug ===\n\n";
echo "Payment Gateways Setting:\n";
print_r($payment_gateways);
echo "\n";

echo "Gateway Configs:\n";
print_r($gateway_configs);
echo "\n";

// Check if PayLater is specifically enabled
$pay_later_enabled = false;
if (isset($gateway_configs['pay_later']['enabled'])) {
    $pay_later_enabled = $gateway_configs['pay_later']['enabled'];
}

echo "PayLater Enabled: " . ($pay_later_enabled ? 'YES' : 'NO') . "\n\n";

// Check PaymentGatewayRegistry
if (class_exists('Yatra\PaymentGateways\PaymentGatewayRegistry')) {
    $registry = \Yatra\PaymentGateways\PaymentGatewayRegistry::getInstance();
    $available = $registry->getAvailable();
    $checkout = $registry->getForCheckout();
    
    echo "Available Gateways:\n";
    foreach ($available as $id => $gateway) {
        echo "- $id: " . ($gateway['enabled'] ? 'ENABLED' : 'DISABLED') . "\n";
    }
    echo "\n";
    
    echo "Checkout Gateways:\n";
    foreach ($checkout as $gateway) {
        echo "- " . $gateway['id'] . "\n";
    }
} else {
    echo "PaymentGatewayRegistry class not found\n";
}

echo "\n=== End Debug ===\n";
