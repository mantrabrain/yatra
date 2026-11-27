<?php
/**
 * Enquiry form custom fields (3.3).
 *
 * Settings → Booking → Enquiry form lets the operator add their own questions
 * to the trip enquiry form (text, paragraph, dropdown, checkbox). Answers are
 * appended to the enquiry message as "Question: answer" lines, so they show
 * wherever the message already shows (the Enquiries screen, the admin email,
 * exports, Pro automations) without changing how enquiries are stored.
 *
 * Form inputs are named `ecf_{id}` so a flat form / JSON payload carries them.
 *
 * @package Yatra\Services
 * @since 3.3.0
 */

declare(strict_types=1);

namespace Yatra\Services;

class EnquiryCustomFields
{
    public const SETTING = 'enquiry_custom_fields';
    public const INPUT_PREFIX = 'ecf_';
    public const MAX_FIELDS = 10;
    public const TYPES = ['text', 'textarea', 'select', 'checkbox'];

    /**
     * Clean a saved / submitted field list.
     *
     * @param mixed $value
     * @return array<int, array{id:string,label:string,type:string,required:bool,options:array<int,string>}>
     */
    public static function sanitizeList($value): array
    {
        if (!is_array($value)) {
            return [];
        }
        $out = [];
        $seen = [];
        foreach ($value as $row) {
            if (!is_array($row) || count($out) >= self::MAX_FIELDS) {
                continue;
            }
            $label = trim(sanitize_text_field((string) ($row['label'] ?? '')));
            if ($label === '') {
                continue;
            }
            $label = function_exists('mb_substr') ? mb_substr($label, 0, 80) : substr($label, 0, 80);
            $type = (string) ($row['type'] ?? 'text');
            $type = in_array($type, self::TYPES, true) ? $type : 'text';

            $id = substr(sanitize_key((string) ($row['id'] ?? '')), 0, 32);
            if ($id === '') {
                $id = substr(sanitize_key(str_replace('-', '_', sanitize_title($label))), 0, 24);
            }
            if ($id === '') {
                $id = 'field';
            }
            $base = $id;
            $n = 2;
            while (isset($seen[$id])) {
                $id = substr($base, 0, 28) . '_' . $n++;
            }
            $seen[$id] = true;

            $options = [];
            if ($type === 'select') {
                $raw = $row['options'] ?? [];
                if (is_string($raw)) {
                    $raw = preg_split('/[\r\n,]+/', $raw) ?: [];
                }
                foreach ((array) $raw as $opt) {
                    $opt = trim(sanitize_text_field((string) $opt));
                    if ($opt !== '' && !in_array($opt, $options, true) && count($options) < 30) {
                        $options[] = function_exists('mb_substr') ? mb_substr($opt, 0, 80) : substr($opt, 0, 80);
                    }
                }
                if ($options === []) {
                    continue; // A dropdown without choices can't be answered.
                }
            }

            $out[] = [
                'id' => $id,
                'label' => $label,
                'type' => $type,
                'required' => !empty($row['required']) && $row['required'] !== 'false',
                'options' => $options,
            ];
        }

        return $out;
    }

    /** @return array<int, array{id:string,label:string,type:string,required:bool,options:array<int,string>}> */
    public static function fields(): array
    {
        $fields = self::sanitizeList(SettingsService::get(self::SETTING, []));

        /**
         * Enquiry form custom fields.
         *
         * @since 3.3.0
         * @param array $fields Field definitions from the settings.
         */
        $fields = apply_filters('yatra_enquiry_custom_fields', $fields);

        return self::sanitizeList($fields);
    }

    /**
     * Validate a public enquiry submission's answers and append them to its
     * message. Returns the updated data, or an error message string.
     *
     * @param array<string, mixed> $data
     * @return array<string, mixed>|string
     */
    public static function applyToSubmission(array $data)
    {
        $fields = self::fields();
        if ($fields === []) {
            return $data;
        }

        $lines = [];
        $answers = [];
        foreach ($fields as $field) {
            $raw = $data[self::INPUT_PREFIX . $field['id']] ?? '';
            if (is_array($raw)) {
                $raw = '';
            }
            $raw = (string) $raw;

            switch ($field['type']) {
                case 'checkbox':
                    $checked = in_array(strtolower(trim($raw)), ['1', 'on', 'yes', 'true'], true);
                    if ($field['required'] && !$checked) {
                        /* translators: %s: question label */
                        return sprintf(__('Please tick "%s".', 'yatra'), $field['label']);
                    }
                    $value = $checked ? __('Yes', 'yatra') : __('No', 'yatra');
                    break;
                case 'select':
                    $value = trim(sanitize_text_field($raw));
                    if ($value !== '' && !in_array($value, $field['options'], true)) {
                        /* translators: %s: question label */
                        return sprintf(__('Please choose a valid option for "%s".', 'yatra'), $field['label']);
                    }
                    break;
                case 'textarea':
                    $value = trim(sanitize_textarea_field($raw));
                    $value = function_exists('mb_substr') ? mb_substr($value, 0, 2000) : substr($value, 0, 2000);
                    break;
                default:
                    $value = trim(sanitize_text_field($raw));
                    $value = function_exists('mb_substr') ? mb_substr($value, 0, 500) : substr($value, 0, 500);
            }

            if ($value === '' && $field['required']) {
                /* translators: %s: question label */
                return sprintf(__('Please answer "%s".', 'yatra'), $field['label']);
            }
            if ($value === '') {
                continue;
            }
            $answers[$field['id']] = ['label' => $field['label'], 'value' => $value];
            $lines[] = $field['label'] . ': ' . $value;
        }

        if ($lines !== []) {
            $message = rtrim((string) ($data['message'] ?? ''));
            $data['message'] = ($message !== '' ? $message . "\n\n" : '') . implode("\n", $lines);
        }
        $data['custom_field_answers'] = $answers;

        return $data;
    }
}
