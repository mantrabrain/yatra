<?php

declare(strict_types=1);

namespace Yatra\Shortcodes;

/**
 * Account Shortcode
 *
 * Displays the user account page
 */
class AccountShortcode extends BaseShortcode
{
    public function __construct()
    {
        parent::__construct('yatra_account');
    }

    /**
     * Render the account shortcode content
     */
    protected function renderContent(array $atts): string
    {
        $template = $this->getTemplatePath('account.php');

        if (!file_exists($template)) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                return '<div class="yatra-error">Account page template not found at: ' . esc_html($template) . '</div>';
            }
            return '';
        }

        ob_start();
        include $template;
        return ob_get_clean();
    }
}
