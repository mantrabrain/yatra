<?php
/**
 * Setup Wizard - Currency Settings Step
 *
 * @package Yatra
 */

defined('ABSPATH') || exit;

use Yatra\Services\SettingsService;
use Yatra\Helpers\CurrencyHelper;

// Get actual Yatra settings
$currency = SettingsService::get('currency', 'USD');
$currency_position = SettingsService::get('currency_position', 'before');
$thousand_separator = SettingsService::get('thousand_separator', ',');
$decimal_separator = SettingsService::get('decimal_separator', '.');
$decimal_places = SettingsService::get('decimal_places', 2);

// Get all currencies from CurrencyHelper
$currencies = CurrencyHelper::getOptions(true);

// Get popular currencies for quick selection
$popular_currencies = CurrencyHelper::getPopular();
$popular_options = [];
foreach ($popular_currencies as $code => $data) {
    $popular_options[$code] = "{$data['name']} ({$data['symbol']})";
}
?>

<form method="post" class="wizard-step">
    <?php wp_nonce_field('yatra-setup'); ?>
    <input type="hidden" name="save_step" value="currency">
    
    <div class="wizard-header">
        <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 8px;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
            <h1 style="margin: 0;"><?php esc_html_e('Currency Settings', 'yatra'); ?></h1>
        </div>
        <p style="text-align: center;"><?php esc_html_e('Set up how prices are displayed on your website', 'yatra'); ?></p>
    </div>

    <div class="wizard-content">
        <!-- First Row - Currency & Position -->
        <div class="form-row" style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div class="form-group">
                <label class="form-label" for="currency"><?php esc_html_e('Currency', 'yatra'); ?></label>
                <select id="currency" name="currency" class="form-control">
                    <optgroup label="<?php esc_html_e('Popular Currencies', 'yatra'); ?>">
                        <?php foreach ($popular_options as $code => $label) : ?>
                            <option value="<?php echo esc_attr($code); ?>" <?php selected($currency, $code); ?>>
                                <?php echo esc_html($label); ?>
                            </option>
                        <?php endforeach; ?>
                    </optgroup>
                    <optgroup label="<?php esc_html_e('All Currencies', 'yatra'); ?>">
                        <?php foreach ($currencies as $code => $label) : ?>
                            <?php if (!isset($popular_options[$code])) : // Skip popular currencies already shown ?>
                                <option value="<?php echo esc_attr($code); ?>" <?php selected($currency, $code); ?>>
                                    <?php echo esc_html($label); ?>
                                </option>
                            <?php endif; ?>
                        <?php endforeach; ?>
                    </optgroup>
                </select>
                <p class="form-help"><?php esc_html_e('Select your preferred currency from 150+ world currencies', 'yatra'); ?></p>
            </div>

            <div class="form-group">
                <label class="form-label" for="currency_position"><?php esc_html_e('Currency Position', 'yatra'); ?></label>
                <select id="currency_position" name="currency_position" class="form-control">
                    <option value="before" <?php selected($currency_position, 'before'); ?>><?php esc_html_e('Before ($99.99)', 'yatra'); ?></option>
                    <option value="after" <?php selected($currency_position, 'after'); ?>><?php esc_html_e('After (99.99$)', 'yatra'); ?></option>
                </select>
                <p class="form-help"><?php esc_html_e('Where to display the currency symbol', 'yatra'); ?></p>
            </div>
        </div>

        <!-- Second Row - Separators -->
        <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
            <div class="form-group">
                <label class="form-label" for="thousand_separator"><?php esc_html_e('Thousand Separator', 'yatra'); ?></label>
                <input type="text" id="thousand_separator" name="thousand_separator" value="<?php echo esc_attr($thousand_separator); ?>" maxlength="1" class="form-control">
                <p class="form-help"><?php esc_html_e('e.g., comma (,) for 1,000', 'yatra'); ?></p>
            </div>

            <div class="form-group">
                <label class="form-label" for="decimal_separator"><?php esc_html_e('Decimal Separator', 'yatra'); ?></label>
                <input type="text" id="decimal_separator" name="decimal_separator" value="<?php echo esc_attr($decimal_separator); ?>" maxlength="1" class="form-control">
                <p class="form-help"><?php esc_html_e('e.g., period (.) for 99.99', 'yatra'); ?></p>
            </div>

            <div class="form-group">
                <label class="form-label" for="decimal_places"><?php esc_html_e('Decimal Places', 'yatra'); ?></label>
                <input type="number" id="decimal_places" name="decimal_places" value="<?php echo esc_attr($decimal_places); ?>" min="0" max="4" class="form-control">
                <p class="form-help"><?php esc_html_e('Number of decimal places to display', 'yatra'); ?></p>
            </div>
        </div>
    </div>

    <div class="wizard-footer">
        <a href="<?php echo esc_url($this->get_step_url('general')); ?>" class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <?php esc_html_e('Back', 'yatra'); ?>
        </a>
        <a href="<?php echo esc_url($this->get_next_step_link()); ?>" class="btn btn-secondary" style="display: inline-flex; align-items: center; gap: 8px;">
            <?php esc_html_e('Skip', 'yatra'); ?>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
                <polyline points="12 5 19 12 12 19" transform="translate(5, 0)"></polyline>
            </svg>
        </a>
        <button type="submit" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px;">
            <?php esc_html_e('Continue', 'yatra'); ?>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
        </button>
    </div>
</form>
