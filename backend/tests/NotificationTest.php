<?php

/**
 * 알림 시스템 테스트
 *
 * 실행: php tests/NotificationTest.php
 */

define('BASE_PATH', dirname(__DIR__));
require BASE_PATH . '/vendor/autoload.php';

use Dotenv\Dotenv;
use App\Models\Notification;
use App\Config\Database;

$dotenv = Dotenv::createImmutable(BASE_PATH);
$dotenv->safeLoad();

class NotificationTest
{
  private \PDO $pdo;
  private int $passed = 0;
  private int $failed = 0;

  // 테스트 픽스처 ID
  private ?int $testUserId1 = null;
  private ?int $testUserId2 = null;
  private array $testNotificationIds = [];

  public function __construct()
  {
    $host = $_ENV['DB_HOST']     ?? 'localhost';
    $db   = $_ENV['DB_DATABASE'] ?? ($_ENV['DB_NAME']  ?? 'homepage_builder');
    $user = $_ENV['DB_USERNAME'] ?? ($_ENV['DB_USER']  ?? 'root');
    $pass = $_ENV['DB_PASSWORD'] ?? ($_ENV['DB_PASS']  ?? '');
    $this->pdo = new \PDO(
      "mysql:host={$host};dbname={$db};charset=utf8mb4",
      $user, $pass,
      [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]
    );
  }

  private function assert(string $name, bool $condition, string $msg = ''): void
  {
    if ($condition) {
      echo "  [PASS] {$name}\n";
      $this->passed++;
    } else {
      echo "  [FAIL] {$name}" . ($msg ? ": {$msg}" : '') . "\n";
      $this->failed++;
    }
  }

  /**
   * setUp: 테스트 사용자 및 데이터 생성
   */
  private function setUp(): void
  {
    // 테스트용 사용자 1 생성
    $stmt = $this->pdo->prepare(
      'INSERT INTO users (email, password_hash, name, role, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())'
    );
    $stmt->execute([
      'test_notification_user1_' . time() . '@test.com',
      password_hash('TestPass123!', PASSWORD_BCRYPT),
      'Test User 1',
      'user',
      'active'
    ]);
    $this->testUserId1 = (int) $this->pdo->lastInsertId();

    // 테스트용 사용자 2 생성
    $stmt = $this->pdo->prepare(
      'INSERT INTO users (email, password_hash, name, role, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())'
    );
    $stmt->execute([
      'test_notification_user2_' . time() . '@test.com',
      password_hash('TestPass123!', PASSWORD_BCRYPT),
      'Test User 2',
      'user',
      'active'
    ]);
    $this->testUserId2 = (int) $this->pdo->lastInsertId();
  }

  /**
   * tearDown: 테스트 데이터 정리
   */
  private function tearDown(): void
  {
    if (!empty($this->testNotificationIds)) {
      $placeholders = implode(',', array_fill(0, count($this->testNotificationIds), '?'));
      $stmt = $this->pdo->prepare("DELETE FROM notifications WHERE id IN ({$placeholders})");
      $stmt->execute($this->testNotificationIds);
    }

    if ($this->testUserId1) {
      $stmt = $this->pdo->prepare('DELETE FROM users WHERE id = ?');
      $stmt->execute([$this->testUserId1]);
    }

    if ($this->testUserId2) {
      $stmt = $this->pdo->prepare('DELETE FROM users WHERE id = ?');
      $stmt->execute([$this->testUserId2]);
    }

    $this->testNotificationIds = [];
    $this->testUserId1 = null;
    $this->testUserId2 = null;
  }

  /**
   * 헬퍼: 알림 직접 생성 및 ID 기록
   */
  private function createTestNotification(
    int $userId,
    string $type = 'comment_on_post',
    string $actorName = 'Test Actor'
  ): int {
    $stmt = $this->pdo->prepare(
      'INSERT INTO notifications
       (user_id, type, post_id, board_id, post_title, actor_name, comment_id, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())'
    );
    $stmt->execute([
      $userId,
      $type,
      1,  // post_id
      1,  // board_id
      'Test Post Title',
      $actorName,
      null,  // comment_id
      0      // is_read
    ]);
    $id = (int) $this->pdo->lastInsertId();
    $this->testNotificationIds[] = $id;
    return $id;
  }

