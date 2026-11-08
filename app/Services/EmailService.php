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

        // Subjects are plain text, but WordPress stores the site title HTML-escaped,
        // so "[Tom &amp; Jerry&#039;s]" reached customers literally.
        $subject = wp_specialchars_decode($subject, ENT_QUOTES);

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
            $mail = self::newMailer();

            // Server settings
            $mail->isSMTP();
            $mail->Host = $smtp_host;
            $mail->SMTPAuth = true;
            $mail->Username = $smtp_username;
            $mail->Password = $smtp_password;
            self::configureSmtpEncryption($mail, $smtp_encryption);
            $mail->Port = $smtp_port;
            
            // Recipients
            $mail->setFrom($from_email, wp_specialchars_decode($from_name, ENT_QUOTES));
            
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
                    foreach (self::headerAddresses(substr($header, 3)) as $address => $name) {
                        $mail->addCC($address, $name);
                    }
                } elseif (stripos($header, 'bcc:') === 0) {
                    foreach (self::headerAddresses(substr($header, 4)) as $address => $name) {
                        $mail->addBCC($address, $name);
                    }
                } elseif (stripos($header, 'reply-to:') === 0) {
                    foreach (self::headerAddresses(substr($header, 9)) as $address => $name) {
                        $mail->addReplyTo($address, $name);
                    }
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
    
    /**
     * A PHPMailer ready for Yatra's own SMTP sending.
     *
     * WordPress only loads PHPMailer inside wp_mail(), so it may not be loaded yet.
     * PHPMailer also defaults to ISO-8859-1, while Yatra's emails are UTF-8: without
     * this, accented letters, dashes and emoji arrived as symbols like "Ã©".
     */
    private static function newMailer(): PHPMailer
    {
        if (!class_exists(PHPMailer::class)) {
            require_once ABSPATH . WPINC . '/PHPMailer/PHPMailer.php';
            require_once ABSPATH . WPINC . '/PHPMailer/SMTP.php';
            require_once ABSPATH . WPINC . '/PHPMailer/Exception.php';
        }

        $mail = new PHPMailer(true);
        $mail->CharSet = 'UTF-8';

        return $mail;
    }

    /**
     * The addresses in one Cc, Bcc or Reply-To header value.
     *
     * A header may hold several addresses ("a@x.com, b@x.com") or a named one
     * ("Ana <a@x.com>"). Passing the whole value to PHPMailer made it reject the
     * header, and with exceptions on, the email was silently not sent.
     *
     * @return array<string, string> address => name
     */
    private static function headerAddresses(string $value): array
    {
        // Split by hand: PHPMailer::parseAddresses() raises a notice on every
        // call without the IMAP extension, which would flood the log (the
        // always-Bcc setting adds this header to every email).
        $out = [];
        foreach (preg_split('/,(?=(?:[^"]*"[^"]*")*[^"]*$)/', $value) ?: [] as $part) {
            $part = trim($part);
            $name = '';
            $address = $part;
            if (preg_match('/^(.*)<([^>]+)>\s*$/', $part, $m)) {
                $name = trim(trim($m[1]), "\" ");
                $address = trim($m[2]);
            }
            if ($address !== '' && is_email($address)) {
                $out[$address] = $name;
            }
        }

        return $out;
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
            $mail = self::newMailer();
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
