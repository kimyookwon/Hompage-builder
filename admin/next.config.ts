import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api').replace(/\/api$/, '');

const nextConfig: NextConfig = {
  // 워크스페이스 루트 경고 제거
  outputFileTracingRoot: require('path').join(__dirname, '../'),
  // Docker 프로덕션 빌드용 standalone 모드
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  // 개발 서버에서 API + 업로드 파일 프록시
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_ORIGIN}/api/:path*`,
      },
      // 업로드된 이미지를 PHP 서버에서 프록시
      {
        source: '/uploads/:path*',
        destination: `${API_ORIGIN}/uploads/:path*`,
      },
      // 공개 API 프록시
      {
        source: '/public/:path*',
        destination: `${API_ORIGIN}/public/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      // 개발 환경 PHP 서버 이미지
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
      },
      // 외부 https 이미지 허용
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

// SENTRY_DSN이 설정된 경우에만 Sentry 래핑 적용 (빌드 영향 최소화)
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      // 빌드 로그 억제
      silent: true,
      // 더 많은 클라이언트 파일 업로드
      widenClientFileUpload: true,
      // 번들에서 소스맵 숨김 (sourcemaps.deleteSourcemapsAfterUpload)
      sourcemaps: { deleteSourcemapsAfterUpload: true },
      // Sentry SDK 내부 로거 비활성화 (번들 크기 절감)
      disableLogger: true,
      // Vercel 자동 모니터 비활성화
      automaticVercelMonitors: false,
    })
  : nextConfig;
