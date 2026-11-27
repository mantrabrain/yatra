<?php

declare(strict_types=1);

namespace Yatra\Blocks;

/**
 * My Account Block (yatra/my-account)
 *
 * The [yatra_my_account] customer dashboard (bookings, profile, wishlist);
 * guests see the login prompt.
 *
 * @package Yatra\Blocks
 * @since 3.1.4
 */
class MyAccountBlock extends AbstractShortcodeBlock
{
    public function slug(): string
    {
        return 'my-account';
    }

    public function title(): string
    {
        return __('My Account', 'yatra');
    }

    public function elementorIcon(): string
    {
        return 'eicon-person';
    }

    protected function shortcodeTag(): string
    {
        return 'yatra_my_account';
    }

    protected function shortcodeAttributes(array $attributes): array
    {
        unset($attributes);

        return [];
    }
}
