import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import BackLink from '~/app/components/BackLink'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('privacy')
  return { title: t('title') }
}

export default async function PrivacidadePage() {
  const t = await getTranslations('privacy')

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <BackLink href="/" />
      <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
      <p className="text-sm text-[var(--color-muted)] mb-8">{t('updated')}</p>

      <div className="prose prose-invert max-w-none space-y-8 text-sm text-[var(--color-text)] leading-relaxed">

        <section>
          <h2 className="text-base font-bold mb-2">{t('s1Title')}</h2>
          <p>{t('s1p1')}</p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">{t('s2Title')}</h2>
          <p>{t('s2p1')}</p>
          <ul className="list-disc list-inside space-y-1 mt-2 text-[var(--color-muted)]">
            <li>{t('s2li1')}</li>
            <li>{t('s2li2')}</li>
            <li>{t('s2li3')}</li>
            <li>{t('s2li4')}</li>
          </ul>
          <p className="mt-2">{t('s2p2')}</p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">{t('s3Title')}</h2>
          <ul className="list-disc list-inside space-y-1 text-[var(--color-muted)]">
            <li>{t('s3li1')}</li>
            <li>{t('s3li2')}</li>
            <li>{t('s3li3')}</li>
            <li>{t('s3li4')}</li>
          </ul>
          <p className="mt-2">{t('s3p1')}</p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">{t('s4Title')}</h2>
          <p>{t('s4p1')}</p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">{t('s5Title')}</h2>
          <p>{t('s5p1')}</p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">{t('s6Title')}</h2>
          <p>{t('s6p1')}</p>
          <ul className="list-disc list-inside space-y-1 mt-2 text-[var(--color-muted)]">
            <li>{t('s6li1')}</li>
            <li>{t('s6li2')}</li>
            <li>{t('s6li3')}</li>
          </ul>
          <p className="mt-2">
            {t('s6p2')}{' '}
            <a href="mailto:contato@trixer.app" className="text-[var(--color-orange)] hover:underline">
              contato@trixer.app
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">{t('s7Title')}</h2>
          <p>{t('s7p1')}</p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">{t('s8Title')}</h2>
          <p>{t('s8p1')}</p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">{t('s9Title')}</h2>
          <p>{t('s9p1')}</p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">{t('s10Title')}</h2>
          <p>
            {t('s10p1')}{' '}
            <a href="mailto:contato@trixer.app" className="text-[var(--color-orange)] hover:underline">
              contato@trixer.app
            </a>
          </p>
        </section>

      </div>
    </div>
  )
}
