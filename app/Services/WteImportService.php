<?php

declare(strict_types=1);

namespace Yatra\Services;

use Yatra\Constants\ClassificationTypes;
use Yatra\Repositories\ItineraryRepository;
use Yatra\Repositories\TripRepository;
use Yatra\Repositories\WteImportRepository;
use Yatra\Utils\Logger;
use Yatra\Validators\TripValidator;

/**
 * WP Travel Engine Import Service
 *
 * Imports trips and their taxonomies from WP Travel Engine (WTE) data that
 * lives in the same WordPress install. WTE data is only ever read.
 *
 * - Scan: a dry run reporting what would be imported (no writes).
 * - Terms: destinations / activities / trip types / difficulties / traveller
 *   categories become Yatra classifications (reused by name or slug when the
 *   operator already has them).
 * - Trips: imported in small batches through TripService (the same path the
 *   trip editor uses) plus ItineraryService for days.
 *
 * Idempotent: the WTE id => Yatra id map is kept in an option, so re-running
 * skips (or, when asked, updates) trips imported before instead of
 * duplicating them.
 *
 * @package Yatra\Services
 */
class WteImportService
{
    /**
     * Option holding the WTE id => Yatra id map.
     */
    public const OPTION_MAP = 'yatra_wte_import_map';

    /**
     * Option holding the progress of the last trip import run.
     */
    public const OPTION_STATE = 'yatra_wte_import_state';

    /**
     * Option used as a short-lived lock so two admins cannot import at once.
     */
    public const OPTION_LOCK = 'yatra_wte_import_lock';

    /**
     * Batch size limits for one REST call.
     */
    public const DEFAULT_BATCH = 10;
    public const MAX_BATCH = 25;

    /**
     * Lock lifetime in seconds.
     */
    private const LOCK_TTL = 300;

    /**
     * WTE taxonomy => Yatra classification type.
     */
    private const TAXONOMY_MAP = [
        'destination'              => ClassificationTypes::DESTINATION,
        'activities'               => ClassificationTypes::ACTIVITY,
        'trip_types'               => ClassificationTypes::CATEGORY,
        'difficulty'               => ClassificationTypes::DIFFICULTY,
        'trip-packages-categories' => ClassificationTypes::TRAVELER_TYPE,
    ];

    /**
     * @var WteImportRepository
     */
    private WteImportRepository $source;

    /**
     * @var TripRepository
     */
    private TripRepository $tripRepository;

    /**
     * In-memory copy of the id map for the current request.
     *
     * @var array{trips: array<string,int>, terms: array<string,int>}|null
     */
    private ?array $map = null;

    /**
     * Per-request cache of WTE terms by taxonomy.
     *
     * @var array<string, object[]>
     */
    private array $termsCache = [];

    /**
     * Constructor
     */
    public function __construct(?WteImportRepository $source = null, ?TripRepository $tripRepository = null)
    {
        $this->source = $source ?? new WteImportRepository();
        $this->tripRepository = $tripRepository ?? new TripRepository();
    }

    // ------------------------------------------------------------------
    // Detection / scan
    // ------------------------------------------------------------------

    /**
     * Summary of the WTE data found in this install.
     */
    public function detect(): array
    {
        $tripCount = $this->source->countTrips();
        $termCounts = $this->countTermsByTaxonomy();
        $map = $this->getMap();
        $importedTrips = 0;
        foreach ($map['trips'] as $yatraId) {
            if ($this->tripRepository->find((int) $yatraId)) {
                $importedTrips++;
            }
        }

        return [
            'has_data'       => $tripCount > 0 || array_sum($termCounts) > 0,
            'wte_active'     => defined('WP_TRAVEL_ENGINE_VERSION'),
            'wte_version'    => defined('WP_TRAVEL_ENGINE_VERSION') ? (string) constant('WP_TRAVEL_ENGINE_VERSION') : '',
            'trips'          => $tripCount,
            'terms'          => $termCounts,
            'bookings'       => $this->source->countPostsOfType('booking'),
            'customers'      => $this->source->countPostsOfType('customer'),
            'enquiries'      => $this->source->countPostsOfType('enquiry'),
            'imported_trips' => $importedTrips,
            'last_run'       => $this->getState(),
            'batch_size'     => self::DEFAULT_BATCH,
        ];
    }

    /**
     * Dry run: what an import would do. Never writes anything.
     */
    public function scan(): array
    {
        // Reads every trip in one request: give large sites the time it needs.
        if (function_exists('set_time_limit')) {
            @set_time_limit(300);
        }
        $map = $this->getMap();
        $notes = [];

        // Terms.
        $termsSummary = [];
        foreach (self::TAXONOMY_MAP as $taxonomy => $type) {
            $summary = ['total' => 0, 'mapped' => 0, 'matched' => 0, 'create' => 0];
            foreach ($this->termsOf($taxonomy) as $term) {
                $summary['total']++;
                $key = $this->termKey($taxonomy, (int) $term->term_id);
                if (isset($map['terms'][$key]) && $this->source->classificationExists((int) $map['terms'][$key], $type)) {
                    $summary['mapped']++;
                } elseif ($this->source->findClassificationByNameOrSlug($type, (string) $term->name, (string) $term->slug)) {
                    $summary['matched']++;
                } else {
                    $summary['create']++;
                }
            }
            $termsSummary[$taxonomy] = $summary;
        }

        foreach (['destination', 'activities'] as $flatTaxonomy) {
            foreach ($this->termsOf($flatTaxonomy) as $term) {
                if ((int) $term->parent > 0) {
                    $notes[] = $flatTaxonomy === 'destination'
                        ? __('Destinations here are a flat list, so nested WP Travel Engine destinations are imported without their parent.', 'yatra')
                        : __('Activities here are a flat list, so nested WP Travel Engine activities are imported without their parent.', 'yatra');
                    break;
                }
            }
        }

        // Currency.
        $wteSettings = get_option('wp_travel_engine_settings');
        $wteCurrency = is_array($wteSettings) && !empty($wteSettings['currency_code']) ? strtoupper((string) $wteSettings['currency_code']) : '';
        $yatraCurrency = strtoupper((string) SettingsService::getCurrency());
        if ($wteCurrency !== '' && $yatraCurrency !== '' && $wteCurrency !== $yatraCurrency) {
            $notes[] = sprintf(
                /* translators: 1: WP Travel Engine currency code, 2: currency code set in Settings. */
                __('WP Travel Engine prices are in %1$s but this site is set to %2$s. Prices are copied as numbers, not converted - change the currency in Settings first if needed.', 'yatra'),
                $wteCurrency,
                $yatraCurrency
            );
        }

        // Trips.
        $trips = [];
        $counts = ['create' => 0, 'update' => 0, 'warnings' => 0];
        foreach ($this->source->getTripIds() as $wteId) {
            $post = $this->source->getPost($wteId);
            if (!$post) {
                continue;
            }
            $normalized = $this->normalizeTrip($post, false);
            $existingId = $this->getMappedTripId($wteId);
            $action = $existingId ? 'update' : 'create';
            $counts[$action]++;
            if (!empty($normalized['warnings'])) {
                $counts['warnings']++;
            }
            $trips[] = [
                'wte_id'         => $wteId,
                'title'          => (string) $normalized['data']['title'],
                'status'         => (string) $normalized['data']['status'],
                'action'         => $action,
                'trip_id'        => $existingId,
                'itinerary_days' => count($normalized['itinerary']),
                'faqs'           => count($normalized['relationships']['faqs']),
                'pricing'        => (string) $normalized['data']['pricing_type'],
                'price'          => isset($normalized['data']['original_price']) ? (float) $normalized['data']['original_price'] : 0.0,
                'warnings'       => $normalized['warnings'],
            ];
        }

        return [
            'trips_total' => count($trips),
            'counts'      => $counts,
            'terms'       => $termsSummary,
            'notes'       => array_values(array_unique($notes)),
            'not_imported' => $this->notImportedSummary(),
            'trips'       => $trips,
        ];
    }

