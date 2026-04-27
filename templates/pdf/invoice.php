<?php

$companyName = (string) ($company_name ?? '');
$companyAddress = (string) ($company_address ?? '');
$companyEmail = (string) ($company_email ?? '');
$companyPhone = (string) ($company_phone ?? '');

$customerName = (string) ($customer_name ?? '');
$customerEmail = (string) ($customer_email ?? '');

$paymentRef = (string) ($payment_ref ?? '');
$paymentDate = (string) ($payment_date ?? '');
$paymentStatus = (string) ($payment_status ?? '');
$statusClass = (string) ($status_class ?? 'pending');

$tripTitle = (string) ($trip_title ?? '');
$paymentMethod = (string) ($payment_method ?? '');
$bookingRef = (string) ($booking_ref ?? '');
$travelDate = (string) ($travel_date ?? '');

$currencySymbol = (string) ($currency_symbol ?? '');
$amount = (string) ($amount ?? '0.00');
$bookingTotal = (string) ($booking_total ?? '0.00');
$amountPaid = (string) ($amount_paid ?? '0.00');
$amountDue = (string) ($amount_due ?? '0.00');

?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo esc_html__('Invoice', 'yatra'); ?> - <?php echo htmlspecialchars($paymentRef, ENT_QUOTES, 'UTF-8'); ?></title>
    <style>
        @page { size: A4 portrait; margin: 0mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { margin: 0; padding: 0; font-family: "DejaVu Sans", sans-serif; font-size: 12px; color: #111; }
        .content { padding: 12mm 12mm 14mm 12mm; }

        .header { width: 100%; border-collapse: collapse; }
        .header td { vertical-align: top; }
        .brand { background: #1e40af; color: #fff; padding: 6mm 6mm; }
        .brand h1 { font-size: 18px; font-weight: 700; margin: 0; }
        .brand p { font-size: 11px; margin-top: 4px; }

        .panel { width: 100%; border: 1px solid #e5e7eb; border-collapse: collapse; margin-top: 6mm; margin-bottom: 6mm; }
        .panel td { padding: 5mm 5mm; vertical-align: top; }
        .panel h3 { font-size: 11px; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; letter-spacing: 0.5px; }
        .muted { color: #6b7280; }

        .details { width: 100%; border-collapse: collapse; }
        .details td { padding: 1.5mm 0; vertical-align: top; }
        .details .k { width: 18mm; white-space: nowrap; font-weight: 700; }
        .details .v { white-space: nowrap; }
        .details .v-wrap { white-space: normal; }

        .badge { display: inline-block; padding: 2px 10px; font-size: 10px; border-radius: 12px; border: 1px solid #e5e7eb; margin-left: 6px; vertical-align: middle; line-height: 1.4; }
        .badge-paid { background: #d1fae5; color: #065f46; border-color: #a7f3d0; }
        .badge-pending { background: #fef3c7; color: #92400e; border-color: #fde68a; }

        .items { width: 100%; border-collapse: collapse; margin-top: 4mm; }
        .items th { text-align: left; font-size: 10px; text-transform: uppercase; color: #6b7280; background: #f9fafb; border-bottom: 1px solid #e5e7eb; padding: 10px 12px; }
        .items td { border-bottom: 1px solid #e5e7eb; padding: 12px; vertical-align: top; }
        .right { text-align: right; }

        .totals { width: 100%; border-collapse: collapse; margin-top: 6mm; }
        .totals td { padding: 7px 12px; }
        .totals .label { color: #374151; }
        .totals .value { text-align: right; }
        .totals .grand { font-weight: 700; color: #1e40af; border-top: 2px solid #1e40af; padding-top: 12px; }
    </style>
</head>
<body>
<table class="header">
    <tr>
        <td class="brand">
            <h1><?php echo htmlspecialchars($companyName, ENT_QUOTES, 'UTF-8'); ?></h1>
            <p><?php esc_html_e('Payment Invoice', 'yatra'); ?></p>
        </td>
    </tr>
</table>

<div class="content">
    <table class="panel">
        <tr>
            <td style="width: 40%;">
                <h3><?php esc_html_e('Invoice To', 'yatra'); ?></h3>
                <div><strong><?php echo htmlspecialchars($customerName, ENT_QUOTES, 'UTF-8'); ?></strong></div>
                <div class="muted"><?php echo htmlspecialchars($customerEmail, ENT_QUOTES, 'UTF-8'); ?></div>
            </td>
            <td style="width: 30%;">
                <h3><?php esc_html_e('Invoice Details', 'yatra'); ?></h3>
                <table class="details">
                    <tr>
                        <td class="k"><?php esc_html_e('Invoice #:', 'yatra'); ?></td>
                        <td class="v-wrap"><?php echo htmlspecialchars($paymentRef, ENT_QUOTES, 'UTF-8'); ?></td>
                    </tr>
                    <tr>
                        <td class="k"><?php esc_html_e('Date:', 'yatra'); ?></td>
                        <td class="v"><?php echo htmlspecialchars($paymentDate, ENT_QUOTES, 'UTF-8'); ?></td>
                    </tr>
                    <tr>
                        <td class="k"><?php esc_html_e('Status:', 'yatra'); ?></td>
                        <td class="v"><span class="badge badge-<?php echo htmlspecialchars($statusClass, ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars($paymentStatus, ENT_QUOTES, 'UTF-8'); ?></span></td>
                    </tr>
                </table>
            </td>
            <td style="width: 30%;">
                <h3><?php esc_html_e('Company', 'yatra'); ?></h3>
                <div><?php echo htmlspecialchars($companyName, ENT_QUOTES, 'UTF-8'); ?></div>
                <?php if ($companyAddress !== ''): ?>
                    <div class="muted"><?php echo htmlspecialchars($companyAddress, ENT_QUOTES, 'UTF-8'); ?></div>
                <?php endif; ?>
                <?php if ($companyEmail !== ''): ?>
                    <div class="muted"><?php echo htmlspecialchars($companyEmail, ENT_QUOTES, 'UTF-8'); ?></div>
                <?php endif; ?>
                <?php if ($companyPhone !== ''): ?>
                    <div class="muted"><?php echo htmlspecialchars($companyPhone, ENT_QUOTES, 'UTF-8'); ?></div>
                <?php endif; ?>
            </td>
        </tr>
    </table>

    <table class="items">
        <thead>
        <tr>
            <th><?php esc_html_e('Description', 'yatra'); ?></th>
            <th><?php esc_html_e('Booking Ref', 'yatra'); ?></th>
            <th><?php esc_html_e('Travel Date', 'yatra'); ?></th>
            <th class="right"><?php esc_html_e('Amount', 'yatra'); ?></th>
        </tr>
        </thead>
        <tbody>
        <tr>
            <td>
                <div><strong><?php echo htmlspecialchars($tripTitle, ENT_QUOTES, 'UTF-8'); ?></strong></div>
                <div class="muted"><?php esc_html_e('Payment via', 'yatra'); ?> <?php echo htmlspecialchars($paymentMethod, ENT_QUOTES, 'UTF-8'); ?></div>
            </td>
            <td><?php echo htmlspecialchars($bookingRef, ENT_QUOTES, 'UTF-8'); ?></td>
            <td><?php echo htmlspecialchars($travelDate, ENT_QUOTES, 'UTF-8'); ?></td>
            <td class="right"><strong><?php echo $currencySymbol . htmlspecialchars($amount, ENT_QUOTES, 'UTF-8'); ?></strong></td>
        </tr>
        </tbody>
    </table>

    <table class="totals">
        <?php if (!empty($tax_breakdown)): ?>
        <tr>
            <td class="label"><?php esc_html_e('Subtotal', 'yatra'); ?></td>
            <td class="value"><?php echo $currencySymbol . htmlspecialchars($subtotal, ENT_QUOTES, 'UTF-8'); ?></td>
        </tr>
        <?php foreach ($tax_breakdown as $tax): ?>
        <tr>
            <td class="label"><?php echo htmlspecialchars($tax['name'], ENT_QUOTES, 'UTF-8'); ?> (<?php echo htmlspecialchars($tax['rate'], ENT_QUOTES, 'UTF-8'); ?>%)</td>
            <td class="value"><?php echo $currencySymbol . htmlspecialchars($tax['amount'], ENT_QUOTES, 'UTF-8'); ?></td>
        </tr>
        <?php endforeach; ?>
        <?php endif; ?>
        <tr>
            <td class="label"><?php esc_html_e('Booking Total', 'yatra'); ?></td>
            <td class="value"><?php echo $currencySymbol . htmlspecialchars($bookingTotal, ENT_QUOTES, 'UTF-8'); ?></td>
        </tr>
        <tr>
            <td class="label"><?php esc_html_e('Total Paid', 'yatra'); ?></td>
            <td class="value"><?php echo $currencySymbol . htmlspecialchars($amountPaid, ENT_QUOTES, 'UTF-8'); ?></td>
        </tr>
        <tr>
            <td class="label"><?php esc_html_e('Balance Due', 'yatra'); ?></td>
            <td class="value"><?php echo $currencySymbol . htmlspecialchars($amountDue, ENT_QUOTES, 'UTF-8'); ?></td>
        </tr>
        <tr>
            <td class="label grand"><?php esc_html_e('This Payment', 'yatra'); ?></td>
            <td class="value grand"><?php echo $currencySymbol . htmlspecialchars($amount, ENT_QUOTES, 'UTF-8'); ?></td>
        </tr>
    </table>
</div>
</body>
</html>
