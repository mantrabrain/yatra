<?php

declare(strict_types=1);

namespace Yatra\Core\Assets;

/**
 * Listing Page Asset Manager
 */
class ListingAssetManager extends BaseAssetManager
{
    private string $listing_type;

    public function __construct(string $listing_type)
    {
        parent::__construct('listing');

        $this->listing_type = $listing_type;

        $this->addStyle('yatra-listing');
        $this->addScript('yatra-listing');

        $data = [
            'type' => $listing_type,
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('yatra_listing_nonce'),
        ];

        if ($listing_type === 'trip' && function_exists('yatra_get_trip_listing_url')) {
            $data['tripListingUrl'] = \yatra_get_trip_listing_url();
        }

        $this->addLocalization('yatra-listing', 'yatraListing', $data);
    }
}
