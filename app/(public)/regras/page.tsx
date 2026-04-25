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
          <p>{t('s3p1')}</p>
          <div className="grid grid-cols-2 gap-4 max-w-sm mb-4">
            <div className="bg-[var(--color-navy-elevated)] p-3 rounded-xl border border-[var(--color-navy-border)]">
              <p className="text-[10px] uppercase font-bold text-[var(--color-muted)] mb-1">{t('s3tableHeader1')}</p>
              <p className="text-sm font-bold text-white">#1 – #7</p>
              <p className="text-sm font-bold text-white">#8 – #15</p>
              <p className="text-sm font-bold text-white">#16 – #25</p>
            </div>
            <div className="bg-[var(--color-navy-elevated)] p-3 rounded-xl border border-[var(--color-navy-border)] text-right">
              <p className="text-[10px] uppercase font-bold text-[var(--color-muted)] mb-1">{t('s3tableHeader2')}</p>
              <p className="text-sm font-black text-[var(--color-orange)]">T$35</p>
              <p className="text-sm font-black text-[var(--color-orange)]">T$28</p>
              <p className="text-sm font-black text-[var(--color-orange)]">T$22</p>
            </div>
          </div>
          <p>{t('s3p2')}</p>
          <ul className="space-y-1 list-disc list-inside text-xs">
            <li>{t('s3price1')}</li>
            <li>{t('s3price2')}</li>
            <li>{t('s3price3')}</li>
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
          </ul>
          <Example label={t('exampleLabel')}>{t('s5example')}</Example>
        </Section>

        <Section n="6" title={t('s6Title')}>
          <p>{t('s6p1')}</p>
          <div className="grid grid-cols-2 gap-4 max-w-xs my-2">
            <div className="bg-[var(--color-navy-elevated)] p-3 rounded-xl border border-[var(--color-navy-border)]">
              <p className="text-[10px] uppercase font-bold text-[var(--color-muted)] mb-1">{t('s6tablePos')}</p>
              {[t('s6row1'),t('s6row2'),t('s6row3'),t('s6row4'),t('s6row5'),t('s6row6'),t('s6row7'),t('s6row8'),t('s6row9')].map(r => (
                <p key={r} className="text-sm text-white">{r}</p>
              ))}
            </div>
            <div className="bg-[var(--color-navy-elevated)] p-3 rounded-xl border border-[var(--color-navy-border)] text-right">
              <p className="text-[10px] uppercase font-bold text-[var(--color-muted)] mb-1">{t('s6tablePts')}</p>
              {[['50','orange'],['40','orange'],['33','orange'],['27','orange'],['22','orange'],['15','orange'],['8','white'],['3','white'],['0','muted']].map(([pts, color]) => (
                <p key={pts+color} className={`text-sm font-black ${color === 'orange' ? 'text-[var(--color-orange)]' : color === 'white' ? 'text-white' : 'text-[var(--color-muted)]'}`}>{pts}</p>
              ))}
            </div>
          </div>
          <p className="font-bold text-white mt-1">{t('s6bonus')}</p>
        </Section>

        <Section n="7" title={t('s7Title')}>
          <p>{t('s7p1')}</p>
          <ul className="space-y-1.5 list-disc list-inside">
            <li>{t('s7li1')}</li>
            <li>{t('s7li2')}</li>
          </ul>
        </Section>

        <Section n="8" title={t('s8Title')}>
          <ul className="space-y-2 list-disc list-inside">
            <li>{t('s8li1')}</li>
            <li>{t('s8li2')}</li>
            <li>
              {t('s8li3').split(t('s8li3Link'))[0]}
              <Link href="/elenco" className="text-[var(--color-orange)] hover:underline font-bold">{t('s8li3Link')}</Link>
              {t('s8li3').split(t('s8li3Link'))[1]}
            </li>
          </ul>
        </Section>

        <Section n="9" title={t('s9Title')}>
          <ul className="space-y-2 list-disc list-inside">
            <li>{t('s9li1')}</li>
            <li>{t('s9li2')}</li>
            <li>{t('s9li3')}</li>
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
