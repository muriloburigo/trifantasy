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
- **i18n:** strings de UI em `messages/pt.json`, `messages/en.json`, `messages/es.json` — nunca hardcode PT sem adicionar EN/ES também

---

## Schema — Pontos de Atenção

- **Unique constraint de atletas:** `(name, gender, type)` — não apenas nome
- **`portfolio`** = source of truth do elenco atual. **`teams` + `team_athletes`** = cache/espelho para histórico de scores. Não confundir.
- **`races.status`** lifecycle: `upcoming` → `open` → `locked` → `finished`
  - `open`: startlist disponível, mercado aberto
  - `locked`: mercado fechado 24h antes da prova
  - `finished`: resultados importados e pontos calculados
- **`races.distance`** valores: `'full'`, `'70.3'`, `'T100'`, `'ows'`, `'other'`
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