    /**
     * What the importer never touches, shown in the scan so nothing is a surprise.
     *
     * @return string[]
     */
    private function notImportedSummary(): array
    {
        $items = [
            __('WP Travel Engine data is only read - nothing is changed or deleted.', 'yatra'),
            __('Bookings, payments, customers and enquiries are not imported.', 'yatra'),
            __('Fixed departure dates, group discounts and extra packages are listed per trip so you can recreate them here.', 'yatra'),
        ];

        return $items;
    }

    // ------------------------------------------------------------------
    // Terms
    // ------------------------------------------------------------------

    /**
     * Import every WTE term of the supported taxonomies as Yatra classifications.
     */
    public function importTerms(): array
    {
        $this->acquireLock();
        try {
            $result = [];
            foreach (self::TAXONOMY_MAP as $taxonomy => $type) {
                $result[$taxonomy] = ['created' => 0, 'matched' => 0, 'mapped' => 0, 'failed' => 0, 'errors' => []];
                $terms = $this->sortTermsParentFirst($this->termsOf($taxonomy));
                foreach ($terms as $term) {
                    try {
                        $outcome = '';
                        $this->resolveTerm($taxonomy, $term, true, $outcome);
                        if (isset($result[$taxonomy][$outcome])) {
                            $result[$taxonomy][$outcome]++;
                        }
                    } catch (\Throwable $e) {
                        $result[$taxonomy]['failed']++;
                        $result[$taxonomy]['errors'][] = sprintf('%s: %s', (string) $term->name, $e->getMessage());
                    }
                }
            }
            $this->saveMap();

            return $result;
        } finally {
            $this->releaseLock();
        }
    }

    /**
     * Resolve (and optionally create) the Yatra classification for a WTE term.
     *
     * @param object $term    Row from WteImportRepository::getTerms().
     * @param string $outcome Set to mapped|matched|created.
     */
    private function resolveTerm(string $taxonomy, $term, bool $create, string &$outcome = ''): int
    {
        $type = self::TAXONOMY_MAP[$taxonomy];
        $map = $this->getMap();
        $key = $this->termKey($taxonomy, (int) $term->term_id);

        if (isset($map['terms'][$key]) && $this->source->classificationExists((int) $map['terms'][$key], $type)) {
            $outcome = 'mapped';
            return (int) $map['terms'][$key];
        }

        $name = trim(wp_specialchars_decode((string) $term->name, ENT_QUOTES));
        $existing = $this->source->findClassificationByNameOrSlug($type, $name, (string) $term->slug);
        if ($existing) {
            $outcome = 'matched';
            $this->map['terms'][$key] = $existing;
            return $existing;
        }

        if (!$create || $name === '') {
            return 0;
        }

        $data = [
            'name'        => $name,
            'description' => (string) ($term->description ?? ''),
            'status'      => 'publish',
        ];

        switch ($type) {
            case ClassificationTypes::DESTINATION:
                $id = (new DestinationService())->create($data);
                break;
            case ClassificationTypes::ACTIVITY:
                $id = (new ActivityService())->create($data);
                break;
            case ClassificationTypes::CATEGORY:
                // Yatra categories support one level of nesting: attach a child
                // to its top-most imported ancestor.
                $parentId = $this->resolveCategoryParent($taxonomy, $term);
                if ($parentId > 0) {
                    $data['parent_id'] = $parentId;
                    $data['level'] = 1;
                }
                $id = (new CategoryService())->create($data);
                break;
            case ClassificationTypes::DIFFICULTY:
                $id = (new DifficultyLevelService())->create($data);
                break;
            case ClassificationTypes::TRAVELER_TYPE:
                $data['description'] = wp_strip_all_tags($data['description']);
                $data['pricing_mode'] = 'per_person';
                $id = (new TravelerCategoryService())->create($data);
                break;
            default:
                return 0;
        }

        $id = (int) $id;
        if ($id > 0) {
            $outcome = 'created';
            $this->map['terms'][$key] = $id;
        }

        return $id;
    }

    /**
     * Top-most ancestor (already imported) of a WTE trip type, as a Yatra category id.
     */
    private function resolveCategoryParent(string $taxonomy, $term): int
    {
        if ((int) $term->parent <= 0) {
            return 0;
        }
        $byId = [];
        foreach ($this->termsOf($taxonomy) as $row) {
            $byId[(int) $row->term_id] = $row;
        }
        $root = $term;
        $guard = 0;
        while ((int) $root->parent > 0 && isset($byId[(int) $root->parent]) && $guard++ < 20) {
            $root = $byId[(int) $root->parent];
        }
        if ((int) $root->term_id === (int) $term->term_id) {
            return 0;
        }

        $parentId = $this->resolveTerm($taxonomy, $root, true);
        // Never nest under a category that is itself a child.
        if ($parentId > 0 && $this->source->getClassificationParentId($parentId) > 0) {
            return 0;
        }

        return $parentId;
    }

