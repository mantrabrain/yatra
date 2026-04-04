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
        // Check if SMTP is enabled
        $smtp_enabled = SettingsService::isEnabled('smtp_enabled');
        
        if ($smtp_enabled) {
            return self::sendViaSMTP($to, $subject, $message, $headers, $attachments);
        }
        
        // Use default WordPress wp_mail
        return self::sendViaWpMail($to, $subject, $message, $headers, $attachments);
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
            error_log('Yatra SMTP: Missing required SMTP configuration');
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
            error_log('Yatra SMTP Error: ' . $mail->ErrorInfo);
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
                'message' => sprintf(__('SMTP connection failed: %s', 'yatra'), $e->getMessage())
            ];
        }
    }
}
