<?php

declare(strict_types=1);

namespace Yatra\Core\Assets;

/**
 * Trip Page Asset Manager
 */
class TripAssetManager extends BaseAssetManager
{
    public function __construct()
    {
        parent::__construct('trip');

        // Video player and tour viewer modules are loaded in FrontendAssetsProvider
        
        // Add main trip styles and scripts
        $this->addStyle('yatra-trip-single');
        $this->addScript('yatra-trip-single');

        // Add trip data localization if available
        if (isset($GLOBALS['trip'])) {
            $this->addLocalization('yatra-trip-single', 'yatraTrip', [
                'id' => $GLOBALS['trip']->id,
                'title' => $GLOBALS['trip']->title,
                'slug' => $GLOBALS['trip']->slug,
                'price' => $GLOBALS['trip']->effective_price_min,
                'currency' => $GLOBALS['trip']->currency,
            ]);
        }
    }
}
