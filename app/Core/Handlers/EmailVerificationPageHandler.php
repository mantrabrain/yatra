<?php

declare(strict_types=1);

namespace Yatra\Core\Handlers;

use Yatra\Controllers\AuthController;

/**
 * Pretty / plain routes for customer email verification links.
 */
final class EmailVerificationPageHandler extends BasePageHandler
{
    /**
     * @param array<string, mixed> $route_data
     */
    public function handle(array $route_data): bool
    {
        $token = isset($route_data['token']) ? (string) $route_data['token'] : '';
        $token = preg_replace('/[^a-zA-Z0-9_-]/', '', $token) ?? '';

        // AuthController::handleEmailVerification() performs wp_redirect/wp_die internally
        // and never returns to the template flow — so we don't queue a template via
        // PageContext. We still configure the page environment so any partial-failure
        // path that DOES return doesn't render the theme's 404.
        $this->setupPageEnvironment('singular', [
            'title' => __('Email Verification', 'yatra'),
            'post_type' => 'page',
            'post_name' => $token !== '' ? 'verify-email/' . $token : 'verify-email',
        ]);

        if ($token !== '') {
            $this->setQueryVars([
                'yatra_verify_email' => $token,
            ]);
        }

        AuthController::handleEmailVerification();

        return true;
    }
}
