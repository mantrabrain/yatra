<?php

declare(strict_types=1);

namespace Yatra\Services;

class PdfService
{
    public function isAvailable(): bool
    {
        return class_exists('Dompdf\\Dompdf') || class_exists('Mpdf\\Mpdf');
    }

    public function renderHtmlToPdf(string $html, array $options = []): string
    {
        $paper = (string) ($options['paper'] ?? 'A4');
        $orientation = (string) ($options['orientation'] ?? 'portrait');

        // Resolve the default font with awareness of the site's locale,
        // so a Nepali / Hindi / Arabic / CJK install gets a font that
        // can actually render the script — Dompdf's bundled DejaVu Sans
        // only covers Latin/Greek/Cyrillic, so non-Latin glyphs come
        // out as blank rectangles otherwise. See `resolveDefaultFont()`.
        $defaultFont = (string) ($options['default_font'] ?? $this->resolveDefaultFont());

        if (class_exists('Dompdf\\Dompdf')) {
            $optionsClass = 'Dompdf\\Options';
            $dompdfClass = 'Dompdf\\Dompdf';

            $dompdfOptions = class_exists($optionsClass) ? new $optionsClass() : null;
            if ($dompdfOptions) {
                // Remote loading is required so PDFs can render the site logo / trip images.
                // Filter exists so site owners can lock it down to the local filesystem if they
                // never use remote images and want to fully eliminate SSRF risk.
                $remoteEnabled = (bool) apply_filters('yatra_pdf_remote_enabled', true);
                $dompdfOptions->set('isRemoteEnabled', $remoteEnabled);
                $dompdfOptions->set('isHtml5ParserEnabled', true);
                $dompdfOptions->set('defaultFont', $defaultFont);

                // Enable `<script type="text/php">` blocks in PDF
                // templates. Required so the itinerary template can
                // draw a per-page header that's skipped on page 1
                // (Dompdf's CSS `position: fixed` runs unconditionally
                // on every page; a PHP canvas script is the only way
                // to gate by `$PAGE_NUM`). The PHP runs in Dompdf's
                // sandbox with access to the $pdf, $fontMetrics,
                // $PAGE_NUM and $PAGE_COUNT variables only — the
                // template files we ship are plugin-controlled so
                // this isn't an attack surface like user-supplied
                // HTML would be.
                $dompdfOptions->set('isPhpEnabled', true);

                // Move the font cache out of the plugin's vendor/ tree
                // (which is normally read-only on managed hosts and gets
                // wiped by composer install). Using
                // wp-content/uploads/yatra-pdf-fonts/cache/ keeps the
                // generated .ufm metric files persistent across deploys
                // AND ensures Dompdf can actually write — without write
                // access registerFont() silently no-ops, the Devanagari
                // font never gets installed, and Nepali glyphs render
                // as missing-glyph rectangles.
                $cacheDir = $this->ensureWritableFontCacheDir();
                if ($cacheDir) {
                    $dompdfOptions->set('fontDir', $cacheDir);
                    $dompdfOptions->set('fontCache', $cacheDir);
                }

                // Restrict file:// reads to within ABSPATH so a crafted template can't read /etc/passwd
                // or other files outside the WordPress install.
                if (defined('ABSPATH')) {
                    $dompdfOptions->set('chroot', [ABSPATH]);
                }

                // Block file:// and php:// protocols from remote requests
                // (only http/https for network fetches). The empty-string
                // key whitelists LOCAL file PATHS (no URL scheme) —
                // Dompdf's Helpers::explode_url() returns "" as the
                // protocol for a bare absolute path. Without that key,
                // FontMetrics::registerFont() silently rejects every
                // local TTF we pass to it, which is exactly why the
                // bundled Noto Sans Devanagari fonts never installed and
                // Nepali text fell back to DejaVu missing-glyph
                // rectangles. file paths are NOT the same as `file://`
                // URLs and don't expose any SSRF surface.
                $dompdfOptions->set('allowedProtocols', [
                    ''        => ['rules' => []],
                    'http://' => ['rules' => []],
                    'https://' => ['rules' => []],
                ]);

                // SSRF hardening for remote fetches: short timeout + identifying User-Agent so admins
                // can spot dompdf traffic in logs. Does not stop SSRF on its own — sites that do not
                // need remote images should disable via the `yatra_pdf_remote_enabled` filter above.
                if ($remoteEnabled) {
                    $httpContext = stream_context_create([
                        'http' => [
                            'timeout' => 5,
                            'follow_location' => 0,
                            'user_agent' => 'YatraPDF/' . (defined('YATRA_VERSION') ? YATRA_VERSION : '1.0'),
                        ],
                        'ssl' => [
                            'verify_peer' => true,
                            'verify_peer_name' => true,
                        ],
                    ]);
                    $dompdfOptions->setHttpContext($httpContext);
                }
            }

            $dompdf = $dompdfOptions ? new $dompdfClass($dompdfOptions) : new $dompdfClass();

            // Register any user-supplied Unicode fonts BEFORE loadHtml so
            // CSS `font-family` references resolve correctly.
            $this->registerExtraFonts($dompdf);

            $dompdf->loadHtml($html, 'UTF-8');
            $dompdf->setPaper($paper, $orientation);
            $dompdf->render();
            return (string) $dompdf->output();
        }

        if (class_exists('Mpdf\\Mpdf')) {
            $mpdfClass = 'Mpdf\\Mpdf';
            $mpdf = new $mpdfClass(['format' => $paper]);
            $mpdf->WriteHTML($html);
            return (string) $mpdf->Output('', 'S');
        }

        throw new \RuntimeException('PDF engine is not available');
    }

