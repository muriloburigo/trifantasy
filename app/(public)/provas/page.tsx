import { createPublicClient } from '~/lib/supabase/server'
import BackLink from '~/app/components/BackLink'
import type { Race } from '~/lib/types'
import { getTranslations } from 'next-intl/server'
import RaceList from './RaceList'

export const revalidate = 900

export default async function ProvasPage() {
  const t = await getTranslations('races')
  const pub = createPublicClient()

  const { data: races } = await pub
    .from('races')
    .select('*')
    .order('date', { ascending: true })

  const all = (races ?? []) as Race[]
  const open     = all.filter(r => r.status === 'open')
  const upcoming = all.filter(r => r.status === 'upcoming')
  const finished = all.filter(r => r.status === 'finished')

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <BackLink href="/" />
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t('calendar')}</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          {open.length > 0 && <span className="text-[var(--color-success)] font-semibold">{t('openSummary', { n: open.length })}</span>}
          {t('upcomingSummary', { n: upcoming.length })}{t('finishedSummary', { n: finished.length })}
        </p>
      </div>

      <RaceList races={all} />
    </div>
  )
}
