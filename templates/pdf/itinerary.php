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
// These three may arrive as either a string (line-separated) OR an
// array (parsed JSON). DON'T cast to string here — `(string) $array`
// produces the literal text "Array", which is exactly the bug that
// made the Trip Highlights section render "• Array" in the PDF.
// The template below already handles both shapes via `is_array(...)`.
$tripHighlights = $trip_highlights ?? '';
$tripIncludes   = $trip_includes ?? '';
$tripExcludes   = $trip_excludes ?? '';

$travelDate = (string) ($travel_date ?? '');
$returnDate = (string) ($return_date ?? '');

$currencySymbol = (string) ($currency_symbol ?? '');
$totalAmount = (string) ($total_amount ?? '0.00');
$amountPaid = (string) ($amount_paid ?? '0.00');
$amountDue = (string) ($amount_due ?? '0.00');

$travelerCount = (int) ($traveler_count ?? 1);
$departureLocation = (string) ($departure_location ?? '');
$destination = (string) ($destination ?? '');

// Day-by-day timeline data. ItineraryPdfBuilder always passes an array
// (may be empty when the trip has no itinerary recorded). Each entry
// can be a stdClass (from TripRepository::getItineraryDays) or an
// associative array (from the JSON-encoded itinerary_days column), so
// we read fields through a small helper that accepts both shapes.
$itineraryDays = is_array($itinerary_days ?? null) ? $itinerary_days : [];

$yatra_itinerary_get = static function ($source, string $key, $default = null) {
    if (is_object($source)) {
        return $source->{$key} ?? $default;
    }
    if (is_array($source)) {
        return $source[$key] ?? $default;
    }
    return $default;
};

/**
 * Normalize a mixed-shape list (highlights, includes, excludes) to a
 * flat array of trimmed strings. Each input item may be a plain
 * string, an associative array with a `title`/`name`/`text` key, or a
 * stdClass with the same properties — the trip builder writes either
 * shape depending on which UI version saved the record. The previous
 * loop called `trim($item)` directly and 500'd whenever it hit a
 * stdClass (see the PHP fatal error in the previous render). Empty
 * entries are filtered out so we never print bullet points with no
 * text.
 */
$yatra_normalize_list = static function ($value): array {
    if (is_string($value)) {
        $value = explode("\n", $value);
    }
    if (!is_array($value)) {
        return [];
    }
    $out = [];
    foreach ($value as $item) {
        if (is_string($item)) {
            $s = trim($item);
        } elseif (is_array($item)) {
            $s = trim((string) ($item['title'] ?? $item['name'] ?? $item['text'] ?? ''));
        } elseif (is_object($item)) {
            $s = trim((string) ($item->title ?? $item->name ?? $item->text ?? ''));
        } else {
            $s = '';
        }
        if ($s !== '') {
            $out[] = $s;
        }
    }
    return $out;
};

