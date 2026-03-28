import type { NextConfig } from 'next';

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api').replace(/\/api$/, '');

const nextConfig: NextConfig = {
  // 워크스페이스 루트 경고 제거
  outputFileTracingRoot: require('path').join(__dirname, '../'),
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

export default nextConfig;
