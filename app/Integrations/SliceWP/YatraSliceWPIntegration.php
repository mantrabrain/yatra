<?php
/**
 * The "Yatra" entry in SliceWP → Settings → Integrations. Loaded only while
 * SliceWP is active (its base class exists).
 *
 * @package Yatra\Integrations\SliceWP
 * @since 3.3.0
 */

declare(strict_types=1);

namespace Yatra\Integrations\SliceWP;

if (!class_exists('\\SliceWP_Integration')) {
    return;
}

class YatraSliceWPIntegration extends \SliceWP_Integration
{
    public function __construct()
    {
        $this->name = 'Yatra';
        $this->supports = (array) apply_filters('slicewp_integration_supports_yatra', [
            'commission_types' => ['sale'],
        ]);
    }
}