    /**
     * Decide which font family to hand to Dompdf as `defaultFont` based
     * on the current WordPress locale. Dompdf's only bundled Unicode
     * font is DejaVu Sans, which covers Latin/Greek/Cyrillic; for other
     * scripts the site has to ship its own TTF (see
     * `registerExtraFonts()`).
     *
     * The mapping intentionally aims at FAMILIES the typical
     * `yatra_pdf_extra_fonts` install would expose (Noto Sans <script>
     * is the canonical pick), so when an admin drops the matching font
     * file into the fonts dir the chain "just works". The CSS in the
     * PDF templates ALSO carries these names as fallbacks, so
     * Dompdf's per-glyph font picker can pick whichever family is
     * actually registered.
     *
     * Filter `yatra_pdf_default_font` lets a site override the
     * resolved family entirely.
     */
    private function resolveDefaultFont(): string
    {
        $locale = function_exists('determine_locale') ? determine_locale() : (function_exists('get_locale') ? get_locale() : 'en_US');
        $lang = strtolower(substr((string) $locale, 0, 2));

        $devanagari = ['ne', 'hi', 'mr', 'sa']; // Nepali, Hindi, Marathi, Sanskrit
        $arabic     = ['ar', 'fa', 'ur'];
        $cjk        = ['zh', 'ja', 'ko'];

        if (in_array($lang, $devanagari, true)) {
            $font = 'Noto Sans Devanagari';
        } elseif (in_array($lang, $arabic, true)) {
            $font = 'Noto Sans Arabic';
        } elseif (in_array($lang, $cjk, true)) {
            $font = 'Noto Sans CJK';
        } else {
            $font = 'DejaVu Sans';
        }

        return (string) apply_filters('yatra_pdf_default_font', $font, $locale);
    }

