import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/p/', '/b/', '/boards'],
        disallow: ['/admin/', '/api/', '/auth/', '/preview/', '/my/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