    /**
     * Order terms so parents come before children.
     *
     * @param object[] $terms
     * @return object[]
     */
    private function sortTermsParentFirst(array $terms): array
    {
        $byId = [];
        foreach ($terms as $term) {
            $byId[(int) $term->term_id] = $term;
        }
        $depth = function ($term) use ($byId): int {
            $d = 0;
            $current = $term;
            while ((int) $current->parent > 0 && isset($byId[(int) $current->parent]) && $d < 20) {
                $current = $byId[(int) $current->parent];
                $d++;
            }
            return $d;
        };
        usort($terms, function ($a, $b) use ($depth) {
            $cmp = $depth($a) <=> $depth($b);
            return $cmp !== 0 ? $cmp : ((int) $a->term_id <=> (int) $b->term_id);
        });

        return $terms;
    }

    /**
     * Number of WTE terms per supported taxonomy.
     *
     * @return array<string,int>
     */
    private function countTermsByTaxonomy(): array
    {
        $counts = array_fill_keys(array_keys(self::TAXONOMY_MAP), 0);
        foreach ($this->source->getTerms(array_keys(self::TAXONOMY_MAP)) as $term) {
            $counts[(string) $term->taxonomy]++;
        }

        return $counts;
    }

    // ------------------------------------------------------------------
    // Trips
    // ------------------------------------------------------------------

    /**
     * Import one batch of WTE trips.
     *
     * @param int  $offset         Position in the ID-ordered list of WTE trips.
     * @param int  $limit          Batch size (capped at MAX_BATCH).
     * @param bool $updateExisting Re-apply WTE data to trips imported before (otherwise they are skipped).
     */
    public function importTripsBatch(int $offset, int $limit, bool $updateExisting): array
    {
        $limit = max(1, min(self::MAX_BATCH, $limit));
        $offset = max(0, $offset);

        $this->acquireLock();
        try {
            $total = $this->source->countTrips();
            $ids = $this->source->getTripIds($offset, $limit);

            $state = $offset === 0 ? [] : $this->getState();
            $totals = array_merge(
                ['created' => 0, 'updated' => 0, 'skipped' => 0, 'failed' => 0],
                isset($state['totals']) && is_array($state['totals']) ? $state['totals'] : []
            );

            $results = [];
            foreach ($ids as $wteId) {
                $result = $this->importTrip($wteId, $updateExisting);
                if (isset($totals[$result['action']])) {
                    $totals[$result['action']]++;
                }
                $results[] = $result;
            }

            $nextOffset = $offset + count($ids);
            $done = empty($ids) || $nextOffset >= $total;

            $this->saveState([
                'offset'          => $nextOffset,
                'total'           => $total,
                'done'            => $done,
                'update_existing' => $updateExisting,
                'totals'          => $totals,
                'updated_at'      => current_time('mysql'),
            ]);

            return [
                'total'       => $total,
                'offset'      => $offset,
                'next_offset' => $nextOffset,
                'done'        => $done,
                'totals'      => $totals,
                'results'     => $results,
            ];
        } finally {
            $this->releaseLock();
        }
    }

    /**
     * Import (or skip / update) one WTE trip. Never throws: failures are reported in the result.
     */
    private function importTrip(int $wteId, bool $updateExisting): array
    {
        $result = [
            'wte_id'   => $wteId,
            'title'    => '',
            'action'   => 'failed',
            'trip_id'  => 0,
            'edit_url' => '',
            'view_url' => '',
            'warnings' => [],
            'error'    => '',
        ];

        try {
            $post = $this->source->getPost($wteId);
            if (!$post) {
                throw new \RuntimeException(__('WP Travel Engine trip not found.', 'yatra'));
            }
            $result['title'] = wp_specialchars_decode((string) $post->post_title, ENT_QUOTES);

            $existingId = $this->getMappedTripId($wteId);
            if ($existingId && !$updateExisting) {
                $result['action'] = 'skipped';
                $result['trip_id'] = $existingId;
                $result['warnings'][] = __('Already imported - skipped. Tick "Update trips imported before" to refresh it from WP Travel Engine.', 'yatra');
                return $this->withLinks($result);
            }

            $normalized = $this->normalizeTrip($post, true);
            $result['warnings'] = $normalized['warnings'];
            $data = $normalized['data'];
            $relationships = $normalized['relationships'];

            if ($existingId) {
                // Keep the slug (URL) the trip already has in Yatra.
                unset($data['slug']);
                TripValidator::validateUpdate($data, $existingId);
                $data = TripValidator::sanitize($data);
                (new TripService())->updateWithRelations($existingId, $data, $relationships);
                $tripId = $existingId;
                $result['action'] = 'updated';
            } else {
                $data['slug'] = $this->uniqueTripSlug((string) $data['slug'], (string) $data['title']);
                TripValidator::validateCreate($data);
                $data = TripValidator::sanitize($data);
                try {
                    $tripId = (new TripService())->createWithRelations($data, $relationships);
                } catch (\Throwable $e) {
                    // The trip row may already exist (a later relation failed):
                    // map it, so the next run updates it instead of creating
                    // a second copy.
                    $partial = $this->tripIdBySlug((string) $data['slug']);
                    if ($partial > 0) {
                        $this->map['trips'][(string) $wteId] = $partial;
                        $this->saveMap();
                        $result['trip_id'] = $partial;
                        $result['action'] = 'created';
                    }
                    throw $e;
                }
                if ($tripId <= 0) {
                    throw new \RuntimeException(__('The trip could not be created.', 'yatra'));
                }
                // Remember the mapping straight away so a later failure can never cause a duplicate.
                $this->map['trips'][(string) $wteId] = $tripId;
                $this->saveMap();
                $result['action'] = 'created';
            }

            $result['trip_id'] = $tripId;
            $this->saveItinerary($tripId, $normalized['itinerary'], $result['action'] === 'updated');
        } catch (\Yatra\Exceptions\ValidationException $e) {
            $result['action'] = $result['trip_id'] ? $result['action'] : 'failed';
            $result['error'] = $this->validationMessage($e);
        } catch (\Throwable $e) {
            $result['action'] = $result['trip_id'] ? $result['action'] : 'failed';
            $result['error'] = $e->getMessage();
            Logger::error('WP Travel Engine import failed for a trip', ['wte_id' => $wteId, 'error' => $e->getMessage()]);
        }

        return $this->withLinks($result);
    }

    /**
     * Readable message for a trip validation failure.
     */
    private function validationMessage(\Yatra\Exceptions\ValidationException $e): string
    {
        $messages = [];
        foreach ($e->getErrors() as $fieldErrors) {
            foreach ((array) $fieldErrors as $msg) {
                $messages[] = (string) $msg;
            }
        }

        return $messages ? implode(' ', array_unique($messages)) : $e->getMessage();
    }

