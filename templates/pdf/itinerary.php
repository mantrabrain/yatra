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
$tripDescription = (string) ($trip_description ?? '');
$tripDuration = (string) ($trip_duration ?? '');
$tripDifficulty = (string) ($trip_difficulty ?? '');
$tripHighlights = (string) ($trip_highlights ?? '');
$tripIncludes = (string) ($trip_includes ?? '');
$tripExcludes = (string) ($trip_excludes ?? '');

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
    <title>Travel Itinerary - <?php echo htmlspecialchars($bookingRef, ENT_QUOTES, 'UTF-8'); ?></title>
    <style>
        @page { size: A4 portrait; margin: 0mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { margin: 0; padding: 0; font-family: "DejaVu Sans", sans-serif; font-size: 12px; color: #111; }
        .content { padding: 12mm 12mm 14mm 12mm; }

        .page-break { page-break-before: always; }
        .avoid-break { page-break-inside: avoid; }

        .header { width: 100%; border-collapse: collapse; }
        .header td { vertical-align: top; }
        .brand { background: #1e40af; color: #fff; padding: 6mm 6mm; }
        .brand h1 { font-size: 18px; font-weight: 700; margin: 0; }
        .brand p { font-size: 11px; margin-top: 4px; }

        .itinerary-number { background: #f3f4f6; padding: 4mm 6mm; border-bottom: 2px solid #1e40af; margin-top: 2mm; }
        .itinerary-number h2 { font-size: 16px; font-weight: 700; color: #1e40af; margin: 0; }
        .itinerary-number .ref { font-size: 13px; color: #6b7280; margin-top: 2px; }

        .section { margin-top: 6mm; page-break-inside: avoid; }
        .section-title { font-size: 14px; font-weight: 700; color: #374151; margin-bottom: 3mm; padding-bottom: 2mm; border-bottom: 1px solid #e5e7eb; }

        .panel { width: 100%; border: 1px solid #e5e7eb; border-collapse: collapse; margin-top: 6mm; margin-bottom: 6mm; }
        .panel td { padding: 5mm 5mm; vertical-align: top; }
        .panel h3 { font-size: 11px; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; letter-spacing: 0.5px; }
        .muted { color: #6b7280; }

        .trip-details { width: 100%; border-collapse: collapse; margin-bottom: 6mm; }
        .trip-details th { background: #f9fafb; font-weight: 600; text-align: left; padding: 3mm 4mm; border: 1px solid #e5e7eb; }
        .trip-details td { padding: 3mm 4mm; border: 1px solid #e5e7eb; }
        .trip-details .label { font-weight: 600; color: #6b7280; width: 30%; }

        .timeline { margin: 4mm 0; }
        .timeline-item { position: relative; padding-left: 8mm; margin-bottom: 6mm; page-break-inside: avoid; }
        .timeline-item:before { content: ''; position: absolute; left: 0; top: 6px; width: 8px; height: 8px; background: #1e40af; border-radius: 50%; }
        .timeline-item:after { content: ''; position: absolute; left: 3px; top: 14px; width: 2px; height: calc(100% - 8px); background: #e5e7eb; }
        .timeline-item:last-child:after { display: none; }
        .timeline-date { font-weight: 600; color: #1e40af; margin-bottom: 1mm; }
        .timeline-title { font-weight: 600; margin-bottom: 1mm; }
        .timeline-desc { color: #6b7280; line-height: 1.4; }

        .status { display: inline-block; padding: 1mm 3mm; border-radius: 2mm; font-size: 10px; font-weight: 600; text-transform: uppercase; }
        .status.confirmed { background: #d1fae5; color: #065f46; }
        .status.pending { background: #fef3c7; color: #92400e; }
        .status.cancelled { background: #fee2e2; color: #991b1b; }

        .footer { margin-top: 8mm; padding-top: 4mm; border-top: 1px solid #e5e7eb; font-size: 10px; color: #6b7280; }
        .footer td { vertical-align: top; }

        .trip-description { background: #f8fafc; padding: 4mm; border-left: 4px solid #1e40af; margin-bottom: 6mm; page-break-inside: avoid; }
        .trip-description h3 { color: #1e40af; margin-bottom: 2mm; font-size: 14px; }
        .trip-description p { line-height: 1.5; margin-bottom: 2mm; }

        .itinerary-highlights { margin: 4mm 0; }
        .highlight-item { padding: 2mm 0; border-bottom: 1px dashed #e5e7eb; }
        .highlight-item:last-child { border-bottom: none; }
        .highlight-title { font-weight: 600; color: #374151; }
        .highlight-desc { color: #6b7280; font-size: 11px; margin-top: 1mm; }
    </style>
</head>
<body>
    <div class="content">
        <!-- Header -->
        <table class="header">
            <tr>
                <td style="width: 60%;">
                    <div class="brand">
                        <h1><?php echo htmlspecialchars($companyName ?: 'Travel Company', ENT_QUOTES, 'UTF-8'); ?></h1>
                        <p><?php esc_html_e('Travel Itinerary Document', 'yatra'); ?></p>
                    </div>
                </td>
                <td style="width: 40%;">
                    <div class="brand" style="background: #374151; text-align: right;">
                        <p style="font-size: 10px; margin-bottom: 2px;"><?php esc_html_e('Booking Reference', 'yatra'); ?></p>
                        <p style="font-size: 14px; font-weight: 700;"><?php echo htmlspecialchars($bookingRef ?: 'N/A', ENT_QUOTES, 'UTF-8'); ?></p>
                    </div>
                </td>
            </tr>
        </table>

        <div class="itinerary-number">
            <h2><?php esc_html_e('Travel Itinerary', 'yatra'); ?></h2>
            <div class="ref"><?php esc_html_e('Issued:', 'yatra'); ?> <?php echo htmlspecialchars($bookingDate, ENT_QUOTES, 'UTF-8'); ?></div>
        </div>

        <!-- Trip Description -->
        <?php if (!empty($tripDescription)): ?>
        <div class="section">
            <div class="section-title"><?php esc_html_e('About This Trip', 'yatra'); ?></div>
            <div class="trip-description">
                <h3><?php echo htmlspecialchars($tripTitle, ENT_QUOTES, 'UTF-8'); ?></h3>
                <p><?php echo nl2br(htmlspecialchars($tripDescription, ENT_QUOTES, 'UTF-8')); ?></p>
            </div>
        </div>
        <?php endif; ?>

        <!-- Trip Details -->
        <div class="section">
            <div class="section-title"><?php esc_html_e('Trip Information', 'yatra'); ?></div>
            <table class="panel">
                <tr>
                    <td style="width: 50%;">
                        <h3><?php esc_html_e('Trip Details', 'yatra'); ?></h3>
                        <table class="trip-details">
                            <tr>
                                <th class="label"><?php esc_html_e('Trip Name', 'yatra'); ?></th>
                                <td><?php echo htmlspecialchars($tripTitle, ENT_QUOTES, 'UTF-8'); ?></td>
                            </tr>
                            <tr>
                                <th class="label"><?php esc_html_e('Duration', 'yatra'); ?></th>
                                <td><?php echo htmlspecialchars($tripDuration ?: 'N/A', ENT_QUOTES, 'UTF-8'); ?></td>
                            </tr>
                            <tr>
                                <th class="label"><?php esc_html_e('Difficulty Level', 'yatra'); ?></th>
                                <td><?php echo htmlspecialchars($tripDifficulty ?: 'N/A', ENT_QUOTES, 'UTF-8'); ?></td>
                            </tr>
                            <tr>
                                <th class="label"><?php esc_html_e('Number of Travelers', 'yatra'); ?></th>
                                <td><?php echo $travelerCount; ?></td>
                            </tr>
                        </table>
                    </td>
                    <td style="width: 50%;">
                        <h3><?php esc_html_e('Travel Information', 'yatra'); ?></h3>
                        <table class="trip-details">
                            <tr>
                                <th class="label"><?php esc_html_e('Departure Location', 'yatra'); ?></th>
                                <td><?php echo htmlspecialchars($departureLocation ?: 'N/A', ENT_QUOTES, 'UTF-8'); ?></td>
                            </tr>
                            <tr>
                                <th class="label"><?php esc_html_e('Destination', 'yatra'); ?></th>
                                <td><?php echo htmlspecialchars($destination ?: 'N/A', ENT_QUOTES, 'UTF-8'); ?></td>
                            </tr>
                            <tr>
                                <th class="label"><?php esc_html_e('Travel Date', 'yatra'); ?></th>
                                <td><?php echo htmlspecialchars($travelDate ?: 'N/A', ENT_QUOTES, 'UTF-8'); ?></td>
                            </tr>
                            <?php if (!empty($returnDate)): ?>
                            <tr>
                                <th class="label"><?php esc_html_e('Return Date', 'yatra'); ?></th>
                                <td><?php echo htmlspecialchars($returnDate, ENT_QUOTES, 'UTF-8'); ?></td>
                            </tr>
                            <?php endif; ?>
                            <tr>
                                <th class="label"><?php esc_html_e('Booking Status', 'yatra'); ?></th>
                                <td><span class="status <?php echo $statusClass; ?>"><?php echo htmlspecialchars($bookingStatus, ENT_QUOTES, 'UTF-8'); ?></span></td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Customer Information -->
        <div class="section">
            <div class="section-title"><?php esc_html_e('Traveler Information', 'yatra'); ?></div>
            <table class="panel">
                <tr>
                    <td style="width: 50%;">
                        <h3><?php esc_html_e('Primary Traveler', 'yatra'); ?></h3>
                        <table class="trip-details">
                            <tr>
                                <th class="label"><?php esc_html_e('Name', 'yatra'); ?></th>
                                <td><?php echo htmlspecialchars($customerName, ENT_QUOTES, 'UTF-8'); ?></td>
                            </tr>
                            <tr>
                                <th class="label"><?php esc_html_e('Email', 'yatra'); ?></th>
                                <td><?php echo htmlspecialchars($customerEmail, ENT_QUOTES, 'UTF-8'); ?></td>
                            </tr>
                        </table>
                    </td>
                    <td style="width: 50%;">
                        <h3><?php esc_html_e('Booking Information', 'yatra'); ?></h3>
                        <table class="trip-details">
                            <tr>
                                <th class="label"><?php esc_html_e('Booking Reference', 'yatra'); ?></th>
                                <td><?php echo htmlspecialchars($bookingRef, ENT_QUOTES, 'UTF-8'); ?></td>
                            </tr>
                            <tr>
                                <th class="label"><?php esc_html_e('Booking Date', 'yatra'); ?></th>
                                <td><?php echo htmlspecialchars($bookingDate, ENT_QUOTES, 'UTF-8'); ?></td>
                            </tr>
                            <tr>
                                <th class="label"><?php esc_html_e('Status', 'yatra'); ?></th>
                                <td><span class="status <?php echo $statusClass; ?>"><?php echo htmlspecialchars($bookingStatus, ENT_QUOTES, 'UTF-8'); ?></span></td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>

        <!-- Trip Highlights -->
        <?php if (!empty($tripHighlights)): ?>
        <div class="section">
            <div class="section-title"><?php esc_html_e('Trip Highlights', 'yatra'); ?></div>
            <div class="itinerary-highlights">
                <?php 
                $highlights = is_array($tripHighlights) ? $tripHighlights : explode("\n", $tripHighlights);
                foreach ($highlights as $highlight):
                    $highlight = trim($highlight);
                    if (!empty($highlight)):
                ?>
                <div class="highlight-item">
                    <div class="highlight-title">• <?php echo htmlspecialchars($highlight, ENT_QUOTES, 'UTF-8'); ?></div>
                </div>
                <?php 
                    endif;
                endforeach;
                ?>
            </div>
        </div>
        <?php endif; ?>

        <!-- Travel Timeline -->
        <div class="section">
            <div class="section-title"><?php esc_html_e('Travel Timeline', 'yatra'); ?></div>
            <div class="timeline">
                <div class="timeline-item">
                    <div class="timeline-date"><?php echo htmlspecialchars($travelDate ?: 'TBD', ENT_QUOTES, 'UTF-8'); ?></div>
                    <div class="timeline-title"><?php esc_html_e('Departure', 'yatra'); ?></div>
                    <div class="timeline-desc"><?php echo esc_html(sprintf(__('Departure from %s. Please arrive at least 30 minutes before departure time.', 'yatra'), htmlspecialchars($departureLocation ?: __('meeting point', 'yatra'), ENT_QUOTES, 'UTF-8'))); ?></div>
                </div>
                
                <div class="timeline-item">
                    <div class="timeline-date"><?php echo htmlspecialchars($travelDate ?: 'TBD', ENT_QUOTES, 'UTF-8'); ?></div>
                    <div class="timeline-title"><?php esc_html_e('Arrival at Destination', 'yatra'); ?></div>
                    <div class="timeline-desc"><?php echo esc_html(sprintf(__('Arrival at %s. Check-in and accommodation briefing.', 'yatra'), htmlspecialchars($destination ?: __('destination', 'yatra'), ENT_QUOTES, 'UTF-8'))); ?></div>
                </div>

                <?php if (!empty($tripDuration)): ?>
                <?php 
                $days = (int) preg_replace('/\D/', '', $tripDuration);
                for ($i = 2; $i <= $days; $i++): 
                ?>
                <div class="timeline-item">
                    <div class="timeline-date"><?php esc_html_e('Day', 'yatra'); ?> <?php echo $i; ?></div>
                    <div class="timeline-title"><?php esc_html_e('Activities & Sightseeing', 'yatra'); ?></div>
                    <div class="timeline-desc"><?php echo esc_html(sprintf(__('Full day of planned activities and sightseeing at %s. Detailed itinerary will be provided by your tour guide.', 'yatra'), htmlspecialchars($destination, ENT_QUOTES, 'UTF-8'))); ?></div>
                </div>
                <?php endfor; ?>
                <?php endif; ?>

                <?php if (!empty($returnDate)): ?>
                <div class="timeline-item">
                    <div class="timeline-date"><?php echo htmlspecialchars($returnDate, ENT_QUOTES, 'UTF-8'); ?></div>
                    <div class="timeline-title"><?php esc_html_e('Return Journey', 'yatra'); ?></div>
                    <div class="timeline-desc"><?php echo esc_html(sprintf(__('Departure from %s and return to %s.', 'yatra'), htmlspecialchars($destination, ENT_QUOTES, 'UTF-8'), htmlspecialchars($departureLocation ?: __('origin', 'yatra'), ENT_QUOTES, 'UTF-8'))); ?></div>
                </div>
                <?php endif; ?>
            </div>
        </div>

        <!-- Important Information -->
        <div class="section">
            <div class="section-title"><?php esc_html_e('Important Information', 'yatra'); ?></div>
            <table class="trip-details">
                <tr>
                    <th class="label"><?php esc_html_e('What to Bring', 'yatra'); ?></th>
                    <td>Comfortable clothing, walking shoes, sunscreen, hat, camera, personal medications, and any required travel documents.</td>
                </tr>
                <tr>
                    <th class="label"><?php esc_html_e('Weather Conditions', 'yatra'); ?></th>
                    <td>Please check weather forecast before departure and pack accordingly. Weather conditions may vary by destination.</td>
                </tr>
                <tr>
                    <th class="label"><?php esc_html_e('Emergency Contact', 'yatra'); ?></th>
                    <td><?php echo htmlspecialchars($companyPhone ?: 'Contact your travel agent', ENT_QUOTES, 'UTF-8'); ?></td>
                </tr>
            </table>
        </div>

        <!-- What's Included -->
        <?php if (!empty($tripIncludes)): ?>
        <div class="section avoid-break">
            <div class="section-title"><?php esc_html_e('What\'s Included', 'yatra'); ?></div>
            <div class="trip-description">
                <?php 
                $includes = is_array($tripIncludes) ? $tripIncludes : explode("\n", $tripIncludes);
                foreach ($includes as $include):
                    $include = trim($include);
                    if (!empty($include)):
                ?>
                <p>• <?php echo htmlspecialchars($include, ENT_QUOTES, 'UTF-8'); ?></p>
                <?php 
                    endif;
                endforeach;
                ?>
            </div>
        </div>
        <?php endif; ?>

        <!-- What's Not Included -->
        <?php if (!empty($tripExcludes)): ?>
        <div class="section avoid-break">
            <div class="section-title"><?php esc_html_e('What\'s Not Included', 'yatra'); ?></div>
            <div class="trip-description">
                <?php 
                $excludes = is_array($tripExcludes) ? $tripExcludes : explode("\n", $tripExcludes);
                foreach ($excludes as $exclude):
                    $exclude = trim($exclude);
                    if (!empty($exclude)):
                ?>
                <p>• <?php echo htmlspecialchars($exclude, ENT_QUOTES, 'UTF-8'); ?></p>
                <?php 
                    endif;
                endforeach;
                ?>
            </div>
        </div>
        <?php endif; ?>

        <!-- Footer -->
        <table class="footer">
            <tr>
                <td style="width: 60%;">
                    <p><strong><?php echo htmlspecialchars($companyName ?: 'Travel Company', ENT_QUOTES, 'UTF-8'); ?></strong></p>
                    <p><?php echo htmlspecialchars($companyAddress, ENT_QUOTES, 'UTF-8'); ?></p>
                    <p>Email: <?php echo htmlspecialchars($companyEmail, ENT_QUOTES, 'UTF-8'); ?> | Phone: <?php echo htmlspecialchars($companyPhone, ENT_QUOTES, 'UTF-8'); ?></p>
                </td>
                <td style="width: 40%; text-align: right;">
                    <p>This is a computer-generated document.</p>
                    <p>No signature required.</p>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
