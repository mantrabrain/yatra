<?php

declare(strict_types=1);

namespace Yatra\Upgrades\Contracts;

/**
 * One-time delta migration for a specific plugin release (not run on fresh installs at that version).
 */
interface UpgradeStepInterface
{
    /**
     * Semver this step belongs to (e.g. "3.0.1"). The step runs when upgrading from below this to at or above it.
     */
    public static function targetVersion(): string;

    public static function shouldApply(string $fromVersion, string $toVersion): bool;

    public static function run(string $fromVersion, string $toVersion): void;

    /**
     * @return list<'init'|'admin_init'>
     */
    public static function runOnHooks(): array;
}