  /**
   * 테스트 1: 알림 생성
   */
  public function testNotificationCreation(): void
  {
    echo "\n[테스트] 알림 생성\n";

    $this->setUp();

    // Model 클래스의 create() 메서드 사용
    Notification::create(
      $this->testUserId1,
      'comment_on_post',
      1,     // postId
      1,     // boardId
      'Test Post Title',
      'Commenter Name'
    );

    // 생성된 알림 조회
    $stmt = $this->pdo->prepare(
      'SELECT id FROM notifications WHERE user_id=? AND post_id=? ORDER BY created_at DESC LIMIT 1'
    );
    $stmt->execute([$this->testUserId1, 1]);
    $result = $stmt->fetch();

    $this->assert(
      '알림 생성 후 DB에서 조회 가능',
      $result !== false && isset($result['id']),
      'row: ' . json_encode($result)
    );

    if ($result) {
      $this->testNotificationIds[] = (int) $result['id'];
    }

    $this->tearDown();
  }

  /**
   * 테스트 2: 미읽음 수 조회
   */
  public function testUnreadCount(): void
  {
    echo "\n[테스트] 미읽음 알림 수 조회\n";

    $this->setUp();

    // 3개 알림 생성 (is_read=0)
    for ($i = 0; $i < 3; $i++) {
      $this->createTestNotification($this->testUserId1, 'comment_on_post', "Actor {$i}");
    }

    // unreadCount 조회
    $unreadCount = Notification::unreadCount($this->testUserId1);

    $this->assert(
      '3개 미읽음 알림 수 조회',
      $unreadCount === 3,
      "actual: {$unreadCount}"
    );

    $this->tearDown();
  }

  /**
   * 테스트 3: 단일 알림 읽음 처리
   */
  public function testMarkSingleAsRead(): void
  {
    echo "\n[테스트] 단일 알림 읽음 처리\n";

    $this->setUp();

    // 2개 알림 생성
    $id1 = $this->createTestNotification($this->testUserId1, 'comment_on_post', 'Actor 1');
    $id2 = $this->createTestNotification($this->testUserId1, 'comment_on_post', 'Actor 2');

    // id1만 읽음 처리
    Notification::markRead($id1, $this->testUserId1);

    // 읽음 상태 확인
    $stmt = $this->pdo->prepare('SELECT is_read FROM notifications WHERE id=?');
    $stmt->execute([$id1]);
    $result1 = $stmt->fetchColumn();

    $stmt->execute([$id2]);
    $result2 = $stmt->fetchColumn();

    $this->assert(
      'id1은 읽음 처리됨 (is_read=1)',
      $result1 == 1,
      "actual: {$result1}"
    );

    $this->assert(
      'id2는 여전히 미읽음 (is_read=0)',
      $result2 == 0,
      "actual: {$result2}"
    );

    $unreadCount = Notification::unreadCount($this->testUserId1);
    $this->assert(
      'unreadCount = 1',
      $unreadCount === 1,
      "actual: {$unreadCount}"
    );

    $this->tearDown();
  }

