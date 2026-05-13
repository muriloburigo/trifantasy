<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Regras para Agentes — Trixer

## Antes de qualquer alteração

1. Leia `CLAUDE.md` completo para entender o domínio, schema e mecânicas
2. Supabase pode estar **pausado** — verifique antes de debugar problema de dados
3. Nunca rode `next build` ou `tsc` localmente — Node v25 é incompatível com o projeto
4. Deploy: push para `main` dispara Vercel automaticamente. Deploy manual: `PATH="/opt/homebrew/Cellar/node/25.9.0_1/bin:$PATH" npx vercel --prod`

---

## Clientes Supabase

Três clientes disponíveis em `~/lib/supabase/server`:

| Cliente | Quando usar |
|---------|-------------|
| `createPublicClient()` | Leitura pública sem auth (races, athletes, results) |
| `createClient()` | Operações do usuário autenticado (lê cookies da sessão) |
| `createAdminClient()` | Operações admin / bypass de RLS — **sempre** precedido por `requireAdmin()` ou `requireUser()` |

**Regra crítica de RLS:** Políticas de leitura em `leagues` bloqueiam não-membros. Para criar/entrar em ligas, use `createAdminClient()` nas operações de DB, mas `createClient()` apenas para `auth.getUser()`.

```typescript
// Padrão correto para server actions que escrevem no banco:
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return { error: '...' }
const admin = createAdminClient()
await admin.from('tabela').insert(...)
```

---

## Tailwind CSS v4

- **Sem `tailwind.config.js`** — configuração em `globals.css` com `@theme inline { ... }`
- Tokens disponíveis: `--color-navy`, `--color-navy-card`, `--color-navy-elevated`, `--color-navy-border`, `--color-orange`, `--color-orange-dim`, `--color-purple`, `--color-purple-dim`, `--color-muted`, `--color-success`, `--color-danger`, `--font-sans`, `--font-heading`, `--font-display`
- Variantes: `var(--color-orange)` em CSS inline, `text-[var(--color-orange)]` em classes Tailwind

---

## Padrões do Projeto

- **Alias de import:** `~/` mapeia para a raiz do projeto (ex: `~/lib/supabase/server`)
- **Server Actions:** sempre com `'use server'` — nunca usar route handlers para mutações no admin
- **`export const revalidate = 3600`** em páginas estáticas — não usar `force-dynamic` desnecessariamente
- **Componentes client:** só marcar `'use client'` quando necessário (hooks, eventos, interatividade)
- **i18n:** strings de UI em `messages/pt.json`, `messages/en.json`, `messages/es.json` — nunca hardcode PT sem adicionar EN/ES também. Default: `en` (PT se `accept-language` inclui `pt`, ES se inclui `es`, caso contrário `en`)

---

## Schema — Pontos de Atenção

- **Unique constraint de atletas:** `(name, gender, type)` — não apenas nome
- **`portfolio`** = source of truth do elenco atual. **`teams` + `team_athletes`** = cache/espelho para histórico de scores. Não confundir.
- **`races.status`** lifecycle: `upcoming` → `open` → `locked` → `finished`
  - `open`: startlist disponível, mercado aberto
  - `locked`: mercado fechado 24h antes da prova
  - `finished`: resultados importados e pontos calculados
- **`races.distance`** valores: `'full'`, `'70.3'`, `'T100'`, `'olympic'`, `'ows'`, `'other'`
- **`athletes.type`** valores: `'pro'`, `'age_grouper'`
- **`athletes.gender`** valores: `'M'`, `'F'`
- **`leagues.is_global = true`** identifica a Liga Global — filtrar ao listar ligas do usuário
- **`push_notification_log`** tem unique em `(user_id, type, ref_id)` — função `alreadySent()` usa isso para dedup (captura erro 23505 em vez de fazer SELECT)

---

## Mercado

- O mercado **fecha 24h antes da prova** — `getMarketStatus()` em `~/lib/market.ts` calcula isso
- Horário de início de prova assumido: **23:00 UTC** do dia da prova
- Preço clamped: **T$1 mínimo, T$35 máximo**
- Após calcular pontos em `/admin/pontuacao`, o mercado reabre automaticamente e preços são atualizados via `updateMarket()` em `~/lib/scoring/market.ts`

---

## Fluxo Pós-Prova (Admin)

1. **Importar resultados** em `/admin/resultados` (CSV com colunas de segmento)
2. **Calcular pontuação** em `/admin/pontuacao` — prova vira `finished`, scores são gravados, mercado é atualizado
3. Rankings ficam visíveis nas ligas imediatamente

---

## Push Notifications

