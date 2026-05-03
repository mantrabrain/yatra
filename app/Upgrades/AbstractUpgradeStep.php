<?php

declare(strict_types=1);

namespace Yatra\Upgrades;

use Yatra\Upgrades\Contracts\UpgradeStepInterface;

/**
 * Default {@see UpgradeStepInterface::shouldApply()}: run only when crossing this target from below.
 */
abstract class AbstractUpgradeStep implements UpgradeStepInterface
{
    public static function shouldApply(string $fromVersion, string $toVersion): bool
    {
        return version_compare($fromVersion, static::targetVersion(), '<')
            && version_compare($toVersion, static::targetVersion(), '>=');
    }
}
