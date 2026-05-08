# Trixer

Fantasy game do circuito mundial de Triathlon — usuários montam elencos com até 5 atletas profissionais, pontuam pelo desempenho nas provas reais e competem em ligas.

**URL:** https://www.trixer.app

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16.2.4 App Router, React 19 |
| Styling | Tailwind CSS v4 (config via `globals.css`, sem `tailwind.config.js`) |
| Database | Supabase (PostgreSQL 15) + RLS |
| Auth | Supabase Auth + Cloudflare Turnstile |
| i18n | next-intl 4.x — PT / EN / ES |
| Push | Web-Push API (VAPID) + Service Workers |
| Image Export | html-to-image 1.11.13 |
| Deploy | Vercel (auto-deploy via GitHub push) |
| Fontes | Inter (body), Sora (headings) via @next/font |

---

## Deploy

Push para `main` dispara deploy automático via Vercel CI/CD.

Deploy manual:
```bash
PATH="/opt/homebrew/Cellar/node/25.9.0_1/bin:$PATH" npx vercel --prod
```

> **Atenção:** Não rode `next build` ou `tsc` localmente — Node v25 é incompatível com o projeto.

---

## Scripts Úteis

```bash
# Sincronizar rankings mundiais (PTO + WTCS)
node scripts/sync-unified-ranks-v3.mjs

# Tornar usuário admin
node scripts/set-admin.mjs email@exemplo.com

# Importar startlist a partir de URL (PTO, Ironman, tabelas HTML)
export $(grep -v '^#' .env.local | xargs) 2>/dev/null
node scripts/import-startlist.mjs <URL> <RACE_ID>

# Cadastrar atleta individualmente
export $(grep -v '^#' .env.local | xargs) 2>/dev/null
node scripts/create-athlete.mjs --name "Nome" --gender M --country France --country-code FR --pto-rank 38

# Repricing global por pontos PTO (atualiza todos os atletas)
node scripts/reprice-athletes.mjs

# Importar resultados de prova (CSV)
node scripts/import-results.mjs

# Gerar chaves VAPID (apenas uma vez)
node scripts/generate-vapid-keys.mjs
```

---

## Importar Startlist — protrinews.com

O site bloqueia bots (403) mas aceita `curl` com User-Agent de browser. Todos os dados (masculino e feminino) estão embutidos no HTML como JSON dentro de `self.__next_f.push(...)`.

```bash
# 1. Baixar o HTML
curl -s "https://protrinews.com/race/<slug>" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  -H "Accept: text/html" -L > /tmp/page.html
```

Extrair via Python: localizar o `<script>` com `startLists` e `MPRO`, decodificar com `json.loads('"' + inner + '"')`, extrair o objeto `{"startLists":...}` balanceando `{}`.

Cada `entry` contém: `athlete_full_name`, `athlete_country_iso2`, `start_list_id` (`MPRO` ou `FPRO`).

**APIs de ranking para precificação:**
- PTO masculino: `https://stats.protriathletes.org/api/rankings?gender=male&limit=500`
- PTO feminino: HTML de `https://stats.protriathletes.org/rankings/women` (a API `gender=female` retorna MPRO por bug)
- WTCS homens: `https://triathlon.org/tri-api/v1/rankings/15`
- WTCS mulheres: `https://triathlon.org/tri-api/v1/rankings/16`

Ver `CLAUDE.md` para o fluxo completo e tabela de preços inicial.

---

## Variáveis de Ambiente

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL=https://www.trixer.app
NEXT_PUBLIC_TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_EMAIL=mailto:contato@trixer.app
CRON_SECRET
```

---

## Documentação Interna

- `CLAUDE.md` — domínio completo, schema, mecânicas, rotas e scripts
- `AGENTS.md` — regras e padrões para agentes de IA
- `GEMINI.md` — contexto resumido para agentes Gemini
- `.claude/commands/` — comandos slash para operações comuns
<!-- Deploy Trigger: Mon Apr 27 10:47:45 -03 2026 -->