  /**
   * 테스트 4: 전체 읽음 처리
   */
  public function testMarkAllAsRead(): void
  {
    echo "\n[테스트] 전체 알림 읽음 처리\n";

    $this->setUp();

    // 5개 알림 생성
    for ($i = 0; $i < 5; $i++) {
      $this->createTestNotification($this->testUserId1, 'comment_on_post', "Actor {$i}");
    }

    // 전체 읽음 처리 전 미읽음 수 확인
    $unreadBefore = Notification::unreadCount($this->testUserId1);
    $this->assert(
      '처리 전 미읽음 수 = 5',
      $unreadBefore === 5,
      "actual: {$unreadBefore}"
    );

    // 전체 읽음 처리
    Notification::markAllRead($this->testUserId1);

    // 처리 후 미읽음 수 확인
    $unreadAfter = Notification::unreadCount($this->testUserId1);
    $this->assert(
      '처리 후 미읽음 수 = 0',
      $unreadAfter === 0,
      "actual: {$unreadAfter}"
    );

    // DB에서 모든 알림의 is_read=1 확인
    $stmt = $this->pdo->prepare(
      'SELECT COUNT(*) FROM notifications WHERE user_id=? AND is_read=1'
    );
    $stmt->execute([$this->testUserId1]);
    $readCount = (int) $stmt->fetchColumn();

    $this->assert(
      'DB의 모든 알림이 읽음 처리됨',
      $readCount === 5,
      "actual: {$readCount}"
    );

    $this->tearDown();
  }

  /**
   * 테스트 5: 알림 목록 최신순 조회
   */
  public function testNotificationListOrdering(): void
  {
    echo "\n[테스트] 알림 목록 최신순 조회\n";

    $this->setUp();

    // 3개 알림 생성 (약간의 시간 차이)
    $ids = [];
    for ($i = 0; $i < 3; $i++) {
      $id = $this->createTestNotification($this->testUserId1, 'comment_on_post', "Actor {$i}");
      $ids[] = $id;
      if ($i < 2) {
        usleep(100000); // 100ms 대기
      }
    }

    // findByUser로 조회 (ORDER BY created_at DESC)
    $notifications = Notification::findByUser($this->testUserId1, 30);

    $this->assert(
      '알림 목록이 배열 형식으로 반환됨',
      is_array($notifications),
      'type: ' . gettype($notifications)
    );

    $this->assert(
      '3개 알림이 조회됨',
      count($notifications) === 3,
      "actual: " . count($notifications)
    );

    // 첫 번째 항목이 가장 최신인지 확인
    if (count($notifications) >= 2) {
      $first = strtotime($notifications[0]['created_at'] ?? '');
      $second = strtotime($notifications[1]['created_at'] ?? '');

      $this->assert(
        '첫 번째 알림이 가장 최신 (created_at DESC)',
        $first >= $second,
        "first: {$first}, second: {$second}"
      );
    }

    $this->tearDown();
  }

  /**
   * 테스트 6: 사용자 간 알림 독립성
   */
  public function testNotificationIsolationBetweenUsers(): void
  {
    echo "\n[테스test] 사용자 간 알림 독립성\n";

    $this->setUp();

    // 사용자1에 3개, 사용자2에 2개 알림 생성
    for ($i = 0; $i < 3; $i++) {
      $this->createTestNotification($this->testUserId1, 'comment_on_post', "Actor {$i}");
    }
    for ($i = 0; $i < 2; $i++) {
      $this->createTestNotification($this->testUserId2, 'comment_on_post', "Actor {$i}");
    }

    // 각 사용자의 미읽음 수 확인
    $count1 = Notification::unreadCount($this->testUserId1);
    $count2 = Notification::unreadCount($this->testUserId2);

    $this->assert(
      '사용자1 미읽음 수 = 3',
      $count1 === 3,
      "actual: {$count1}"
    );

    $this->assert(
      '사용자2 미읽음 수 = 2',
      $count2 === 2,
      "actual: {$count2}"
    );

    // 사용자1 전체 읽음 처리
    Notification::markAllRead($this->testUserId1);

    // 사용자2는 여전히 미읽음 상태
    $count1After = Notification::unreadCount($this->testUserId1);
    $count2After = Notification::unreadCount($this->testUserId2);

    $this->assert(
      '사용자1 markAllRead 후 미읽음 수 = 0',
      $count1After === 0,
      "actual: {$count1After}"
    );

    $this->assert(
      '사용자2는 여전히 미읽음 수 = 2',
      $count2After === 2,
      "actual: {$count2After}"
    );

    $this->tearDown();
  }

