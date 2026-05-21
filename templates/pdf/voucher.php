<?php

$companyName = (string) ($company_name ?? '');
$companyAddress = (string) ($company_address ?? '');
$companyEmail = (string) ($company_email ?? '');
$companyPhone = (string) ($company_phone ?? '');

$customerName = (string) ($customer_name ?? '');
$customerEmail = (string) ($customer_email ?? '');

$bookingRef = (string) ($booking_ref ?? '');
$bookingDate = (string) ($booking_date ?? '');
$bookingStatus = (string) ($booking_status ?? '');
$statusClass = (string) ($status_class ?? 'pending');

$tripTitle = (string) ($trip_title ?? '');
$tripDuration = (string) ($trip_duration ?? '');
$tripDifficulty = (string) ($trip_difficulty ?? '');

$travelDate = (string) ($travel_date ?? '');
$returnDate = (string) ($return_date ?? '');

$currencySymbol = (string) ($currency_symbol ?? '');
$totalAmount = (string) ($total_amount ?? '0.00');
$amountPaid = (string) ($amount_paid ?? '0.00');
$amountDue = (string) ($amount_due ?? '0.00');

$travelerCount = (int) ($traveler_count ?? 1);
$departureLocation = (string) ($departure_location ?? '');
$destination = (string) ($destination ?? '');

