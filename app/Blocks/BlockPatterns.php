<?php

declare(strict_types=1);

namespace Yatra\Blocks;

/**
 * Block patterns built from Yatra blocks, under a "Yatra" pattern category.
 *
 * @package Yatra\Blocks
 * @since 3.1.4
 */
final class BlockPatterns
{
    public static function register(): void
    {
        if (! function_exists('register_block_pattern') || ! function_exists('register_block_pattern_category')) {
            return;
        }

        register_block_pattern_category('yatra', ['label' => __('Yatra', 'yatra')]);

        foreach (self::patterns() as $name => $pattern) {
            register_block_pattern('yatra/' . $name, $pattern);
        }
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private static function patterns(): array
    {
        $tripLanding = '<!-- wp:yatra/trip-gallery {"align":"wide"} /-->'
            . "\n\n" . '<!-- wp:yatra/trip-facts {"align":"wide"} /-->'
            . "\n\n" . '<!-- wp:columns {"align":"wide"} -->'
            . "\n" . '<div class="wp-block-columns alignwide"><!-- wp:column {"width":"66.66%"} -->'
            . "\n" . '<div class="wp-block-column" style="flex-basis:66.66%"><!-- wp:yatra/trip-itinerary /-->'
            . "\n\n" . '<!-- wp:yatra/trip-includes /-->'
            . "\n\n" . '<!-- wp:yatra/trip-map /-->'
            . "\n\n" . '<!-- wp:yatra/trip-faq /--></div>'
            . "\n" . '<!-- /wp:column -->'
            . "\n\n" . '<!-- wp:column {"width":"33.33%"} -->'
            . "\n" . '<div class="wp-block-column" style="flex-basis:33.33%"><!-- wp:yatra/trip-booking /--></div>'
            . "\n" . '<!-- /wp:column --></div>'
            . "\n" . '<!-- /wp:columns -->'
            . "\n\n" . '<!-- wp:yatra/trip-reviews {"align":"wide"} /-->';

        $destinationHero = '<!-- wp:cover {"dimRatio":40,"minHeight":420,"align":"full"} -->'
            . "\n" . '<div class="wp-block-cover alignfull" style="min-height:420px"><span aria-hidden="true" class="wp-block-cover__background has-background-dim-40 has-background-dim"></span><div class="wp-block-cover__inner-container"><!-- wp:heading {"textAlign":"center","level":1} -->'
            . "\n" . '<h1 class="wp-block-heading has-text-align-center">' . esc_html__('Explore the Himalayas', 'yatra') . '</h1>'
            . "\n" . '<!-- /wp:heading -->'
            . "\n\n" . '<!-- wp:paragraph {"align":"center"} -->'
            . "\n" . '<p class="has-text-align-center">' . esc_html__('Hand-picked trips with local guides. Find your next adventure.', 'yatra') . '</p>'
            . "\n" . '<!-- /wp:paragraph -->'
            . "\n\n" . '<!-- wp:yatra/trip-search /--></div></div>'
            . "\n" . '<!-- /wp:cover -->'
            . "\n\n" . '<!-- wp:yatra/tour {"title":"' . esc_attr__('Popular trips', 'yatra') . '","per_page":6,"columns":3,"show_pagination":false,"align":"wide"} /-->';

        $deals = '<!-- wp:heading {"textAlign":"center"} -->'
            . "\n" . '<h2 class="wp-block-heading has-text-align-center">' . esc_html__('Special deals', 'yatra') . '</h2>'
            . "\n" . '<!-- /wp:heading -->'
            . "\n\n" . '<!-- wp:yatra/deals {"per_page":6,"columns":3} /-->';

        return [
            'trip-landing-page' => [
                'title' => __('Trip landing page', 'yatra'),
                'description' => __('Gallery, facts, itinerary, inclusions, map, FAQ, booking card and reviews for one trip.', 'yatra'),
                'categories' => ['yatra'],
                'keywords' => ['trip', 'tour', 'landing', 'yatra'],
                'content' => $tripLanding,
            ],
            'destination-hero-trip-grid' => [
                'title' => __('Destination hero + trip grid', 'yatra'),
                'description' => __('Full-width hero with the trip search bar, followed by a grid of trips.', 'yatra'),
                'categories' => ['yatra'],
                'keywords' => ['destination', 'hero', 'search', 'yatra'],
                'content' => $destinationHero,
            ],
            'deals-section' => [
                'title' => __('Deals section', 'yatra'),
                'description' => __('Heading and a grid of discounted trips.', 'yatra'),
                'categories' => ['yatra'],
                'keywords' => ['deals', 'discount', 'offer', 'yatra'],
                'content' => $deals,
            ],
        ];
    }
}
