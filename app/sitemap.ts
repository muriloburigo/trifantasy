import { MetadataRoute } from 'next'
import { createPublicClient } from '~/lib/supabase/server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trixer.com.br'
  const pub = createPublicClient()

  // 1. Static routes
  const routes = ['', '/atletas', '/provas', '/regras', '/ligas'].map(route => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1,
  }))

  // 2. Dynamic: Athletes
  const { data: athletes } = await pub.from('athletes').select('id, created_at')
  const athleteRoutes = (athletes ?? []).map(a => ({
    url: `${siteUrl}/atletas/${a.id}`,
    lastModified: new Date(a.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // 3. Dynamic: Races
  const { data: races } = await pub.from('races').select('slug, date')
  const raceRoutes = (races ?? []).map(r => ({
    url: `${siteUrl}/provas/${r.slug}`,
    lastModified: new Date(r.date),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  return [...routes, ...athleteRoutes, ...raceRoutes]
}