    /**
     * Add admin edit and front-end links to a result row.
     */
    private function withLinks(array $result): array
    {
        $tripId = (int) $result['trip_id'];
        if ($tripId > 0) {
            $result['edit_url'] = admin_url('admin.php?page=yatra&subpage=trips&action=edit&id=' . $tripId);
            // Only published trips have a public page.
            $trip = $this->tripRepository->find($tripId);
            if ($trip && ($trip->status ?? '') === 'publish' && function_exists('yatra_get_trip_permalink')) {
                $result['view_url'] = (string) yatra_get_trip_permalink($tripId);
            }
        }

        return $result;
    }

    /**
     * Create / update itinerary days through the itinerary service (upsert by day number).
     *
     * @param array<int, array{day:int, title:string, description:string}> $days
     */
    private function saveItinerary(int $tripId, array $days, bool $isUpdate = false): void
    {
        if ($isUpdate) {
            // A trip shortened in WP Travel Engine: drop the days it no longer has.
            global $wpdb;
            $repo = new ItineraryRepository();
            $daysTable = \Yatra\Database\Tables\TripItineraryDaysTable::getTableName();
            $keep = empty($days) ? 0 : max(array_map(static function ($d) {
                return (int) $d['day'];
            }, $days));
            $extra = $wpdb->get_col($wpdb->prepare("SELECT id FROM `{$daysTable}` WHERE trip_id = %d AND day_number > %d", $tripId, $keep));
            foreach ($extra as $dayId) {
                $repo->delete((int) $dayId);
            }
        }
        if (empty($days)) {
            return;
        }
        $service = new ItineraryService(new ItineraryRepository(), $this->tripRepository);
        foreach ($days as $day) {
            $service->create([
                'trip_id'         => $tripId,
                'day'             => (int) $day['day'],
                'title'           => $day['title'],
                'day_title'       => $day['title'],
                'day_description' => $day['description'],
            ]);
        }
    }

    private function tripIdBySlug(string $slug): int
    {
        if ($slug === '') {
            return 0;
        }
        global $wpdb;
        $table = \Yatra\Database\Tables\TripsTable::getTableName();

        return (int) $wpdb->get_var($wpdb->prepare("SELECT id FROM {$table} WHERE slug = %s ORDER BY id DESC LIMIT 1", $slug));
    }

    /**
     * A free trip slug: the WTE slug when available, otherwise slug-2, slug-3...
     */
    private function uniqueTripSlug(string $slug, string $title): string
    {
        $base = \Yatra\Helpers\SlugHelper::generate($slug !== '' ? $slug : $title);
        if ($base === '') {
            $base = 'trip';
        }
        $candidate = $base;
        $i = 2;
        while ($this->source->tripSlugTaken($candidate) && $i < 1000) {
            $candidate = $base . '-' . $i;
            $i++;
        }

        return $candidate;
    }

    // ------------------------------------------------------------------
    // Mapping WTE => Yatra
    // ------------------------------------------------------------------

    /**
     * Build the Yatra trip payload for a WTE trip.
     *
     * @param bool $resolveTerms Create missing classifications (false in a dry run).
     * @return array{data: array, relationships: array, itinerary: array, warnings: string[]}
     */
    private function normalizeTrip(\WP_Post $post, bool $resolveTerms): array
    {
        $meta = $this->source->getPostMeta((int) $post->ID);
        $settings = isset($meta[WteImportRepository::SETTINGS_META_KEY]) && is_array($meta[WteImportRepository::SETTINGS_META_KEY])
            ? $meta[WteImportRepository::SETTINGS_META_KEY]
            : [];
        $warnings = [];

        $title = trim(wp_specialchars_decode((string) $post->post_title, ENT_QUOTES));
        if ($title === '') {
            $title = sprintf(
                /* translators: %d: WP Travel Engine trip id. */
                __('Imported trip #%d', 'yatra'),
                (int) $post->ID
            );
        }

        $data = [
            'title'        => $title,
            'slug'         => rawurldecode((string) $post->post_name),
            'status'       => $this->mapStatus((string) $post->post_status, $warnings),
            'pricing_type' => 'regular',
        ];

        // Content.
        $overview = '';
        $tabContent = isset($settings['tab_content']) && is_array($settings['tab_content']) ? $settings['tab_content'] : [];
        foreach ($tabContent as $tabKey => $html) {
            if ((string) $tabKey === '1_wpeditor') {
                $overview = trim((string) $html);
            } elseif (trim(wp_strip_all_tags((string) $html)) !== '') {
                $warnings[] = __('An extra WP Travel Engine content tab was not imported.', 'yatra');
            }
        }
        $postContent = trim((string) $post->post_content);
        $description = $overview;
        if ($postContent !== '' && strpos($overview, $postContent) === false) {
            $description = $overview !== '' ? $overview . "\n\n" . $postContent : $postContent;
        }
        $data['description'] = $description;
        $excerpt = trim((string) $post->post_excerpt);
        $data['short_description'] = $excerpt !== ''
            ? $excerpt
            : wp_trim_words(wp_strip_all_tags($description), 30);

        // Media (shared media library - attachment ids are reused).
        $thumbId = isset($meta['_thumbnail_id']) ? (int) $meta['_thumbnail_id'] : 0;
        if ($thumbId > 0) {
            if ($this->source->attachmentExists($thumbId)) {
                $data['featured_image'] = (string) $thumbId;
            } else {
                $warnings[] = __('The featured image no longer exists in the media library.', 'yatra');
            }
        }
        $gallery = $this->mapGallery($meta['wpte_gallery_id'] ?? null, $warnings);

        // Duration.
        $this->mapDuration($settings, $data);

        // Group size and ages.
        $this->mapGroupSize($settings, $meta, $data);
        $ageEnabled = $settings['min_max_age_enable'] ?? '';
        if ($ageEnabled === true || $ageEnabled === 'true' || $ageEnabled === '1' || $ageEnabled === 'yes') {
            $minAge = isset($meta['wp_travel_engine_trip_min_age']) ? (int) $meta['wp_travel_engine_trip_min_age'] : 0;
            $maxAge = isset($meta['wp_travel_engine_trip_max_age']) ? (int) $meta['wp_travel_engine_trip_max_age'] : 0;
            if ($minAge > 0) {
                $data['age_min'] = $minAge;
            }
            if ($maxAge > 0 && $maxAge >= $minAge) {
                $data['age_max'] = $maxAge;
            }
        }

        // Trip code (3.3: shown on the trip page, {{trip_code}}).
        $tripCode = trim(sanitize_text_field((string) ($settings['trip_code'] ?? '')));
        if ($tripCode !== '') {
            $data['custom_fields'] = ['trip_code' => $tripCode];
        }

        // Booking cut-off.
        $cutoffEnabled = $settings['trip_cutoff_enable'] ?? false;
        $cutoffTime = isset($settings['trip_cut_off_time']) ? (int) $settings['trip_cut_off_time'] : 0;
        if (($cutoffEnabled === true || $cutoffEnabled === '1' || $cutoffEnabled === 'true' || $cutoffEnabled === 'yes') && $cutoffTime > 0) {
            $unit = strtolower((string) ($settings['trip_cut_off_unit'] ?? 'days'));
            $data['booking_deadline_hours'] = $unit === 'hours' ? $cutoffTime : $cutoffTime * 24;
        }

        // Pricing.
        $priceTypes = $this->mapPricing($post, $meta, $settings, $data, $warnings, $resolveTerms);

        // Includes / excludes.
        $cost = isset($settings['cost']) && is_array($settings['cost']) ? $settings['cost'] : [];
        $includes = $this->linesToItems((string) ($cost['cost_includes'] ?? ''));
        $excludes = $this->linesToItems((string) ($cost['cost_excludes'] ?? ''));
        if ($includes) {
            $data['included_items'] = wp_json_encode($includes);
        }
        if ($excludes) {
            $data['excluded_items'] = wp_json_encode($excludes);
        }

        // Highlights.
        $highlights = [];
        if (!empty($settings['trip_highlights']) && is_array($settings['trip_highlights'])) {
            foreach ($settings['trip_highlights'] as $row) {
                $text = is_array($row) ? (string) ($row['highlight_text'] ?? '') : (string) $row;
                $text = trim(wp_strip_all_tags($text));
                if ($text !== '') {
                    $highlights[] = ['text' => $text];
                }
            }
        }

        // Trip facts.
        $this->mapTripFacts($settings, $data, $warnings);

        // SEO (Yoast / Rank Math).
        $this->mapSeo($meta, $data);

        // Things Yatra has no direct place for.
        $map = isset($settings['map']) && is_array($settings['map']) ? $settings['map'] : [];
        if (!empty($map['iframe']) || !empty($map['image_url'])) {
            $warnings[] = __('The route map (embed or image) was not imported - add start/end coordinates or itinerary locations to show a map.', 'yatra');
        }
        if (!empty($settings['enable_video_gallery']) && $settings['enable_video_gallery'] !== 'false') {
            $warnings[] = __('The video gallery was not imported.', 'yatra');
        }
        if (!empty($meta['WTE_Fixed_Starting_Dates_setting'])) {
            $warnings[] = __('Fixed starting dates were not imported - recreate them under Departures.', 'yatra');
        }
        $tags = $this->source->getPostTermIds((int) $post->ID, 'trip_tag');
        if (!empty($tags)) {
            $warnings[] = __('Trip tags were not imported (there is no trip tag field).', 'yatra');
        }

        // Taxonomies.
        $destinations = $this->mapPostTerms((int) $post->ID, 'destination', $resolveTerms);
        $activities = $this->mapPostTerms((int) $post->ID, 'activities', $resolveTerms);
        $categories = $this->mapPostTerms((int) $post->ID, 'trip_types', $resolveTerms);
        $difficulties = $this->mapPostTerms((int) $post->ID, 'difficulty', $resolveTerms);
        if (!empty($difficulties)) {
            $data['difficulty_level'] = (int) $difficulties[0];
        }

        $relationships = [
            'destinations'   => $destinations,
            'activities'     => $activities,
            'trip_category'  => $categories,
            'highlights'     => $highlights,
            'gallery_images' => $gallery,
            'faqs'           => $this->mapFaqs($settings),
        ];
        // Always sent: an empty list clears traveller prices left from an earlier import.
        $relationships['price_types'] = $priceTypes;

        return [
            'data'          => $data,
            'relationships' => $relationships,
            'itinerary'     => $this->mapItinerary($settings),
            'warnings'      => array_values(array_unique($warnings)),
        ];
    }