- Engine em `~/lib/notifications-engine.ts` — chamada pelo cron `/api/cron/notifications`
- Notificações disparadas: **prova em 7d**, **prova em 1d**, **prova hoje**, **mercado aberto**, **mercado fechado**, **atleta fora da startlist**
- Idioma por usuário: busca `profiles.locale` — fallback `'pt'`
- Dedup: `alreadySent(uid, type, refId)` — **não** fazer SELECT manual, usar a função
- Subscriptions expiradas são removidas automaticamente quando web-push retorna 404/410

---

## Gerador de Cards (`/share`)

- Rota protegida (requer auth) — redireciona para `/login` se não autenticado
- **5 templates:** `power-ranking`, `race-preview`, `race-recap`, `my-roster`, `league-standings`
- **Formatos:** `feed` (1080×1350) e `story` (1080×1920)
- **URL params:** `/share?template=my-roster`, `/share?template=league-standings&format=story`
- Dados reais do Supabase (sem mock data em produção)
- `race-recap` retorna `null` — tabela `race_results` ainda não existe no schema
- Componentes de card em `~/app/components/cards/` — usam inline styles (não Tailwind) para garantir fidelidade no export PNG
- Tipos em `~/lib/trixerTypes.ts` — mapeados para o schema real: `current_price` → `currentT`, `price_change` → `deltaT`, `pto_rank` → `rank`

---

## Scoring

- Lógica em `~/lib/scoring/calculate.ts` (`scoreAthlete()`) e `~/lib/scoring/market.ts` (`updateMarket()`)
- PRO: 1º=50pts, bônus de segmento +6pts. AG: 1º=30pts, bônus de segmento +4pts
- DNF/DNS = 0 pontos (sem pontuação negativa)
- Breakdown guardado como JSONB em `scores.breakdown`

---

## Autenticação Admin

```typescript
import { requireAdmin } from '~/lib/auth/require-admin'
import { requireUser } from '~/lib/auth/require-user'

// Em server actions admin:
const user = await requireAdmin() // redireciona se não for admin

// Em server actions de usuário:
const user = await requireUser() // redireciona se não autenticado
```

---

## Segurança (Headers)

Configurados em `next.config.ts`:
- CSP: sem `unsafe-eval`, fontes/scripts apenas de domínios confiáveis
- `X-Frame-Options: SAMEORIGIN`
- `Strict-Transport-Security` (63M segundos)
- Permissions Policy: câmera, microfone e geolocalização desabilitados

---

## Importar Startlist — protrinews.com

O site bloqueia bots (403 no WebFetch) mas aceita `curl` com User-Agent de browser. Todos os dados (masculino e feminino) estão embutidos no HTML como JSON dentro de `self.__next_f.push(...)`.

**Fluxo completo:**

1. Baixar o HTML:
   ```bash
   curl -s "https://protrinews.com/race/<slug>" \
     -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
     -H "Accept: text/html" -L > /tmp/page.html
   ```

2. Extrair o JSON via Python — procurar o `<script>` com `startLists` e `MPRO`. O conteúdo está como string JSON escapada dentro de `self.__next_f.push([1,"..."])`. Fazer `json.loads('"' + inner + '"')` para decodificar, depois localizar `{"startLists":` e extrair o objeto balanceando chaves `{}`.

3. Cada `entry` tem: `athlete_full_name`, `athlete_country_iso2`, `start_list_id` (liga a `startLists[].program_name`: `MPRO` ou `FPRO`).

4. Cross-reference com a tabela `athletes` do Supabase (normalizar nomes: minúsculas, sem acentos, hífen→espaço).

5. Atletas não encontrados: criar via POST em `athletes` com `name`, `gender`, `type='pro'`, `country`, `country_code`.

6. Inserir todos em `race_athletes` com `race_id`, `athlete_id`, `price` (= `current_price` do atleta).

7. Para atletas **novos**: consultar PTO e WTCS e aplicar a tabela de preços (ver seção abaixo). Atualizar `athletes.current_price`, `pto_rank`, `wtcs_rank` e `race_athletes.price`.

**APIs de ranking:**
- PTO masculino: `https://stats.protriathletes.org/api/rankings/men?limit=500` → JSON com `rankings[].{rank, name, points}` (retorna ~500 atletas)
- PTO feminino: `https://stats.protriathletes.org/api/rankings/women?limit=500` → mesmo formato
- WTCS: `https://api.triathlon.org/v1/rankings` requer autenticação (401). Usar ranking hardcoded ou triathlon.org (JS-rendered, não tem API pública simples)

**Tabela de preços inicial** (mesma para PTO e WTCS — usar o melhor rank entre os dois):

| Rank | Preço |
|------|-------|
| 1–7  | T$35  |
| 8–15 | T$28  |
| 16–25| T$22  |
| 26–40| T$18  |
| 41–60| T$15  |
| 61–80| T$12  |
| 81–120| T$11 |
| 121+ ou sem rank | T$10 |

**Não alterar T$ de atletas já existentes** — o preço atual reflete histórico de provas anteriores.
