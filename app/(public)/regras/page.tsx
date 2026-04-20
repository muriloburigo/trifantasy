import type { Metadata } from 'next'
import Link from 'next/link'
import BackLink from '~/app/components/BackLink'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('rules')
  return { title: t('title'), description: t('subtitle') }
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold mb-3 text-[var(--color-orange)]">{n}. {title}</h2>
      <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-5 text-sm text-[var(--color-muted)] space-y-3 leading-relaxed">
        {children}
      </div>
    </section>
  )
}

function Example({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--color-navy-elevated)] border border-[var(--color-orange)]/20 rounded-xl p-3 text-xs text-[var(--color-muted)] italic leading-relaxed">
      <span className="text-[var(--color-orange)] font-bold not-italic mr-1">{label}</span>
      {children}
    </div>
  )
}

export default async function RegrasPage() {
  const t = await getTranslations('rules')

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <BackLink href="/" />

      <h1 className="text-3xl font-extrabold mb-2">{t('title')}</h1>
      <p className="text-[var(--color-muted)] mb-10">{t('subtitle')}</p>

      <div className="space-y-10">

        <Section n="1" title={t('s1Title')}>
          <p>{t('s1p1')}</p>
          <p>{t('s1p2')}</p>
          <Example label={t('exampleLabel')}>{t('s1example')}</Example>
        </Section>

        <Section n="2" title={t('s2Title')}>
          <p><strong className="text-white">{t('s2p1')}</strong></p>
          <ul className="space-y-1.5 list-disc list-inside">
            <li>{t('s2li1')}</li>
            <li>{t('s2li2')}</li>
            <li>{t('s2li3')}</li>
          </ul>
          <Example label={t('exampleLabel')}>{t('s2example')}</Example>
        </Section>

        <Section n="3" title={t('s3Title')}>
          <p>
            {t('s3p1')}{' '}
            <Link href="/atletas" className="text-[var(--color-orange)] hover:underline">/atletas</Link>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-navy-border)]">
                  <th className="text-left py-1.5 pr-4 font-semibold text-white">{t('s3tableHeader1')}</th>
                  <th className="text-left py-1.5 font-semibold text-white">{t('s3tableHeader2')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-navy-border)]">
                {[
                  ['≥ 95 pts (rank ~1–7)',   'T$35'],
                  ['≥ 90 pts (rank ~8–15)',  'T$28'],
                  ['≥ 85 pts (rank ~16–25)', 'T$22'],
                  ['≥ 80 pts (rank ~26–40)', 'T$18'],
                  ['≥ 75 pts (rank ~41–60)', 'T$15'],
                  ['≥ 70 pts (rank ~61–80)', 'T$12'],
                  ['≥ 60 pts (rank ~81–120)','T$11'],
                  ['— PTO',                  'T$10'],
                ].map(([r, p]) => (
                  <tr key={r}><td className="py-1.5 pr-4">{r}</td><td className="py-1.5 font-semibold text-white">{p}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>{t('s3p2')}</p>
          <ul className="space-y-1 list-disc list-inside text-xs">
            <li><strong className="text-[var(--color-success)]">{t('s3price1')}</strong></li>
            <li><strong className="text-[var(--color-success)]">{t('s3price2')}</strong></li>
            <li><strong className="text-[var(--color-success)]">{t('s3price3')}</strong></li>
            <li><strong className="text-[var(--color-danger)]">{t('s3price4')}</strong></li>
          </ul>
          <Example label={t('exampleLabel')}>{t('s3example')}</Example>
        </Section>

        <Section n="4" title={t('s4Title')}>
          <p>{t('s4p1')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[var(--color-navy-elevated)] rounded-xl p-3 text-center border border-green-900/40">
              <p className="text-xs font-bold text-[var(--color-success)] mb-1">{t('s4openLabel')}</p>
              <p className="text-[11px]">{t('s4openDesc')}</p>
            </div>
            <div className="bg-[var(--color-navy-elevated)] rounded-xl p-3 text-center border border-yellow-900/40">
              <p className="text-xs font-bold text-yellow-400 mb-1">{t('s4lockedLabel')}</p>
              <p className="text-[11px]">{t('s4lockedDesc')}</p>
            </div>
            <div className="bg-[var(--color-navy-elevated)] rounded-xl p-3 text-center border border-[var(--color-navy-border)]">
              <p className="text-xs font-bold text-white mb-1">{t('s4reopenLabel')}</p>
              <p className="text-[11px]">{t('s4reopenDesc')}</p>
            </div>
          </div>
          <p className="text-xs font-semibold text-yellow-400">{t('s4warning')}</p>
          <Example label={t('exampleLabel')}>{t('s4example')}</Example>
        </Section>

        <Section n="5" title={t('s5Title')}>
          <p>{t('s5p1')}</p>
          <ul className="space-y-1.5 list-disc list-inside">
            <li>{t('s5li1')}</li>
            <li>{t('s5li2')}</li>
            <li>{t('s5li3')}</li>
            <li>{t('s5li4')}</li>
          </ul>
          <Example label={t('exampleLabel')}>{t('s5example')}</Example>
        </Section>

        <Section n="6" title={t('s6Title')}>
          <p>{t('s6p1')}</p>
          <div className="max-w-xs">
            <table className="w-full text-xs">
              <tbody className="divide-y divide-[var(--color-navy-border)]">
                {[['1º','50'],['2º','40'],['3º','33'],['4º','27'],['5º','22'],['6º–10º','15'],['11º–15º','10'],['16º–20º','6'],['21º+','3'],['DNF/DNS','0']].map(([p, s]) => (
                  <tr key={p}><td className="py-1 pr-3">{p}</td><td className="py-1 font-bold text-white">{s} pts</td></tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] mt-2 text-[var(--color-success)]">{t('s6bonus')}</p>
          </div>
        </Section>

        <Section n="7" title={t('s7Title')}>
          <p>{t('s7p1')}</p>
          <ul className="space-y-2 list-disc list-inside">
            <li>{t('s7li1')}</li>
            <li>{t('s7li2')}</li>
            <li>{t('s7li3')}</li>
          </ul>
          <Example label={t('exampleLabel')}>{t('s7example')}</Example>
        </Section>

        <Section n="8" title={t('s8Title')}>
          <ul className="space-y-2 list-disc list-inside">
            <li>{t('s8li1')}</li>
            <li>{t('s8li2')}</li>
            <li>{t('s8li3')}</li>
            <li>{t('s8li4')}</li>
            <li>
              {t('s8li5').split(t('s8li5Link'))[0]}
              <Link href="/elenco" className="text-[var(--color-orange)] hover:underline">{t('s8li5Link')}</Link>
              {t('s8li5').split(t('s8li5Link'))[1]}
            </li>
          </ul>
        </Section>

        <Section n="9" title={t('s9Title')}>
          <ul className="space-y-2 list-disc list-inside">
            <li>{t('s9li1')}</li>
            <li>{t('s9li2')}</li>
            <li>{t('s9li3')}</li>
            <li>{t('s9li4')}</li>
          </ul>
        </Section>

      </div>

      <div className="mt-12 text-center">
        <Link
          href="/register"
          className="inline-block bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white font-semibold px-8 py-3 rounded-xl text-sm transition-colors"
        >
          {t('cta')}
        </Link>
      </div>
    </div>
  )
}