    /**
     * WTE post status => Yatra trip status.
     */
    private function mapStatus(string $status, array &$warnings): string
    {
        if ($status === 'publish') {
            return 'publish';
        }
        if ($status === 'private') {
            return 'private';
        }
        if ($status === 'future') {
            $warnings[] = __('The trip was scheduled in WP Travel Engine; it is imported as a draft.', 'yatra');
        }

        return 'draft';
    }

    /**
     * Gallery attachment ids => Yatra gallery rows.
     *
     * @param mixed $gallery wpte_gallery_id meta: ['enable' => '1', 0 => id, 1 => id, ...]
     */
    private function mapGallery($gallery, array &$warnings): array
    {
        if (!is_array($gallery)) {
            return [];
        }
        $rows = [];
        $missing = 0;
        foreach ($gallery as $key => $attachmentId) {
            if (!is_int($key) && !ctype_digit((string) $key)) {
                continue; // "enable" flag.
            }
            $attachmentId = (int) $attachmentId;
            if (!$this->source->attachmentExists($attachmentId)) {
                $missing++;
                continue;
            }
            $url = wp_get_attachment_url($attachmentId);
            if (!$url) {
                $missing++;
                continue;
            }
            $rows[] = [
                'url'      => $url,
                'image_id' => $attachmentId,
                'alt_text' => (string) get_post_meta($attachmentId, '_wp_attachment_image_alt', true),
                'caption'  => (string) wp_get_attachment_caption($attachmentId),
            ];
        }
        if ($missing > 0) {
            $warnings[] = sprintf(
                /* translators: %d: number of gallery images. */
                _n('%d gallery image no longer exists and was skipped.', '%d gallery images no longer exist and were skipped.', $missing, 'yatra'),
                $missing
            );
        }

        return $rows;
    }

    /**
     * Duration (days/nights, or hours for day tours).
     */
    private function mapDuration(array $settings, array &$data): void
    {
        $duration = isset($settings['trip_duration']) ? (int) $settings['trip_duration'] : 0;
        $unit = strtolower((string) ($settings['trip_duration_unit'] ?? 'days'));

        if ($unit === 'hours' || $unit === 'hour') {
            $data['trip_type'] = 'single_day';
            $data['duration_days'] = 1;
            $data['duration_nights'] = 0;
            $data['duration_hours'] = max(0, min(24, $duration));
            return;
        }
        if ($unit === 'minutes') {
            $data['trip_type'] = 'single_day';
            $data['duration_days'] = 1;
            $data['duration_nights'] = 0;
            $data['duration_hours'] = max(1, (int) ceil($duration / 60));
            return;
        }

        $days = max(0, $duration);
        $data['duration_days'] = $days;
        $nights = isset($settings['trip_duration_nights']) && $settings['trip_duration_nights'] !== ''
            ? (int) $settings['trip_duration_nights']
            : max(0, $days - 1);
        $data['duration_nights'] = max(0, $nights);
        $data['trip_type'] = $days <= 1 ? 'single_day' : 'multi_day';
    }

