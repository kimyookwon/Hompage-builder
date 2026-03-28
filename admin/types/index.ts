// 사용자 역할 타입
export type UserRole = 'admin' | 'user';

// 사용자 타입
export interface User {
  id: number;
  email: string;
  name: string;
  avatarUrl?: string | null;
  role: UserRole;
  status: 'active' | 'blocked';
  oauthProvider?: 'google' | 'kakao' | 'naver';
  createdAt: string;
  updatedAt: string;
}

// 인증 토큰 타입
export interface AuthToken {
  token: string;
  expiresAt: string;
}

// API 공통 성공 응답 타입
export interface ApiResponse<T> {
  success: true;
  data: T;
}

// API 에러 응답 타입
export interface ApiError {
  success: false;
  error: string;
  code: number;
}

// 페이지네이션 타입
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 페이지네이션 응답 타입
export interface PaginatedResponse<T> {
  success: true;
  data: {
    items: T[];
    pagination: Pagination;
  };
}

// 섹션 타입 열거형
export type SectionType = 'header' | 'container' | 'banner' | 'footer';
export type SectionFormat = 'bento' | 'glassmorphism' | 'organic' | 'text' | 'gallery' | 'board_widget';

// 페이지 섹션 타입
export interface PageSection {
  id: number;
  pageId: number;
  type: SectionType;
  format: SectionFormat;
  content: Record<string, unknown>;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// 페이지 타입
export interface Page {
  id: number;
  title: string;
  slug: string;
  isPublished: boolean;
  seoDescription?: string | null;
  seoOgImage?: string | null;
  createdAt: string;
  updatedAt: string;
}

// 게시판 타입
export interface Board {
  id: number;
  name: string;
  description: string | null;
  type: 'general' | 'gallery';
  readPermission: 'admin_only' | 'user' | 'public';
  writePermission: 'admin_only' | 'user';
  postCount?: number;
  createdAt: string;
  updatedAt: string;
}

// 게시글 인접 포스트 타입
export interface AdjacentPost {
  id: number;
  title: string;
}

// 게시글 타입
export interface PostTag {
  id: number;
  name: string;
}

export interface Post {
  id: number;
  boardId: number;
  authorId: number;
  authorName: string;
  boardName?: string;
  title: string;
  content: string;
  isNotice: boolean;
  thumbnailUrl?: string | null;
  commentCount: number;
  viewCount: number;
  likeCount: number;
  liked: boolean;
  bookmarked?: boolean;
  prevPost?: AdjacentPost | null;
  nextPost?: AdjacentPost | null;
  attachments?: PostAttachment[];
  tags?: PostTag[];
  createdAt: string;
  updatedAt: string;
}

// 북마크된 게시글 타입
export interface BookmarkedPost {
  id: number;
  title: string;
  boardId: number;
  boardName: string;
  createdAt: string; // 북마크한 시각
}

// 첨부파일 타입
export interface PostAttachment {
  id: number;
  postId: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  downloadCount?: number;
  createdAt: string;
}

// 신고 타입
export interface Report {
  id: number;
  commentId: number;
  commentContent: string;
  reporterName: string;
  reason: 'spam' | 'abuse' | 'inappropriate' | 'other';
  status: 'pending' | 'reviewed' | 'dismissed';
  note: string | null;
  createdAt: string;
}

// 알림 타입
export interface Notification {
  id: number;
  type: 'comment_on_post' | 'reply_to_comment';
  postId: number;
  boardId: number;
  postTitle: string;
  actorName: string;
  isRead: boolean;
  createdAt: string;
}

// 댓글 타입
export interface Comment {
  id: number;
  postId: number;
  parentId?: number | null;
  authorId: number;
  authorName: string;
  authorAvatarUrl?: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// 사이트 설정 타입
export interface SiteSettings {
  id: number;
  siteName: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  gtmCode: string | null;
  homeSlug: string | null;
  noticeEnabled: boolean;
  noticeText: string | null;
  noticeColor: string;
  siteUrl: string | null;
  robotsTxt: string | null;
  updatedAt: string;
}

// 공개 프로필 최근 게시글 항목
export interface PublicProfilePost {
  id: number;
  title: string;
  boardName: string;
  boardId: number;
  createdAt: string;
}

// 공개 사용자 프로필
export interface PublicUserProfile {
  id: number;
  name: string;
  avatarUrl: string | null;
  role: 'admin' | 'user';
  createdAt: string;
  postCount: number;
  commentCount: number;
  recentPosts: PublicProfilePost[];
}
