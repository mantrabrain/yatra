<?php
/**
 * Template: Signed Consent PDF
 *
 * Variables available:
 * @var string $site_name
 * @var object $consent
 * @var string $form_name
 * @var array $form_data
 * @var string $signed_at
 * @var string $ip_address
 * @var string $user_agent
 * @var string|null $signature_data
 * @var string|null $initials_data
 */

$safe = static function (?string $value): string {
    return esc_html($value ?? '');
};

$formatDate = static function (?string $date): string {
    if (!$date) {
        return '';
    }
    return esc_html(date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($date)));
};
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title><?php echo $safe($form_name); ?> - <?php echo $safe($site_name); ?></title>
    <style>
        @page {
            margin: 22mm 13mm;
        }
        body {
            font-family: 'Noto Sans Devanagari', 'Noto Sans Arabic', 'Noto Sans CJK', 'DejaVu Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
            font-size: 11.5px;
            color: #111827;
            line-height: 1.32;
            margin: 0;
            padding: 0;
            background: #ffffff;
        }
        .wrapper {
            padding: 14px 12px;
            page-break-after: avoid;
        }
        .header {
            margin-bottom: 18px;
            border-bottom: 1px solid #d1d5db;
            padding-bottom: 10px;
            page-break-after: avoid;
        }
        .header h1 {
            margin: 0;
            font-size: 17px;
        }
        .meta {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        .meta td {
            padding: 5px 0;
            vertical-align: top;
        }
        .section-title {
            font-size: 12px;
            font-weight: 700;
            margin-top: 16px;
            margin-bottom: 5px;
            page-break-after: avoid;
        }
        .responses {
            width: 100%;
            border-collapse: collapse;
            page-break-inside: auto;
            font-size: 10.5px;
        }
        .responses th,
        .responses td {
            padding: 5px;
            border: 1px solid #e5e7eb;
            text-align: left;
        }
        .responses th {
            background: #f3f4f6;
            font-weight: 700;
        }
        .responses tr {
            page-break-inside: avoid;
        }
        .signature-box {
            border: 1px dashed #9ca3af;
            padding: 10px;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 10px;
            background: #f9fafb;
            page-break-inside: avoid;
            box-sizing: border-box;
        }
        .signature-row {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            page-break-inside: avoid;
        }
        .signature-row td {
            vertical-align: top;
            padding: 0;
        }
        .signature-row td:first-child {
            width: 48%;
            padding-right: 2%;
        }
        .signature-row td:last-child {
            width: 48%;
            padding-left: 2%;
        }
        .signature-label {
            font-size: 11px;
            font-weight: 700;
            margin-bottom: 5px;
            color: #374151;
        }
        .muted {
            color: #6b7280;
            font-size: 11px;
        }
        .section {
            page-break-inside: avoid;
        }
        .footer-note {
            page-break-inside: avoid;
            text-align: center;
            margin-top: 20px;
            font-size: 10px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1><?php echo $safe($form_name); ?></h1>
            <p class="muted"><?php echo $safe($site_name); ?></p>
        </div>

        <table class="meta">
            <tr>
                <td><strong><?php esc_html_e('Signer Name', 'yatra'); ?>:</strong></td>
                <td><?php echo $safe($consent->signer_name ?? ''); ?></td>
            </tr>
            <tr>
                <td><strong><?php esc_html_e('Email', 'yatra'); ?>:</strong></td>
                <td><?php echo $safe($consent->signer_email ?? ''); ?></td>
            </tr>
            <tr>
                <td><strong><?php esc_html_e('Signed At', 'yatra'); ?>:</strong></td>
                <td><?php echo $formatDate($signed_at); ?></td>
            </tr>
            <tr>
                <td><strong><?php esc_html_e('IP Address', 'yatra'); ?>:</strong></td>
                <td><?php echo $safe($ip_address); ?></td>
            </tr>
            <tr>
                <td><strong><?php esc_html_e('User Agent', 'yatra'); ?>:</strong></td>
                <td><?php echo $safe($user_agent); ?></td>
            </tr>
        </table>

        <div class="section-title"><?php esc_html_e('Form Responses', 'yatra'); ?></div>
        <?php if (!empty($form_data)): ?>
            <table class="responses">
                <thead>
                    <tr>
                        <th><?php esc_html_e('Field', 'yatra'); ?></th>
                        <th><?php esc_html_e('Response', 'yatra'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($form_data as $field => $value): ?>
                        <tr>
                            <td><?php echo $safe(is_string($field) ? $field : (string) $field); ?></td>
                            <td>
                                <?php
                                if (is_bool($value)) {
                                    echo $value ? esc_html__('Yes', 'yatra') : esc_html__('No', 'yatra');
                                } elseif (is_array($value)) {
                                    echo $safe(implode(', ', array_map('strval', $value)));
                                } else {
                                    echo $safe((string) $value);
                                }
                                ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php else: ?>
            <p class="muted"><?php esc_html_e('No responses recorded for this consent form.', 'yatra'); ?></p>
        <?php endif; ?>

        <div class="section-title"><?php esc_html_e('Signature & Initials', 'yatra'); ?></div>
        <table class="signature-row">
            <tr>
                <td>
                    <div class="signature-label"><?php esc_html_e('Signature', 'yatra'); ?></div>
                    <div class="signature-box">
                        <?php if (!empty($signature_data)): ?>
                            <img src="<?php echo esc_attr($signature_data); ?>" alt="<?php esc_attr_e('Signature', 'yatra'); ?>" style="max-height: 80px;">
                        <?php else: ?>
                            <span class="muted"><?php esc_html_e('No signature captured.', 'yatra'); ?></span>
                        <?php endif; ?>
                    </div>
                </td>
                <td>
                    <div class="signature-label"><?php esc_html_e('Initials', 'yatra'); ?></div>
                    <div class="signature-box">
                        <?php if (!empty($initials_data)): ?>
                            <img src="<?php echo esc_attr($initials_data); ?>" alt="<?php esc_attr_e('Initials', 'yatra'); ?>" style="max-height: 50px;">
                        <?php else: ?>
                            <span class="muted"><?php esc_html_e('No initials captured.', 'yatra'); ?></span>
                        <?php endif; ?>
                    </div>
                </td>
            </tr>
        </table>

        <p class="footer-note">
            <?php esc_html_e('This document is generated electronically and is valid without a handwritten signature.', 'yatra'); ?>
        </p>
    </div>
</body>
</html>
