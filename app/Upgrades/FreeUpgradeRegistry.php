<?php

declare(strict_types=1);

namespace Yatra\Upgrades;

use Yatra\Upgrades\Contracts\UpgradeStepInterface;
use Yatra\Upgrades\Versions\Upgrade_3_0_1;

/**
 * Register Free upgrade steps (add a class per release when DB/data migration is required).
 *
 * @return list<class-string<UpgradeStepInterface>>
 */
final class FreeUpgradeRegistry
{
    /**
     * @return list<class-string<UpgradeStepInterface>>
     */
    public static function allSteps(): array
    {
        return [
            Upgrade_3_0_1::class,
        ];
    }

    /**
     * @return list<class-string<UpgradeStepInterface>>
     */
    public static function stepsForHook(string $hook): array
    {
        $out = [];
        foreach (self::allSteps() as $class) {
            if (in_array($hook, $class::runOnHooks(), true)) {
                $out[] = $class;
            }
        }

        usort($out, static function (string $a, string $b): int {
            return version_compare($a::targetVersion(), $b::targetVersion(), '<=>');
        });

        return $out;
    }
}
