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
                $dompdfOptions->set('isRemoteEnabled', true);
                $dompdfOptions->set('isHtml5ParserEnabled', true);
                $dompdfOptions->set('defaultFont', $defaultFont);
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

        // Extract data variables for template
        extract($data, EXTR_OVERWRITE);

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
        header('Content-Type: application/pdf');
        header('Content-Disposition: ' . ($inline ? 'inline' : 'attachment') . '; filename="' . $filename . '"');
        header('Cache-Control: no-cache, no-store, must-revalidate');
        header('Pragma: no-cache');
        header('Expires: 0');

        echo $pdfBinary;
        exit;
    }
}
