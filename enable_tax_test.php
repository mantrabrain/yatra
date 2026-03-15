<?php
/**
 * Enable tax for testing
 */

// Enable tax
update_option('yatra_enable_tax', '1');

// Set tax rate to 10%
update_option('yatra_tax_rate', '10');

// Set tax label
update_option('yatra_tax_label', 'Tax');

// Set tax as exclusive (added to price)
update_option('yatra_tax_inclusive', '0');

echo "Tax enabled with 10% rate\n";
echo "Enable: " . get_option('yatra_enable_tax') . "\n";
echo "Rate: " . get_option('yatra_tax_rate') . "\n";
echo "Label: " . get_option('yatra_tax_label') . "\n";
echo "Inclusive: " . get_option('yatra_tax_inclusive') . "\n";
