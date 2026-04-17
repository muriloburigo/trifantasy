# TriFantasy

Fantasy game do circuito Ironman — usuários montam times com atletas PRO e age-groupers reais e pontuam pelo desempenho nas provas.

**Status:** MVP implementado. Aguarda Supabase + .env.local para rodar.

---

## Stack

- **Next.js 16** App Router (não é o Next.js padrão — leia `node_modules/next/dist/docs/`)
- **Supabase** — Auth + PostgreSQL + RLS
- **Tailwind CSS v4** — `@theme inline` em `globals.css`
- **TypeScript** strict
- **Vercel** para deploy

---

## Para começar

1. Criar projeto no Supabase
2. Copiar `.env.local.example` → `.env.local` e preencher
3. Rodar migration: copiar `supabase/migrations/001_initial.sql` no SQL Editor do Supabase
4. Adicionar unique constraint nos atletas (ver abaixo)
5. Criar conta no site e tornar admin: `node scripts/set-admin.mjs email@voce.com`
6. Seed de prova de exemplo: `node scripts/seed-race.mjs`
7. Deploy: `PATH="/opt/homebrew/Cellar/node/25.9.0_1/bin:$PATH" npx vercel --prod`

### Unique constraint em athletes (rodar no Supabase SQL Editor)
```sql
ALTER TABLE athletes ADD CONSTRAINT athletes_name_gender_type_key UNIQUE (name, gender, type);
```

---

## Variáveis de ambiente (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Clientes Supabase

| Função | Chave | Usa RLS | Quando usar |
|--------|-------|---------|-------------|
| `createClient()` | anon + cookie | Sim | Auth, layout, server components logados |
| `createPublicClient()` | anon | Sim | Páginas públicas (sem cookie) |
| `createAdminClient()` | service role | **Não** | Server actions admin (sempre com `requireAdmin()`) |

---

## Estrutura de rotas

```
app/
  (public)/          → loja pública
    page.tsx           → home: calendário de provas
    provas/[slug]/     → detalhe da prova + team builder
    ligas/             → minhas ligas
    ligas/criar/       → criar ou entrar em liga
    ligas/[id]/        → ranking da liga
  (auth)/
    login/
    register/
  admin/              → painel admin (requer is_admin=true)
    dashboard/
    provas/           → CRUD de provas
    atletas/          → adicionar/importar atletas por prova
    resultados/       → importar resultados pós-prova
    pontuacao/        → calcular pontos e marcar prova como finalizada
  api/
    auth/callback/    → OAuth callback
    auth/logout/
```

---

## Banco de dados

| Tabela | Descrição |
|--------|-----------|
| `races` | Provas do calendário Ironman |
| `athletes` | Pool global de atletas (PRO + age-groupers) |
| `race_athletes` | Atletas inscritos por prova + preço em Tricoins |
| `results` | Resultados por atleta por prova (splits + posições) |
| `profiles` | Extensão de auth.users (name, is_admin) |
| `teams` | Um time por usuário por prova |
| `team_athletes` | Atletas no time (máx. 5) |
| `scores` | Pontuação calculada por time |
| `leagues` | Ligas privadas por prova |
| `league_members` | Membros de cada liga |

---

## Mecânicas do jogo

- **Orçamento:** T$100 por prova
- **Time:** 5 atletas (livre mix PRO + age-grouper)
- **Restrição:** máx. 2 atletas do mesmo clube
- **PRO:** pontos por posição no campo PRO + bônus de melhor segmento
- **Age-grouper:** pontos por posição no AG + bônus de segmento + Kona slot (+8)
- **Sem capitão**

### Pontuação PRO (posição no campo)
1º=50, 2º=40, 3º=33, 4º=27, 5º=22, 6-10º=15, 11-20º=8, 21+=3

### Pontuação Age-Grouperconfira (posição no AG)
1º=30, 2º=24, 3º=19, 4-10º=13, top25%=8, 25-50%=5, 50-75%=2, 75%+=1

### Bônus segmentos PRO: natação/bike/corrida melhor geral = +6 cada
### Bônus segmentos AG: melhor no AG = +4 cada; Kona slot = +8

---

## Fluxo de uso

1. Admin cria prova → muda status para `open`
2. Admin importa atletas via JSON (`/admin/atletas`)
3. Usuários criam conta, montam time em `/provas/[slug]`
4. Prova acontece → admin importa resultados via JSON (`/admin/resultados`)
5. Admin dispara cálculo de pontos em `/admin/pontuacao` → status muda para `finished`
6. Rankings ficam disponíveis nas ligas

---

## Scripts

```bash
# Leem .env.local automaticamente
node scripts/seed-race.mjs      # Cria Ironman Brasil 2025 com atletas
node scripts/seed-results.mjs   # Simula resultados para testar scoring
node scripts/set-admin.mjs email@voce.com  # Torna usuário admin
```

---

## Deploy

```bash
PATH="/opt/homebrew/Cellar/node/25.9.0_1/bin:$PATH" npx vercel --prod
```

Erros TypeScript só aparecem nos logs do Vercel — verificar após deploy.

---

## Pendente para produção

- [ ] Domínio customizado no Vercel + `NEXT_PUBLIC_SITE_URL`
- [ ] OG image dinâmica (`app/opengraph-image.tsx`)
- [ ] Sitemap (`app/sitemap.ts`)
- [ ] Scraper do Ironman Tracker para importação automática de atletas/resultados
- [ ] Página de score detalhado por time (`/meu-time/[raceId]`)
- [ ] Ranking geral da prova (público, não só por liga)
- [ ] Notificações por email pós-cálculo de pontos
