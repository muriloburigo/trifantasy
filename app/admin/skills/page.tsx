import { requireAdmin } from '~/lib/auth/require-admin'
import {
  Terminal, Users, FileText, Flag, UserPlus, ChevronRight,
  Camera, RefreshCw, ListChecks, Sparkles, ArrowRight,
} from 'lucide-react'

type Color = 'orange' | 'green' | 'blue' | 'teal' | 'purple' | 'indigo' | 'cyan' | 'amber'

interface Skill {
  command: string
  script: string
  icon: React.ElementType
  title: string
  description: string
  steps: string[]
  args: { name: string; desc: string }[]
  color: Color
  isNew?: boolean
  isLegacy?: boolean
}

const colorMap: Record<Color, { bg: string; border: string; text: string; num: string }> = {
  orange: { bg: 'bg-[var(--color-orange)]/15', border: 'border-[var(--color-orange)]/30', text: 'text-[var(--color-orange)]', num: 'bg-[var(--color-orange)]/20 text-[var(--color-orange)]' },
  green:  { bg: 'bg-green-500/15',  border: 'border-green-500/30',  text: 'text-green-400',  num: 'bg-green-500/20 text-green-400' },
  blue:   { bg: 'bg-blue-500/15',   border: 'border-blue-500/30',   text: 'text-blue-400',   num: 'bg-blue-500/20 text-blue-400' },
  teal:   { bg: 'bg-teal-500/15',   border: 'border-teal-500/30',   text: 'text-teal-400',   num: 'bg-teal-500/20 text-teal-400' },
  purple: { bg: 'bg-purple-500/15', border: 'border-purple-500/30', text: 'text-purple-400', num: 'bg-purple-500/20 text-purple-400' },
  indigo: { bg: 'bg-indigo-500/15', border: 'border-indigo-500/30', text: 'text-indigo-400', num: 'bg-indigo-500/20 text-indigo-400' },
  cyan:   { bg: 'bg-cyan-500/15',   border: 'border-cyan-500/30',   text: 'text-cyan-400',   num: 'bg-cyan-500/20 text-cyan-400' },
  amber:  { bg: 'bg-amber-500/15',  border: 'border-amber-500/30',  text: 'text-amber-400',  num: 'bg-amber-500/20 text-amber-400' },
}

