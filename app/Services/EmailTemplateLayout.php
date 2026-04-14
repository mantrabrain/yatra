<?php

declare(strict_types=1);

namespace Yatra\Services;

/**
 * Reusable HTML shells for transactional / automation emails (table-based for clients like Outlook).
 * Inner fragments may contain {{merge_tags}} (defaults) or pre-escaped HTML (PHP fallbacks).
 */
final class EmailTemplateLayout
{
    private const CUSTOMER_HEADER_BG = '#0d9488';

    private const ADMIN_HEADER_BG = '#1e293b';

    /**
     * Customer-facing email: soft outer background, colored header band, white card body.
     *
     * @param string $footerLine Site line or merge tag (e.g. {{site_name}})
     */
    public static function customer(
        string $emoji,
        string $heading,
        string $innerHtml,
        string $footerLine = '{{site_name}}',
        string $preheader = ''
    ): string {
        $headingEsc = esc_html($heading);
        $emojiHtml = $emoji !== '' ? '<p style="margin:0 0 10px;font-size:32px;line-height:1;">' . esc_html($emoji) . '</p>' : '';
        $pre = $preheader !== ''
            ? '<div style="display:none;font-size:1px;color:#f4f7fb;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">' . esc_html($preheader) . '</div>'
            : '';

        return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>' . $headingEsc . '</title></head>'
            . '<body style="margin:0;padding:0;background-color:#e8eef5;">' . $pre
            . '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#e8eef5;">'
            . '<tr><td align="center" style="padding:28px 16px;">'
            . '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(15,23,42,0.1);">'
            . '<tr><td style="background:' . self::CUSTOMER_HEADER_BG . ';padding:28px 32px;text-align:center;">'
            . $emojiHtml
            . '<h1 style="margin:0;font-family:Georgia,\'Times New Roman\',serif;font-size:24px;font-weight:600;color:#f0fdfa;letter-spacing:-0.02em;">' . $headingEsc . '</h1>'
            . '</td></tr>'
            . '<tr><td style="padding:32px 32px 24px;font-family:\'Segoe UI\',Roboto,\'Helvetica Neue\',Arial,sans-serif;font-size:16px;line-height:1.65;color:#334155;">'
            . $innerHtml
            . '</td></tr>'
            . '<tr><td style="padding:0 32px 32px;font-family:\'Segoe UI\',Roboto,\'Helvetica Neue\',Arial,sans-serif;font-size:13px;line-height:1.5;color:#94a3b8;text-align:center;border-top:1px solid #f1f5f9;">'
            . '<p style="margin:20px 0 0;">' . $footerLine . '</p>'
            . '</td></tr>'
            . '</table>'
            . '<p style="margin:16px 0 0;font-family:\'Segoe UI\',Roboto,Arial,sans-serif;font-size:11px;color:#94a3b8;text-align:center;">'
            . esc_html__('You received this email because of a booking or enquiry on our site.', 'yatra')
            . '</p>'
            . '</td></tr></table></body></html>';
    }

    /**
     * Admin / internal email: compact, high-contrast header.
     */
    public static function admin(
        string $emoji,
        string $heading,
        string $innerHtml,
        ?string $footerLine = null
    ): string {
        $headingEsc = esc_html($heading);
        $footer = $footerLine ?? esc_html__('Yatra · Admin notification', 'yatra');

        return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>' . $headingEsc . '</title></head>'
            . '<body style="margin:0;padding:0;background-color:#e2e8f0;">'
            . '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#e2e8f0;">'
            . '<tr><td align="center" style="padding:24px 12px;">'
            . '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #cbd5e1;">'
            . '<tr><td style="background:' . self::ADMIN_HEADER_BG . ';padding:20px 24px;">'
            . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>'
            . '<td style="font-size:26px;line-height:1;width:40px;">' . esc_html($emoji) . '</td>'
            . '<td style="font-family:\'Segoe UI\',Roboto,Arial,sans-serif;font-size:18px;font-weight:700;color:#f8fafc;">' . $headingEsc . '</td>'
            . '</tr></table>'
            . '</td></tr>'
            . '<tr><td style="padding:24px;font-family:\'Segoe UI\',Roboto,\'Helvetica Neue\',Arial,sans-serif;font-size:15px;line-height:1.6;color:#1e293b;">'
            . $innerHtml
            . '</td></tr>'
            . '<tr><td style="padding:16px 24px 20px;font-family:\'Segoe UI\',Roboto,Arial,sans-serif;font-size:12px;color:#64748b;background:#f8fafc;border-top:1px solid #e2e8f0;">'
            . $footer
            . '</td></tr>'
            . '</table></td></tr></table></body></html>';
    }

    /**
     * Light card block for key–value rows (inner fragment for customer emails).
     *
     * @param array<int, array{label: string, value: string}> $rows label/value may contain merge tags
     */
    public static function detailCard(array $rows): string
    {
        if ($rows === []) {
            return '';
        }
        $out = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin:24px 0;">';
        $filtered = array_values(array_filter($rows, static function (array $row): bool {
            return trim((string) ($row['value'] ?? '')) !== '';
        }));
        $last = count($filtered) - 1;
        foreach ($filtered as $i => $row) {
            $label = $row['label'] ?? '';
            $value = $row['value'] ?? '';
            $borderBottom = $i < $last ? 'border-bottom:1px solid #e2e8f0;' : '';
            $out .= '<tr><td style="padding:14px 20px;' . $borderBottom . '">'
                . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">'
                . '<tr>'
                . '<td style="font-size:13px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.04em;width:38%;vertical-align:top;">' . $label . '</td>'
                . '<td style="font-size:15px;color:#0f172a;font-weight:600;vertical-align:top;">' . $value . '</td>'
                . '</tr></table></td></tr>';
        }
        $out .= '</table>';

        return $out;
    }

    /**
     * Primary CTA button (table for Outlook).
     */
    public static function button(string $href, string $label): string
    {
        $hrefEsc = esc_url($href);
        $labelEsc = esc_html($label);

        return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;"><tr>'
            . '<td style="border-radius:10px;background:#0d9488;">'
            . '<a href="' . $hrefEsc . '" style="display:inline-block;padding:14px 28px;font-family:\'Segoe UI\',Roboto,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">'
            . $labelEsc . '</a></td></tr></table>';
    }
}
