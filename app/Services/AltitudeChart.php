<?php
/**
 * Altitude profile of a trip's itinerary: an inline SVG line chart of each
 * day's highest altitude (metres), for the trip page.
 *
 * Shown when at least two days have an altitude. No JavaScript, no external
 * library; the values are also in the SVG's accessible description.
 *
 * @package Yatra\Services
 * @since 3.3.0
 */

declare(strict_types=1);

namespace Yatra\Services;

class AltitudeChart
{
    /**
     * Day number => altitude (metres), in day order, only days that have one.
     *
     * @param array<int, array<string, mixed>> $days Trip-page itinerary days (`day`, `altitude`).
     * @return array<int, int>
     */
    public static function points(array $days): array
    {
        $points = [];
        foreach ($days as $day) {
            $day = (array) $day;
            if (!isset($day['altitude']) || !is_numeric($day['altitude'])) {
                continue;
            }
            $points[(int) ($day['day'] ?? 0)] = (int) $day['altitude'];
        }
        ksort($points);

        return $points;
    }

    public static function feet(int $metres): int
    {
        return (int) round($metres * 3.28084);
    }

    /** "4,130 m" */
    public static function label(int $metres): string
    {
        return sprintf(
            /* translators: %s: altitude in metres */
            __('%s m', 'yatra'),
            number_format_i18n($metres)
        );
    }

    /**
     * The chart, or '' when fewer than two days have an altitude.
     *
     * @param array<int, array<string, mixed>> $days
     */
    public static function render(array $days): string
    {
        $points = self::points($days);
        /**
         * Whether to show the altitude chart on a trip page.
         *
         * @since 3.3.0
         * @param bool  $show   True when two or more days have an altitude.
         * @param array $points Day number => metres.
         */
        if (!apply_filters('yatra_show_altitude_chart', count($points) >= 2, $points) || count($points) < 2) {
            return '';
        }

        $w = 720;
        $h = 240;
        $padL = 60;
        $padR = 20;
        $padT = 20;
        $padB = 40;
        $min = min($points);
        $max = max($points);
        // Round gridlines: 100 / 200 / 250 / 500 / 1000 / 2000 m apart.
        $step = 100;
        foreach ([100, 200, 250, 500, 1000, 2000] as $candidate) {
            $step = $candidate;
            if (($max - $min) / $candidate <= 4) {
                break;
            }
        }
        $lo = (int) (floor($min / $step) * $step);
        $hi = (int) (ceil($max / $step) * $step);
        if ($hi <= $max) {
            $hi += $step;
        }
        if ($lo >= $min && $lo - $step >= -500) {
            $lo -= $step;
        }
        $days = array_keys($points);
        $firstDay = (int) reset($days);
        $lastDay = (int) end($days);
        $spanDays = max(1, $lastDay - $firstDay);

        $x = static function (int $day) use ($firstDay, $spanDays, $w, $padL, $padR): float {
            return $padL + (($day - $firstDay) / $spanDays) * ($w - $padL - $padR);
        };
        $y = static function (int $m) use ($lo, $hi, $h, $padT, $padB): float {
            return $padT + (1 - (($m - $lo) / ($hi - $lo))) * ($h - $padT - $padB);
        };

        $line = [];
        foreach ($points as $day => $m) {
            $line[] = round($x((int) $day), 1) . ',' . round($y($m), 1);
        }
        $baseY = $h - $padB;
        $area = 'M' . round($x($firstDay), 1) . ',' . $baseY . ' L' . implode(' L', $line) . ' L' . round($x($lastDay), 1) . ',' . $baseY . ' Z';

        $highestDay = (int) array_search($max, $points, true);
        $summary = sprintf(
            /* translators: 1: altitude, 2: day number */
            __('Highest point: %1$s on day %2$d', 'yatra'),
            self::label($max),
            $highestDay
        );
        $desc = implode(', ', array_map(static function ($day, $m) {
            /* translators: 1: day number, 2: altitude */
            return sprintf(__('Day %1$d: %2$s', 'yatra'), (int) $day, self::label((int) $m));
        }, array_keys($points), $points));

        // Gridlines at round altitudes.
        $grid = '';
        for ($val = $lo; $val <= $hi; $val += $step) {
            $gy = round($y($val), 1);
            $grid .= '<line x1="' . $padL . '" y1="' . $gy . '" x2="' . ($w - $padR) . '" y2="' . $gy . '" stroke="currentColor" stroke-opacity="0.12" />'
                . '<text x="' . ($padL - 8) . '" y="' . ($gy + 4) . '" text-anchor="end" font-size="13" fill="currentColor" fill-opacity="0.6">' . esc_html(number_format_i18n($val)) . '</text>';
        }

        $dots = '';
        $labelEvery = (int) max(1, ceil(count($points) / 12));
        $n = 0;
        foreach ($points as $day => $m) {
            $cx = round($x((int) $day), 1);
            $cy = round($y($m), 1);
            $tip = sprintf(
                /* translators: 1: day number, 2: altitude in metres, 3: altitude in feet */
                __('Day %1$d: %2$s (%3$s ft)', 'yatra'),
                (int) $day,
                self::label($m),
                number_format_i18n(self::feet($m))
            );
            $dots .= '<g><title>' . esc_html($tip) . '</title><circle cx="' . $cx . '" cy="' . $cy . '" r="4.5" fill="var(--yatra-primary, #2563eb)" stroke="#fff" stroke-width="2" /></g>';
            if ($n % $labelEvery === 0 || (int) $day === $lastDay) {
                $dots .= '<text x="' . $cx . '" y="' . ($baseY + 18) . '" text-anchor="middle" font-size="13" fill="currentColor" fill-opacity="0.7">'
                    . esc_html(sprintf(/* translators: %d: day number */ __('D%d', 'yatra'), (int) $day)) . '</text>';
            }
            $n++;
        }
        $peak = '<text x="' . round($x($highestDay), 1) . '" y="' . round(max(12, $y($max) - 10), 1) . '" text-anchor="middle" font-size="14" font-weight="600" fill="currentColor">' . esc_html(self::label($max)) . '</text>';

        $id = 'yatra-alt-' . substr(md5(wp_json_encode($points)), 0, 8);

        // On a phone the chart keeps a readable size and scrolls sideways
        // inside its own box (never the page).
        return '<figure class="yatra-altitude-chart" style="margin:0 0 24px;">'
            . '<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;">'
            . '<svg viewBox="0 0 ' . $w . ' ' . $h . '" width="100%" role="img" aria-labelledby="' . $id . '-t ' . $id . '-d" preserveAspectRatio="xMidYMid meet" style="display:block;min-width:520px;height:auto;">'
            . '<title id="' . $id . '-t">' . esc_html__('Altitude profile', 'yatra') . '</title>'
            . '<desc id="' . $id . '-d">' . esc_html($desc) . '</desc>'
            . $grid
            . '<path d="' . esc_attr($area) . '" fill="var(--yatra-primary, #2563eb)" fill-opacity="0.12" />'
            . '<polyline points="' . esc_attr(implode(' ', $line)) . '" fill="none" stroke="var(--yatra-primary, #2563eb)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />'
            . $dots . $peak
            . '</svg></div>'
            . '<figcaption style="font-size:0.9em;opacity:0.8;margin-top:6px;">' . esc_html(__('Altitude profile', 'yatra') . ' — ' . $summary) . '</figcaption>'
            . '</figure>';
    }
}