    /**
     * Parse a TTF/OTF basename into (cssFamily, style).
     *
     * Examples:
     *   "NotoSansDevanagari-Regular"     → ("Noto Sans Devanagari", "normal")
     *   "NotoSansDevanagari-Bold"        → ("Noto Sans Devanagari", "bold")
     *   "NotoSansArabic-Italic"          → ("Noto Sans Arabic", "italic")
     *   "NotoSansCJK-BoldItalic"         → ("Noto Sans CJK", "bold_italic")
     *   "Roboto"                         → ("Roboto", "normal")
     *   "Noto Sans Devanagari-Bold"      → ("Noto Sans Devanagari", "bold")  (file already has spaces)
     *
     * Returns `["", ""]` when the basename can't yield a sensible family.
     *
     * The CSS family is derived by:
     *   1. Stripping any recognised weight/style suffix (Regular, Bold,
     *      Italic, BoldItalic, Oblique, BoldOblique).
     *   2. Replacing underscores with spaces.
     *   3. If the result is PascalCase with no separators, inserting a
     *      space before each interior capital letter — so the bundled
     *      `NotoSansDevanagari` file matches the CSS `"Noto Sans
     *      Devanagari"` declaration in the templates.
     *
     * @return array{0:string,1:string}
     */
    private function parseFontFilename(string $base): array
    {
        $style = 'normal';
        $family = $base;

        if (preg_match('/^(.+?)[-_](Regular|Bold(?:Italic|Oblique)?|Italic|Oblique)$/i', $base, $m)) {
            $family = $m[1];
            $variant = strtolower($m[2]);
            if ($variant === 'bolditalic' || $variant === 'boldoblique') {
                $style = 'bold_italic';
            } elseif ($variant === 'bold') {
                $style = 'bold';
            } elseif ($variant === 'italic' || $variant === 'oblique') {
                $style = 'italic';
            } else {
                // Regular / unknown → normal weight.
                $style = 'normal';
            }
        }

        // Normalise underscores → spaces first so a file already named
        // "Noto_Sans_Devanagari-Bold.ttf" lands as "Noto Sans Devanagari".
        $cssFamily = str_replace('_', ' ', $family);

        // PascalCase → spaced (insert a space between a lowercase and the
        // next uppercase, and between two uppercases followed by a
        // lowercase — preserves "CJK" inside "Noto Sans CJK").
        if (strpos($cssFamily, ' ') === false) {
            $cssFamily = preg_replace('/([a-z])([A-Z])/', '$1 $2', $cssFamily);
            $cssFamily = preg_replace('/([A-Z]+)([A-Z][a-z])/', '$1 $2', (string) $cssFamily);
        }

        $cssFamily = trim((string) $cssFamily);

        return [$cssFamily, $style];
    }

    /**
     * Resolve a writable font cache directory under wp-content/uploads/
     * — required so Dompdf's `registerFont()` can write the generated
     * `.ufm` metric files and the copied TTF. Returns the absolute path
     * on success, or an empty string when uploads aren't writable (in
     * which case the caller falls back to Dompdf's vendor cache).
     */
    private function ensureWritableFontCacheDir(): string
    {
        $uploads = function_exists('wp_get_upload_dir') ? wp_get_upload_dir() : null;
        if (!$uploads || empty($uploads['basedir'])) {
            return '';
        }
        $dir = rtrim((string) $uploads['basedir'], '/\\') . '/yatra-pdf-fonts/cache';
        if (!is_dir($dir)) {
            if (function_exists('wp_mkdir_p')) {
                wp_mkdir_p($dir);
            } else {
                @mkdir($dir, 0755, true);
            }
        }
        if (!is_dir($dir) || !is_writable($dir)) {
            return '';
        }

        // One-time cache invalidation. Tied to the plugin version so it
        // re-runs whenever the bundled fonts or the registerFont logic
        // change — for example the `allowedProtocols` fix that finally
        // lets registerFont() write font cache for local TTFs:
        // installations that rendered a PDF BEFORE that fix have a
        // partial `installed-fonts.json` recording the failed bold
        // entry, and Dompdf's runtime cache trusts that file even when
        // the matching .ufm is missing. Wiping the dir once per
        // version forces a fresh build with the corrected logic.
        $version = defined('YATRA_VERSION') ? (string) constant('YATRA_VERSION') : '1.0.0';
        $stampFile = $dir . '/.yatra-font-cache-version';
        $currentStamp = is_file($stampFile) ? (string) @file_get_contents($stampFile) : '';
        if ($currentStamp !== $version) {
            foreach ((array) glob($dir . '/*') as $file) {
                if (is_file($file)) {
                    @unlink($file);
                }
            }
            @file_put_contents($stampFile, $version);
        }

        return $dir;
    }

