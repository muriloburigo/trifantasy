import type { Metadata } from 'next'
import Link from 'next/link'
import BackLink from '~/app/components/BackLink'

export const metadata: Metadata = {
  title: 'Como Funciona',
  description: 'Entenda como funciona o Trixer — carteira, mercado de atletas, provas e Trix Leagues.',
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

function Example({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[var(--color-navy-elevated)] border border-[var(--color-orange)]/20 rounded-xl p-3 text-xs text-[var(--color-muted)] italic leading-relaxed">
      <span className="text-[var(--color-orange)] font-bold not-italic mr-1">Exemplo:</span>
      {children}
    </div>
  )
}

export default function RegrasPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <BackLink href="/" />

      <h1 className="text-3xl font-extrabold mb-2">Como Funciona</h1>
      <p className="text-[var(--color-muted)] mb-10">Tudo que você precisa saber para jogar o Trixer.</p>

      <div className="space-y-10">

        <Section n="1" title="O que é o Trixer?">
          <p>
            O Trixer é um <strong className="text-white">jogo de mercado de atletas</strong> baseado em provas reais de triathlon
            (Full e Middle Distance). Você começa com uma carteira de <strong className="text-[var(--color-orange)]">T$200</strong>,
            compra atletas no mercado, e acompanha o valor do seu elenco subir ou cair conforme os resultados das provas.
          </p>
          <p>
            Não é só escalar um time — é sobre comprar na hora certa, vender antes que o atleta caia,
            e montar o melhor elenco para a próxima prova.
          </p>
          <Example>
            Você compra Kristian Blummenfelt por T$35. Ele vence o IRONMAN Texas. Seu valor sobe para T$40.
            Se você vender agora, embolsa T$40 — lucro de T$5. Ou segure para a próxima prova.
          </Example>
        </Section>

        <Section n="2" title="Carteira (T$)">
          <p>
            Toda conta começa com <strong className="text-white">T$200 em Trix Coins (T$)</strong>.
            Esse é o seu dinheiro para comprar atletas no mercado.
          </p>
          <ul className="space-y-1.5 list-disc list-inside">
            <li><strong className="text-white">Comprar:</strong> preço do atleta é debitado da carteira, ele entra no seu elenco.</li>
            <li><strong className="text-white">Vender:</strong> preço atual do atleta é creditado na carteira, ele sai do elenco.</li>
            <li>Sem limite de atletas — só o saldo te limita.</li>
          </ul>
          <Example>
            Carteira: T$200. Você compra 3 atletas: T$35 + T$28 + T$18 = T$81 gastos.
            Carteira fica em T$119. Elenco vale T$81. Patrimônio total continua T$200 — sem ganho ainda.
          </Example>
        </Section>

        <Section n="3" title="Mercado de Atletas e Preços">
          <p>
            No mercado (<Link href="/atletas" className="text-[var(--color-orange)] hover:underline">/atletas</Link>) você vê todos os atletas com preço atual e variação.
            Os preços base seguem o ranking PTO mundial:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-navy-border)]">
                  <th className="text-left py-1.5 pr-4 font-semibold text-white">Ranking PTO</th>
                  <th className="text-left py-1.5 font-semibold text-white">Preço base</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-navy-border)]">
                {[
                  ['≥ 95 pts (rank ~1–7)','T$35 — Elite mundial'],
                  ['≥ 90 pts (rank ~8–15)','T$28 — Top estabelecido'],
                  ['≥ 85 pts (rank ~16–25)','T$22 — PRO forte'],
                  ['≥ 80 pts (rank ~26–40)','T$18 — Competitivo'],
                  ['≥ 75 pts (rank ~41–60)','T$15 — Sólido'],
                  ['≥ 70 pts (rank ~61–80)','T$12 — Ranqueado'],
                  ['≥ 60 pts (rank ~81–120)','T$11 — Ranqueado'],
                  ['Sem ranking PTO','T$10 — Base PRO'],
                ].map(([r,p]) => (
                  <tr key={r}><td className="py-1.5 pr-4">{r}</td><td className="py-1.5 font-semibold text-white">{p}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>Após cada prova, os preços são atualizados:</p>
          <ul className="space-y-1 list-disc list-inside text-xs">
            <li><strong className="text-[var(--color-success)]">1º lugar: +T$5</strong></li>
            <li><strong className="text-[var(--color-success)]">2º lugar: +T$3</strong></li>
            <li><strong className="text-[var(--color-success)]">3º lugar: +T$2</strong></li>
            <li><strong className="text-[var(--color-danger)]">DNF/DNS: queda de preço (conforme desempenho)</strong></li>
          </ul>
          <Example>
            Marta Sánchez valia T$18. Terminou 3ª no IRONMAN Texas → preço subiu para T$20.
            Se você comprou antes da prova e vendeu depois, lucrou T$2 por atleta.
          </Example>
        </Section>

        <Section n="4" title="Janela de Mercado — Quando Posso Comprar e Vender?">
          <p>
            O mercado <strong className="text-white">fecha 24 horas antes</strong> de qualquer prova.
            Reabre somente quando os resultados daquela prova são publicados.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[var(--color-navy-elevated)] rounded-xl p-3 text-center border border-green-900/40">
              <p className="text-xs font-bold text-[var(--color-success)] mb-1">✓ Aberto</p>
              <p className="text-[11px]">Mais de 24h para a próxima prova. Compre e venda à vontade.</p>
            </div>
            <div className="bg-[var(--color-navy-elevated)] rounded-xl p-3 text-center border border-yellow-900/40">
              <p className="text-xs font-bold text-yellow-400 mb-1">🔒 Fechado</p>
              <p className="text-[11px]">Menos de 24h para a prova ou prova em andamento. Sem transações.</p>
            </div>
            <div className="bg-[var(--color-navy-elevated)] rounded-xl p-3 text-center border border-[var(--color-navy-border)]">
              <p className="text-xs font-bold text-white mb-1">↻ Reabertura</p>
              <p className="text-[11px]">Automática após resultados serem publicados.</p>
            </div>
          </div>
          <p className="text-xs font-semibold text-yellow-400">
            ⚠ Atenção: atletas que fazem DNS (não largam) têm o preço reduzido.
            Acompanhe as prévias das provas — se seu atleta desistiu, você tem até 24h antes para vender.
          </p>
          <Example>
            O IRONMAN South Africa é sábado (19/04). O mercado fecha sexta à meia-noite UTC.
            Após os resultados serem publicados, o mercado reabre e você pode rebalancear o elenco
            para a próxima prova (ex: IRONMAN 70.3 Peru no dia 26/04).
          </Example>
        </Section>

        <Section n="5" title="Escalando um Time para a Prova">
          <p>
            Para cada prova aberta, você escala <strong className="text-white">5 atletas do seu elenco</strong>
            que estejam inscritos naquela prova. Escalação é gratuita — você só precisa possuir os atletas.
          </p>
          <ul className="space-y-1.5 list-disc list-inside">
            <li>Só pode escalar atletas que você <strong className="text-white">comprou</strong> no mercado.</li>
            <li>Homens e mulheres podem estar no mesmo time — sem restrição de gênero.</li>
            <li>O time pode ser alterado até o mercado fechar (24h antes da prova).</li>
            <li>Você só tem <strong className="text-white">um time escalado por prova</strong>.</li>
          </ul>
          <Example>
            Você possui no elenco: Blummenfelt (M), Van Riel (M), Løvseth (F), Knibb (F), Marta Sánchez (F).
            Todos estão no IRONMAN Texas. Você os escala como time → Trix Score calculado após a prova.
          </Example>
        </Section>

        <Section n="6" title="Pontuação (Trix Score)">
          <p>A pontuação é calculada pela posição no campo PRO da prova.</p>
          <div className="max-w-xs">
            <table className="w-full text-xs">
              <tbody className="divide-y divide-[var(--color-navy-border)]">
                {[['1º','50'],['2º','40'],['3º','33'],['4º','27'],['5º','22'],['6º–10º','15'],['11º–15º','10'],['16º–20º','6'],['21º+','3'],['DNF/DNS','0']].map(([p,s]) => (
                  <tr key={p}><td className="py-1 pr-3">{p}</td><td className="py-1 font-bold text-white">{s} pts</td></tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] mt-2 text-[var(--color-success)]">+6 pts segmento mais rápido (nado/bike/run)</p>
          </div>
        </Section>

        <Section n="7" title="Trix Leagues">
          <p>
            Crie uma liga privada e convide amigos para disputar quem monta o melhor time em uma prova específica.
          </p>
          <ul className="space-y-2 list-disc list-inside">
            <li>Liga vinculada a <strong className="text-white">uma prova</strong>, acessada por <strong className="text-white">código de convite</strong>.</li>
            <li>Ranking por Trix Score — quem tem mais pontos no time escalado vence.</li>
            <li>Participe de múltiplas ligas com o mesmo time.</li>
          </ul>
          <Example>
            Você e 5 amigos criam uma liga para o IRONMAN 70.3 Brasília. Cada um escala 5 atletas.
            Após a prova, o sistema calcula e exibe o ranking: quem apostou certo no atleta local ganhou.
          </Example>
        </Section>

        <Section n="8" title="Dicas de Estratégia">
          <ul className="space-y-2 list-disc list-inside">
            <li><strong className="text-white">Compre antes das provas:</strong> atletas que vão bem sobem de preço. Compre cedo, venda depois.</li>
            <li><strong className="text-white">Fique de olho em DNS:</strong> acompanhe as prévias. Se um favorito desistiu, venda antes do fechamento do mercado.</li>
            <li><strong className="text-white">Diversifique:</strong> não coloque tudo em atletas de uma única prova. Um mix de homens e mulheres de provas diferentes pode render mais pontos.</li>
            <li><strong className="text-white">Apostas de valor:</strong> atletas sem ranking PTO custam apenas T$10 — se performarem bem em uma prova local, o retorno pode surpreender.</li>
            <li><strong className="text-white">Patrimônio total = carteira + elenco:</strong> acompanhe no <Link href="/elenco" className="text-[var(--color-orange)] hover:underline">Meu Elenco</Link> o P&L de cada atleta.</li>
          </ul>
        </Section>

        <Section n="9" title="Observações Gerais">
          <ul className="space-y-2 list-disc list-inside">
            <li>O Trixer é um jogo recreativo — sem premiação em dinheiro.</li>
            <li>Não somos afiliados ao Ironman/WTC nem a qualquer organização de triathlon.</li>
            <li>Resultados são inseridos manualmente — pode haver atraso após a prova.</li>
            <li>Regras e preços podem ser ajustados pelo admin antes do início de uma prova.</li>
          </ul>
        </Section>

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
