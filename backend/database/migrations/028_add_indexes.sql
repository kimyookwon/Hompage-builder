-- 쿼리 성능 최적화를 위한 복합 인덱스 추가
-- 작성일: 2026-03-28
-- 목적: WHERE, ORDER BY, JOIN 절 최적화

-- ============================================
-- posts 테이블 복합 인덱스
-- ============================================

-- 게시판별 최신 게시글 조회 최적화
-- Query: WHERE board_id = ? ORDER BY created_at DESC / is_notice DESC, created_at DESC
ALTER TABLE posts ADD INDEX IF NOT EXISTS idx_posts_board_created (board_id, created_at);

-- 작성자별 게시글 조회 최적화
-- Query: WHERE author_id = ? ORDER BY created_at DESC
ALTER TABLE posts ADD INDEX IF NOT EXISTS idx_posts_author_created (author_id, created_at);

-- 공지사항 상단 고정 + 최신순 정렬 최적화
-- Query: WHERE board_id = ? ORDER BY is_notice DESC, created_at DESC
ALTER TABLE posts ADD INDEX IF NOT EXISTS idx_posts_notice_created (is_notice, created_at);

-- 뷰 수 기반 인기 게시글 정렬 (ORDER BY view_count DESC)
-- Query: ORDER BY view_count DESC LIMIT ?
ALTER TABLE posts ADD INDEX IF NOT EXISTS idx_posts_view_count_desc (view_count DESC);

-- ============================================
-- comments 테이블 복합 인덱스
-- ============================================

-- 게시글의 댓글 조회 최적화 (부모 댓글 우선, 시간순)
-- Query: WHERE post_id = ? ORDER BY COALESCE(parent_id, id) ASC, id ASC
ALTER TABLE comments ADD INDEX IF NOT EXISTS idx_comments_post_created (post_id, created_at);

-- 작성자별 댓글 조회 최적화
-- Query: WHERE author_id = ? 또는 작성자의 댓글 수 조회 최적화
ALTER TABLE comments ADD INDEX IF NOT EXISTS idx_comments_author_created (author_id, created_at);

-- ============================================
-- users 테이블 인덱스
-- ============================================

-- 역할 및 상태별 사용자 조회 최적화
-- Query: WHERE role = 'admin' OR WHERE status = 'active'
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_users_status (status);
ALTER TABLE users ADD INDEX IF NOT EXISTS idx_users_role (role);

-- ============================================
-- post_tags 테이블 인덱스
-- ============================================

-- 태그별 게시글 조회 최적화 (Join 최적화)
-- Query: SELECT ... FROM post_tags WHERE tag_id = ? JOIN posts ...
ALTER TABLE post_tags ADD INDEX IF NOT EXISTS idx_post_tags_tag_post (tag_id, post_id);

-- ============================================
-- post_bookmarks 테이블 인덱스
-- ============================================

-- 사용자의 북마크 조회 최적화 (이미 idx_user_bookmarks 있음)
-- post_id 기준 북마크 조회 최적화 (게시글 삭제 시)
ALTER TABLE post_bookmarks ADD INDEX IF NOT EXISTS idx_bookmarks_post_id (post_id);

-- ============================================
-- reports 테이블 인덱스
-- ============================================

-- 댓글별 신고 조회 및 상태별 신고 목록
-- Query: WHERE status = 'pending' OR WHERE comment_id = ?
ALTER TABLE reports ADD INDEX IF NOT EXISTS idx_reports_status_created (status, created_at);

-- 신고 댓글 조회
ALTER TABLE reports ADD INDEX IF NOT EXISTS idx_reports_comment_id (comment_id);

-- ============================================
-- admin_logs 테이블 인덱스
-- ============================================

-- 관리자별 로그 조회 최적화 (이미 idx_admin, idx_created 있음)
-- 액션과 생성시간 기반 로그 조회 최적화
ALTER TABLE admin_logs ADD INDEX IF NOT EXISTS idx_admin_logs_action_created (action, created_at);

-- ============================================
-- password_reset_tokens 테이블 인덱스
-- ============================================

-- 만료된 토큰 정리용 (이미 idx_expires 있음)
-- 이메일과 사용 여부 기반 조회 최적화
ALTER TABLE password_reset_tokens ADD INDEX IF NOT EXISTS idx_password_reset_email_used (email, used_at);

-- ============================================
-- page_sections 테이블 인덱스
-- ============================================