  /**
   * 테스트 7: 알림 type 검증
   */
  public function testNotificationTypes(): void
  {
    echo "\n[테스트] 알림 type 검증\n";

    $this->setUp();

    $types = ['comment_on_post', 'reply_to_comment'];

    foreach ($types as $type) {
      Notification::create(
        $this->testUserId1,
        $type,
        1,
        1,
        'Test Post',
        'Test Actor'
      );
    }

    // DB에서 각 type이 저장되었는지 확인
    $stmt = $this->pdo->prepare(
      'SELECT DISTINCT type FROM notifications WHERE user_id=? ORDER BY type'
    );
    $stmt->execute([$this->testUserId1]);
    $savedTypes = $stmt->fetchAll(\PDO::FETCH_COLUMN);

    $this->assert(
      'comment_on_post type 저장됨',
      in_array('comment_on_post', $savedTypes),
      'types: ' . implode(',', $savedTypes)
    );

    $this->assert(
      'reply_to_comment type 저장됨',
      in_array('reply_to_comment', $savedTypes),
      'types: ' . implode(',', $savedTypes)
    );

    $this->tearDown();
  }

  /**
   * 테스트 8: 중복 알림 방지 (commentId 기반)
   *
   * 같은 commentId로 이미 unread 알림이 있으면 스킵
   */
  public function testDuplicateNotificationPrevention(): void
  {
    echo "\n[테스트] 중복 알림 방지 (commentId 기반)\n";

    $this->setUp();

    $commentId = 999;

    // 같은 commentId로 여러 번 create 호출
    Notification::create(
      $this->testUserId1,
      'reply_to_comment',
      1,
      1,
      'Test Post',
      'Test Actor',
      $commentId
    );

    Notification::create(
      $this->testUserId1,
      'reply_to_comment',
      1,
      1,
      'Test Post',
      'Test Actor',
      $commentId
    );

    // 두 번째 create는 무시되어야 함
    $stmt = $this->pdo->prepare(
      'SELECT COUNT(*) FROM notifications WHERE user_id=? AND comment_id=?'
    );
    $stmt->execute([$this->testUserId1, $commentId]);
    $count = (int) $stmt->fetchColumn();

    $this->assert(
      '같은 commentId는 1개만 저장됨 (중복 방지)',
      $count === 1,
      "actual: {$count}"
    );

    // 읽음 처리 후 다시 create하면 새로 추가되어야 함
    $ids = [];
    $stmt = $this->pdo->prepare(
      'SELECT id FROM notifications WHERE user_id=? AND comment_id=?'
    );
    $stmt->execute([$this->testUserId1, $commentId]);
    $result = $stmt->fetch();
    if ($result) {
      $ids[] = (int) $result['id'];
    }

    // 첫 번째 알림 읽음 처리
    if ($ids) {
      Notification::markRead($ids[0], $this->testUserId1);
    }

    // 같은 commentId로 다시 create (이미 read이므로 생성됨)
    Notification::create(
      $this->testUserId1,
      'reply_to_comment',
      1,
      1,
      'Test Post',
      'Test Actor',
      $commentId
    );

    $stmt->execute([$this->testUserId1, $commentId]);
    $countAfter = (int) $stmt->fetchColumn();

    $this->assert(
      '읽음 처리 후 같은 commentId는 새로 추가됨',
      $countAfter === 2,
      "actual: {$countAfter}"
    );

    $this->tearDown();
  }

  public function run(): void
  {
    echo "=== NotificationTest 실행 ===\n";
    $this->testNotificationCreation();
    $this->testUnreadCount();
    $this->testMarkSingleAsRead();
    $this->testMarkAllAsRead();
    $this->testNotificationListOrdering();
    $this->testNotificationIsolationBetweenUsers();
    $this->testNotificationTypes();
    $this->testDuplicateNotificationPrevention();

    echo "\n=== 결과: {$this->passed} 통과, {$this->failed} 실패 ===\n";
    exit($this->failed > 0 ? 1 : 0);
  }
}

(new NotificationTest())->run();