    /**
     * Min / max travellers.
     */
    private function mapGroupSize(array $settings, array $meta, array &$data): void
    {
        $min = isset($settings['trip_minimum_pax']) && is_numeric($settings['trip_minimum_pax']) ? (int) $settings['trip_minimum_pax'] : 0;
        $max = 0;
        foreach (['total_travellers_per_day', 'max_travellers_per_day'] as $key) {
            if (isset($meta[$key]) && is_numeric($meta[$key]) && (int) $meta[$key] > 0) {
                $max = (int) $meta[$key];
                break;
            }
        }
        if ($max <= 0 && isset($settings['trip_maximum_pax']) && is_numeric($settings['trip_maximum_pax'])) {
            $max = (int) $settings['trip_maximum_pax'];
        }

        $min = max(1, $min);
        $data['min_travelers'] = $min;
        if ($max > 0) {
            $max = max($max, $min);
            $data['max_travelers'] = $max;
        }
    }

    /**
     * Pricing: WTE 6 packages (traveller categories) or the legacy single price.
     *
     * Sets original/discounted price and pricing_type on $data; returns
     * Yatra price_types when the trip uses traveller-based pricing.
     */
    private function mapPricing(\WP_Post $post, array $meta, array $settings, array &$data, array &$warnings, bool $resolveTerms): array
    {
        $rows = [];
        $packageIds = isset($meta['packages_ids']) && is_array($meta['packages_ids']) ? array_values(array_filter(array_map('intval', $meta['packages_ids']))) : [];
        $package = null;
        $packageMeta = [];

        if (!empty($packageIds)) {
            $primaryId = isset($meta['primary_package']) ? (int) $meta['primary_package'] : 0;
            $candidates = in_array($primaryId, $packageIds, true) ? array_merge([$primaryId], array_diff($packageIds, [$primaryId])) : $packageIds;
            foreach ($candidates as $candidateId) {
                $candidate = $this->source->getPost($candidateId);
                if ($candidate && $candidate->post_type === WteImportRepository::PACKAGE_POST_TYPE && $candidate->post_status !== 'trash') {
                    $package = $candidate;
                    break;
                }
            }
            if (count($packageIds) > 1) {
                $warnings[] = sprintf(
                    /* translators: 1: number of packages, 2: package name. */
                    __('The trip has %1$d pricing packages; only "%2$s" was imported.', 'yatra'),
                    count($packageIds),
                    $package ? wp_specialchars_decode((string) $package->post_title, ENT_QUOTES) : '-'
                );
            }
        }

        if ($package) {
            $packageMeta = $this->source->getPostMeta((int) $package->ID);
            $categories = isset($packageMeta['package-categories']) && is_array($packageMeta['package-categories']) ? $packageMeta['package-categories'] : [];
            $primaryCategory = isset($packageMeta['_primary_category_id']) ? (int) $packageMeta['_primary_category_id'] : 0;
            $cIds = isset($categories['c_ids']) && is_array($categories['c_ids']) ? $categories['c_ids'] : [];
            $perGroup = false;

            foreach ($cIds as $key => $termId) {
                $termId = (int) ($termId ?: $key);
                $price = $categories['prices'][$key] ?? '';
                if ($price === '' || !is_numeric($price) || (float) $price <= 0) {
                    continue;
                }
                $price = (float) $price;
                $sale = $categories['sale_prices'][$key] ?? '';
                $saleEnabled = isset($categories['enabled_sale'])
                    ? !empty($categories['enabled_sale'][$key])
                    : ($sale !== '' && $sale !== null);
                $discounted = ($saleEnabled && is_numeric($sale) && (float) $sale > 0 && (float) $sale < $price) ? (float) $sale : null;
                $label = isset($categories['labels'][$key]) ? (string) $categories['labels'][$key] : '';
                // 'pricing_types' today; packages made by WTE's 5.0 migration use 'price_types'.
                $ptype = $categories['pricing_types'][$key] ?? ($categories['price_types'][$key] ?? 'per-person');
                if (in_array($ptype, ['per-group', 'group'], true)) {
                    $perGroup = true;
                }
                $rows[] = [
                    'term_id'    => $termId,
                    'label'      => $label,
                    'price'      => $price,
                    'discounted' => $discounted,
                    'is_default' => $primaryCategory > 0 ? $termId === $primaryCategory : empty($rows),
                ];
            }

            if ($perGroup) {
                $warnings[] = __('Some WP Travel Engine prices are per group; they were imported per person. The trip is saved as a draft - check the traveller categories and prices before publishing.', 'yatra');
                $data['status'] = 'draft';
            }
            if (!empty($packageMeta['group-pricing']) && is_array($packageMeta['group-pricing']) && !empty($categories['enabled_group_discount']) && array_filter((array) $categories['enabled_group_discount'])) {
                $warnings[] = __('Group discounts were not imported - add them under Discounts.', 'yatra');
            }
            if (!empty($packageMeta['package-dates']) && is_array($packageMeta['package-dates'])) {
                $warnings[] = __('Package departure dates were not imported - recreate them under Departures.', 'yatra');
            }
        }

        if (count($rows) > 1) {
            $priceTypes = [];
            foreach ($rows as $row) {
                $categoryId = $this->resolveTravelerCategory((int) $row['term_id'], (string) $row['label'], $resolveTerms);
                if ($resolveTerms && $categoryId <= 0) {
                    $warnings[] = sprintf(
                        /* translators: %s: traveller category name. */
                        __('The traveller category "%s" could not be created; its price was skipped.', 'yatra'),
                        $row['label']
                    );
                    continue;
                }
                $priceTypes[] = [
                    'category_id'      => $categoryId,
                    'original_price'   => $row['price'],
                    'discounted_price' => $row['discounted'],
                    'is_default'       => (bool) $row['is_default'],
                ];
            }
            if (count($priceTypes) > 1 || (!$resolveTerms && count($priceTypes) > 0)) {
                $data['pricing_type'] = 'traveler_based';
                $default = $rows[0];
                foreach ($rows as $row) {
                    if ($row['is_default']) {
                        $default = $row;
                        break;
                    }
                }
                $data['original_price'] = $default['price'];
                $data['discounted_price'] = $default['discounted'];
                return $priceTypes;
            }
            $rows = array_slice($rows, 0, 1);
        }

        if (count($rows) === 1) {
            $data['original_price'] = $rows[0]['price'];
            $data['discounted_price'] = $rows[0]['discounted'];
            return [];
        }

        // Legacy (pre-packages) pricing: trip_prev_price is the regular price,
        // trip_price the sale price when "sale" is on.
        $regular = isset($settings['trip_prev_price']) && is_numeric($settings['trip_prev_price']) ? (float) $settings['trip_prev_price'] : 0.0;
        $salePrice = isset($settings['trip_price']) && is_numeric($settings['trip_price']) ? (float) $settings['trip_price'] : 0.0;
        $onSale = !empty($settings['sale']);
        if ($regular <= 0 && $salePrice > 0) {
            $regular = $salePrice;
            $onSale = false;
        }
        if ($regular <= 0) {
            foreach (['wp_travel_engine_setting_trip_actual_price', '_s_price', 'wp_travel_engine_setting_trip_price'] as $key) {
                if (isset($meta[$key]) && is_numeric($meta[$key]) && (float) $meta[$key] > 0) {
                    $regular = (float) $meta[$key];
                    break;
                }
            }
        }

        if ($regular > 0) {
            $data['original_price'] = $regular;
            $data['discounted_price'] = ($onSale && $salePrice > 0 && $salePrice < $regular) ? $salePrice : null;
        } else {
            $warnings[] = __('No price was found; set a price before taking bookings.', 'yatra');
        }

        return [];
    }