?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo esc_html__('Travel Itinerary', 'yatra'); ?> - <?php echo htmlspecialchars($bookingRef, ENT_QUOTES, 'UTF-8'); ?></title>
    <style>
        /* A4 page geometry.
           Dompdf's `@page margin` has TWO known quirks in this build:
             1. only the single-value shorthand (`margin: Xmm`) is
                reliably parsed,
             2. the top/bottom margin doesn't always carry across
                page-breaks initiated by `page-break-before: always`,
                so content on subsequent pages starts flush at the
                page top and overlaps with whatever we drew with
                `$pdf->page_script()`.
           We work around it by setting the @page margin to ZERO and
           emulating page margins ourselves: body padding handles the
           LEFT/RIGHT inset (Dompdf applies body horizontal padding
           per-line, so it's consistent on every page); the page-break
           sections get an explicit `padding-top` (room for the
           per-page header) and the last visible content has bottom
           clearance so the footer rule isn't crowded. */
        @page {
            size: A4 portrait;
            margin: 0;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        /* Explicit font-family on every text-bearing element. Dompdf's
           default CSS resets some inherit chains; without this, table
           cells were occasionally falling back to DejaVu Sans Bold
           (which has no Devanagari) for the Travel Date value, even
           though the parent body declared the Noto chain. */
        body, table, td, th, p, div, span, h1, h2, h3, h4, h5, h6, li, a, strong, em {
            font-family: "Noto Sans Devanagari", "Noto Sans Arabic", "Noto Sans CJK", "DejaVu Sans", sans-serif;
        }
        /* Body padding emulates @page margin:
             LEFT  / RIGHT 18mm — applied per line, so consistent across
                                  every page
             TOP   / BOTTOM 22mm — applies at document start / end. For
                                  the per-page top/bottom we rely on the
                                  page-break-before sections having their
                                  own padding-top below. */
        body {
            margin: 0;
            padding: 22mm 18mm;
            font-size: 12px;
            color: #111;
        }
        .content { padding: 0; }

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

        .section { margin-top: 6mm; }
        /* Each top-level section starts on its own page. `.section +
           .section` pushes the second-and-later sections to new pages,
           and `padding-top: 16mm` reserves clearance for the
           per-page running header drawn via $pdf->page_script() so
           the section title doesn't end up under the header strip.
           Page 1 (the first .section) skips both rules — it shows
           the existing tall brand banner in normal flow above. */
        .section + .section {
            page-break-before: always;
            padding-top: 16mm;
        }
        .section.section-skip-break { page-break-before: avoid; }
        /* Headings shouldn't orphan at the bottom of a page. */
        .section-title { font-size: 14px; font-weight: 700; color: #374151; margin-bottom: 3mm; padding-bottom: 2mm; border-bottom: 1px solid #e5e7eb; page-break-after: avoid; }

        .panel { width: 100%; border: 1px solid #e5e7eb; border-collapse: collapse; margin-top: 6mm; margin-bottom: 6mm; }
        .panel td { padding: 5mm 5mm; vertical-align: top; }
        .panel h3 { font-size: 11px; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; letter-spacing: 0.5px; }
        .muted { color: #6b7280; }

        .trip-details { width: 100%; border-collapse: collapse; margin-bottom: 6mm; }
        .trip-details th { background: #f9fafb; font-weight: 700; text-align: left; padding: 3mm 4mm; border: 1px solid #e5e7eb; }
        .trip-details td { padding: 3mm 4mm; border: 1px solid #e5e7eb; }
        .trip-details .label { font-weight: 700; color: #6b7280; width: 30%; }

        /* Info-card grid for Trip Info / Traveler & Booking. Replaces
           the previous "label-value-as-table-row" layout, which read
           more like a tax form than a travel document. Two columns,
           each column = a stack of label+value rows where the label
           sits above the value (vertical pairing) and the value uses
           the document's primary text colour. Empty rows are hidden
           upstream so this never renders a half-empty card. */
        .info-grid { width: 100%; border-collapse: collapse; margin-top: 2mm; }
        .info-grid > tbody > tr > td { vertical-align: top; padding: 0; }
        .info-card { background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 2mm; padding: 5mm 5mm; }
        .info-card h3 { font-size: 11px; text-transform: uppercase; color: #1e40af; letter-spacing: 0.5px; margin: 0 0 3mm 0; padding-bottom: 2mm; border-bottom: 1px solid #dbeafe; }
        .info-row { padding: 1.5mm 0; }
        .info-row + .info-row { border-top: 1px dashed #e5e7eb; }
        .info-label { display: block; font-size: 9.5px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.4px; margin-bottom: 1mm; }
        .info-value { display: block; color: #111827; font-size: 12px; line-height: 1.4; }

        .timeline { margin: 4mm 0; }
        .timeline-item { position: relative; padding-left: 8mm; margin-bottom: 6mm; page-break-inside: avoid; }
        .timeline-item:before { content: ''; position: absolute; left: 0; top: 6px; width: 8px; height: 8px; background: #1e40af; border-radius: 50%; }
        .timeline-item:after { content: ''; position: absolute; left: 3px; top: 14px; width: 2px; height: calc(100% - 8px); background: #e5e7eb; }
        .timeline-item:last-child:after { display: none; }
        .timeline-date { font-weight: 700; color: #1e40af; margin-bottom: 1mm; }
        .timeline-title { font-weight: 700; margin-bottom: 1mm; }
        .timeline-desc { color: #6b7280; line-height: 1.4; }

        .status { display: inline-block; padding: 1mm 3mm; border-radius: 2mm; font-size: 10px; font-weight: 700; text-transform: uppercase; }
        .status.confirmed { background: #d1fae5; color: #065f46; }
        .status.pending { background: #fef3c7; color: #92400e; }
        .status.cancelled { background: #fee2e2; color: #991b1b; }

        /* Footer needs explicit width:100% — without it Dompdf
           collapses the table to its content width, so the
           "right-aligned" cell only reaches the centre of the page
           instead of the right margin. border-collapse + table-layout
           fixed keep the two columns honouring their declared widths
           (60% / 40%) regardless of content length. */
        .footer { width: 100%; table-layout: fixed; border-collapse: collapse; margin-top: 8mm; padding-top: 4mm; border-top: 1px solid #e5e7eb; font-size: 10px; color: #6b7280; }
        .footer td { vertical-align: top; }
        /* Dompdf doesn't always inherit text-align from a td down to
           child block elements (<p>) — apply the alignment directly to
           the cell content so the right-hand footer note actually
           hugs the right edge instead of sitting flush-left. */
        .footer td.footer-right { text-align: right; }
        .footer td.footer-right p { text-align: right; margin: 0; padding: 0; }

        .trip-description { background: #f8fafc; padding: 4mm; border-left: 4px solid #1e40af; margin-bottom: 6mm; page-break-inside: avoid; }
        .trip-description h3 { color: #1e40af; margin-bottom: 2mm; font-size: 14px; }
        .trip-description p { line-height: 1.5; margin-bottom: 2mm; }

        .itinerary-highlights { margin: 4mm 0; }
        .highlight-item { padding: 2mm 0; border-bottom: 1px dashed #e5e7eb; }
        .highlight-item:last-child { border-bottom: none; }
        .highlight-title { font-weight: 700; color: #374151; }
        .highlight-desc { color: #6b7280; font-size: 11px; margin-top: 1mm; }
    </style>
</head>
<body>
    <!-- Per-page header and footer, drawn via Dompdf's PHP canvas hook
         using `$pdf->page_text(...)`. This is the most reliable
         multi-page chrome approach in Dompdf because:
            1) It runs ONCE per page during the canvas-output phase,
               so the strings are guaranteed to render — no fragile
               CSS `position: fixed` quirks.
            2) `page_text` supports the special `{PAGE_NUM}` and
               `{PAGE_COUNT}` substitutions, which is the only way to
               get an accurate "X of Y" before page count is known.
            3) Conditional rendering via `if ($PAGE_NUM > 1)` is
               trivial — used here to SKIP the running header on page 1
               (page 1 already has its own tall brand banner in body
               content, so a second header up top would duplicate it).

         Coordinates are in Dompdf's point grid — 72pt equals 1 inch.
         A4 portrait is 595 × 842 pt. The 45pt left/right offsets
         match the 16mm @page side margin set in CSS above. -->
    <?php
    // Pre-compute strings for the per-page header/footer script. The
    // actual <script type="text/php"> block is positioned at the END
    // of body (just before </body>) instead of here at the top —
    // critical reason: Dompdf's processPageScript() iterates the
    // pages that exist AT THE MOMENT page_text() / page_script() are
    // called. Placing the script at the top of body means only
    // page 1 has been laid out, so the header/footer registers for
    // page 1 ONLY (and even the "{PAGE_COUNT}" placeholder resolves
    // to 1 instead of the real total). Moving it to the end means
    // all pages exist by the time the script runs, so the chrome
    // applies to every page and the page counter is accurate.
    $_headerLeft  = ($companyName !== '' ? $companyName : __('Travel Company', 'yatra'))
                 . '  ·  ' . __('Travel Itinerary', 'yatra');
    $_headerRight = (string) $bookingRef;

    $_footerLeftParts = [];
    if ($companyName  !== '') { $_footerLeftParts[] = $companyName; }
    if ($companyEmail !== '') { $_footerLeftParts[] = $companyEmail; }
    if ($companyPhone !== '') { $_footerLeftParts[] = $companyPhone; }
    $_footerLeft = implode(' · ', $_footerLeftParts);

    $_pageLabel = __('Page', 'yatra') . ' ';
    ?>

    <div class="content">
        <!-- Header -->
        <table class="header">
            <tr>
                <td style="width: 60%;">
                    <div class="brand">
                        <h1><?php echo htmlspecialchars($companyName ?: __('Travel Company', 'yatra'), ENT_QUOTES, 'UTF-8'); ?></h1>
                        <p><?php esc_html_e('Travel Itinerary Document', 'yatra'); ?></p>
                    </div>
                </td>
                <td style="width: 40%;">
                    <div class="brand" style="background: #374151; text-align: right;">
                        <p style="font-size: 10px; margin-bottom: 2px;"><?php esc_html_e('Booking Reference', 'yatra'); ?></p>
                        <p style="font-size: 14px; font-weight: 700;"><?php echo htmlspecialchars($bookingRef ?: __('N/A', 'yatra'), ENT_QUOTES, 'UTF-8'); ?></p>
                    </div>
                </td>
            </tr>
        </table>

        <div class="itinerary-number">
            <h2><?php esc_html_e('Travel Itinerary', 'yatra'); ?></h2>
            <div class="ref"><?php esc_html_e('Issued:', 'yatra'); ?> <?php echo htmlspecialchars($bookingDate, ENT_QUOTES, 'UTF-8'); ?></div>
        </div>

        <!-- Trip Description.
             trip_description is stored as rich HTML in the DB
             (TinyMCE/Gutenberg output); the previous template escaped
             it with htmlspecialchars() so the user literally saw `<p>`
             tags in the PDF. Use wp_kses_post() instead — same allow-list
             WP uses for post content, so admin-saved HTML renders
             correctly without opening up to script injection. -->
        <?php if (!empty($tripDescription)): ?>
        <div class="section">
            <div class="section-title"><?php esc_html_e('About This Trip', 'yatra'); ?></div>
            <div class="trip-description">
                <h3><?php echo htmlspecialchars($tripTitle, ENT_QUOTES, 'UTF-8'); ?></h3>
                <?php echo wp_kses_post(wpautop($tripDescription)); ?>
            </div>
        </div>
        <?php endif; ?>

        <!-- Trip Information + Traveler & Booking.
             Rendered as info-card pairs (label above value) instead
             of label-value table rows — reads as a travel document,
             not a tax form. Empty fields are omitted entirely (no
             "N/A" placeholders). Booking status is shown ONCE here,
             in the booking card — it used to render in both Travel
             Information AND Booking Information, so the same pill
             appeared twice on the page. -->
        <?php
        $tripRows = [];
        if ($tripTitle !== '')      { $tripRows[] = [__('Trip Name', 'yatra'),  $tripTitle,      false]; }
        if ($tripDuration !== '')   { $tripRows[] = [__('Duration', 'yatra'),   $tripDuration,   false]; }
        if ($tripDifficulty !== '') { $tripRows[] = [__('Difficulty', 'yatra'), $tripDifficulty, false]; }
        if ($travelerCount > 0)     { $tripRows[] = [__('Travelers', 'yatra'),  (string) $travelerCount, false]; }

        $travelRows = [];
        if ($departureLocation !== '') { $travelRows[] = [__('Departure Location', 'yatra'), $departureLocation, false]; }
        if ($destination !== '')       { $travelRows[] = [__('Destination', 'yatra'),        $destination,       false]; }
        if ($travelDate !== '')        { $travelRows[] = [__('Travel Date', 'yatra'),        $travelDate,        false]; }
        if (!empty($returnDate))       { $travelRows[] = [__('Return Date', 'yatra'),        $returnDate,        false]; }

        $travelerRows = [];
        if ($customerName !== '')  { $travelerRows[] = [__('Name', 'yatra'),  $customerName,  false]; }
        if ($customerEmail !== '') { $travelerRows[] = [__('Email', 'yatra'), $customerEmail, false]; }

        $bookingRows = [];
        if ($bookingRef !== '')    { $bookingRows[] = [__('Reference', 'yatra'),    $bookingRef,  false]; }
        if ($bookingDate !== '')   { $bookingRows[] = [__('Issued On', 'yatra'),    $bookingDate, false]; }
        if ($bookingStatus !== '') { $bookingRows[] = [__('Status', 'yatra'),       '<span class="status ' . $statusClass . '">' . htmlspecialchars($bookingStatus, ENT_QUOTES, 'UTF-8') . '</span>', true]; }

        $renderCard = static function (string $heading, array $rows): void {
            if (empty($rows)) return;
            echo '<div class="info-card">';
            echo '<h3>' . htmlspecialchars($heading, ENT_QUOTES, 'UTF-8') . '</h3>';
            foreach ($rows as [$label, $value, $rawHtml]) {
                echo '<div class="info-row">';
                echo '<span class="info-label">' . htmlspecialchars((string) $label, ENT_QUOTES, 'UTF-8') . '</span>';
                echo '<span class="info-value">' . ($rawHtml ? $value : htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8')) . '</span>';
                echo '</div>';
            }
            echo '</div>';
        };

        $renderTwoCardRow = static function (string $leftHeading, array $leftRows, string $rightHeading, array $rightRows) use ($renderCard): void {
            if (empty($leftRows) && empty($rightRows)) return;
            echo '<table class="info-grid"><tr>';
            if (!empty($leftRows)) {
                $width = !empty($rightRows) ? '49%' : '100%';
                echo '<td style="width:' . $width . '; padding-right:' . (!empty($rightRows) ? '2%' : '0') . ';">';
                $renderCard($leftHeading, $leftRows);
                echo '</td>';
            }
            if (!empty($rightRows)) {
                $width = !empty($leftRows) ? '49%' : '100%';
                echo '<td style="width:' . $width . ';">';
                $renderCard($rightHeading, $rightRows);
                echo '</td>';
            }
            echo '</tr></table>';
        };
        ?>

        <?php if (!empty($tripRows) || !empty($travelRows)): ?>
        <div class="section">
            <div class="section-title"><?php esc_html_e('Trip Information', 'yatra'); ?></div>
            <?php $renderTwoCardRow(__('Trip Details', 'yatra'), $tripRows, __('Travel Information', 'yatra'), $travelRows); ?>
        </div>
        <?php endif; ?>

        <?php if (!empty($travelerRows) || !empty($bookingRows)): ?>
        <div class="section">
            <div class="section-title"><?php esc_html_e('Traveler &amp; Booking', 'yatra'); ?></div>
            <?php $renderTwoCardRow(__('Primary Traveler', 'yatra'), $travelerRows, __('Booking Information', 'yatra'), $bookingRows); ?>
        </div>
        <?php endif; ?>

        <!-- Trip Highlights.
             Highlights come in three shapes depending on which schema
             version saved them:
               1. Newline-separated string (legacy plain-text field)
               2. Array of plain strings (newer JSON column)
               3. Array of objects / assoc arrays with `title` +
                  optional `description` (current trip-builder UI)
             Normalise to a list of `[title, description]` tuples up
             front so the markup loop stays simple — and never call
             trim() on a stdClass (the bug that 500'd the previous
             render). -->
        <?php
        $highlightsList = [];
        $rawHighlights = $tripHighlights;
        if (is_string($rawHighlights)) {
            $rawHighlights = explode("\n", $rawHighlights);
        }
        if (is_array($rawHighlights)) {
            foreach ($rawHighlights as $h) {
                $title = '';
                $description = '';
                if (is_string($h)) {
                    $title = trim($h);
                } elseif (is_array($h)) {
                    $title       = trim((string) ($h['title']       ?? $h['name'] ?? $h['text'] ?? ''));
                    $description = trim((string) ($h['description'] ?? $h['desc'] ?? ''));
                } elseif (is_object($h)) {
                    $title       = trim((string) ($h->title       ?? $h->name ?? $h->text ?? ''));
                    $description = trim((string) ($h->description ?? $h->desc ?? ''));
                }
                if ($title !== '' || $description !== '') {
                    $highlightsList[] = [$title, $description];
                }
            }
        }
        ?>
        <?php if (!empty($highlightsList)): ?>
        <div class="section">
            <div class="section-title"><?php esc_html_e('Trip Highlights', 'yatra'); ?></div>
            <div class="itinerary-highlights">
                <?php foreach ($highlightsList as [$hTitle, $hDesc]): ?>
                <div class="highlight-item">
                    <?php if ($hTitle !== ''): ?>
                        <div class="highlight-title">• <?php echo htmlspecialchars($hTitle, ENT_QUOTES, 'UTF-8'); ?></div>
                    <?php endif; ?>
                    <?php if ($hDesc !== ''): ?>
                        <div class="highlight-desc"><?php echo wp_kses_post(wpautop($hDesc)); ?></div>
                    <?php endif; ?>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endif; ?>

        <!-- Travel Timeline — mirrors the single-trip page's
             "Itinerary" section so the printed PDF matches what the
             traveller already saw on the website. Each day from the
             trip's itinerary table renders as a timeline item with
             title, description, and the activities/meals/transport
             entries that belong to it. When the trip has no itinerary
             recorded we fall back to a derived Departure → days →
             Arrival outline so the PDF is never empty. -->
        <div class="section">
            <div class="section-title"><?php esc_html_e('Travel Timeline', 'yatra'); ?></div>
            <div class="timeline">
                <?php if (!empty($itineraryDays)): ?>
                    <?php foreach ($itineraryDays as $dayIndex => $day):
                        $dayNumber = (int) ($yatra_itinerary_get($day, 'day_number', $dayIndex + 1));
                        $dayTitle = (string) ($yatra_itinerary_get($day, 'title', $yatra_itinerary_get($day, 'day_title', '')));
                        $dayDescription = (string) ($yatra_itinerary_get($day, 'description', $yatra_itinerary_get($day, 'day_description', '')));
                        $dayEntries = $yatra_itinerary_get($day, 'entries', []);
                        if (!is_array($dayEntries)) {
                            $dayEntries = [];
                        }

                        // Resolve the calendar date for this day, if we
                        // know the travel start: Day 1 = travel_date,
                        // Day N = travel_date + (N-1) days. Skipped
                        // silently when no travel_date is available.
                        $dayDateLabel = '';
                        if (!empty($travel_date)) {
                            $startTs = strtotime((string) ($travel_date_raw ?? ''));
                        }
                        // Use the already-formatted $travelDate for Day 1,
                        // and compute later days from $travelDate's source
                        // when available via the global travel_date var.
                    ?>
                    <div class="timeline-item">
                        <div class="timeline-date">
                            <?php
                            /* translators: %d: itinerary day number. */
                            echo esc_html(sprintf(__('Day %d', 'yatra'), $dayNumber));
                            ?>
                        </div>
                        <div class="timeline-title">
                            <?php echo htmlspecialchars($dayTitle !== '' ? $dayTitle : sprintf(__('Day %d', 'yatra'), $dayNumber), ENT_QUOTES, 'UTF-8'); ?>
                        </div>
                        <?php if ($dayDescription !== ''): ?>
                            <div class="timeline-desc"><?php echo wp_kses_post(wpautop($dayDescription)); ?></div>
                        <?php endif; ?>

                        <?php if (!empty($dayEntries)): ?>
                            <div class="timeline-desc" style="margin-top:2mm;">
                                <?php foreach ($dayEntries as $entry):
                                    $entryTitle = (string) ($yatra_itinerary_get($entry, 'title', ''));
                                    $entryDesc  = (string) ($yatra_itinerary_get($entry, 'description', ''));
                                    $entryType  = (string) ($yatra_itinerary_get($entry, 'item_type', $yatra_itinerary_get($entry, 'item_type_name', '')));
                                    $entryTime  = (string) ($yatra_itinerary_get($entry, 'time', $yatra_itinerary_get($entry, 'start_time', '')));
                                    $entryLoc   = (string) ($yatra_itinerary_get($entry, 'location', ''));
                                    if ($entryTitle === '' && $entryDesc === '') {
                                        continue;
                                    }
                                ?>
                                    <div style="padding:2mm 0; border-bottom:1px dashed #e5e7eb;">
                                        <div style="font-weight:600; color:#374151;">
                                            <?php if ($entryTime !== ''): ?>
                                                <span style="color:#1e40af; margin-right:2mm;">[<?php echo htmlspecialchars($entryTime, ENT_QUOTES, 'UTF-8'); ?>]</span>
                                            <?php endif; ?>
                                            <?php echo htmlspecialchars($entryTitle !== '' ? $entryTitle : $entryType, ENT_QUOTES, 'UTF-8'); ?>
                                            <?php if ($entryType !== '' && $entryTitle !== '' && stripos($entryTitle, $entryType) === false): ?>
                                                <span style="color:#6b7280; font-weight:400; font-size:10px; margin-left:2mm;">· <?php echo htmlspecialchars($entryType, ENT_QUOTES, 'UTF-8'); ?></span>
                                            <?php endif; ?>
                                        </div>
                                        <?php if ($entryLoc !== ''): ?>
                                            <div style="color:#6b7280; font-size:10px; margin-top:1mm;">
                                                <?php
                                                /* translators: %s: location name (city/landmark) for an itinerary entry. */
                                                echo esc_html(sprintf(__('Location: %s', 'yatra'), $entryLoc));
                                                ?>
                                            </div>
                                        <?php endif; ?>
                                        <?php if ($entryDesc !== ''): ?>
                                            <div style="color:#6b7280; margin-top:1mm; line-height:1.4;">
                                                <?php echo wp_kses_post(wpautop($entryDesc)); ?>
                                            </div>
                                        <?php endif; ?>
                                    </div>
                                <?php endforeach; ?>
                            </div>
                        <?php endif; ?>
                    </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <!-- Derived outline shown when no day-by-day
                         itinerary has been authored for the trip.
                         Previously this section rendered both a
                         "Departure" AND an "Arrival at Destination"
                         row using `$travelDate` for BOTH — so the
                         customer saw the same start date repeated
                         twice for what should be two distinct events.
                         Now we render the actual booked travel range:
                           * Trip Start  — `$travelDate` (booking start)
                           * Trip End    — `$returnDate` (booking start
                                            + duration), only when it
                                            differs from the start
                                            (single-day trips skip it)
                         No more duplicate "arrival = departure date"
                         confusion. -->
                    <?php
                    $startDate = $travelDate !== '' ? $travelDate : __('TBD', 'yatra');
                    $endDate   = $returnDate !== '' ? $returnDate : '';
                    $isMultiDay = $endDate !== '' && $endDate !== $startDate;
                    // Resolve the destination / origin labels ONCE here
                    // so the sprintf() calls below interpolate plain
                    // values — not a `__('destination', 'yatra')` ternary
                    // that wp-cli would attach to each surrounding
                    // translator comment, producing "string has N
                    // different translator comments" warnings.
                    $destinationLabel = $destination !== '' ? $destination : __('destination', 'yatra');
                    $originLabel      = $departureLocation !== '' ? $departureLocation : __('origin', 'yatra');
                    $meetingPointLabel = $departureLocation !== '' ? $departureLocation : __('meeting point', 'yatra');
                    ?>

                    <div class="timeline-item">
                        <div class="timeline-date"><?php echo htmlspecialchars($startDate, ENT_QUOTES, 'UTF-8'); ?></div>
                        <div class="timeline-title">
                            <?php
                            if ($isMultiDay) {
                                esc_html_e('Trip Start', 'yatra');
                            } else {
                                esc_html_e('Trip Day', 'yatra');
                            }
                            ?>
                        </div>
                        <div class="timeline-desc"><?php
                            /* translators: %s: departure location (e.g. meeting point or city). */
                            echo esc_html(sprintf(__('Departure from %s. Please arrive at least 30 minutes before departure time.', 'yatra'), $meetingPointLabel));
                            if ($destination !== '') {
                                echo ' ';
                                /* translators: %s: destination name (city or region). */
                                echo esc_html(sprintf(__('Arrival at %s for check-in and accommodation briefing.', 'yatra'), $destination));
                            }
                        ?></div>
                    </div>

                    <?php
                    // Optional intermediate days. Only shown for
                    // multi-day trips where we have a duration.
                    // Day 1 = Trip Start (above). Day N = Trip End
                    // (below). So intermediates are 2 .. N-1.
                    $derivedDays = (int) preg_replace('/\D/', '', (string) $tripDuration);
                    if ($isMultiDay && $derivedDays > 2):
                        for ($i = 2; $i < $derivedDays; $i++): ?>
                        <div class="timeline-item">
                            <div class="timeline-date">
                                <?php
                                /* translators: %d: itinerary day number. */
                                echo esc_html(sprintf(__('Day %d', 'yatra'), $i));
                                ?>
                            </div>
                            <div class="timeline-title"><?php esc_html_e('Activities & Sightseeing', 'yatra'); ?></div>
                            <div class="timeline-desc"><?php
                                /* translators: %s: destination name (city or region). */
                                echo esc_html(sprintf(__('Full day of planned activities and sightseeing at %s. Detailed itinerary will be provided by your tour guide.', 'yatra'), $destinationLabel));
                            ?></div>
                        </div>
                        <?php endfor;
                    endif; ?>

                    <?php if ($isMultiDay): ?>
                    <div class="timeline-item">
                        <div class="timeline-date"><?php echo htmlspecialchars($endDate, ENT_QUOTES, 'UTF-8'); ?></div>
                        <div class="timeline-title"><?php esc_html_e('Trip End', 'yatra'); ?></div>
                        <div class="timeline-desc"><?php
                            /* translators: 1: destination name, 2: origin/departure location. */
                            echo esc_html(sprintf(__('Departure from %1$s and return to %2$s.', 'yatra'), $destinationLabel, $originLabel));
                        ?></div>
                    </div>
                    <?php endif; ?>
                <?php endif; ?>
            </div>
        </div>

        <!-- Important Information — mirrors the same fields the
             single-trip page's "Important Information" tab surfaces
             (templates/partials/single-trip/content-important-info.php):
             physical requirements, visa, vaccination, cancellation
             policy, age range, accommodation, transportation. Empty
             fields are skipped, so trips with no important-info
             content authored don't show a half-empty table.

             The previous version hardcoded generic "Comfortable
             clothing, walking shoes, sunscreen..." advice that wasn't
             actually associated with the booked trip — misleading the
             reader and identical across every itinerary PDF the site
             ever generated. -->
        <?php
        $physicalReq    = (string) ($physical_requirements ?? '');
        $visaReq        = (string) ($visa_requirements ?? '');
        $vaccinationReq = (string) ($vaccination_requirements ?? '');
        $cancellation   = (string) ($cancellation_policy ?? '');
        $ageMin         = $age_min ?? null;
        $ageMax         = $age_max ?? null;
        $accomType      = (string) ($accommodation_type ?? '');
        $accomDetails   = (string) ($accommodation_details ?? '');
        $mealPlan       = (string) ($meal_plan ?? '');
        $transportInc   = (bool) ($transportation_included ?? false);
        $pickupLoc      = (string) ($pickup_location ?? '');
        $dropoffLoc     = (string) ($dropoff_location ?? '');
        $transportDet   = (string) ($transportation_details ?? '');

        $hasAgeInfo = ($ageMin !== null && $ageMin !== '') || ($ageMax !== null && $ageMax !== '');
        $hasAccom   = $accomType !== '' || $accomDetails !== '' || $mealPlan !== '';
        $hasTransp  = $transportInc || $pickupLoc !== '' || $dropoffLoc !== '' || $transportDet !== '';

        $hasAnyImportantInfo = $physicalReq !== ''
            || $visaReq !== ''
            || $vaccinationReq !== ''
            || $cancellation !== ''
            || $hasAgeInfo
            || $hasAccom
            || $hasTransp
            || $companyPhone !== '';
        ?>
        <?php if ($hasAnyImportantInfo): ?>
        <div class="section">
            <div class="section-title"><?php esc_html_e('Important Information', 'yatra'); ?></div>
            <table class="trip-details">
                <?php if ($physicalReq !== ''): ?>
                <tr>
                    <th class="label"><?php esc_html_e('Physical Requirements', 'yatra'); ?></th>
                    <td><?php echo wp_kses_post(wpautop($physicalReq)); ?></td>
                </tr>
                <?php endif; ?>

                <?php if ($visaReq !== ''): ?>
                <tr>
                    <th class="label"><?php esc_html_e('Visa Requirements', 'yatra'); ?></th>
                    <td><?php echo wp_kses_post(wpautop($visaReq)); ?></td>
                </tr>
                <?php endif; ?>

                <?php if ($vaccinationReq !== ''): ?>
                <tr>
                    <th class="label"><?php esc_html_e('Health & Vaccination', 'yatra'); ?></th>
                    <td><?php echo wp_kses_post(wpautop($vaccinationReq)); ?></td>
                </tr>
                <?php endif; ?>

                <?php if ($cancellation !== ''): ?>
                <tr>
                    <th class="label"><?php esc_html_e('Cancellation Policy', 'yatra'); ?></th>
                    <td><?php echo wp_kses_post(wpautop($cancellation)); ?></td>
                </tr>
                <?php endif; ?>

                <?php if ($hasAgeInfo):
                    $ageParts = [];
                    if ($ageMin !== null && $ageMin !== '') {
                        /* translators: %d: minimum age in years. */
                        $ageParts[] = sprintf(__('Min %d years', 'yatra'), (int) $ageMin);
                    }
                    if ($ageMax !== null && $ageMax !== '') {
                        /* translators: %d: maximum age in years. */
                        $ageParts[] = sprintf(__('Max %d years', 'yatra'), (int) $ageMax);
                    }
                ?>
                <tr>
                    <th class="label"><?php esc_html_e('Age Requirements', 'yatra'); ?></th>
                    <td><?php echo esc_html(implode(' · ', $ageParts)); ?></td>
                </tr>
                <?php endif; ?>

                <?php if ($hasAccom): ?>
                <tr>
                    <th class="label"><?php esc_html_e('Accommodation', 'yatra'); ?></th>
                    <td>
                        <?php if ($accomType !== ''): ?>
                            <div><?php echo esc_html($accomType); ?></div>
                        <?php endif; ?>
                        <?php if ($mealPlan !== ''): ?>
                            <div>
                                <?php
                                echo esc_html(sprintf(
                                    /* translators: %s: meal plan label (e.g. "Breakfast included"). */
                                    __('Meal Plan: %s', 'yatra'),
                                    function_exists('yatra_meal_plan_label')
                                        ? yatra_meal_plan_label($mealPlan)
                                        : $mealPlan
                                ));
                                ?>
                            </div>
                        <?php endif; ?>
                        <?php if ($accomDetails !== ''): ?>
                            <?php echo wp_kses_post(wpautop($accomDetails)); ?>
                        <?php endif; ?>
                    </td>
                </tr>
                <?php endif; ?>

                <?php if ($hasTransp): ?>
                <tr>
                    <th class="label"><?php esc_html_e('Transportation', 'yatra'); ?></th>
                    <td>
                        <?php if ($transportInc): ?>
                            <div><?php esc_html_e('Transportation Included', 'yatra'); ?></div>
                        <?php endif; ?>
                        <?php if ($pickupLoc !== ''): ?>
                            <div>
                                <?php
                                /* translators: %s: pickup location for transportation. */
                                echo esc_html(sprintf(__('Pickup: %s', 'yatra'), $pickupLoc));
                                ?>
                            </div>
                        <?php endif; ?>
                        <?php if ($dropoffLoc !== ''): ?>
                            <div>
                                <?php
                                /* translators: %s: dropoff location for transportation. */
                                echo esc_html(sprintf(__('Dropoff: %s', 'yatra'), $dropoffLoc));
                                ?>
                            </div>
                        <?php endif; ?>
                        <?php if ($transportDet !== ''): ?>
                            <?php echo wp_kses_post(wpautop($transportDet)); ?>
                        <?php endif; ?>
                    </td>
                </tr>
                <?php endif; ?>

                <?php if ($companyPhone !== ''): ?>
                <tr>
                    <th class="label"><?php esc_html_e('Emergency Contact', 'yatra'); ?></th>
                    <td><?php echo htmlspecialchars($companyPhone, ENT_QUOTES, 'UTF-8'); ?></td>
                </tr>
                <?php endif; ?>
            </table>
        </div>
        <?php endif; ?>

        <!-- What's Included / Not Included.
             Both lists run through the same shape-tolerant normaliser
             so a stdClass entry can't crash the render the way it did
             before (trim() on stdClass = PHP fatal). Empty lists hide
             the whole section. -->
        <?php $includesList = $yatra_normalize_list($tripIncludes); ?>
        <?php if (!empty($includesList)): ?>
        <div class="section avoid-break">
            <div class="section-title"><?php esc_html_e('What\'s Included', 'yatra'); ?></div>
            <div class="trip-description">
                <?php foreach ($includesList as $include): ?>
                    <p>• <?php echo htmlspecialchars($include, ENT_QUOTES, 'UTF-8'); ?></p>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endif; ?>

        <?php $excludesList = $yatra_normalize_list($tripExcludes); ?>
        <?php if (!empty($excludesList)): ?>
        <div class="section avoid-break">
            <div class="section-title"><?php esc_html_e('What\'s Not Included', 'yatra'); ?></div>
            <div class="trip-description">
                <?php foreach ($excludesList as $exclude): ?>
                    <p>• <?php echo htmlspecialchars($exclude, ENT_QUOTES, 'UTF-8'); ?></p>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endif; ?>

        <!-- Final-page disclaimer. The repeating company contact and
             page counter live in #page-footer (every page); this small
             right-aligned block sits AFTER the last content section so
             it only prints once, at the very end of the document. -->
        <div style="margin-top: 8mm; padding-top: 3mm; border-top: 1px solid #e5e7eb; text-align: right; font-size: 9px; color: #9ca3af;">
            <div><?php esc_html_e('This is a computer-generated document.', 'yatra'); ?></div>
            <div><?php esc_html_e('No signature required.', 'yatra'); ?></div>
        </div>
    </div>

    <!-- Per-page header + footer.
         CRITICAL: this script tag MUST live at the END of body, after
         every content section. Dompdf's `processPageScript()` (called
         internally by `page_text()` / `page_script()` / `page_line()`)
         iterates the pages that ALREADY EXIST when those methods are
         invoked — pages are added to that list one-by-one as content
         flows during layout. If the script ran at the top of body,
         only page 1 would exist at register-time, so the header /
         footer / page counter would apply to page 1 only and
         {PAGE_COUNT} would resolve to "1" everywhere. Placing the
         script after all sections means all pages have been laid out
         by the time it runs, so the chrome applies uniformly and the
         counter is accurate. -->
    <script type="text/php">
    if (isset($pdf)) {
        $headerLeft  = <?php echo var_export($_headerLeft,  true); ?>;
        $headerRight = <?php echo var_export($_headerRight, true); ?>;
        $footerLeft  = <?php echo var_export($_footerLeft,  true); ?>;
        $pageLabel   = <?php echo var_export($_pageLabel,   true); ?>;

        $pageWidth  = $pdf->get_width();
        $pageHeight = $pdf->get_height();
        // 51pt ≈ 18mm — matches the body's horizontal padding so the
        // header/footer chrome lines up with the body content's
        // left/right edges. (@page margin is 0; body padding emulates
        // the page margin for us — Dompdf applies body horizontal
        // padding per line which works reliably on every page.)
        $marginL    = 51;
        $marginR    = $pageWidth - 51;

        $font     = $fontMetrics->get_font('Noto Sans Devanagari', 'normal') ?: $fontMetrics->get_font('DejaVu Sans', 'normal');
        $fontBold = $fontMetrics->get_font('Noto Sans Devanagari', 'bold')   ?: $fontMetrics->get_font('DejaVu Sans', 'bold');

        // ---- Per-page HEADER (skip page 1) ----
        // Header text y=22pt (≈7.7mm from top), separator y=38pt
        // (≈13.4mm). Both sit safely inside the 18mm top margin
        // band, above where body content starts (51pt).
        $pdf->page_script(
            'if ($PAGE_NUM > 1) {' .
            '    $fontBold = $fontMetrics->get_font("Noto Sans Devanagari", "bold")   ?: $fontMetrics->get_font("DejaVu Sans", "bold");' .
            '    $pdf->text(' . $marginL . ', 22, ' . var_export($headerLeft, true) . ', $fontBold, 9, [0.12, 0.25, 0.69]);' .
            '    $hr = ' . var_export($headerRight, true) . ';' .
            '    if ($hr !== "") {' .
            '        $rw = $fontMetrics->getTextWidth($hr, $fontBold, 9);' .
            '        $pdf->text(' . $marginR . ' - $rw, 22, $hr, $fontBold, 9, [0.07, 0.09, 0.15]);' .
            '    }' .
            '    $pdf->line(' . $marginL . ', 38, ' . $marginR . ', 38, [0.90, 0.91, 0.92], 0.5);' .
            '}'
        );

        // ---- Per-page FOOTER (every page) ----
        // Footer text y=pageHeight-26 (≈9mm from bottom), separator
        // line y=pageHeight-38 (≈13mm from bottom). page_line and
        // page_text both queue per-page callbacks now that we're
        // running with all pages already laid out.
        $footerY     = $pageHeight - 26;
        $footerLineY = $pageHeight - 38;
        $pdf->page_line($marginL, $footerLineY, $marginR, $footerLineY, [0.90, 0.91, 0.92], 0.5);

        if ($footerLeft !== '') {
            $pdf->page_text($marginL, $footerY, $footerLeft, $font, 9, [0.42, 0.45, 0.50]);
        }

        // Estimate the substituted text width against a max-width
        // sample so the right-aligned page counter stays anchored.
        $sample = $pageLabel . '00 / 00';
        $tw     = $fontMetrics->getTextWidth($sample, $font, 9);
        $pdf->page_text($marginR - $tw, $footerY, $pageLabel . '{PAGE_NUM} / {PAGE_COUNT}', $font, 9, [0.23, 0.27, 0.34]);
    }
    </script>
</body>
</html>