    /**
     * Register any TTF/OTF the site has dropped into the Yatra PDF
     * fonts dir with Dompdf's `FontMetrics`. Without this Dompdf has
     * no idea those files exist — even with a matching CSS
     * `font-family`, glyphs from the file would never reach the PDF.
     *
     * Default font dir is `wp-content/uploads/yatra-pdf-fonts/`
     * (filter `yatra_pdf_fonts_dir`), so admins can add fonts without
     * touching plugin code. Any TTF/OTF whose filename matches
     * `<Family>[-<Style>].ttf` is registered as that family/style —
     * style suffix is one of `Regular`, `Bold`, `Italic`,
     * `BoldItalic`. Unknown suffixes default to `normal`.
     *
     * The filter `yatra_pdf_extra_fonts` lets code register fonts
     * imperatively too, returning an array of
     *   [ family => [ 'normal' => '/abs/path.ttf', 'bold' => ... ] ]
     */
    private function registerExtraFonts($dompdf): void
    {
        $metrics = method_exists($dompdf, 'getFontMetrics') ? $dompdf->getFontMetrics() : null;
        if (!$metrics) {
            return;
        }

        // Scan order: plugin-bundled fonts (always present) first, then
        // the user-overridable uploads dir. Later registrations win so
        // a site can drop in a higher-quality Devanagari font in
        // uploads/yatra-pdf-fonts/ to override the bundled Noto Sans.
        $dirs = [];
        if (defined('YATRA_PLUGIN_PATH')) {
            $bundled = rtrim((string) YATRA_PLUGIN_PATH, '/\\') . '/assets/pdf-fonts';
            if (is_dir($bundled)) {
                $dirs[] = $bundled;
            }
        }
        $uploads = function_exists('wp_get_upload_dir') ? wp_get_upload_dir() : null;
        if ($uploads && !empty($uploads['basedir'])) {
            $userDir = rtrim((string) $uploads['basedir'], '/\\') . '/yatra-pdf-fonts';
            $userDir = (string) apply_filters('yatra_pdf_fonts_dir', $userDir);
            if ($userDir && is_dir($userDir)) {
                $dirs[] = $userDir;
            }
        }

        $fonts = [];

        foreach ($dirs as $dir) {
            foreach ((array) glob($dir . '/*.{ttf,TTF,otf,OTF}', GLOB_BRACE) as $file) {
                $base = pathinfo((string) $file, PATHINFO_FILENAME);
                [$cssFamily, $style] = $this->parseFontFilename($base);
                if ($cssFamily === '') {
                    continue;
                }
                if (!isset($fonts[$cssFamily])) {
                    $fonts[$cssFamily] = [];
                }
                $fonts[$cssFamily][$style] = $file;
            }
        }

        $fonts = (array) apply_filters('yatra_pdf_extra_fonts', $fonts);

        // Map our internal style keys to Dompdf's
        // ['weight' => …, 'style' => …] tuple, since registerFont()
        // uses CSS-shaped style arrays (weight = normal|bold,
        // style = normal|italic) and not the four-key family entries.
        $styleMatrix = [
            'normal'      => ['weight' => 'normal', 'style' => 'normal'],
            'bold'        => ['weight' => 'bold',   'style' => 'normal'],
            'italic'      => ['weight' => 'normal', 'style' => 'italic'],
            'bold_italic' => ['weight' => 'bold',   'style' => 'italic'],
        ];

        foreach ($fonts as $family => $styles) {
            if (!is_array($styles)) {
                continue;
            }
            // Fill missing styles with the regular variant so Dompdf
            // doesn't fall back to its own default on bold/italic.
            $normal = $styles['normal'] ?? reset($styles);
            if (!$normal) {
                continue;
            }
            foreach (array_keys($styleMatrix) as $style) {
                if (empty($styles[$style])) {
                    $styles[$style] = $normal;
                }
            }

            foreach ($styleMatrix as $key => $css) {
                $file = $styles[$key] ?? null;
                if (!$file || !is_file($file)) {
                    continue;
                }
                try {
                    // registerFont downloads (or here, copies from a
                    // local path) the TTF into Dompdf's font dir, then
                    // generates the .ufm metrics file and wires the
                    // family/weight/style triple into the FontMetrics
                    // lookup table — all in one call. Passing a local
                    // path works because Helpers::getFileContent() just
                    // file_get_contents()s it.
                    $metrics->registerFont(
                        [
                            'family' => (string) $family,
                            'weight' => $css['weight'],
                            'style'  => $css['style'],
                        ],
                        $file
                    );
                } catch (\Throwable $e) {
                    // Don't take the whole PDF render down for one bad font.
                    error_log('[Yatra] Failed to register PDF font ' . $family . ' (' . $key . '): ' . $e->getMessage());
                }
            }
        }
    }