    /**
     * Yatra traveller category for a WTE pricing category term.
     */
    private function resolveTravelerCategory(int $termId, string $label, bool $create): int
    {
        $taxonomy = 'trip-packages-categories';
        $term = null;
        foreach ($this->termsOf($taxonomy) as $row) {
            if ((int) $row->term_id === $termId) {
                $term = $row;
                break;
            }
        }
        if (!$term) {
            if ($label === '') {
                return 0;
            }
            $term = (object) [
                'term_id'     => $termId,
                'name'        => $label,
                'slug'        => sanitize_title($label),
                'parent'      => 0,
                'description' => '',
            ];
        }

        return $this->resolveTerm($taxonomy, $term, $create);
    }

    /**
     * Yatra classification ids for the WTE terms of one taxonomy attached to a trip.
     *
     * @return int[]
     */
    private function mapPostTerms(int $postId, string $taxonomy, bool $resolveTerms): array
    {
        $termIds = $this->source->getPostTermIds($postId, $taxonomy);
        if (empty($termIds)) {
            return [];
        }
        $terms = [];
        foreach ($this->termsOf($taxonomy) as $row) {
            $terms[(int) $row->term_id] = $row;
        }
        $ids = [];
        foreach ($termIds as $termId) {
            if (!isset($terms[$termId])) {
                continue;
            }
            $id = $this->resolveTerm($taxonomy, $terms[$termId], $resolveTerms);
            if ($id > 0) {
                $ids[] = $id;
            }
        }

        return array_values(array_unique($ids));
    }

    /**
     * FAQs: WTE 6.7+ "faqs_data" (categories) or the legacy faq_title / faq_content arrays.
     */
    private function mapFaqs(array $settings): array
    {
        $faqs = [];
        if (!empty($settings['faqs_data']['categories']) && is_array($settings['faqs_data']['categories'])) {
            foreach ($settings['faqs_data']['categories'] as $category) {
                $categoryName = is_array($category) ? trim((string) ($category['name'] ?? '')) : '';
                $items = is_array($category) && isset($category['faqs']) && is_array($category['faqs']) ? $category['faqs'] : [];
                foreach ($items as $faq) {
                    $question = trim(wp_strip_all_tags((string) ($faq['question'] ?? '')));
                    $answer = trim((string) ($faq['answer'] ?? ''));
                    if ($question === '' || $answer === '') {
                        continue;
                    }
                    $row = ['question' => $question, 'answer' => $answer];
                    if ($categoryName !== '') {
                        $row['category'] = $categoryName;
                    }
                    $faqs[] = $row;
                }
            }
        }

        if (empty($faqs) && !empty($settings['faq']['faq_title']) && is_array($settings['faq']['faq_title'])) {
            $answers = isset($settings['faq']['faq_content']) && is_array($settings['faq']['faq_content']) ? $settings['faq']['faq_content'] : [];
            foreach ($settings['faq']['faq_title'] as $key => $question) {
                $question = trim(wp_strip_all_tags((string) $question));
                $answer = trim((string) ($answers[$key] ?? ''));
                if ($question !== '' && $answer !== '') {
                    $faqs[] = ['question' => $question, 'answer' => $answer];
                }
            }
        }

        return $faqs;
    }

    /**
     * Itinerary days (renumbered 1..n in WTE order).
     *
     * @return array<int, array{day:int, title:string, description:string}>
     */
    private function mapItinerary(array $settings): array
    {
        $itinerary = isset($settings['itinerary']) && is_array($settings['itinerary']) ? $settings['itinerary'] : [];
        $titles = isset($itinerary['itinerary_title']) && is_array($itinerary['itinerary_title']) ? $itinerary['itinerary_title'] : [];
        $contents = isset($itinerary['itinerary_content']) && is_array($itinerary['itinerary_content']) ? $itinerary['itinerary_content'] : [];
        $inner = isset($itinerary['itinerary_content_inner']) && is_array($itinerary['itinerary_content_inner']) ? $itinerary['itinerary_content_inner'] : [];

        $keys = array_unique(array_merge(array_keys($titles), array_keys($contents)));
        usort($keys, function ($a, $b) {
            return (int) $a <=> (int) $b;
        });

        $days = [];
        $number = 1;
        foreach ($keys as $key) {
            $title = trim(wp_strip_all_tags((string) ($titles[$key] ?? '')));
            $description = trim((string) ($inner[$key] ?? ''));
            if ($description === '') {
                $description = trim((string) ($contents[$key] ?? ''));
            }
            if ($title === '' && $description === '') {
                continue;
            }
            $days[] = [
                'day'         => $number,
                'title'       => $title !== '' ? $title : sprintf(
                    /* translators: %d: day number. */
                    __('Day %d', 'yatra'),
                    $number
                ),
                'description' => $description,
            ];
            $number++;
        }

        return $days;
    }

    /**
     * WTE trip facts => Yatra fields where Yatra has one.
     */
    private function mapTripFacts(array $settings, array &$data, array &$warnings): void
    {
        $facts = isset($settings['trip_facts']) && is_array($settings['trip_facts']) ? $settings['trip_facts'] : [];
        $labels = isset($facts['field_id']) && is_array($facts['field_id']) ? $facts['field_id'] : [];
        $unmapped = [];

        foreach ($labels as $fieldId => $label) {
            $value = $facts[$fieldId][$fieldId] ?? ($facts[$fieldId] ?? '');
            if (is_array($value)) {
                $value = implode(', ', array_filter(array_map('strval', $value)));
            }
            $value = trim(wp_strip_all_tags((string) $value));
            $label = trim((string) $label);
            if ($value === '') {
                continue;
            }
            $field = $this->factField(strtolower($label));
            if ($field !== '' && empty($data[$field])) {
                $data[$field] = $value;
            } else {
                $unmapped[] = $label;
            }
        }

        if ($unmapped) {
            $warnings[] = sprintf(
                /* translators: %s: comma-separated trip fact names. */
                __('Trip facts with no matching trip field were not imported: %s.', 'yatra'),
                implode(', ', $unmapped)
            );
        }
    }