-- 페이지의 섹션 순서 조회 (이미 idx_page_order 있음)
-- type별 섹션 조회 최적화
ALTER TABLE page_sections ADD INDEX IF NOT EXISTS idx_page_sections_type (type);

-- ============================================
-- site_notices 테이블 인덱스
-- ============================================

-- 활성 공지사항 조회 + 정렬 (is_active = true일 때)
-- Query: WHERE is_active = 1 ORDER BY sort_order ASC
ALTER TABLE site_notices ADD INDEX IF NOT EXISTS idx_site_notices_active_order (is_active, sort_order);

-- 시간 범위 기반 활성 공지 조회
ALTER TABLE site_notices ADD INDEX IF NOT EXISTS idx_site_notices_datetime (starts_at, ends_at);

-- ============================================
-- point_logs 테이블 인덱스
-- ============================================

-- 사용자의 포인트 로그 조회 (이미 idx_user 있음)
-- 사용자별 최근 로그 조회 최적화
ALTER TABLE point_logs ADD INDEX IF NOT EXISTS idx_point_logs_user_created (user_id, created_at DESC);

-- ============================================
-- post_attachments 테이블 인덱스
-- ============================================

-- 게시글의 첨부파일 조회 (이미 idx_attach_post 있음)
-- 다운로드 횟수가 많은 파일 조회
ALTER TABLE post_attachments ADD INDEX IF NOT EXISTS idx_post_attachments_download_count (download_count DESC);

-- ============================================
-- media_assets 테이블 인덱스
-- ============================================

-- 업로드 사용자별 미디어 조회 (이미 idx_uploaded_by, idx_created_at 있음)
-- 파일명 기반 검색 최적화 (추후 FULLTEXT 고려)
ALTER TABLE media_assets ADD INDEX IF NOT EXISTS idx_media_assets_filename (filename);

-- ============================================
-- notifications 테이블 인덱스
-- ============================================

-- 사용자별 미읽음 알림 조회 (이미 idx_notif_user(user_id, is_read, created_at) 있음)
-- 타입별 알림 조회 최적화
ALTER TABLE notifications ADD INDEX IF NOT EXISTS idx_notifications_type (notification_type);

-- ============================================
-- 주석: 이미 존재하는 핵심 인덱스
-- ============================================

-- users:
--   - PRIMARY KEY (id)
--   - UNIQUE (email)
--   - UNIQUE (oauth_provider, oauth_id)
--   - INDEX (oauth_provider)

-- posts:
--   - PRIMARY KEY (id)
--   - FOREIGN KEY (board_id, author_id)
--   - INDEX (board_id)
--   - INDEX (author_id)
--   - INDEX (created_at)
--   - INDEX (board_id, is_notice)
--   - FULLTEXT (title, content) with ngram parser

-- comments:
--   - PRIMARY KEY (id)
--   - FOREIGN KEY (post_id, author_id)
--   - INDEX (post_id)
--   - INDEX (author_id)
--   - INDEX (parent_id)

-- pages:
--   - PRIMARY KEY (id)
--   - UNIQUE (slug)
--   - INDEX (is_published)

-- page_sections:
--   - PRIMARY KEY (id)
--   - FOREIGN KEY (page_id)
--   - INDEX (page_id)
--   - INDEX (page_id, order)

-- boards:
--   - PRIMARY KEY (id)
--   - INDEX (created_at)

-- ============================================
-- 선택적: 추후 개선 고려사항
-- ============================================

-- 1. posts 테이블 커버링 인덱스 (대시보드 성능 향상)
--    CREATE INDEX idx_posts_board_created_author
--    ON posts(board_id, created_at, author_id, title)
--    → 많은 SELECT 쿼리를 커버링 인덱스로 처리 가능
--    → 테이블 I/O 제거, 더 빠른 응답
--    → 인덱스 크기 증가 주의 (INSERT/UPDATE 오버헤드)

-- 2. comments 풀텍스트 검색
--    ALTER TABLE comments ADD FULLTEXT INDEX ft_comments_content (content) WITH PARSER ngram;
--    → "댓글 검색" 기능 추가 시 필요

-- 3. 파티셔닝 (대규모 데이터)
--    - posts: board_id 기반 Range 파티셔닝
--    - comments: post_id 기반 Range 파티셔닝
--    → 매월 또는 분기별 파티션 추가 (관리 필요)

-- 4. 읽기 복제본 (Read Replica) 구성
--    - 분석 쿼리를 복제본으로 오프로드
--    → 메인 DB 부하 감소, 읽기 성능 향상
