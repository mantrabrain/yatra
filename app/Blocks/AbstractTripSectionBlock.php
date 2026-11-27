<?php

declare(strict_types=1);

namespace Yatra\Blocks;

use Yatra\Controllers\SingleTripController;
use Yatra\Providers\FrontendAssetsProvider;
use Yatra\Repositories\TripRepository;

/**
 * A block that shows one section of the single-trip page (gallery, itinerary,
 * facts, booking card, FAQ …) anywhere: the trip is picked in the block, or,
 * when left on "Current trip", the trip whose page is being shown.
 *
 * The markup is the single-trip template part itself
 * (templates/partials/single-trip/*), loaded with yatra_get_template() so
 * theme overrides apply. The parts read the trip from the global $trip, the
 * same way {@see \Yatra\Core\Handlers\TripPageHandler} sets it up; the global
 * is set for the duration of the render and restored afterwards.
 *
 * @package Yatra\Blocks
 * @since 3.1.4
 */
abstract class AbstractTripSectionBlock extends AbstractServerBlock
{
    /**
     * Prepared trips, per request (several section blocks usually show the same trip).
     *
     * @var array<int, object|null>
     */
    private static array $trips = [];

    /**
     * Template parts printed once per page (modals the sections open).
     *
     * @var array<string, true>
     */
    private static array $printedOnce = [];

    /**
     * Print the section for $trip (echo; output is buffered by render()).
     *
     * @param object $trip Prepared trip ({@see SingleTripController::getById()}).
     * @param array<string, mixed> $attributes
     */
    abstract protected function renderSection(object $trip, array $attributes): void;

    protected function editorStyles(): array
    {
        return ['yatra-common', 'yatra-blocks-trip-preview', 'yatra-blocks'];
    }

    public function controls(): array
    {
        return [
            [
                'name' => 'tripId',
                'type' => 'trip',
                'label' => __('Trip', 'yatra'),
                'default' => 0,
                'help' => __('Leave on "Current trip" to show the trip whose page this is.', 'yatra'),
            ],
        ];
    }

    /**
     * @param array<string, mixed> $attributes
     */
    public function render(array $attributes): string
    {
        $tripId = self::int($attributes['tripId'] ?? 0, 0, 0, PHP_INT_MAX);
        $resolved = self::resolveTrip($tripId);

        if ($resolved === null) {
            return $this->renderMissingTrip($tripId);
        }

        global $trip;
        $previousTrip = $trip;
        $previousHero = $GLOBALS['yatra_hero_gallery_images'] ?? null;
        $previousItinerary = $GLOBALS['yatra_itinerary_gallery_images'] ?? null;
        $trip = $resolved;

        // Trip-page files (booking.js, sidebar, yatraTripData for this trip) —
        // needs the global $trip, so it runs after it is set.
        $this->ensureAssets();
        FrontendAssetsProvider::ensureTripDetailAssets($this->needsOwnTripData());

        ob_start();
        try {
            $this->renderSection($resolved, $attributes);
            $html = (string) ob_get_clean();
        } catch (\Throwable $e) {
            ob_end_clean();
            $html = (defined('WP_DEBUG') && WP_DEBUG) ? '<div class="yatra-error">' . esc_html($e->getMessage()) . '</div>' : '';
        } finally {
            $trip = $previousTrip;
            $GLOBALS['yatra_hero_gallery_images'] = $previousHero;
            $GLOBALS['yatra_itinerary_gallery_images'] = $previousItinerary;
        }

        if (trim($html) === '') {
            // Editors see why the block is empty; visitors see nothing.
            if (current_user_can('edit_posts')) {
                return '<div class="yatra-trip-block-notice">' . esc_html(sprintf(
                    /* translators: 1: block title, 2: trip title. */
                    __('%1$s: "%2$s" has nothing to show in this section yet.', 'yatra'),
                    $this->title(),
                    (string) ($resolved->title ?? '')
                )) . '</div>';
            }

            return '';
        }

        return sprintf(
            '<div %1$s data-trip-id="%2$d">%3$s</div>',
            $this->wrapperAttributes('yatra-single-trip yatra-trip-block yatra-trip-block--' . $this->slug()),
            (int) $resolved->id,
            $html
        );
    }

    /** Does this section's script read yatraTripData (so it must be this trip's)? */
    protected function needsOwnTripData(): bool
    {
        return false;
    }

    /**
     * The picked trip, or the trip of the page being shown. Unpublished trips
     * only for staff, the same rule {@see SingleTripController::getBySlug()} uses.
     */
    public static function resolveTrip(int $tripId): ?object
    {
        if ($tripId <= 0) {
            global $trip;

            return (is_object($trip) && isset($trip->id) && method_exists($trip, 'getItineraryDays')) ? $trip : null;
        }

        if (array_key_exists($tripId, self::$trips)) {
            return self::$trips[$tripId];
        }

        $isStaff = current_user_can('manage_options') || current_user_can('yatra_edit_trips');
        if (! $isStaff && (new TripRepository())->findPublished($tripId) === null) {
            return self::$trips[$tripId] = null;
        }

        $prepared = (new SingleTripController())->getById($tripId);

        return self::$trips[$tripId] = $prepared;
    }

    /**
     * Nothing to show: a hint for editors (block editor preview, Elementor),
     * nothing for visitors.
     */
    protected function renderMissingTrip(int $tripId): string
    {
        if (! current_user_can('edit_posts')) {
            return '';
        }

        $message = $tripId > 0
            ? __('The selected trip is not available (unpublished or deleted).', 'yatra')
            : __('Choose a trip in the block settings. On a trip page this block shows that trip.', 'yatra');

        return '<div class="yatra-trip-block-notice">' . esc_html(sprintf(
            /* translators: 1: block title, 2: explanation. */
            __('%1$s: %2$s', 'yatra'),
            $this->title(),
            $message
        )) . '</div>';
    }

    /**
     * The frontend tab configuration for a section (custom label + icon set in
     * Trip Builder), or a default when the trip has none.
     *
     * @return object
     */
    protected static function tab(object $trip, string $contentType, string $label, string $icon)
    {
        $tabs = isset($trip->frontend_tabs) && is_array($trip->frontend_tabs) ? $trip->frontend_tabs : [];
        foreach ($tabs as $tab) {
            $tab = is_array($tab) ? (object) $tab : $tab;
            if (is_object($tab) && ($tab->content_type ?? '') === $contentType) {
                return $tab;
            }
        }

        return (object) [
            'id' => $contentType,
            'label' => $label,
            'enabled' => true,
            'content_type' => $contentType,
            'icon' => $icon,
        ];
    }

    /**
     * Whether the trip has anything for this section — the same check the
     * single-trip page uses to skip empty sections.
     */
    protected static function hasContent(object $tab, object $trip): bool
    {
        return SingleTripController::tabHasContent($tab, $trip);
    }

    /**
     * Load a template part only once per page (modals shared by several sections).
     *
     * @param array<string, mixed> $args
     */
    protected static function templateOnce(string $template, array $args): void
    {
        if (isset(self::$printedOnce[$template])) {
            return;
        }
        self::$printedOnce[$template] = true;
        yatra_get_template($template, $args);
    }
}
