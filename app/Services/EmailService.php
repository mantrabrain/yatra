<?php
/**
 * Email Service
 * 
 * Handles email sending with SMTP support
 * 
 * @package Yatra\Services
 * @since 3.0.0
 */

declare(strict_types=1);

namespace Yatra\Services;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class EmailService
{
    /**
     * Send email using WordPress wp_mail or SMTP
     * 
     * @param string|array $to Recipient email address(es)
     * @param string $subject Email subject
     * @param string $message Email message
     * @param array $headers Optional headers
     * @param array $attachments Optional attachments
     * @return bool True on success, false on failure
     */
    public static function send($to, string $subject, string $message, array $headers = [], array $attachments = []): bool
    {
        // Archive copy of every Yatra email, if the operator configured one.
        // Applied here rather than at each call site so it covers all senders —
        // core transactional mail, Pro automation templates and sequences — and
        // cannot be forgotten by a sender added later.
        $headers = self::withAlwaysBcc($headers);

        // Check if SMTP is enabled
        $smtp_enabled = SettingsService::isEnabled('smtp_enabled');
        
        if ($smtp_enabled) {
            return self::sendViaSMTP($to, $subject, $message, $headers, $attachments);
        }
        
        // Use default WordPress wp_mail
        return self::sendViaWpMail($to, $subject, $message, $headers, $attachments);
    }
    
    /**
     * Merge the configured always-BCC address into a header list.
     *
     * Opt-in: with the setting empty nothing is added and the headers are handed
     * back untouched, so an operator who never configures it sees no change at
     * all. When a template already carries its own Bcc header the two are merged
     * and de-duplicated, so an address listed in both places is only copied once.
     *
     * @param string[] $headers
     * @return string[]
     */
    private static function withAlwaysBcc(array $headers): array
    {
        // Cc/Bcc configured on the template being sent. Read here rather than at
        // the call site because Yatra Pro can take the send over and mail it
        // through its own service — both routes end up here.
        foreach (TransactionalEmailTemplateService::headersForCurrentDispatch() as $templateHeader) {
            $headers[] = $templateHeader;
        }

        $configured = TransactionalEmailTemplateService::sanitizeAddressList(
            (string) SettingsService::get('email_always_bcc', '')
        );

        /**
         * Filter the always-BCC recipients for a single send. Return an empty
         * array to skip archiving this particular email.
         *
         * @param string[] $configured
         * @param string[] $headers
         */
        $configured = (array) apply_filters('yatra_email_always_bcc', $configured, $headers);

        if ($configured === []) {
            return $headers;
        }

        // Fold any Bcc headers already present into the same list so the address
        // cannot be added twice, then re-emit a single combined header.
        $existing = [];
        $kept = [];

        foreach ($headers as $header) {
            if (is_string($header) && stripos(trim($header), 'bcc:') === 0) {
                $existing = array_merge(
                    $existing,
                    TransactionalEmailTemplateService::sanitizeAddressList(trim(substr(trim($header), 4)))
                );
                continue;
            }

            $kept[] = $header;
        }

        $all = [];

        foreach (array_merge($existing, $configured) as $address) {
            $all[strtolower($address)] = $address;
        }

        if ($all === []) {
            return $headers;
        }

        $kept[] = 'Bcc: ' . implode(', ', array_values($all));

        return $kept;
    }

    /**
     * Send email via WordPress wp_mail with custom from address
     */
    private static function sendViaWpMail($to, string $subject, string $message, array $headers, array $attachments): bool
    {
        // Add custom from address if configured
        add_filter('wp_mail_from', [self::class, 'customFromEmail']);
        add_filter('wp_mail_from_name', [self::class, 'customFromName']);
        
        $result = wp_mail($to, $subject, $message, $headers, $attachments);
        
        // Remove filters after sending
        remove_filter('wp_mail_from', [self::class, 'customFromEmail']);
        remove_filter('wp_mail_from_name', [self::class, 'customFromName']);
        
        return $result;
    }
    
