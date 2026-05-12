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
        $defaultFont = (string) ($options['default_font'] ?? 'DejaVu Sans');

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

                // Restrict file:// reads to within ABSPATH so a crafted template can't read /etc/passwd
                // or other files outside the WordPress install.
                if (defined('ABSPATH')) {
                    $dompdfOptions->set('chroot', [ABSPATH]);
                }

                // Block file:// and php:// protocols from remote requests (only http/https allowed).
                $dompdfOptions->set('allowedProtocols', [
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
