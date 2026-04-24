# Trixer

Fantasy game do circuito mundial de Triathlon — usuários montam elencos com 5 atletas profissionais e pontuam pelo desempenho nas provas reais.

**Status:** Produção — Core funcional, Ligas e Mercado ativos.

---

## Stack

- **Next.js 16** App Router
- **Supabase** — Auth + PostgreSQL + RLS
- **Tailwind CSS v4**
- **TypeScript** strict
- **Vercel** para deploy

---

## Mecânicas do Jogo

- **Orçamento Inicial:** T$100 (vitalício, aumenta conforme lucro nas vendas).
- **Elenco:** Exatamente 5 atletas no total (PRO + Elite Olímpica).
- **Escalação:** Automática — seu elenco atual de 5 atletas é o seu time para todas as provas.
- **Mercado:** Dinâmico, baseado no melhor ranking entre **PTO World Rank** (longa distância) e **WTCS Olympic Rank** (curta distância).
- **Liga Global:** Todos os usuários participam da "Liga Global Trixer" por padrão.
- **Janela de Mercado:** Abre após cada prova, fecha 24h antes da próxima.

---

## Funcionalidades Implementadas

- [x] **Gerenciamento de Elenco:** Compra e venda de atletas com limite fixo de 5 nomes.
- [x] **Mercado Unificado:** Preços baseados no melhor de dois rankings mundiais (PTO + WTCS).
- [x] **Ligas:** Privadas, Públicas e a Liga Global automática.
- [x] **Onboarding:** Tour guiado no primeiro acesso para novos usuários.
- [x] **Score Detalhado:** Página de breakdown de pontos (`/meu-time/[id]`) com detalhes por segmento.
- [x] **Leaderboard por Prova:** Ranking de usuários dentro da página de resultados de cada prova.
- [x] **Compartilhamento:** Botões de WhatsApp com **OG Images dinâmicas** (mostram foto e preço do atleta).
- [x] **SEO:** Sitemap automático, Robots.txt e Meta Tags dinâmicas.
- [x] **Responsividade:** Interface otimizada para mobile.

---

## Estrutura de Banco de Dados (Principais)

| Tabela | Descrição |
|--------|-----------|
| `races` | Provas do calendário (status: upcoming, open, locked, finished). |
| `athletes` | Pool global com `pto_rank` e `wtcs_rank`. |
| `portfolio` | **Source of truth** do elenco atual de cada usuário. |
| `teams` | Cache do elenco (espelho do `portfolio`) usado para histórico de scores. |
| `scores` | Pontuação calculada por usuário por prova (inclui JSON `breakdown`). |
| `leagues` | Ligas de competição (flag `is_global` para a liga principal). |

---

## Scripts Úteis

```bash
node scripts/sync-unified-ranks-v2.mjs  # Sincroniza atletas com rankings mundiais
node scripts/seed-brasilia-2026.mjs     # Exemplo de seed de prova real
node scripts/set-admin.mjs email@ex.com # Torna usuário admin
```

---

## Deploy

O deploy é automático via GitHub Actions ou manual via Vercel CLI:
```bash
PATH="/opt/homebrew/Cellar/node/25.9.0_1/bin:$PATH" npx vercel --prod
```
URL Oficial: [https://www.trixer.app](https://www.trixer.app)
