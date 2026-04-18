import type { Metadata } from 'next'
import Link from 'next/link'
import BackLink from '~/app/components/BackLink'

export const metadata: Metadata = {
  title: 'Regras do Jogo',
  description: 'Entenda como funciona o Trixer — orçamento, Trix Score, Trix Leagues e mais.',
}

export default function RegrasPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <BackLink href="/" />

      <h1 className="text-3xl font-extrabold mb-2">Regras do Jogo</h1>
      <p className="text-[var(--color-muted)] mb-10">Tudo que você precisa saber para jogar o Trixer.</p>

      <div className="space-y-10">

        {/* Objetivo */}
        <section>
          <h2 className="text-xl font-bold mb-3 text-[var(--color-orange)]">1. Objetivo</h2>
          <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-5 text-sm text-[var(--color-muted)] space-y-2 leading-relaxed">
            <p>
              O Trixer é um jogo de escalação baseado em provas reais de triathlon (distâncias Full e Middle Distance).
              Você monta um time de <strong className="text-[var(--color-text)]">5 atletas reais</strong> — misturando PROs e age-groupers —
              e pontua conforme o desempenho deles na prova.
            </p>
            <p>
              Dispute com amigos em <strong className="text-[var(--color-text)]">Trix Leagues</strong> para ver quem tem mais inteligência para escalar atletas.
            </p>
          </div>
        </section>

        {/* Montagem do time */}
        <section>
          <h2 className="text-xl font-bold mb-3 text-[var(--color-orange)]">2. Montagem do Time</h2>
          <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-5 text-sm text-[var(--color-muted)] space-y-3 leading-relaxed">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
              <div className="bg-[var(--color-navy-elevated)] rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-[var(--color-orange)]">5</p>
                <p className="text-xs mt-1">atletas por time</p>
              </div>
              <div className="bg-[var(--color-navy-elevated)] rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-[var(--color-orange)]">T$100</p>
                <p className="text-xs mt-1">orçamento total</p>
              </div>
              <div className="bg-[var(--color-navy-elevated)] rounded-xl p-3 text-center">
                <p className="text-2xl font-black text-[var(--color-orange)]">2</p>
                <p className="text-xs mt-1">máx. do mesmo clube</p>
              </div>
            </div>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Cada atleta tem um preço em <strong className="text-[var(--color-text)]">Trix Coin (T$)</strong> definido pelo admin.</li>
              <li>Você pode escalar <strong className="text-[var(--color-text)]">qualquer combinação</strong> de atletas PRO e age-groupers.</li>
              <li>Máximo de <strong className="text-[var(--color-text)]">2 atletas do mesmo clube</strong> por time.</li>
              <li>Não há capitão — todos os atletas valem igual.</li>
              <li>O time pode ser alterado <strong className="text-[var(--color-text)]">até o encerramento das inscrições</strong> da prova.</li>
            </ul>
          </div>
        </section>

        {/* Pontuação PRO */}
        <section>
          <h2 className="text-xl font-bold mb-3 text-[var(--color-orange)]">3. Pontuação — Atletas PRO</h2>
          <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-5 text-sm text-[var(--color-muted)] space-y-3">
            <p>A pontuação é calculada pela <strong className="text-[var(--color-text)]">posição no campo PRO</strong> (masculino e feminino separados).</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-navy-border)]">
                    <th className="text-left py-2 pr-4 font-semibold text-[var(--color-text)]">Posição</th>
                    <th className="text-left py-2 font-semibold text-[var(--color-text)]">Pontos base</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-navy-border)]">
                  {[
                    ['1º', '50 pts'],
                    ['2º', '40 pts'],
                    ['3º', '33 pts'],
                    ['4º', '27 pts'],
                    ['5º', '22 pts'],
                    ['6º – 10º', '15 pts'],
                    ['11º – 15º', '10 pts'],
                    ['16º – 20º', '6 pts'],
                    ['21º+', '3 pts'],
                    ['DNF / DNS', '0 pts'],
                  ].map(([pos, pts]) => (
                    <tr key={pos}>
                      <td className="py-1.5 pr-4">{pos}</td>
                      <td className="py-1.5 font-semibold text-[var(--color-text)]">{pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[var(--color-navy-border)] pt-3">
              <p className="font-semibold text-[var(--color-text)] mb-1">Bônus PRO</p>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong className="text-[var(--color-text)]">+6 pts</strong> por ser o mais rápido em qualquer segmento (natação, ciclismo ou corrida) no campo PRO.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Pontuação Age Group */}
        <section>
          <h2 className="text-xl font-bold mb-3 text-[var(--color-orange)]">4. Pontuação — Age Groupers</h2>
          <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-5 text-sm text-[var(--color-muted)] space-y-3">
            <p>
              A pontuação é calculada pela <strong className="text-[var(--color-text)]">posição dentro do seu grupo de idade (AG)</strong>,
              separado por gênero. Isso garante que age-groupers de qualquer faixa etária sejam comparados de forma justa.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-navy-border)]">
                    <th className="text-left py-2 pr-4 font-semibold text-[var(--color-text)]">Posição no AG</th>
                    <th className="text-left py-2 font-semibold text-[var(--color-text)]">Pontos base</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-navy-border)]">
                  {[
                    ['1º', '30 pts'],
                    ['2º', '24 pts'],
                    ['3º', '19 pts'],
                    ['4º – 10º', '13 pts'],
                    ['Top 25%', '8 pts'],
                    ['25% – 50%', '5 pts'],
                    ['50% – 75%', '2 pts'],
                    ['Abaixo de 75%', '1 pt'],
                    ['DNF / DNS', '0 pts'],
                  ].map(([pos, pts]) => (
                    <tr key={pos}>
                      <td className="py-1.5 pr-4">{pos}</td>
                      <td className="py-1.5 font-semibold text-[var(--color-text)]">{pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-[var(--color-navy-border)] pt-3 space-y-2">
              <p className="font-semibold text-[var(--color-text)] mb-1">Bônus Age Groupers</p>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong className="text-[var(--color-text)]">+4 pts</strong> por ser o mais rápido em qualquer segmento (natação, ciclismo ou corrida) entre todos os age-groupers.</li>
                <li><strong className="text-[var(--color-text)]">+8 pts</strong> por garantir uma vaga de Kona (slot para o Campeonato Mundial).</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Ligas */}
        <section>
          <h2 className="text-xl font-bold mb-3 text-[var(--color-orange)]">5. Trix Leagues</h2>
          <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-5 text-sm text-[var(--color-muted)] space-y-2 leading-relaxed">
            <ul className="space-y-2 list-disc list-inside">
              <li>Trix Leagues são <strong className="text-[var(--color-text)]">privadas</strong> — acessadas por código de convite.</li>
              <li>Cada liga é vinculada a <strong className="text-[var(--color-text)]">uma prova específica</strong>.</li>
              <li>O Trix Rank é calculado pela pontuação total do time de cada Trixers.</li>
              <li>Não há limite de participantes por liga.</li>
              <li>É possível participar de <strong className="text-[var(--color-text)]">múltiplas Trix Leagues</strong> com o mesmo time.</li>
            </ul>
          </div>
        </section>

        {/* Calendário */}
        <section>
          <h2 className="text-xl font-bold mb-3 text-[var(--color-orange)]">6. Calendário e Status das Provas</h2>
          <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-5 text-sm text-[var(--color-muted)] space-y-2">
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-[var(--color-text)]">Em breve</strong> — prova cadastrada, montagem de time ainda não disponível.</li>
              <li><strong className="text-[var(--color-text)]">Aberto</strong> — inscrições abertas, monte seu time agora.</li>
              <li><strong className="text-[var(--color-text)]">Encerrado</strong> — prazo para montagem de time encerrado, aguardando a prova.</li>
              <li><strong className="text-[var(--color-text)]">Finalizado</strong> — resultados calculados, ranking disponível.</li>
            </ul>
          </div>
        </section>

        {/* Observações */}
        <section>
          <h2 className="text-xl font-bold mb-3 text-[var(--color-orange)]">7. Observações Gerais</h2>
          <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-5 text-sm text-[var(--color-muted)] space-y-2 leading-relaxed">
            <ul className="space-y-2 list-disc list-inside">
              <li>O Trixer é um jogo recreativo sem premiação em dinheiro.</li>
              <li>Não somos afiliados ao Ironman/WTC nem a qualquer organização de triathlon.</li>
              <li>Os resultados são inseridos manualmente — pode haver atraso após a prova.</li>
              <li>Em caso de empate no ranking, a posição é desempatada pela menor variação de orçamento utilizado.</li>
              <li>As regras podem ser ajustadas pelo admin a qualquer momento antes do início de uma prova.</li>
            </ul>
          </div>
        </section>

      </div>

      <div className="mt-12 text-center">
        <Link
          href="/register"
          className="inline-block bg-[var(--color-orange)] hover:bg-[var(--color-orange-light)] text-white font-semibold px-8 py-3 rounded-xl text-sm transition-colors"
        >
          Entrar no jogo — grátis
        </Link>
      </div>
    </div>
  )
}