    public function renderHtmlToPdfSafely(string $html, array $options = []): string
    {
        $originalErrorReporting = error_reporting();
        $originalDisplayErrors = ini_get('display_errors');
        $originalHtmlErrors = ini_get('html_errors');
        $startObLevel = ob_get_level();

        ini_set('display_errors', '0');
        ini_set('html_errors', '0');
        error_reporting($originalErrorReporting & ~E_DEPRECATED & ~E_USER_DEPRECATED);
        ob_start();

        $previousErrorHandler = set_error_handler(static function (int $errno) {
            if ($errno === E_DEPRECATED || $errno === E_USER_DEPRECATED) {
                return true;
            }
            return false;
        });

        try {
            return $this->renderHtmlToPdf($html, $options);
        } finally {
            if ($previousErrorHandler !== null) {
                restore_error_handler();
            }

            while (ob_get_level() > $startObLevel) {
                ob_end_clean();
            }

            error_reporting($originalErrorReporting);
            if ($originalDisplayErrors !== false) {
                ini_set('display_errors', (string) $originalDisplayErrors);
            }
            if ($originalHtmlErrors !== false) {
                ini_set('html_errors', (string) $originalHtmlErrors);
            }
        }
    }

    public function renderTemplate(string $templatePath, array $data = []): string
    {
        $templateFile = YATRA_PLUGIN_PATH . 'templates/' . $templatePath;

        if (!file_exists($templateFile)) {
            throw new \InvalidArgumentException("Template file not found: {$templateFile}");
        }

        // Defence in depth: only extract string-keyed entries with valid PHP-identifier names,
        // and skip keys that would clobber locals already in scope (EXTR_SKIP). Stops a malicious
        // $data array from injecting arbitrary local variables into the template scope.
        $safeData = [];
        foreach ($data as $key => $value) {
            if (is_string($key) && preg_match('/^[a-zA-Z_][a-zA-Z0-9_]*$/', $key)) {
                $safeData[$key] = $value;
            }
        }
        extract($safeData, EXTR_SKIP);

        // Capture output
        ob_start();
        try {
            include $templateFile;
            return ob_get_clean();
        } catch (\Throwable $e) {
            ob_end_clean();
            throw $e;
        }
    }

    public function renderTemplateToPdf(string $templatePath, array $data = [], array $options = []): string
    {
        $html = $this->renderTemplate($templatePath, $data);
        return $this->renderHtmlToPdf($html, $options);
    }

    public function renderTemplateToPdfSafely(string $templatePath, array $data = [], array $options = []): string
    {
        $html = $this->renderTemplate($templatePath, $data);
        return $this->renderHtmlToPdfSafely($html, $options);
    }

    public function outputPdfDownload(string $pdfBinary, string $filename, bool $inline = false): void
    {
        // Strip CR/LF (header injection) and any quotes/backslashes from the ASCII fallback name.
        // Keep an RFC 5987 UTF-8 form so non-ASCII filenames still display correctly in modern browsers.
        $cleanFilename = preg_replace('/[\r\n"\\\\]/', '', $filename) ?? '';
        if ($cleanFilename === '') {
            $cleanFilename = 'document.pdf';
        }
        $asciiFilename = preg_replace('/[^\x20-\x7E]/', '_', $cleanFilename) ?? 'document.pdf';
        $encodedFilename = rawurlencode($cleanFilename);

        header('Content-Type: application/pdf');
        header(
            'Content-Disposition: ' . ($inline ? 'inline' : 'attachment')
            . '; filename="' . $asciiFilename . '"'
            . "; filename*=UTF-8''" . $encodedFilename
        );
        header('Cache-Control: no-cache, no-store, must-revalidate');
        header('Pragma: no-cache');
        header('Expires: 0');

        echo $pdfBinary;
        exit;
    }
}
