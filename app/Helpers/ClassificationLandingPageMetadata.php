<?php

declare(strict_types=1);

namespace Yatra\Helpers;

/**
 * Decode and merge {@see classifications.metadata} payloads (serialized PHP arrays, occasional JSON array strings).
 *
 * Used so {@see landing_page_id} and SEO keys stay in one record without overwriting each other.
 */
final class ClassificationLandingPageMetadata
{
    /**
     * Decode a classification `metadata` column value into an associative array.
     *
     * @param mixed $stored Serialized string from DB, JSON string, empty, or already an array (tests).
     *
     * @return array<string, mixed>
     */
    public static function decodeStoredMetadata($stored): array
    {
        if ($stored === null || $stored === '') {
            return [];
        }

        if (is_array($stored)) {
            return $stored;
        }

        if (!is_string($stored)) {
            return [];
        }

        $trimmed = trim($stored);
        if ($trimmed === '') {
            return [];
        }

        $fromPhp = maybe_unserialize($trimmed);
        if (is_array($fromPhp)) {
            return $fromPhp;
        }

        $slashes = stripslashes($trimmed);
        if ($slashes !== $trimmed) {
            $fromPhp2 = maybe_unserialize($slashes);
            if (is_array($fromPhp2)) {
                return $fromPhp2;
            }
        }

        $fromJson = json_decode($trimmed, true);

        return is_array($fromJson) ? $fromJson : [];
    }

    /**
     * Existing row metadata merged with inbound `metadata` from the REST payload (decoded).
     * Request keys overwrite stored keys for same name.
     *
     * @param array<string, mixed> $payload Current request slice (typically full body); reads `metadata` only.
     *
     * @return array<string, mixed>
     */
    public static function baseMetadataMergedWithRequest(
        ?int $classificationId,
        object $repository,
        array $payload
    ): array {
        $fromDb = [];
        if ($classificationId !== null && $classificationId > 0 && method_exists($repository, 'find')) {
            $row = $repository->find($classificationId);
            if ($row && isset($row->metadata)) {
                $fromDb = self::decodeStoredMetadata($row->metadata);
            }
        }

        $fromRequest = [];
        if (isset($payload['metadata']) && is_array($payload['metadata'])) {
            $fromRequest = $payload['metadata'];
        } elseif (isset($payload['metadata'])) {
            $fromRequest = self::decodeStoredMetadata($payload['metadata']);
        }

        return array_merge($fromDb, $fromRequest);
    }

    /**
     * Merges {@see landing_page_id} from REST/admin payloads into classification `metadata`
     * (always grounded on stored row metadata + inbound metadata).
     *
     * @param array<string, mixed> $data Incoming create/update payload (modified in place).
     */
    public static function mergeLandingPageIntoData(array &$data, ?int $classificationId, object $repository): void
    {
        if (!array_key_exists('landing_page_id', $data)) {
            return;
        }

        $raw = $data['landing_page_id'];
        unset($data['landing_page_id']);

        $merged = self::baseMetadataMergedWithRequest($classificationId, $repository, $data);

        $pageId = 0;
        if ($raw !== null && $raw !== '') {
            $pageId = absint($raw);
        }

        if ($pageId <= 0) {
            unset($merged['landing_page_id']);
        } else {
            $post = get_post($pageId);
            if ($post && $post->post_type === 'page') {
                $merged['landing_page_id'] = $pageId;
            } else {
                unset($merged['landing_page_id']);
            }
        }

        $data['metadata'] = $merged;
    }
}