function SkillCard({ skill }: { skill: Skill }) {
  const Icon = skill.icon
  const c = colorMap[skill.color]

  return (
    <div className={`bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden ${skill.isLegacy ? 'opacity-70' : ''}`}>
      {/* Header */}
      <div className="flex items-start gap-4 p-6 border-b border-[var(--color-navy-border)]">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.bg} border ${c.border}`}>
          <Icon size={18} className={c.text} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <code className={`text-base font-bold font-mono ${c.text}`}>{skill.command}</code>
            {skill.isNew && (
              <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded-full">novo</span>
            )}
            {skill.isLegacy && (
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/5 text-[var(--color-muted)] border border-white/10 px-1.5 py-0.5 rounded-full">legado</span>
            )}
          </div>
          <h2 className="font-semibold text-white mb-1">{skill.title}</h2>
          <p className="text-sm text-[var(--color-muted)]">{skill.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--color-navy-border)]">
        {/* Steps */}
        <div className="p-5">
          <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-3">Passo a passo</p>
          <ol className="space-y-2">
            {skill.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--color-muted)]">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 ${c.num}`}>{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Args + script */}
        <div className="p-5">
          {skill.args.length > 0 && (
            <>
              <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-3">Argumentos</p>
              <div className="space-y-2 mb-4">
                {skill.args.map(arg => (
                  <div key={arg.name} className="flex gap-2 items-start text-sm">
                    <ChevronRight size={12} className="text-[var(--color-muted)] shrink-0 mt-1" />
                    <div>
                      <code className="text-xs bg-[var(--color-navy-elevated)] px-1 py-0.5 rounded font-mono text-white">{arg.name}</code>
                      <span className="text-[var(--color-muted)] text-xs ml-1.5">{arg.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">Comando direto</p>
          <pre className="bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2.5 text-xs font-mono text-white overflow-x-auto whitespace-pre-wrap break-all">
            {skill.script}
          </pre>
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-black uppercase tracking-[0.12em] text-[var(--color-muted)]/60 mb-4 mt-8 first:mt-0">
      {children}
    </h2>
  )
}

export default async function AdminSkillsPage() {
  await requireAdmin()

  const workflow: Skill = {
    command: '/update-startlist',
    icon: ListChecks,
    title: 'Atualizar Startlist (Agente Completo)',
    description: 'Agente que orquestra o fluxo completo: busca MPRO + FPRO da URL, detecta duplicatas com precisão, cadastra novos atletas com T$ inicial baseado no melhor rank PTO ou WTCS ao vivo, vincula à prova e busca fotos automaticamente.',
    steps: [
      'Busca rankings PTO + WTCS ao vivo (antes de criar qualquer atleta)',
      'Extrai MPRO e FPRO do mesmo HTML — detecta protrinews.com automaticamente e usa curl',
      'Cross-reference com o banco: match exato (normalizado) e match fuzzy (primeiro + último nome)',
      'Cria atletas novos com T$ inicial = melhor rank entre PTO e WTCS — nunca altera existentes',
      'Vincula todos em race_athletes e dispara update de fotos para quem não tem',
    ],
    args: [
      { name: 'url', desc: 'URL da página de startlist' },
      { name: 'race_id', desc: 'UUID da prova — copie de /admin/provas' },
      { name: '--dry-run', desc: 'Preview do que seria feito sem gravar nada' },
    ],
    script: 'cd /tmp/trifantasy-work\nnode scripts/update-startlist.mjs <url> <race_id>\n\n# Preview:\nnode scripts/update-startlist.mjs <url> <race_id> --dry-run',
    color: 'indigo',
    isNew: true,
  }

  const fetchResults: Skill = {
    command: '/fetch-results',
    icon: FileText,
    title: 'Buscar Resultados (M + F)',
    description: 'Busca resultados de uma URL extraindo MPRO e FPRO do mesmo HTML. Associa atletas por bib ou nome, exibe preview por gênero antes de importar, e orienta sobre próximos passos.',
    steps: [
      'Certifique-se de ter importado o startlist desta prova',
      'Execute o comando com a URL da página de resultados e o race_id',
      'O script extrai MPRO e FPRO — mostra preview top 5 de cada gênero',
      'Confirma e importa na tabela results (upsert)',
      'Acesse /admin/pontuacao para calcular os Trix Scores',
    ],
    args: [
      { name: 'url', desc: 'URL da página de resultados' },
      { name: 'race_id', desc: 'UUID da prova — copie de /admin/provas' },
      { name: '--dry-run', desc: 'Preview sem gravar no banco' },
    ],
    script: 'cd /tmp/trifantasy-work\nnode scripts/fetch-results.mjs <url> <race_id>\n\n# Preview:\nnode scripts/fetch-results.mjs <url> <race_id> --dry-run',
    color: 'cyan',
    isNew: true,
  }

  const syncRanks: Skill = {
    command: '/sync-ranks',
    icon: RefreshCw,
    title: 'Sincronizar Rankings',
    description: 'Atualiza pto_rank e wtcs_rank de todos os atletas buscando ao vivo nas APIs PTO e WTCS. Exibe o T$ sugerido pela tabela de preços como informativo — não altera nenhum valor de T$.',
    steps: [
      'Execute o comando (sem argumentos)',
      'Aguarda busca em 4 fontes: PTO men/women + WTCS men/women',
      'Atualiza somente pto_rank e wtcs_rank para cada atleta',
      'Exibe ranking novo e T$ sugerido vs atual (informativo)',
      'Nenhum T$ é alterado — ajustes manuais em /admin/atletas',
    ],
    args: [
      { name: '--dry-run', desc: 'Mostra o que mudaria sem gravar' },
    ],
    script: 'cd /tmp/trifantasy-work\nnode scripts/sync-ranks.mjs\n\n# Preview:\nnode scripts/sync-ranks.mjs --dry-run',
    color: 'amber',
    isNew: true,
  }

  const cadastrarProva: Skill = {
    command: '/cadastrar-prova',
    icon: Flag,
    title: 'Cadastrar Prova',
    description: 'Cria uma nova prova interativamente: nome, data, local, distância e status. Gera slug automático e insere na tabela races.',
    steps: [
      'Abra o Claude Code neste projeto',
      'Digite /cadastrar-prova no chat',
      'Informe os dados quando solicitado',
      'O Claude cria a prova e mostra o ID gerado',
    ],
    args: [
      { name: '--name', desc: 'Nome da prova (ex: "IRONMAN 70.3 Florianópolis")' },
      { name: '--date', desc: 'Data no formato YYYY-MM-DD' },
      { name: '--location', desc: 'Cidade' },
      { name: '--country / --country-code', desc: 'País e código de 2 letras' },
      { name: '--distance', desc: 'full | 70.3 | ows | other' },
      { name: '--status', desc: 'upcoming (padrão) | open | locked | finished' },
      { name: '--pro (flag)', desc: 'Marca que a prova tem campo PRO' },
    ],
    script: 'cd /tmp/trifantasy-work\nnode scripts/create-race.mjs',
    color: 'green',
  }

  const cadastrarAtleta: Skill = {
    command: '/cadastrar-atleta',
    icon: UserPlus,
    title: 'Cadastrar Atleta',
    description: 'Cadastra um atleta PRO individualmente. Verifica duplicatas por nome. Calcula T$ inicial pelo melhor rank entre PTO e WTCS. Opcionalmente vincula a uma prova.',
    steps: [
      'Abra o Claude Code neste projeto',
      'Digite /cadastrar-atleta no chat',
      'Informe nome, gênero, país e rank PTO quando solicitado',
      'Opcionalmente vincule a uma prova na hora',
    ],
    args: [
      { name: '--name', desc: 'Nome completo do atleta' },
      { name: '--gender', desc: 'M ou F' },
      { name: '--country / --country-code', desc: 'País e código de 2 letras' },
      { name: '--pto-rank', desc: 'Posição no ranking PTO (define o T$ automaticamente)' },
      { name: '--race-id (opcional)', desc: 'UUID da prova para vincular' },
      { name: '--bib (opcional)', desc: 'Número de largada' },
      { name: '--photo-url (opcional)', desc: 'URL da foto' },
    ],
    script: 'cd /tmp/trifantasy-work\nnode scripts/create-athlete.mjs\n\n# Modo direto:\nnode scripts/create-athlete.mjs --name "Nome" --gender M --country France --country-code FR --pto-rank 38',
    color: 'blue',
  }

  const atualizarFotos: Skill = {
    command: '/atualizar-fotos',
    icon: Camera,
    title: 'Atualizar Fotos de Atletas',
    description: 'Harvest em bulk das páginas de ranking (PTO, World Triathlon, ProTriNews) e atualiza photo_url dos atletas sem foto. Fallback por página individual quando necessário.',
    steps: [
      'Abra o Claude Code neste projeto',
      'Digite /atualizar-fotos no chat (ou execute o script direto)',
      'Phase 1: harvest em bulk dos rankings PTO, WTCS e ProTriNews',
      'Phase 2: fallback por atleta individualmente para quem ficou sem foto',
      'Informa quantas fotos foram atualizadas e quais PROs ficaram sem foto',
    ],
    args: [
      { name: '--gender=M|F|all', desc: 'Filtra por gênero (padrão: all)' },
      { name: '--type=pro|age_grouper|all', desc: 'Filtra por tipo (padrão: pro)' },
      { name: '--force', desc: 'Reprocessa atletas que já têm foto' },
      { name: '--dry-run', desc: 'Mostra o que faria sem salvar no banco' },
      { name: '--limit=N', desc: 'Limita a N atletas (útil para testes)' },
    ],
    script: 'cd /tmp/trifantasy-work\nnode scripts/update-athlete-photos.mjs\n\n# Apenas PROs masculinos:\nnode scripts/update-athlete-photos.mjs --gender=M --type=pro',
    color: 'teal',
  }

  const importStartlistLegacy: Skill = {
    command: '/import-startlist',
    icon: Users,
    title: 'Importar Startlist (Legado)',
    description: 'Versão simplificada: scraping de URL, upsert de atletas e vinculação à prova. Não busca rankings ao vivo nem fotos. Use /update-startlist para o fluxo completo.',
    steps: [
      'Prefira /update-startlist para o fluxo completo',
      'Use este script quando quiser importar rapidamente sem lookup de rankings',
      'Informe a URL da startlist e o race_id',
    ],
    args: [
      { name: 'url', desc: 'URL da página de startlist' },
      { name: 'race_id', desc: 'UUID da prova' },
      { name: '--all (opcional)', desc: 'Importa todas as divisões, não só PRO' },
    ],
    script: 'cd /tmp/trifantasy-work\nnode scripts/import-startlist.mjs <url> <race_id>',
    color: 'orange',
    isLegacy: true,
  }

  const importResultsLegacy: Skill = {
    command: '/import-results',
    icon: FileText,
    title: 'Importar Resultados (Legado)',
    description: 'Versão simplificada: scraping genérico de uma URL de resultados. Não separa explicitamente M e F. Use /fetch-results para o fluxo atualizado.',
    steps: [
      'Prefira /fetch-results para buscar M e F automaticamente',
      'Use este script como fallback para formatos não suportados pelo novo script',
      'Informe a URL dos resultados e o race_id',
    ],
    args: [
      { name: 'url', desc: 'URL da página de resultados' },
      { name: 'race_id', desc: 'UUID da prova' },
    ],
    script: 'cd /tmp/trifantasy-work\nnode scripts/import-results.mjs <url> <race_id>',
    color: 'purple',
    isLegacy: true,
  }

  const flowSteps = [
    { label: '/cadastrar-prova', sub: 'cria a prova' },
    { label: '/update-startlist', sub: 'M + F + T$ + fotos' },
    { label: '/fetch-results', sub: 'M + F juntos' },
    { label: '/admin/pontuacao', sub: 'calcula Trix Scores' },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Skills & Scripts</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Automações disponíveis via terminal. Execute a partir de{' '}
          <code className="bg-[var(--color-navy-elevated)] px-1.5 py-0.5 rounded text-xs font-mono">/tmp/trifantasy-work</code>
          {' '}com as variáveis de ambiente já configuradas no <code className="bg-[var(--color-navy-elevated)] px-1.5 py-0.5 rounded text-xs font-mono">~/.zshrc</code>.
        </p>
      </div>

      {/* Como usar */}
      <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Terminal size={16} className="text-[var(--color-orange)]" />
          <h2 className="font-bold text-sm">Como usar via Claude Code</h2>
        </div>
        <ol className="text-sm text-[var(--color-muted)] space-y-1.5 list-decimal list-inside">
          <li>Abra o terminal na pasta do projeto: <code className="bg-[var(--color-navy-elevated)] px-1.5 py-0.5 rounded text-xs font-mono">cd /tmp/trifantasy-work</code></li>
          <li>Inicie o Claude Code: <code className="bg-[var(--color-navy-elevated)] px-1.5 py-0.5 rounded text-xs font-mono">claude</code></li>
          <li>Digite o nome da skill (ex: <code className="bg-[var(--color-navy-elevated)] px-1.5 py-0.5 rounded text-xs font-mono">/update-startlist</code>) — o Claude orquestra tudo</li>
          <li>Ou execute o script direto no terminal usando o comando exibido em cada card</li>
        </ol>
      </div>

      {/* Fluxo recomendado */}
      <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-5 mb-2">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={15} className="text-[var(--color-orange)]" />
          <h2 className="font-bold text-sm">Fluxo recomendado por prova</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {flowSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] px-3 py-2 rounded-xl">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[var(--color-orange)] font-black text-xs">{i + 1}</span>
                  <code className="text-white text-xs font-mono">{step.label}</code>
                </div>
                <p className="text-[var(--color-muted)] text-[10px]">{step.sub}</p>
              </div>
              {i < flowSteps.length - 1 && <ArrowRight size={14} className="text-[var(--color-navy-border)] shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Por Prova */}
      <SectionTitle>Por prova</SectionTitle>
      <div className="space-y-5">
        <SkillCard skill={cadastrarProva} />
        <SkillCard skill={workflow} />
        <SkillCard skill={fetchResults} />
      </div>

      {/* Rankings & Atletas */}
      <SectionTitle>Rankings & Atletas</SectionTitle>
      <div className="space-y-5">
        <SkillCard skill={syncRanks} />
        <SkillCard skill={cadastrarAtleta} />
        <SkillCard skill={atualizarFotos} />
      </div>

      {/* Legado */}
      <SectionTitle>Scripts legados</SectionTitle>
      <p className="text-xs text-[var(--color-muted)] mb-4 -mt-2">
        Use como fallback quando os scripts recomendados não funcionarem para um site específico.
      </p>
      <div className="space-y-5">
        <SkillCard skill={importStartlistLegacy} />
        <SkillCard skill={importResultsLegacy} />
      </div>
    </div>
  )
}
