<?php

namespace Yatra\Compatibility\LiteSpeed;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * LiteSpeed Cache compatibility for Yatra gallery images.
 *
 * LiteSpeed Cache (and similar caching/optimisation plugins) replace an
 * <img src="real.jpg"> with <img src="data:image/gif;base64,..." data-src="real.jpg">
 * as part of their lazy-load feature.  Yatra's gallery modal JavaScript reads
 * image URLs directly from the DOM, so it ends up with the placeholder instead
 * of the real URL.
 *
 * Three-layer defence:
 *  1. PHP templates add `data-yatra-src` (our own attribute, never altered by
 *     third-party plugins) and `data-no-lazy="1"` (LiteSpeed's own opt-out).
 *  2. This class hooks into LiteSpeed's filters to exclude Yatra gallery
 *     selectors from the lazy-loader entirely.
 *  3. trip.js uses `getImageSrc()` which reads `data-yatra-src` first before
 *     falling back to common lazy-load attributes and finally `img.src`.
 */
final class Assets {

    /** @var bool Guard against double-registration. */
    private static bool $registered = false;

    public static function register(): void {
        if ( self::$registered ) {
            return;
        }
        self::$registered = true;

        // Only wire up hooks if LiteSpeed Cache is active.
        if ( ! self::isActive() ) {
            return;
        }

        // Exclude Yatra gallery images from LiteSpeed lazy-loading.
        add_filter( 'litespeed_lazyload_excludes',      [ self::class, 'excludeImages' ] );

        // Exclude Yatra's trip.js from JS deferral / combination so the
        // gallery modal initialises at the correct time.
        add_filter( 'litespeed_optm_js_defer_excludes', [ self::class, 'excludeJs' ] );
        add_filter( 'litespeed_optm_ccss_sep_posttype', [ self::class, 'excludeJs' ] ); // belt-and-suspenders

        // Prevent CSS combination for Yatra trip stylesheet so its selectors
        // remain intact (some LiteSpeed versions rewrite url() paths).
        add_filter( 'litespeed_optm_css_excludes',      [ self::class, 'excludeCss' ] );
    }

    // -------------------------------------------------------------------------
    // Filter callbacks
    // -------------------------------------------------------------------------

    /**
     * Exclude Yatra gallery image selectors from LiteSpeed lazy-loading.
     *
     * @param array<string> $excludes CSS selectors / URL patterns to exclude.
     * @return array<string>
     */
    public static function excludeImages( array $excludes ): array {
        $excludes[] = '.yatra-hero-main-img';
        $excludes[] = '.yatra-trip-hero-slide img';
        $excludes[] = '.yatra-gallery-item img';
        $excludes[] = '.yatra-side-image-item img';
        $excludes[] = '.yatra-gallery-modal-image';
        $excludes[] = '.yatra-gallery-thumbnail img';
        return $excludes;
    }

    /**
     * Exclude Yatra's trip.js from JS defer / combination.
     *
     * @param array<string> $excludes URL patterns.
     * @return array<string>
     */
    public static function excludeJs( array $excludes ): array {
        $excludes[] = 'yatra/assets/js/trip';
        return $excludes;
    }

    /**
     * Exclude Yatra's trip.css from CSS combination.
     *
     * @param array<string> $excludes URL patterns.
     * @return array<string>
     */
    public static function excludeCss( array $excludes ): array {
        $excludes[] = 'yatra/assets/css/trip';
        return $excludes;
    }

    // -------------------------------------------------------------------------
    // Detection
    // -------------------------------------------------------------------------

    /**
     * Check whether LiteSpeed Cache is active.
     * Supports both the free plugin and LiteSpeed's enterprise build.
     */
    private static function isActive(): bool {
        return defined( 'LSCWP_V' )
            || class_exists( '\\LiteSpeed\\Core', false )
            || class_exists( '\\LiteSpeed_Cache', false )
            || function_exists( 'litespeed_purge_all' );
    }
}
