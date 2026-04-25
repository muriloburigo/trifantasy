import { requireAdmin } from '~/lib/auth/require-admin'
import { Terminal, Users, FileText, Copy, ChevronRight } from 'lucide-react'

export default async function AdminSkillsPage() {
  await requireAdmin()

  const skills = [
    {
      command: '/import-startlist',
      icon: Users,
      title: 'Importar Startlist',
      description: 'Faz scraping de uma URL de startlist, normaliza dados dos atletas e vincula à prova. Suporte a PTO, Ironman e sites Next.js.',
      steps: [
        'Abra o Claude Code neste projeto',
        'Digite o comando abaixo no chat',
        'Informe a URL da startlist e o race_id quando solicitado',
        'O Claude irá executar o script e mostrar o resultado',
      ],
      args: [
        { name: 'URL', desc: 'URL da página de startlist (ex: https://protriathletes.org/events/slug/startlist)' },
        { name: 'race_id', desc: 'UUID da prova no banco — copie de /admin/provas' },
        { name: '--all (opcional)', desc: 'Importa todas as divisões, não só PRO' },
      ],
      script: 'node scripts/import-startlist.mjs <url> <race_id>',
      color: 'orange',
    },
    {
      command: '/import-results',
      icon: FileText,
      title: 'Importar Resultados',
      description: 'Faz scraping de uma URL de resultados, extrai posição e tempos por segmento, e salva na tabela results. Requer startlist importada primeiro.',
      steps: [
        'Certifique-se de ter importado a startlist desta prova',
        'Abra o Claude Code neste projeto',
        'Digite o comando abaixo no chat',
        'Informe a URL dos resultados e o race_id quando solicitado',
        'Após importar, vá em /admin/pontuacao para calcular os Trix Scores',
      ],
      args: [
        { name: 'URL', desc: 'URL da página de resultados (ex: https://protriathletes.org/events/slug/results)' },
        { name: 'race_id', desc: 'UUID da prova no banco — copie de /admin/provas' },
      ],
      script: 'node scripts/import-results.mjs <url> <race_id>',
      color: 'purple',
    },
  ]

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Skills</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Automações disponíveis via Claude Code CLI. Execute no terminal dentro do projeto.
        </p>
      </div>

      {/* How to use */}
      <div className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-5 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Terminal size={16} className="text-[var(--color-orange)]" />
          <h2 className="font-bold text-sm">Como usar</h2>
        </div>
        <ol className="text-sm text-[var(--color-muted)] space-y-2 list-decimal list-inside">
          <li>Abra o terminal na pasta do projeto: <code className="bg-[var(--color-navy-elevated)] px-1.5 py-0.5 rounded text-xs font-mono">/tmp/trifantasy</code></li>
          <li>Inicie o Claude Code: <code className="bg-[var(--color-navy-elevated)] px-1.5 py-0.5 rounded text-xs font-mono">claude</code></li>
          <li>Digite o comando da skill (ex: <code className="bg-[var(--color-navy-elevated)] px-1.5 py-0.5 rounded text-xs font-mono">/import-startlist</code>)</li>
          <li>Siga as instruções — informe URL e race_id quando solicitado</li>
        </ol>
        <p className="text-xs text-[var(--color-muted)] mt-3 italic">
          Alternativamente, execute os scripts diretamente no terminal com <code className="bg-[var(--color-navy-elevated)] px-1 py-0.5 rounded">node scripts/&lt;script&gt;.mjs</code>
        </p>
      </div>

      {/* Skills */}
      <div className="space-y-6">
        {skills.map(skill => {
          const Icon = skill.icon
          return (
            <div key={skill.command} className="bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-start gap-4 p-6 border-b border-[var(--color-navy-border)]">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  skill.color === 'orange'
                    ? 'bg-[var(--color-orange)]/15 border border-[var(--color-orange)]/30'
                    : 'bg-purple-500/15 border border-purple-500/30'
                }`}>
                  <Icon size={18} className={skill.color === 'orange' ? 'text-[var(--color-orange)]' : 'text-purple-400'} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <code className={`text-base font-bold font-mono ${
                      skill.color === 'orange' ? 'text-[var(--color-orange)]' : 'text-purple-400'
                    }`}>{skill.command}</code>
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
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 ${
                          skill.color === 'orange'
                            ? 'bg-[var(--color-orange)]/20 text-[var(--color-orange)]'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Args + script */}
                <div className="p-5">
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
                  <p className="text-xs font-bold text-[var(--color-muted)] uppercase tracking-wider mb-2">Script direto</p>
                  <div className="group relative">
                    <pre className="bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] rounded-lg px-3 py-2.5 text-xs font-mono text-white overflow-x-auto whitespace-pre-wrap break-all">
                      {skill.script}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Fluxo recomendado */}
      <div className="mt-8 bg-[var(--color-navy-card)] border border-[var(--color-navy-border)] rounded-2xl p-5">
        <h2 className="font-bold text-sm mb-4">Fluxo recomendado por prova</h2>
        <div className="flex items-center gap-2 flex-wrap text-sm">
          {[
            'Criar prova em /admin/provas',
            '/import-startlist',
            '/import-results',
            'Calcular pontuação em /admin/pontuacao',
          ].map((step, i, arr) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[var(--color-navy-elevated)] border border-[var(--color-navy-border)] px-2.5 py-1.5 rounded-lg">
                <span className="text-[var(--color-orange)] font-black text-xs">{i + 1}</span>
                <span className="text-[var(--color-muted)] text-xs">{step}</span>
              </div>
              {i < arr.length - 1 && <ChevronRight size={14} className="text-[var(--color-navy-border)] shrink-0" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