    /**
     * Yatra field for a trip fact label ('' when none).
     */
    private function factField(string $label): string
    {
        $rules = [
            'season'    => 'best_season',
            'meal'      => 'meal_plan',
            'accom'     => 'accommodation_type',
            'transport' => 'transportation_details',
            'pickup'    => 'pickup_location',
            'pick-up'   => 'pickup_location',
            'drop'      => 'dropoff_location',
            'arrival'   => 'starting_location',
            'start'     => 'starting_location',
            // WTE's "Departure from" is where the trip starts.
            'departure' => 'starting_location',
            'end'       => 'ending_location',
            'fitness'   => 'physical_requirements',
            'physical'  => 'physical_requirements',
        ];
        foreach ($rules as $needle => $field) {
            if (preg_match('/\b' . preg_quote($needle, '/') . '/', $label)) {
                return $field;
            }
        }

        return '';
    }

    /**
     * Yoast / Rank Math title and description, when they hold plain text.
     */
    private function mapSeo(array $meta, array &$data): void
    {
        foreach (['_yoast_wpseo_title', 'rank_math_title'] as $key) {
            $value = isset($meta[$key]) ? trim((string) $meta[$key]) : '';
            if ($value !== '' && strpos($value, '%') === false) {
                $data['meta_title'] = $value;
                break;
            }
        }
        foreach (['_yoast_wpseo_metadesc', 'rank_math_description'] as $key) {
            $value = isset($meta[$key]) ? trim((string) $meta[$key]) : '';
            if ($value !== '' && strpos($value, '%') === false) {
                $data['meta_description'] = $value;
                break;
            }
        }
    }

    /**
     * One item per non-empty line, in the shape the trip editor stores.
     *
     * @return array<int, array{title:string, description:string}>
     */
    private function linesToItems(string $text): array
    {
        $items = [];
        foreach (preg_split('/\r\n|\r|\n/', wp_strip_all_tags($text)) ?: [] as $line) {
            $line = trim((string) preg_replace('/^[\s\-\*\x{2022}]+/u', '', $line));
            if ($line !== '') {
                $items[] = ['title' => sanitize_text_field($line), 'description' => ''];
            }
        }

        return $items;
    }

    // ------------------------------------------------------------------
    // Map / state / lock storage
    // ------------------------------------------------------------------

    /**
     * WTE terms of one taxonomy (cached for the request).
     *
     * @return object[]
     */
    private function termsOf(string $taxonomy): array
    {
        if (!isset($this->termsCache[$taxonomy])) {
            $this->termsCache[$taxonomy] = $this->source->getTerms([$taxonomy]);
        }

        return $this->termsCache[$taxonomy];
    }

    private function termKey(string $taxonomy, int $termId): string
    {
        return $taxonomy . ':' . $termId;
    }

    /**
     * @return array{trips: array<string,int>, terms: array<string,int>}
     */
    private function getMap(): array
    {
        if ($this->map === null) {
            $stored = get_option(self::OPTION_MAP, []);
            $stored = is_array($stored) ? $stored : [];
            $this->map = [
                'trips' => isset($stored['trips']) && is_array($stored['trips']) ? array_map('intval', $stored['trips']) : [],
                'terms' => isset($stored['terms']) && is_array($stored['terms']) ? array_map('intval', $stored['terms']) : [],
            ];
        }

        return $this->map;
    }

    private function saveMap(): void
    {
        $this->getMap();
        update_option(self::OPTION_MAP, $this->map, false);
    }

    /**
     * Yatra trip id imported from a WTE trip, when that trip still exists (trashed counts as existing).
     */
    private function getMappedTripId(int $wteId): int
    {
        $map = $this->getMap();
        $id = (int) ($map['trips'][(string) $wteId] ?? 0);
        if ($id > 0 && $this->tripRepository->find($id, true)) {
            return $id;
        }

        return 0;
    }

    private function getState(): array
    {
        $state = get_option(self::OPTION_STATE, []);

        return is_array($state) ? $state : [];
    }

    private function saveState(array $state): void
    {
        update_option(self::OPTION_STATE, $state, false);
    }

    /** "expiry|token" of the lock this request holds. */
    private string $lockValue = '';

    /**
     * Take the import lock (add_option is atomic on the unique option name).
     *
     * @throws \RuntimeException When another import is running.
     */
    private function acquireLock(): void
    {
        global $wpdb;
        $now = time();
        $value = ($now + self::LOCK_TTL) . '|' . wp_generate_uuid4();
        if (add_option(self::OPTION_LOCK, $value, '', false)) {
            $this->lockValue = $value;
            return;
        }
        wp_cache_delete(self::OPTION_LOCK, 'options');
        $current = (string) $wpdb->get_var($wpdb->prepare("SELECT option_value FROM {$wpdb->options} WHERE option_name = %s", self::OPTION_LOCK));
        $expires = (int) strtok($current, '|');
        if ($expires > $now) {
            throw new \RuntimeException(__('Another WP Travel Engine import is running. Please wait a minute and try again.', 'yatra'), 409);
        }
        // Stale lock from a request that died: take it over only if nobody
        // else did in the meantime (compare-and-swap on the old value).
        $taken = $wpdb->query($wpdb->prepare(
            "UPDATE {$wpdb->options} SET option_value = %s WHERE option_name = %s AND option_value = %s",
            $value,
            self::OPTION_LOCK,
            $current
        ));
        wp_cache_delete(self::OPTION_LOCK, 'options');
        if ((int) $taken !== 1) {
            throw new \RuntimeException(__('Another WP Travel Engine import is running. Please wait a minute and try again.', 'yatra'), 409);
        }
        $this->lockValue = $value;
    }

    private function releaseLock(): void
    {
        if ($this->lockValue === '') {
            return;
        }
        global $wpdb;
        // Only our own lock: a request that overran must not free someone else's.
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$wpdb->options} WHERE option_name = %s AND option_value = %s",
            self::OPTION_LOCK,
            $this->lockValue
        ));
        wp_cache_delete(self::OPTION_LOCK, 'options');
        wp_cache_delete('notoptions', 'options');
        $this->lockValue = '';
    }
}
