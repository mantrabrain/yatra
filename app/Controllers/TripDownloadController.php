<?php

declare(strict_types=1);

namespace Yatra\Controllers;

use Yatra\Repositories\TripDownloadRepository;
use Yatra\Repositories\BookingRepository;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * Trip Download Controller
 * 
 * Handles REST API routes for trip downloadable files.
 * Downloads is a FREE feature in Yatra.
 * 
 * @package Yatra\Controllers
 * @since 3.0.0
 */
class TripDownloadController extends BaseController
{
    /**
     * Register REST routes
     */
    public function register_routes(): void
    {
        // Secure download endpoint (public with signature validation)
        register_rest_route('yatra/v1', '/downloads/(?P<download_id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'handleDownloadRequest'],
            'permission_callback' => '__return_true',
            'args' => [
                'download_id' => [
                    'required' => true,
                    'type' => 'integer',
                ],
                'booking_id' => [
                    'required' => false,
                    'type' => 'integer',
                ],
                'exp' => [
                    'required' => true,
                    'type' => 'integer',
                ],
                'sig' => [
                    'required' => true,
                    'type' => 'string',
                ],
                'action' => [
                    'required' => false,
                    'type' => 'string',
                    'default' => 'download',
                ],
            ],
        ]);

        // Admin endpoints for managing downloads
        register_rest_route('yatra/v1', '/trips/(?P<trip_id>\d+)/downloads', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'getDownloads'],
                'permission_callback' => [$this, 'check_admin_permission'],
                'args' => [
                    'trip_id' => [
                        'required' => true,
                        'type' => 'integer',
                    ],
                ],
            ],
            [
                'methods' => 'POST',
                'callback' => [$this, 'saveDownloads'],
                'permission_callback' => [$this, 'check_admin_permission'],
                'args' => [
                    'trip_id' => [
                        'required' => true,
                        'type' => 'integer',
                    ],
                ],
            ],
        ]);
    }

    /**
     * Handle secure download request
     */
    public function handleDownloadRequest(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $downloadId = (int) $request->get_param('download_id');
        $bookingId = (int) $request->get_param('booking_id');
        $exp = (int) $request->get_param('exp');
        $sig = (string) $request->get_param('sig');
        $action = (string) ($request->get_param('action') ?: 'download');

        if ($downloadId <= 0 || $exp <= 0 || $sig === '') {
            return new WP_Error('yatra_download_invalid_request', __('Invalid download request.', 'yatra'), ['status' => 400]);
        }

        if (time() > $exp) {
            return new WP_Error('yatra_download_expired', __('This download link has expired.', 'yatra'), ['status' => 403]);
        }

        // Validate signature - try both actions for flexibility
        $expectedSigDownload = $this->signDownloadToken($downloadId, $bookingId, $exp, 'download');
        $expectedSigPreview = $this->signDownloadToken($downloadId, $bookingId, $exp, 'preview');
        
        if (!hash_equals($expectedSigDownload, $sig) && !hash_equals($expectedSigPreview, $sig)) {
            return new WP_Error('yatra_download_invalid_signature', __('Invalid download signature.', 'yatra'), ['status' => 403]);
        }

        $repo = new TripDownloadRepository();
        $download = $repo->getById($downloadId);
        if (!$download || empty($download->id)) {
            return new WP_Error('yatra_download_not_found', __('Download not found.', 'yatra'), ['status' => 404]);
        }

        if (isset($download->enabled) && !(bool) $download->enabled) {
            return new WP_Error('yatra_download_disabled', __('This download is not available.', 'yatra'), ['status' => 403]);
        }

        $visibility = isset($download->visibility) ? (string) $download->visibility : 'booked_only';
        if ($visibility === 'paid_only') {
            $visibility = 'booked_only';
        }

        // Enforce visibility rules
        if ($visibility === 'public') {
            // No extra checks needed
        } elseif ($visibility === 'logged_in') {
            if (!is_user_logged_in()) {
                return new WP_Error('yatra_download_login_required', __('Please log in to access this download.', 'yatra'), ['status' => 401]);
            }
        } else {
            // booked_only
            if ($bookingId <= 0) {
                return new WP_Error('yatra_download_booking_required', __('Booking is required for this download.', 'yatra'), ['status' => 403]);
            }

            $bookingRepo = new BookingRepository();
            $booking = $bookingRepo->findWithTrip($bookingId);
            if (!$booking) {
                return new WP_Error('yatra_download_booking_not_found', __('Booking not found.', 'yatra'), ['status' => 404]);
            }

            $downloadTripId = isset($download->trip_id) ? (int) $download->trip_id : 0;
            if ($downloadTripId > 0 && (int) $booking->trip_id !== $downloadTripId) {
                return new WP_Error('yatra_download_trip_mismatch', __('This download does not match your booking.', 'yatra'), ['status' => 403]);
            }
        }

        $filePath = $this->ensureProtectedFile($download, $repo);
        if (!$filePath || !file_exists($filePath)) {
            return new WP_Error('yatra_download_file_missing', __('File not found.', 'yatra'), ['status' => 404]);
        }

        // Get trip title for custom filename
        $tripTitle = 'Download';
        if (isset($download->trip_id) && $download->trip_id > 0) {
            global $wpdb;
            $tripTable = $wpdb->prefix . 'yatra_trips';
            
            $trip = $wpdb->get_row($wpdb->prepare(
                "SELECT title FROM {$tripTable} WHERE id = %d",
                (int) $download->trip_id
            ));
            
            if ($trip && !empty($trip->title)) {
                $tripTitle = sanitize_text_field($trip->title);
            }
        }

        // Generate custom filename
        $originalFilename = basename($filePath);
        $fileExtension = pathinfo($originalFilename, PATHINFO_EXTENSION);
        
        if (empty($fileExtension)) {
            $mime = function_exists('mime_content_type') ? @mime_content_type($filePath) : 'application/octet-stream';
            switch ($mime) {
                case 'application/pdf':
                    $fileExtension = 'pdf';
                    break;
                case 'image/jpeg':
                    $fileExtension = 'jpg';
                    break;
                case 'image/png':
                    $fileExtension = 'png';
                    break;
                default:
                    $fileExtension = 'bin';
                    break;
            }
        }

        // Get download number for this trip
        $downloadNumber = 1;
        if (isset($download->trip_id) && $download->trip_id > 0) {
            $tripDownloads = $repo->getByTripId((int) $download->trip_id);
            if (!empty($tripDownloads)) {
                foreach ($tripDownloads as $index => $tripDownload) {
                    if ($tripDownload->id == $download->id) {
                        $downloadNumber = $index + 1;
                        break;
                    }
                }
            }
        }

        $customFilename = sprintf('%s - Download - %d.%s', $tripTitle, $downloadNumber, $fileExtension);

        $mime = function_exists('mime_content_type') ? (string) @mime_content_type($filePath) : 'application/octet-stream';
        $disposition = ($action === 'preview') ? 'inline' : 'attachment';

        // Serve file
        nocache_headers();
        header('Content-Type: ' . $mime);
        header('Content-Length: ' . (string) filesize($filePath));
        header('Content-Disposition: ' . $disposition . '; filename="' . $customFilename . '"');

        if (ob_get_level()) {
            ob_end_clean();
        }

        readfile($filePath);
        exit;
    }

    /**
     * Get downloads for a trip
     */
    public function getDownloads(WP_REST_Request $request): WP_REST_Response
    {
        $tripId = (int) $request->get_param('trip_id');
        
        $repo = new TripDownloadRepository();
        $downloads = $repo->getByTripId($tripId);

        $items = array_map(function ($download) {
            $attachmentId = isset($download->attachment_id) ? (int) $download->attachment_id : null;
            $attachmentUrl = '';
            $attachmentTitle = '';

            if ($attachmentId) {
                $attachmentUrl = (string) (wp_get_attachment_url($attachmentId) ?: '');
                $attachmentTitle = (string) (get_the_title($attachmentId) ?: '');
            }

            return [
                'id' => (int) $download->id,
                'trip_id' => (int) $download->trip_id,
                'title' => $download->title ?? '',
                'description' => $download->description ?? '',
                'attachment_id' => $attachmentId,
                'attachment_url' => $attachmentUrl,
                'attachment_title' => $attachmentTitle,
                'visibility' => $download->visibility ?? 'booked_only',
                'enabled' => (bool) ($download->enabled ?? true),
                'sort_order' => (int) ($download->sort_order ?? 0),
            ];
        }, $downloads);

        return new WP_REST_Response(['data' => $items], 200);
    }

    /**
     * Save downloads for a trip
     */
    public function saveDownloads(WP_REST_Request $request): WP_REST_Response
    {
        $tripId = (int) $request->get_param('trip_id');
        $items = $request->get_param('items') ?? [];

        if (!is_array($items)) {
            $items = [];
        }

        $repo = new TripDownloadRepository();
        $repo->replaceForTrip($tripId, $items);

        // Return updated downloads
        $downloads = $repo->getByTripId($tripId);
        $responseItems = array_map(function ($download) {
            $attachmentId = isset($download->attachment_id) ? (int) $download->attachment_id : null;
            $attachmentUrl = '';
            $attachmentTitle = '';

            if ($attachmentId) {
                $attachmentUrl = (string) (wp_get_attachment_url($attachmentId) ?: '');
                $attachmentTitle = (string) (get_the_title($attachmentId) ?: '');
            }

            return [
                'id' => (int) $download->id,
                'trip_id' => (int) $download->trip_id,
                'title' => $download->title ?? '',
                'description' => $download->description ?? '',
                'attachment_id' => $attachmentId,
                'attachment_url' => $attachmentUrl,
                'attachment_title' => $attachmentTitle,
                'visibility' => $download->visibility ?? 'booked_only',
                'enabled' => (bool) ($download->enabled ?? true),
                'sort_order' => (int) ($download->sort_order ?? 0),
            ];
        }, $downloads);

        return new WP_REST_Response(['data' => $responseItems], 200);
    }

    /**
     * Ensure protected file exists
     */
    private function ensureProtectedFile(object $download, TripDownloadRepository $repo): string
    {
        $existing = isset($download->protected_path) ? (string) $download->protected_path : '';
        if ($existing !== '' && file_exists($existing)) {
            return $existing;
        }

        $attachmentId = isset($download->attachment_id) ? (int) $download->attachment_id : 0;
        if ($attachmentId <= 0) {
            return '';
        }

        $source = get_attached_file($attachmentId);
        if (!$source || !file_exists($source)) {
            return '';
        }

        $uploads = wp_upload_dir();
        $baseDir = isset($uploads['basedir']) ? (string) $uploads['basedir'] : '';
        if ($baseDir === '') {
            return '';
        }

        $dir = rtrim($baseDir, '/') . '/yatra-protected-downloads';
        if (!wp_mkdir_p($dir)) {
            return '';
        }

        $downloadId = isset($download->id) ? (int) $download->id : 0;
        $name = basename($source);
        $safeName = preg_replace('/[^A-Za-z0-9._-]/', '-', $name);
        $target = $dir . '/download-' . $downloadId . '-' . $safeName;

        if (!file_exists($target)) {
            @copy($source, $target);
        }

        if (file_exists($target) && $downloadId > 0) {
            $repo->updateProtectedPath($downloadId, $target);
        }

        return $target;
    }

    /**
     * Sign a download token
     */
    private function signDownloadToken(int $downloadId, int $bookingId, int $exp, string $action): string
    {
        $payload = $downloadId . '|' . $bookingId . '|' . $exp . '|' . $action;
        return hash_hmac('sha256', $payload, wp_salt('yatra-downloads'));
    }

    /**
     * Build a secure download URL
     */
    public static function buildSecureDownloadUrl(int $downloadId, int $bookingId, string $action = 'download'): string
    {
        $ts = time() + (24 * 60 * 60); // 24 hours expiration
        $payload = $downloadId . '|' . $bookingId . '|' . $ts . '|' . $action;
        $sig = hash_hmac('sha256', $payload, wp_salt('yatra-downloads'));
        
        $url = rest_url('yatra/v1/downloads/' . $downloadId);

        $url = add_query_arg([
            'booking_id' => $bookingId,
            'action' => $action,
            'exp' => $ts,
            'sig' => $sig,
        ], $url);

        return add_query_arg('_wpnonce', wp_create_nonce('wp_rest'), $url);
    }
}
