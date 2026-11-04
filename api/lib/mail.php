<?php
/**
 * Codle API — outgoing e-mail through Resend (https://resend.com).
 *
 * Config (api/config.php):
 *   'mail' => ['resend_key' => 're_…', 'from' => 'Codle <no-reply@your-domain>', 'reply_to' => null]
 *
 * send_mail() throws an ApiError (502 mail_failed) when the message could not be
 * handed to Resend; callers that only send a courtesy notice catch that.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function mail_config(): array
{
    $c = config()['mail'] ?? [];
    $key = (string) ($c['resend_key'] ?? '');
    $from = (string) ($c['from'] ?? '');
    if ($key === '' || $from === '') {
        error_log('Codle API: mail.resend_key / mail.from are not set in api/config.php');
        fail(502, 'mail_failed', 'E-mail is not set up on the server.');
    }
    return ['key' => $key, 'from' => $from, 'reply_to' => $c['reply_to'] ?? null];
}

/** Sends one e-mail. $text is the plain-text body; $html the HTML version (optional). */
function send_mail(string $to, string $subject, string $text, ?string $html = null): void
{
    $c = mail_config();
    $payload = ['from' => $c['from'], 'to' => [$to], 'subject' => $subject, 'text' => $text];
    if ($html !== null) $payload['html'] = $html;
    if (!empty($c['reply_to'])) $payload['reply_to'] = $c['reply_to'];

    $ch = curl_init(RESEND_ENDPOINT);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_HTTPHEADER     => ['Authorization: Bearer ' . $c['key'], 'Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_CONNECTTIMEOUT => 10,
    ]);
    $body = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $curlErr = curl_error($ch);
    curl_close($ch);

    if ($body === false || $status < 200 || $status >= 300) {
        $detail = $body === false ? $curlErr : (string) (json_decode((string) $body, true)['message'] ?? $body);
        error_log('Codle API: Resend refused "' . $subject . '" (' . $status . '): ' . $detail);
        fail(502, 'mail_failed', 'The e-mail could not be sent. Try again in a moment.');
    }
}

/** Sends, but never lets a failure escape (for courtesy notices). */
function send_mail_quietly(string $to, string $subject, string $text, ?string $html = null): void
{
    try {
        send_mail($to, $subject, $text, $html);
    } catch (Throwable $e) {
        error_log('Codle API: notice mail failed: ' . $subject);
    }
}

/* ---------------------------------------------------------------
   Templates
--------------------------------------------------------------- */

function mail_app_name(): string
{
    return (string) (config()['app_name'] ?? 'Codle');
}

/** Wraps $innerHtml in the shared layout. */
function mail_layout(string $innerHtml): string
{
    $app = htmlspecialchars(mail_app_name(), ENT_QUOTES);
    return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>'
        . '<body style="margin:0;padding:0;background:#0b0d12;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#e8eaf0;">'
        . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0b0d12;padding:32px 16px;"><tr><td align="center">'
        . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background:#151822;border:1px solid #262b3a;border-radius:16px;overflow:hidden;">'
        . '<tr><td style="padding:28px 32px 8px;font-size:20px;font-weight:700;letter-spacing:.02em;color:#ffffff;">' . $app . '</td></tr>'
        . '<tr><td style="padding:8px 32px 28px;font-size:15px;line-height:1.6;color:#c9cdd8;">' . $innerHtml . '</td></tr>'
        . '</table>'
        . '<p style="max-width:480px;margin:16px auto 0;font-size:12px;line-height:1.5;color:#6f7689;">You received this e-mail because this address was entered on ' . $app . '. If that was not you, you can ignore it.</p>'
        . '</td></tr></table></body></html>';
}

function code_mail(string $purpose, string $code, int $minutes): array
{
    $app = mail_app_name();
    [$subject, $intro] = match ($purpose) {
        'password_reset' => ["$app: your password reset code", 'Use this code to set a new password:'],
        'email_change'   => ["$app: confirm your new e-mail", 'Use this code to confirm your new e-mail address:'],
        default          => ["$app: your verification code", 'Use this code to verify your e-mail and finish signing up:'],
    };
    $text = "$intro\n\n$code\n\nIt is valid for $minutes minutes. If you did not ask for it, ignore this e-mail.\n\n$app";
    $html = mail_layout(
        '<p style="margin:0 0 16px;">' . htmlspecialchars($intro, ENT_QUOTES) . '</p>'
        . '<p style="margin:0 0 16px;font-size:32px;font-weight:700;letter-spacing:.35em;color:#ffffff;font-family:SFMono-Regular,Menlo,Consolas,monospace;">' . $code . '</p>'
        . '<p style="margin:0;font-size:13px;color:#8d94a7;">The code is valid for ' . $minutes . ' minutes. If you did not ask for it, ignore this e-mail.</p>'
    );
    return [$subject, $text, $html];
}

function notice_mail(string $subject, string $text): array
{
    $app = mail_app_name();
    $plain = "$text\n\nIf this was not you, reset your password right away.\n\n$app";
    $html = mail_layout(
        '<p style="margin:0 0 16px;">' . nl2br(htmlspecialchars($text, ENT_QUOTES)) . '</p>'
        . '<p style="margin:0;font-size:13px;color:#8d94a7;">If this was not you, reset your password right away.</p>'
    );
    return [$subject, $plain, $html];
}
