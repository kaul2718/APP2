import type { MetadataRoute } from 'next';
import { getCanonicalUrl } from '@/lib/seoConfig';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: getCanonicalUrl('/'),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ];
}
