<?php

declare(strict_types=1);

namespace Yatra\Compatibility\Elementor;

use Yatra\Blocks\AbstractServerBlock;
use Yatra\Providers\FrontendAssetsProvider;
use Yatra\Shortcodes\LoginShortcode;
use Yatra\Shortcodes\SearchShortcode;

/**
 * Elementor widgets for Yatra's blocks (a "Yatra" category in the widget panel).
 *
 * Registered only when Elementor is active: {@see \Yatra\Providers\BlockServiceProvider}
 * calls register() on `elementor/loaded`. Nothing here touches an Elementor
 * class until Elementor fires its own hooks, so Yatra never depends on it.
 *
 * Every widget renders through the same PHP method as its block, so a block and
 * its widget print identical markup.
 *
 * @package Yatra\Compatibility\Elementor
 * @since 3.1.4
 */
final class WidgetManager
{
    private static bool $registered = false;

    /**
     * Widget classes (one per block), in panel order.
     *
     * @return list<class-string>
     */
    public static function widgetClasses(): array
    {
        return [
            Widgets\TripSearchWidget::class,
            Widgets\TripGridWidget::class,
            Widgets\DealsWidget::class,
            Widgets\TripGalleryWidget::class,
            Widgets\TripFactsWidget::class,
            Widgets\TripBookingWidget::class,
            Widgets\TripItineraryWidget::class,
            Widgets\TripIncludesWidget::class,
            Widgets\TripFaqWidget::class,
            Widgets\TripMapWidget::class,
            Widgets\TripReviewsWidget::class,
            Widgets\LoginWidget::class,
            Widgets\MyAccountWidget::class,
        ];
    }

    public static function register(): void
    {
        if (self::$registered) {
            return;
        }
        self::$registered = true;

        add_action('elementor/elements/categories_registered', [self::class, 'registerCategory']);
        add_action('elementor/widgets/register', [self::class, 'registerWidgets']);

        // The editor preview re-renders widgets over AJAX, so the preview frame
        // loads the files every Yatra widget needs up front.
        add_action('elementor/preview/enqueue_styles', [self::class, 'enqueuePreviewAssets']);
    }

    /**
     * @param object $elementsManager \Elementor\Elements_Manager
     */
    public static function registerCategory($elementsManager): void
    {
        if (! is_object($elementsManager) || ! method_exists($elementsManager, 'add_category')) {
            return;
        }

        $elementsManager->add_category('yatra', [
            'title' => __('Yatra', 'yatra'),
            'icon' => 'eicon-map-pin',
        ]);
    }

    /**
     * @param object $widgetsManager \Elementor\Widgets_Manager
     */
    public static function registerWidgets($widgetsManager): void
    {
        if (! is_object($widgetsManager) || ! class_exists('\Elementor\Widget_Base')) {
            return;
        }

        foreach (self::widgetClasses() as $class) {
            try {
                $widget = new $class();
                if (method_exists($widgetsManager, 'register')) {
                    $widgetsManager->register($widget);
                } elseif (method_exists($widgetsManager, 'register_widget_type')) {
                    $widgetsManager->register_widget_type($widget);
                }
            } catch (\Throwable $e) {
                // One broken widget must never take the Elementor editor down.
                continue;
            }
        }
    }

    /**
     * Shared Yatra files for the Elementor preview frame.
     */
    public static function enqueuePreviewAssets(): void
    {
        FrontendAssetsProvider::ensureCommonAssets();
        FrontendAssetsProvider::ensureTripDetailAssets();
        SearchShortcode::enqueueTripSearchAssets();
        LoginShortcode::enqueueLoginAssets();

        AbstractServerBlock::registerSharedStyles();
        wp_enqueue_style('yatra-blocks');
        if (wp_style_is('yatra-trip-shortcode', 'registered')) {
            wp_enqueue_style('yatra-trip-shortcode');
        }
        if (wp_script_is('yatra-trip-shortcode', 'registered')) {
            wp_enqueue_script('yatra-trip-shortcode');
        }
    }
}
