import { requireAdmin } from '~/lib/auth/require-admin'

export default async function AdminRegrasPage() {
  await requireAdmin()

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-2">Regras & Mecânicas do Jogo</h1>
      <p className="text-[var(--color-muted)] text-sm mb-10">
        Referência completa de todas as regras, limites e comportamentos do sistema.
        Use como guia ao operar resultados, precificar atletas e gerenciar provas.
      </p>

      <div className="space-y-8">

        {/* ── MERCADO ──────────────────────────────────────── */}
        <section>
          <h2 className="text-base font-bold text-[var(--color-orange)] uppercase tracking-wider mb-3">Mercado de Atletas</h2>
          <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl divide-y divide-[var(--color-navy-border)]">

            <Row label="Saldo inicial" value="T$200 por usuário (gerado no cadastro via default da coluna profiles.wallet)" />
            <Row label="Comprar atleta" value="Débita current_price da carteira, insere linha em portfolio(user_id, athlete_id, bought_price)" />
            <Row label="Vender atleta" value="Credita current_price na carteira, remove linha do portfolio. P&L = current_price − bought_price" />
            <Row label="Regra de posse" value="Usuário só pode escalar atletas que possui no portfolio" />

            <div className="px-4 py-3">
              <p className="text-xs font-bold text-white mb-1">Janela de mercado</p>
              <ul className="text-xs text-[var(--color-muted)] space-y-1 list-disc list-inside">
                <li><span className="text-[var(--color-success)] font-semibold">Aberto:</span> nenhuma prova (open/upcoming/locked) com data ≤ agora + 24h</li>
                <li><span className="text-yellow-400 font-semibold">Fechado:</span> existe prova com status open/upcoming/locked cujo date ≤ hoje + 1 dia</li>
                <li><span className="text-white font-semibold">Reabertura:</span> automática — ao marcar prova como finished os bloqueios somem</li>
              </ul>
              <p className="text-[11px] text-[var(--color-muted)] mt-2 italic">
                Implementado em lib/market.ts → getMarketStatus(). Chamado nas server actions buyAthlete() e sellAthlete().
                A lógica é stateless — basta publicar o resultado para o mercado reabrir, sem nenhuma ação manual.
              </p>
            </div>

          </div>
        </section>

        {/* ── PREÇOS ───────────────────────────────────────── */}
        <section>
          <h2 className="text-base font-bold text-[var(--color-orange)] uppercase tracking-wider mb-3">Precificação de Atletas</h2>
          <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl divide-y divide-[var(--color-navy-border)]">

            <div className="px-4 py-3">
              <p className="text-xs font-bold text-white mb-2">Preços base (PTO ranking points)</p>
              <table className="w-full text-xs text-[var(--color-muted)]">
                <thead><tr className="border-b border-[var(--color-navy-border)]">
                  <th className="text-left py-1 font-semibold text-white pr-6">Pontuação PTO</th>
                  <th className="text-left py-1 font-semibold text-white pr-6">Rank aprox.</th>
                  <th className="text-left py-1 font-semibold text-white">Preço</th>
                </tr></thead>
                <tbody className="divide-y divide-[var(--color-navy-border)]">
                  {[
                    ['≥ 95','~1–7','T$35'],['≥ 90','~8–15','T$28'],['≥ 85','~16–25','T$22'],
                    ['≥ 80','~26–40','T$18'],['≥ 75','~41–60','T$15'],['≥ 70','~61–80','T$12'],
                    ['≥ 60','~81–120','T$11'],['Sem ranking PTO','—','T$10'],
                  ].map(([pts,rank,price]) => (
                    <tr key={pts}><td className="py-1 pr-6">{pts}</td><td className="py-1 pr-6">{rank}</td><td className="py-1 font-semibold text-white">{price}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3">
              <p className="text-xs font-bold text-white mb-1">Variação pós-prova (price_change)</p>
              <ul className="text-xs text-[var(--color-muted)] space-y-1 list-disc list-inside">
                <li>1º lugar PRO/FPRO: <span className="text-[var(--color-success)] font-semibold">+T$5</span></li>
                <li>2º lugar: <span className="text-[var(--color-success)] font-semibold">+T$3</span></li>
                <li>3º lugar: <span className="text-[var(--color-success)] font-semibold">+T$2</span></li>
                <li>DNF/DNS ou desempenho ruim: definir manualmente no script de insert-results ou via admin/mercado</li>
              </ul>
              <p className="text-[11px] text-[var(--color-muted)] mt-2 italic">
                Script: scripts/insert-texas-results.mjs como referência. Para re-precificar tudo pelo ranking PTO: scripts/reprice-athletes.mjs
              </p>
            </div>

            <Row label="price_change" value="Armazena variação da última prova. Reset para 0 em cada rodada de repricing PTO. Exibido como ↑↓ na UI." />

          </div>
        </section>

        {/* ── TIME / ESCALAÇÃO ─────────────────────────────── */}
        <section>
          <h2 className="text-base font-bold text-[var(--color-orange)] uppercase tracking-wider mb-3">Escalação de Times</h2>
          <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl divide-y divide-[var(--color-navy-border)]">
            <Row label="Tamanho do time" value="5 atletas (TEAM_SIZE em lib/types.ts)" />
            <Row label="Restrição de gênero" value="Nenhuma — homens e mulheres podem estar no mesmo time" />
            <Row label="Restrição de budget" value="Nenhuma — o critério é posse no portfolio, não orçamento virtual" />
            <Row label="Atletas elegíveis" value="Apenas atletas que o usuário possui (portfolio) E que estão em race_athletes para aquela prova" />
            <Row label="Limite por usuário" value="1 time por prova (upsert por user_id + race_id)" />
            <Row label="Prazo de alteração" value="Até o mercado fechar (24h antes da prova)" />
          </div>
        </section>

        {/* ── PONTUAÇÃO ────────────────────────────────────── */}
        <section>
          <h2 className="text-base font-bold text-[var(--color-orange)] uppercase tracking-wider mb-3">Pontuação (Trix Score)</h2>
          <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl divide-y divide-[var(--color-navy-border)]">

            <div className="px-4 py-3">
              <p className="text-xs font-bold text-white mb-2">PRO (por posição no campo PRO)</p>
              <table className="w-full text-xs text-[var(--color-muted)]">
                <tbody className="divide-y divide-[var(--color-navy-border)]">
                  {[['1º','50'],['2º','40'],['3º','33'],['4º','27'],['5º','22'],['6–10','15'],['11–15','10'],['16–20','6'],['21+','3'],['DNF/DNS','0']].map(([p,s])=>(
                    <tr key={p}><td className="py-1 pr-4">{p}</td><td className="py-1 font-semibold text-white">{s} pts</td></tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] text-[var(--color-success)] mt-1.5">+6 pts segmento mais rápido (nado/bike/run)</p>
            </div>

            <Row label="Cálculo" value="Trigger manual: admin/pontuacao → calcula scores para todos os teams de uma prova após inserir resultados" />
            <Row label="Armazenamento" value="scores(team_id, total_points, breakdown JSONB, calculated_at)" />

          </div>
        </section>

        {/* ── FLUXO OPERACIONAL ────────────────────────────── */}
        <section>
          <h2 className="text-base font-bold text-[var(--color-orange)] uppercase tracking-wider mb-3">Fluxo Operacional por Prova</h2>
          <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl p-4">
            <ol className="text-xs text-[var(--color-muted)] space-y-3">
              {[
                ['1', 'Cadastrar prova', 'admin/provas/nova — preencher nome, slug, data, localização, status=upcoming'],
                ['2', 'Importar atletas', 'admin/atletas → BulkImport ou seed script. Associar à prova via race_athletes'],
                ['3', 'Abrir mercado', 'Mudar status da prova para open. Usuários já podem comprar/escalar'],
                ['4', 'D-1 (24h antes)', 'Mercado fecha automaticamente via getMarketStatus(). Nenhuma ação manual necessária'],
                ['5', 'Prova acontece', 'Acompanhar resultados no site do Ironman / PTO'],
                ['6', 'Inserir resultados', 'admin/resultados → inserir pro_pos e finish_time dos finishers PRO'],
                ['7', 'Marcar como finished', 'Atualizar status da prova para finished (no formulário de resultados ou via SQL). Mercado reabre automaticamente'],
                ['8', 'Calcular pontuação', 'admin/pontuacao → calcular Trix Score de todos os times daquela prova'],
                ['9', 'Atualizar preços', 'node scripts/insert-[race]-results.mjs (ou admin/mercado) — aplicar price_change para os atletas que competiram'],
                ['10', 'Repricing PTO (mensal)', 'node scripts/reprice-athletes.mjs — atualiza todos os preços base pelo ranking PTO atual'],
              ].map(([n, title, desc]) => (
                <li key={n} className="flex gap-3">
                  <span className="w-5 h-5 rounded-full bg-[var(--color-orange)]/20 text-[var(--color-orange)] text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">{n}</span>
                  <div>
                    <span className="font-semibold text-white">{title}: </span>
                    {desc}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── STATUS DAS PROVAS ─────────────────────────────── */}
        <section>
          <h2 className="text-base font-bold text-[var(--color-orange)] uppercase tracking-wider mb-3">Status das Provas</h2>
          <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl divide-y divide-[var(--color-navy-border)]">
            <Row label="upcoming" value="Prova cadastrada, montagem de time ainda não disponível para usuários" />
            <Row label="open" value="Times podem ser montados. Mercado abre/fecha conforme proximidade da data" />
            <Row label="locked" value="Força o fechamento do mercado independente da data (útil se precisar travar antes das 24h)" />
            <Row label="finished" value="Resultados publicados. Mercado reabre. Pontuação calculada. Prova aparece em histórico" />
          </div>
        </section>

        {/* ── TABELAS ──────────────────────────────────────── */}
        <section>
          <h2 className="text-base font-bold text-[var(--color-orange)] uppercase tracking-wider mb-3">Schema Resumido</h2>
          <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-xl divide-y divide-[var(--color-navy-border)]">
            <Row label="profiles" value="id, name, country, is_admin, wallet (T$, default 200), created_at" />
            <Row label="athletes" value="id, name, country, gender, type, pto_rank, current_price, price_change, photo_url" />
            <Row label="races" value="id, name, slug, date, location, distance, status, has_pro_field" />
            <Row label="race_athletes" value="race_id, athlete_id, bib, price (snapshot do preço na abertura)" />
            <Row label="portfolio" value="user_id, athlete_id, bought_price, created_at — elenco atual do usuário" />
            <Row label="teams" value="id, user_id, race_id — time escalado para uma prova (1 por user/race)" />
            <Row label="team_athletes" value="team_id, athlete_id — os 5 atletas do time" />
            <Row label="results" value="race_id, athlete_id, pro_pos, finish_time (s), swim/bike/run, dnf, dns, kona_slot" />
            <Row label="scores" value="team_id, total_points, breakdown (JSONB), calculated_at" />
            <Row label="leagues" value="id, name, race_id, invite_code, owner_id" />
            <Row label="league_members" value="league_id, user_id, joined_at" />
          </div>
        </section>

      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3 flex gap-4">
      <span className="text-xs font-semibold text-white w-40 shrink-0">{label}</span>
      <span className="text-xs text-[var(--color-muted)]">{value}</span>
    </div>
  )
}
