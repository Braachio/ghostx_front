import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/_next/',
        '/static/',
        '/mobile/settings',
        '/events/regular/*/new',
        '/multis/new',
        '/profile',
        '/dashboard',
        '/login',
        '/signup',
        '/onboarding',
      ],
    },
    sitemap: 'https://ghostx.site/sitemap.xml',
  }
}