?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo esc_html__('Travel Voucher', 'yatra'); ?> - <?php echo htmlspecialchars($bookingRef, ENT_QUOTES, 'UTF-8'); ?></title>
    <style>
        @page { size: A4 portrait; margin: 0mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { margin: 0; padding: 0; font-family: "Noto Sans Devanagari", "Noto Sans Arabic", "Noto Sans CJK", "DejaVu Sans", sans-serif; font-size: 12px; color: #111; }
        .content { padding: 12mm 12mm 14mm 12mm; }

        .header { width: 100%; border-collapse: collapse; }
        .header td { vertical-align: top; }
        .brand { background: #059669; color: #fff; padding: 6mm 6mm; }
        .brand h1 { font-size: 20px; font-weight: 700; margin: 0; }
        .brand p { font-size: 12px; margin-top: 4px; font-weight: 400; }

        .voucher-number { background: #f3f4f6; padding: 4mm 6mm; border-bottom: 2px solid #059669; }
        .voucher-number .number { font-size: 16px; font-weight: 700; color: #059669; }

        .panel { width: 100%; border: 1px solid #e5e7eb; border-collapse: collapse; margin-top: 6mm; margin-bottom: 6mm; }
        .panel td { padding: 5mm 5mm; vertical-align: top; }
        .panel h3 { font-size: 11px; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; letter-spacing: 0.5px; }
        .muted { color: #6b7280; }

        .trip-info { background: #f9fafb; border-left: 4px solid #059669; padding: 6mm; margin: 6mm 0; }
        .trip-info h4 { color: #059669; font-size: 14px; margin-bottom: 4mm; }

        .details { width: 100%; border-collapse: collapse; }
        .details td { padding: 1.5mm 0; vertical-align: top; }
        .details .k { width: 20mm; white-space: nowrap; font-weight: 700; }
        .details .v { white-space: nowrap; }
        .details .v-wrap { white-space: normal; }

        .badge { display: inline-block; padding: 2px 10px; font-size: 10px; border-radius: 12px; border: 1px solid #e5e7eb; margin-left: 6px; vertical-align: middle; line-height: 1.4; }
        .badge-confirmed { background: #d1fae5; color: #065f46; border-color: #a7f3d0; }
        .badge-pending { background: #fef3c7; color: #92400e; border-color: #fde68a; }
        .badge-cancelled { background: #fee2e2; color: #991b1b; border-color: #fecaca; }

        .travelers { width: 100%; border-collapse: collapse; margin-top: 4mm; }
        .travelers th { text-align: left; font-size: 10px; text-transform: uppercase; color: #6b7280; background: #f9fafb; border-bottom: 1px solid #e5e7eb; padding: 10px 12px; }
        .travelers td { border-bottom: 1px solid #e5e7eb; padding: 12px; vertical-align: top; }
        .right { text-align: right; }

        .totals { width: 100%; border-collapse: collapse; margin-top: 6mm; }
        .totals td { padding: 7px 12px; }
        .totals .label { color: #374151; }
        .totals .value { text-align: right; }
        .totals .grand { font-weight: 700; color: #059669; border-top: 2px solid #059669; padding-top: 12px; }

        .footer { margin-top: 8mm; padding-top: 6mm; border-top: 1px solid #e5e7eb; font-size: 10px; color: #6b7280; text-align: center; }
    </style>
</head>
<body>
<table class="header">
    <tr>
        <td class="brand">
            <h1><?php echo htmlspecialchars($companyName, ENT_QUOTES, 'UTF-8'); ?></h1>
            <p><?php esc_html_e('Travel Voucher', 'yatra'); ?></p>
        </td>
    </tr>
</table>

<div class="voucher-number">
    <div class="number"><?php esc_html_e('Voucher #', 'yatra'); ?><?php echo htmlspecialchars($bookingRef, ENT_QUOTES, 'UTF-8'); ?></div>
</div>

<div class="content">
    <table class="panel">
        <tr>
            <td style="width: 40%;">
                <h3><?php esc_html_e('Traveler Information', 'yatra'); ?></h3>
                <div><strong><?php echo htmlspecialchars($customerName, ENT_QUOTES, 'UTF-8'); ?></strong></div>
                <div class="muted"><?php echo htmlspecialchars($customerEmail, ENT_QUOTES, 'UTF-8'); ?></div>
                <div class="muted"><?php esc_html_e('Travelers:', 'yatra'); ?> <?php echo (int) $traveler_count; ?></div>
            </td>
            <td style="width: 30%;">
                <h3><?php esc_html_e('Booking Details', 'yatra'); ?></h3>
                <table class="details">
                    <tr>
                        <td class="k"><?php esc_html_e('Booking #:', 'yatra'); ?></td>
                        <td class="v-wrap"><?php echo htmlspecialchars($bookingRef, ENT_QUOTES, 'UTF-8'); ?></td>
                    </tr>
                    <tr>
                        <td class="k"><?php esc_html_e('Date:', 'yatra'); ?></td>
                        <td class="v"><?php echo htmlspecialchars($bookingDate, ENT_QUOTES, 'UTF-8'); ?></td>
                    </tr>
                    <tr>
                        <td class="k"><?php esc_html_e('Status:', 'yatra'); ?></td>
                        <td class="v"><span class="badge badge-<?php echo htmlspecialchars($statusClass, ENT_QUOTES, 'UTF-8'); ?>"><?php echo htmlspecialchars($bookingStatus, ENT_QUOTES, 'UTF-8'); ?></span></td>
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

    <div class="trip-info">
        <h4><?php echo htmlspecialchars($tripTitle, ENT_QUOTES, 'UTF-8'); ?></h4>
        <table class="details">
            <tr>
                <td class="k"><?php esc_html_e('Duration:', 'yatra'); ?></td>
                <td class="v"><?php echo htmlspecialchars($tripDuration, ENT_QUOTES, 'UTF-8'); ?></td>
            </tr>
            <?php if ($tripDifficulty !== ''): ?>
            <tr>
                <td class="k"><?php esc_html_e('Difficulty:', 'yatra'); ?></td>
                <td class="v"><?php echo htmlspecialchars($tripDifficulty, ENT_QUOTES, 'UTF-8'); ?></td>
            </tr>
            <?php endif; ?>
            <?php if ($departureLocation !== ''): ?>
            <tr>
                <td class="k"><?php esc_html_e('Departure:', 'yatra'); ?></td>
                <td class="v"><?php echo htmlspecialchars($departureLocation, ENT_QUOTES, 'UTF-8'); ?></td>
            </tr>
            <?php endif; ?>
            <?php if ($destination !== ''): ?>
            <tr>
                <td class="k"><?php esc_html_e('Destination:', 'yatra'); ?></td>
                <td class="v"><?php echo htmlspecialchars($destination, ENT_QUOTES, 'UTF-8'); ?></td>
            </tr>
            <?php endif; ?>
            <tr>
                <td class="k"><?php esc_html_e('Travel Date:', 'yatra'); ?></td>
                <td class="v"><?php echo htmlspecialchars($travelDate, ENT_QUOTES, 'UTF-8'); ?></td>
            </tr>
            <?php if ($returnDate !== ''): ?>
            <tr>
                <td class="k"><?php esc_html_e('Return Date:', 'yatra'); ?></td>
                <td class="v"><?php echo htmlspecialchars($returnDate, ENT_QUOTES, 'UTF-8'); ?></td>
            </tr>
            <?php endif; ?>
        </table>
    </div>

    <table class="totals">
        <tr>
            <td class="label"><?php esc_html_e('Total Amount', 'yatra'); ?></td>
            <td class="value"><?php echo $currencySymbol . htmlspecialchars($totalAmount, ENT_QUOTES, 'UTF-8'); ?></td>
        </tr>
        <tr>
            <td class="label"><?php esc_html_e('Amount Paid', 'yatra'); ?></td>
            <td class="value"><?php echo $currencySymbol . htmlspecialchars($amountPaid, ENT_QUOTES, 'UTF-8'); ?></td>
        </tr>
        <tr>
            <td class="label"><?php esc_html_e('Balance Due', 'yatra'); ?></td>
            <td class="value"><?php echo $currencySymbol . htmlspecialchars($amountDue, ENT_QUOTES, 'UTF-8'); ?></td>
        </tr>
    </table>
</div>

<div class="footer">
    <p><?php esc_html_e('This voucher confirms your booking and should be presented at check-in. Please keep it safe for your travel records.', 'yatra'); ?></p>
    <p><?php esc_html_e('For questions or changes, contact us at', 'yatra'); ?> <?php echo htmlspecialchars($companyEmail, ENT_QUOTES, 'UTF-8'); ?> <?php esc_html_e('or call', 'yatra'); ?> <?php echo htmlspecialchars($companyPhone, ENT_QUOTES, 'UTF-8'); ?></p>
</div>
</body>
</html>
