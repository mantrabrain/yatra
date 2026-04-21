<?php

declare(strict_types=1);

namespace Yatra\Services;

/**
 * Renders email preview HTML for any bundled template key (core settings + Pro default bodies).
 */
final class EmailTemplatePreviewService
{
    /**
     * @return array{subject: string, body: string}
     */
    public static function render(
        string $templateKey,
        string $subjectTpl,
        string $bodyTpl,
        ?int $tripId = null
    ): array {
        $key = sanitize_key($templateKey);
        if ($key === '' || !self::isPreviewable($key)) {
            throw new \InvalidArgumentException(__('Unknown email template.', 'yatra'));
        }

        $samples = EmailTemplateSampleData::forTemplateKey($key, $tripId);
        $coreType = TransactionalEmailTemplateService::coreTemplateKeyToType($key);

        if ($coreType !== null) {
            return TransactionalEmailTemplateService::renderWithStringTemplates(
                $coreType,
                $subjectTpl,
                $bodyTpl,
                $samples
            );
        }

        $defaults = EmailTemplateDefaults::proSystemTemplate($key);
        if ($defaults === null) {
            throw new \InvalidArgumentException(__('Unknown email template.', 'yatra'));
        }

        $subjectOut = $subjectTpl !== ''
            ? TransactionalEmailTemplateService::parseMergeTags($subjectTpl, $samples)
            : TransactionalEmailTemplateService::parseMergeTags($defaults['subject'], $samples);

        $bodyRaw = $bodyTpl !== '' ? $bodyTpl : $defaults['body'];
        $bodyOut = TransactionalEmailTemplateService::parseMergeTags($bodyRaw, $samples);

        return [
            'subject' => $subjectOut,
            'body' => $bodyOut,
        ];
    }

    public static function isPreviewable(string $templateKey): bool
    {
        return EmailTemplateSampleData::isPreviewableTemplateKey(sanitize_key($templateKey));
    }
}
