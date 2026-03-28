<?php

namespace App\Services;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;

class EmailService {
  // SMTP 설정이 .env에 있는지 확인
  public static function isConfigured(): bool {
    return !empty($_ENV['MAIL_HOST']) && !empty($_ENV['MAIL_USERNAME']);
  }

  // 이메일 발송 — 실패 시 예외 대신 false 반환
  public static function send(
    string $toEmail,
    string $toName,
    string $subject,
    string $htmlBody,
    string $textBody = ''
  ): bool {
    if (!self::isConfigured()) {
      return false;
    }

    try {
      $mail = new PHPMailer(true);

      // SMTP 설정
      $mail->isSMTP();
      $mail->Host       = $_ENV['MAIL_HOST'];
      $mail->SMTPAuth   = true;
      $mail->Username   = $_ENV['MAIL_USERNAME'];
      $mail->Password   = $_ENV['MAIL_PASSWORD'];
      $mail->SMTPSecure = ($_ENV['MAIL_ENCRYPTION'] ?? 'tls') === 'ssl'
        ? PHPMailer::ENCRYPTION_SMTPS
        : PHPMailer::ENCRYPTION_STARTTLS;
      $mail->Port       = (int) ($_ENV['MAIL_PORT'] ?? 587);
      $mail->CharSet    = 'UTF-8';

      // 발신자
      $fromEmail = $_ENV['MAIL_FROM'] ?? $_ENV['MAIL_USERNAME'];
      $fromName  = $_ENV['MAIL_FROM_NAME'] ?? '홈페이지 알림';
      $mail->setFrom($fromEmail, $fromName);

      // 수신자
      $mail->addAddress($toEmail, $toName);

      // 본문
      $mail->isHTML(true);
      $mail->Subject = $subject;
      $mail->Body    = $htmlBody;
      $mail->AltBody = $textBody ?: strip_tags($htmlBody);

      $mail->send();
      return true;
    } catch (\Throwable) {
      return false;
    }
  }

  // 댓글 알림 이메일 발송
  public static function sendCommentNotification(
    string $toEmail,
    string $toName,
    string $postTitle,
    string $actorName,
    string $commentContent,
    string $postUrl
  ): bool {
    $subject = "[알림] \"{$postTitle}\" 에 새 댓글이 달렸습니다";
    $escaped = htmlspecialchars($commentContent, ENT_QUOTES, 'UTF-8');
    $html = <<<HTML
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;color:#222;max-width:540px;margin:0 auto;padding:24px;">
  <h2 style="font-size:18px;margin-bottom:8px;">새 댓글 알림</h2>
  <p style="color:#555;font-size:14px;margin-bottom:16px;">
    <strong>{$actorName}</strong>님이 회원님의 게시글 <strong>"{$postTitle}"</strong>에 댓글을 달았습니다.
  </p>
  <blockquote style="border-left:3px solid #3b82f6;margin:0;padding:8px 16px;background:#f1f5f9;border-radius:4px;font-size:14px;color:#333;">
    {$escaped}
  </blockquote>
  <p style="margin-top:20px;">
    <a href="{$postUrl}" style="background:#3b82f6;color:#fff;padding:8px 18px;border-radius:6px;text-decoration:none;font-size:14px;">게시글 보기</a>
  </p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
  <p style="font-size:12px;color:#999;">이 메일은 자동 발송된 알림입니다. 수신을 원하지 않으시면 마이페이지에서 설정을 변경하세요.</p>
</body>
</html>
HTML;

    return self::send($toEmail, $toName, $subject, $html);
  }

  // 대댓글 알림 이메일 발송
  public static function sendReplyNotification(
    string $toEmail,
    string $toName,
    string $postTitle,
    string $actorName,
    string $commentContent,
    string $postUrl
  ): bool {
    $subject = "[알림] \"{$postTitle}\" 에서 답글이 달렸습니다";
    $escaped = htmlspecialchars($commentContent, ENT_QUOTES, 'UTF-8');
    $html = <<<HTML
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"></head>
<body style="font-family:sans-serif;color:#222;max-width:540px;margin:0 auto;padding:24px;">
  <h2 style="font-size:18px;margin-bottom:8px;">답글 알림</h2>
  <p style="color:#555;font-size:14px;margin-bottom:16px;">
    <strong>{$actorName}</strong>님이 회원님의 댓글에 답글을 달았습니다.
    (게시글: <strong>"{$postTitle}"</strong>)
  </p>
  <blockquote style="border-left:3px solid #10b981;margin:0;padding:8px 16px;background:#f0fdf4;border-radius:4px;font-size:14px;color:#333;">
    {$escaped}
  </blockquote>
  <p style="margin-top:20px;">
    <a href="{$postUrl}" style="background:#10b981;color:#fff;padding:8px 18px;border-radius:6px;text-decoration:none;font-size:14px;">게시글 보기</a>
  </p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
  <p style="font-size:12px;color:#999;">이 메일은 자동 발송된 알림입니다.</p>
</body>
</html>
HTML;

    return self::send($toEmail, $toName, $subject, $html);
  }
}