    /**
     * Send email via SMTP
     */
    private static function sendViaSMTP($to, string $subject, string $message, array $headers, array $attachments): bool
    {
        // Get SMTP settings
        $smtp_host = SettingsService::getString('smtp_host', 'smtp.gmail.com');
        $smtp_port = SettingsService::getInt('smtp_port', 587);
        $smtp_username = SettingsService::getString('smtp_username', '');
        $smtp_password = SettingsService::getString('smtp_password', '');
        $smtp_encryption = SettingsService::getString('smtp_encryption', 'tls');
        $from_email = SettingsService::getString('from_email', get_option('admin_email'));
        $from_name = SettingsService::getString('from_name', get_bloginfo('name'));
        
        // Validate required settings
        if (empty($smtp_host) || empty($smtp_username) || empty($smtp_password)) {
            return false;
        }
        
        try {
            $mail = new PHPMailer(true);
            
            // Server settings
            $mail->isSMTP();
            $mail->Host = $smtp_host;
            $mail->SMTPAuth = true;
            $mail->Username = $smtp_username;
            $mail->Password = $smtp_password;
            self::configureSmtpEncryption($mail, $smtp_encryption);
            $mail->Port = $smtp_port;
            
            // Recipients
            $mail->setFrom($from_email, $from_name);
            
            if (is_array($to)) {
                foreach ($to as $recipient) {
                    $mail->addAddress($recipient);
                }
            } else {
                $mail->addAddress($to);
            }
            
            // Process headers
            foreach ($headers as $header) {
                if (stripos($header, 'content-type:') === 0) {
                    if (stripos($header, 'text/html') !== false) {
                        $mail->isHTML(true);
                    }
                } elseif (stripos($header, 'cc:') === 0) {
                    $cc = trim(substr($header, 3));
                    $mail->addCC($cc);
                } elseif (stripos($header, 'bcc:') === 0) {
                    $bcc = trim(substr($header, 4));
                    $mail->addBCC($bcc);
                } elseif (stripos($header, 'reply-to:') === 0) {
                    $reply_to = trim(substr($header, 9));
                    $mail->addReplyTo($reply_to);
                }
            }
            
            // Content
            $mail->Subject = $subject;
            $mail->Body = $message;
            
            // Attachments
            foreach ($attachments as $attachment) {
                $mail->addAttachment($attachment);
            }
            
            $mail->send();
            return true;
            
        } catch (Exception $e) {
            return false;
        }
    }
    
    private static function configureSmtpEncryption(PHPMailer $mail, string $smtp_encryption): void
    {
        if ($smtp_encryption === 'ssl') {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            $mail->SMTPAutoTLS = true;

            return;
        }
        if ($smtp_encryption === 'tls') {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->SMTPAutoTLS = true;

            return;
        }
        $mail->SMTPSecure = '';
        $mail->SMTPAutoTLS = false;
    }

    /**
     * Custom from email filter
     */
    public static function customFromEmail($email)
    {
        $from_email = SettingsService::getString('from_email', '');
        return !empty($from_email) ? $from_email : $email;
    }

    /**
     * Custom from name filter
     */
    public static function customFromName($name)
    {
        $from_name = SettingsService::getString('from_name', '');
        return !empty($from_name) ? $from_name : $name;
    }
    
    /**
     * Test SMTP connection
     * 
     * @return array Result with success status and message
     */
    public static function testSMTPConnection(): array
    {
        $smtp_host = SettingsService::getString('smtp_host', '');
        $smtp_port = SettingsService::getInt('smtp_port', 587);
        $smtp_username = SettingsService::getString('smtp_username', '');
        $smtp_password = SettingsService::getString('smtp_password', '');
        $smtp_encryption = SettingsService::getString('smtp_encryption', 'tls');
        
        if (empty($smtp_host) || empty($smtp_username) || empty($smtp_password)) {
            return [
                'success' => false,
                'message' => __('Please configure all SMTP settings first.', 'yatra')
            ];
        }
        
        try {
            $mail = new PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = $smtp_host;
            $mail->SMTPAuth = true;
            $mail->Username = $smtp_username;
            $mail->Password = $smtp_password;
            self::configureSmtpEncryption($mail, $smtp_encryption);
            $mail->Port = $smtp_port;
            $mail->Timeout = 10;
            
            // Test connection
            $mail->smtpConnect();
            $mail->smtpClose();
            
            return [
                'success' => true,
                'message' => __('SMTP connection successful!', 'yatra')
            ];
            
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => sprintf(
                    /* translators: %s: SMTP error message. */
                    __('SMTP connection failed: %s', 'yatra'),
                    $e->getMessage()
                )
            ];
        }
    }
}
