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

        if ($token === '') {
            $this->prevent404();
            AuthController::handleEmailVerification();

            return true;
        }

        $this->prevent404();
        $this->setQueryVars([
            'yatra_verify_email' => $token,
        ]);

        AuthController::handleEmailVerification();

        return true;
    }
}
