import BackLink from '~/app/components/BackLink'

export const metadata = {
  title: 'Política de Privacidade — Trixer',
}

export default function PrivacidadePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <BackLink href="/" />
      <h1 className="text-2xl font-bold mb-2">Política de Privacidade</h1>
      <p className="text-sm text-[var(--color-muted)] mb-8">Última atualização: abril de 2026</p>

      <div className="prose prose-invert max-w-none space-y-8 text-sm text-[var(--color-text)] leading-relaxed">

        <section>
          <h2 className="text-base font-bold mb-2">1. Quem somos</h2>
          <p>
            Trixer é uma plataforma de fantasy esportivo voltada para o circuito profissional de triathlon (IRONMAN e 70.3).
            Este documento descreve como coletamos, usamos e protegemos as informações dos usuários.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">2. Dados coletados</h2>
          <p>Ao se cadastrar e usar o Trixer, coletamos:</p>
          <ul className="list-disc list-inside space-y-1 mt-2 text-[var(--color-muted)]">
            <li>Nome de usuário e endereço de e-mail (para autenticação)</li>
            <li>Ações dentro do jogo: compras, vendas e escalações de atletas</li>
            <li>Participação em ligas e pontuações obtidas</li>
            <li>Dados de sessão e logs de acesso (para segurança e diagnóstico)</li>
          </ul>
          <p className="mt-2">Não coletamos dados de pagamento. O Trixer é gratuito.</p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">3. Como usamos seus dados</h2>
          <ul className="list-disc list-inside space-y-1 text-[var(--color-muted)]">
            <li>Operar o jogo: exibir seu elenco, time, pontuações e ranking</li>
            <li>Comunicar atualizações relevantes da plataforma</li>
            <li>Gerar estatísticas agregadas e anônimas sobre uso do jogo</li>
            <li>Prevenir fraudes e garantir a integridade do jogo</li>
          </ul>
          <p className="mt-2">Não vendemos nem compartilhamos seus dados pessoais com terceiros para fins comerciais.</p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">4. Armazenamento e segurança</h2>
          <p>
            Os dados são armazenados na plataforma Supabase, hospedada em infraestrutura segura com criptografia em trânsito (TLS)
            e em repouso. O acesso é restrito por Row Level Security (RLS) — cada usuário acessa apenas seus próprios dados.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">5. Dados de atletas</h2>
          <p>
            As informações sobre atletas profissionais (nome, nacionalidade, ranking PTO, resultados de provas) são de caráter
            público e obtidas de fontes abertas como a PTO (Professional Triathletes Organisation) e resultados oficiais do
            IRONMAN. Não armazenamos dados pessoais sensíveis de atletas.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">6. Seus direitos</h2>
          <p>Você pode a qualquer momento:</p>
          <ul className="list-disc list-inside space-y-1 mt-2 text-[var(--color-muted)]">
            <li>Solicitar a exclusão da sua conta e todos os dados associados</li>
            <li>Solicitar uma cópia dos dados que temos sobre você</li>
            <li>Corrigir informações incorretas no seu perfil</li>
          </ul>
          <p className="mt-2">
            Para exercer esses direitos, entre em contato pelo e-mail:{' '}
            <a href="mailto:contato@trifantasy.com" className="text-[var(--color-orange)] hover:underline">
              contato@trifantasy.com
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">7. Cookies e rastreamento</h2>
          <p>
            Utilizamos cookies estritamente necessários para autenticação e manutenção de sessão. Não utilizamos cookies
            de rastreamento publicitário ou ferramentas de analytics de terceiros.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">8. Menores de idade</h2>
          <p>
            O Trixer não é direcionado a menores de 13 anos. Se tomarmos conhecimento de que coletamos dados de
            menores sem consentimento dos responsáveis, removeremos essas informações imediatamente.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">9. Alterações nesta política</h2>
          <p>
            Podemos atualizar esta política periodicamente. Alterações significativas serão comunicadas por e-mail ou
            notificação no app. O uso continuado da plataforma após as alterações implica aceite da nova política.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold mb-2">10. Contato</h2>
          <p>
            Dúvidas sobre privacidade:{' '}
            <a href="mailto:contato@trifantasy.com" className="text-[var(--color-orange)] hover:underline">
              contato@trifantasy.com
            </a>
          </p>
        </section>

      </div>
    </div>
  )
}
