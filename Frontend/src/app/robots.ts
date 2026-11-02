import type { MetadataRoute } from 'next';
import { getRawSiteUrl } from '@/lib/seoConfig';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getRawSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/admin/',
          '/api/',
          '/_next/',
          '/ver-*',
          '/ingresar-*',
          '/reportes/',
          '/items/',
        ],
      },
    ],
    sitemap: siteUrl ? `${siteUrl}/sitemap.xml` : undefined,
  };
}
