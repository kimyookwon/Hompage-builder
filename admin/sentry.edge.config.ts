import * as Sentry from '@sentry/nextjs';

// Edge 런타임 Sentry 초기화
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // 프로덕션에서만 활성화
  enabled: process.env.NODE_ENV === 'production',
  // 트랜잭션 샘플링 비율 (10%)
  tracesSampleRate: 0.1,
});
