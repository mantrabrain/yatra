<?php
/**
 * Enable PayLater gateway in database
 */

// Include WordPress
require_once('../../../wp-config.php');

// Get current gateway configs
$gateway_configs = get_option('yatra_gateway_configs', []);

// Add PayLater config if not exists
if (!isset($gateway_configs['pay_later'])) {
    $gateway_configs['pay_later'] = [
        'enabled' => true,
        'payment_deadline_days' => 7,
        'auto_cancel_days' => 3,
        'require_deposit' => false,
        'deposit_amount' => 20,
        'payment_reminder_days' => '7,3,1',
    ];
    
    // Save the updated configs
    update_option('yatra_gateway_configs', $gateway_configs);
    
    echo "PayLater gateway has been enabled!\n";
    echo "Config saved: " . print_r($gateway_configs['pay_later'], true) . "\n";
} else {
    // Just enable it if it exists but is disabled
    $gateway_configs['pay_later']['enabled'] = true;
    update_option('yatra_gateway_configs', $gateway_configs);
    
    echo "PayLater gateway was already configured, now enabled!\n";
    echo "Current config: " . print_r($gateway_configs['pay_later'], true) . "\n";
}

// Verify the save
$verify = get_option('yatra_gateway_configs', []);
echo "\nVerification - PayLater enabled: " . ($verify['pay_later']['enabled'] ?? false ? 'YES' : 'NO') . "\n";
?>
