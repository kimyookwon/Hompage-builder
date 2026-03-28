<?php

namespace App\Controllers;

use App\Config\Database;
use App\Middleware\AuthMiddleware;
use App\Services\EmailService;
use App\Utils\AdminLogger;
use App\Utils\ResponseHelper;
use PHPMailer\PHPMailer\PHPMailer;

// 관리자 일괄 이메일 발송 컨트롤러
class BulkMailController {
  // POST /api/admin/bulk-mail -- 일괄 이메일 발송
  public function send(): void {
    $payload = AuthMiddleware::requireAdmin();

    try {
      $data = json_decode(file_get_contents('php://input'), true);

      $subject = trim($data['subject'] ?? '');
      $body    = trim($data['body'] ?? '');
      $target  = $data['target'] ?? '';
      $userIds = $data['user_ids'] ?? [];

      // 입력 검증
      if (empty($subject)) {
        ResponseHelper::error('제목을 입력해주세요.', 422);
      }
      if (empty($body)) {
        ResponseHelper::error('내용을 입력해주세요.', 422);
      }
      if (!in_array($target, ['all', 'active', 'specific'], true)) {
        ResponseHelper::error('유효한 대상(all, active, specific)을 지정해주세요.', 422);
      }
      if ($target === 'specific' && (empty($userIds) || !is_array($userIds))) {
        ResponseHelper::error('specific 대상은 user_ids 배열이 필요합니다.', 422);
      }

      $pdo = Database::getInstance();
      $recipients = $this->getRecipients($pdo, $target, $userIds);

      // 최대 500명 제한
      if (count($recipients) > 500) {
        ResponseHelper::error('수신자는 최대 500명까지 가능합니다.', 422);
      }

      if (empty($recipients)) {
        ResponseHelper::success(['sent' => 0, 'failed' => 0]);
        return;
      }

      // SMTP 설정 확인
      if (!EmailService::isConfigured()) {
        ResponseHelper::error('이메일 설정이 완료되지 않았습니다.', 500);
      }

      // 50명씩 배치 발송
      $sent   = 0;
      $failed = 0;
      $chunks = array_chunk($recipients, 50);

      foreach ($chunks as $chunk) {
        $result = $this->sendBatch($chunk, $subject, $body);
        $sent   += $result['sent'];
        $failed += $result['failed'];
      }

      // 관리자 로그 기록
      AdminLogger::log(
        (int) $payload->sub,
        AdminLogger::getAdminName($payload),
        'bulk_mail',
        'email',
        null,
        [
          'subject'    => $subject,
          'target'     => $target,
          'sent'       => $sent,
          'failed'     => $failed,
          'total'      => count($recipients),
        ]
      );

      ResponseHelper::success(['sent' => $sent, 'failed' => $failed]);
    } catch (\Throwable $e) {
      ResponseHelper::error('일괄 이메일 발송에 실패했습니다.', 500);
    }
  }

  // target별 수신자 조회
  private function getRecipients(\PDO $pdo, string $target, array $userIds): array {
    switch ($target) {
      case 'all':
        // 모든 active 사용자
        $stmt = $pdo->query(
          "SELECT id, email, name FROM users WHERE status = 'active'"
        );
        return $stmt->fetchAll();

      case 'active':
        // 30일 이내 활동 사용자 (최근 로그인 또는 게시글 작성)
        $stmt = $pdo->prepare(
          "SELECT DISTINCT u.id, u.email, u.name
           FROM users u
           LEFT JOIN posts p ON p.author_id = u.id AND p.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
           WHERE u.status = 'active'
             AND (u.updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                  OR p.id IS NOT NULL)"
        );
        $stmt->execute();
        return $stmt->fetchAll();

      case 'specific':
        if (empty($userIds)) return [];
        // 정수로 캐스팅하여 SQL Injection 방지
        $ids = array_map('intval', $userIds);
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $pdo->prepare(
          "SELECT id, email, name FROM users
           WHERE id IN ({$placeholders}) AND status = 'active'"
        );
        $stmt->execute($ids);
        return $stmt->fetchAll();

      default:
        return [];
    }
  }

  // BCC 배치 발송 (최대 50명 단위)
  private function sendBatch(array $recipients, string $subject, string $body): array {
    $sent   = 0;
    $failed = 0;

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

      // BCC로 수신자 추가
      foreach ($recipients as $recipient) {
        $mail->addBCC($recipient['email'], $recipient['name'] ?? '');
      }

      // 본문 설정
      $mail->isHTML(true);
      $mail->Subject = $subject;
      $mail->Body    = $body;
      $mail->AltBody = strip_tags($body);

      $mail->send();
      $sent = count($recipients);
    } catch (\Throwable) {
      $failed = count($recipients);
    }

    return ['sent' => $sent, 'failed' => $failed];
  }
}
