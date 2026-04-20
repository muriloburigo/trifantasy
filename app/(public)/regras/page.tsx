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

        <Section n="3" title={t('s4Title')}>
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

        <Section n="4" title={t('s5Title')}>
          <p>{t('s5p1')}</p>
          <ul className="space-y-1.5 list-disc list-inside">
            <li>{t('s5li1')}</li>
            <li>{t('s5li2')}</li>
            <li>{t('s5li3')}</li>
            <li>{t('s5li4')}</li>
          </ul>
          <Example label={t('exampleLabel')}>{t('s5example')}</Example>
        </Section>

        <Section n="5" title={t('s7Title')}>
          <p>{t('s7p1')}</p>
          <ul className="space-y-2 list-disc list-inside">
            <li>{t('s7li1')}</li>
            <li>{t('s7li2')}</li>
            <li>{t('s7li3')}</li>
          </ul>
          <Example label={t('exampleLabel')}>{t('s7example')}</Example>
        </Section>

        <Section n="6" title={t('s8Title')}>
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

        <Section n="7" title={t('s9Title')}>
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
