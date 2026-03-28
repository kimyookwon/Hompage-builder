import * as Sentry from '@sentry/nextjs';

// 클라이언트 사이드 Sentry 초기화
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  // 프로덕션에서만 활성화
  enabled: process.env.NODE_ENV === 'production',
  // 트랜잭션 샘플링 비율 (10%)
  tracesSampleRate: 0.1,
  // 소스맵 업로드용 릴리즈 버전
  release: process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0',
});
