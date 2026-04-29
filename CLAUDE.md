# Trixer

Fantasy game do circuito mundial de Triathlon — usuários montam elencos com até 5 atletas profissionais, pontuam pelo desempenho nas provas reais e competem em ligas.

**Status:** Produção — Core funcional, Ligas, Mercado, Push Notifications e Card Generator ativos.
**URL Oficial:** https://www.trixer.app

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 16.2.4 App Router, React 19 |
| Styling | Tailwind CSS v4 (config via `globals.css`, sem `tailwind.config.js`) |
| Database | Supabase (PostgreSQL 15) + RLS |
| Auth | Supabase Auth + Cloudflare Turnstile (captcha) |
| i18n | next-intl 4.x — PT / EN / ES |
| Push | Web-Push API (VAPID) + Service Workers |
| Image Export | html-to-image 1.11.13 |
| Deploy | Vercel (auto-deploy via GitHub push) |
| Fontes | Inter (body), Sora (headings) via @next/font |

---

## Mecânicas do Jogo

- **Orçamento Inicial:** T$100 (Trixer dollars). Aumenta conforme lucro nas vendas.
- **Elenco:** Máximo 5 atletas (PRO e/ou Elite Olímpica combinados).
- **Escalação:** Automática — elenco atual = time para todas as provas abertas.
- **Preços:** Dinâmicos, baseados no melhor entre **PTO World Rank** (longa distância) e **WTCS Olympic Rank** (curta). Range: T$1–T$35.
- **Janela de Mercado:** Abre após cada prova, fecha 24h antes da próxima (midnight 23:00 UTC).
- **Liga Global:** Todos os usuários são automaticamente membros da "Liga Global Trixer".
- **Ligas Privadas/Públicas:** Criadas por usuários, com código de convite ou adesão pública.
- **Restrição de Clube:** Máximo 2 atletas do mesmo clube no elenco.

---

## Pontuação

### PRO (longa e média distância)
| Posição | Pontos base |
|---------|-------------|
| 1º | 50 |
| 2º | 40 |
| 3º | 33 |
| 4º | 28 |
| 5º | 24 |
| 6º–10º | 15 |
| 11º–20º | 0 |
| 21º+ | 3 |
| DNF/DNS | 0 |

Bônus de segmento PRO: melhor swim / bike / run geral = **+6pts** cada.

### Age Group
| Posição | Pontos base |
|---------|-------------|
| 1º AG | 30 |
| 2º AG | 24 |
| 3º AG | 19 |
| Top 10% | 13 |
| Top 25% | 8 |
| Top 50% | 5 |
| Top 75% | 2 |
| Resto | 1 |
| DNF/DNS | 0 |

Bônus de segmento AG: melhor swim / bike / run na categoria = **+4pts** cada.

---

## Precificação de Mercado (pós-prova)

### PRO
| Resultado | Variação |
|-----------|----------|
| 1º | +4 |
| 2º–3º | +3 |
| 4º–5º | +2 |
| 6º–10º | +1 |
| 11º–20º | 0 |
| 21º+ | −1 |
| DNF/DNS | −2 |
| Líder de segmento | +1 cada |

### Age Group
| Resultado | Variação |
|-----------|----------|
| 1º AG | +3 |
| 2º–3º AG | +2 |
| Top 25% | +1 |
| 25–50% | 0 |
| 50–75% | −1 |
| 75%+ | −1 |
| DNF/DNS | −2 |
| Líder de segmento | +1 cada |

Preço clamped T$1–T$35. Propagado para `race_athletes` de provas futuras.

---

## Estrutura de Banco de Dados

### Tabelas principais

| Tabela | Colunas-chave | Descrição |
|--------|---------------|-----------|
| `races` | id, name, slug, date, location, country, country_code, distance, has_pro_field, status, image_url | Provas do calendário. `status`: upcoming → open → locked → finished |
| `athletes` | id, name, country, country_code, club, gender (M/F), type (pro/age_grouper), pto_rank, wtcs_rank, photo_url, current_price, price_change | Pool global de atletas |
| `race_athletes` | race_id, athlete_id, bib, price | Startlist por prova |
| `results` | race_id, athlete_id, overall_pos, ag_pos, pro_pos, swim_time, t1_time, bike_time, t2_time, run_time, finish_time, dnf, dns, kona_slot | Resultados importados |
| `profiles` | id, name, country, is_admin, locale, wallet, has_seen_tour, photo_url | Extensão do auth.users |
| `teams` | id, user_id | 1 por usuário — cache do elenco (espelho do `portfolio`) |
| `team_athletes` | team_id, athlete_id | Atletas do time (max 5) |
| `portfolio` | user_id, athlete_id, bought_price | **Source of truth** do elenco atual |
| `scores` | team_id, race_id, total_points, breakdown (JSONB) | Pontuação calculada |
| `leagues` | id, name, race_id (nullable), invite_code, owner_id, is_public, is_global | Ligas |
| `league_members` | league_id, user_id, joined_at | Membros de liga |
| `market_transactions` | user_id, athlete_id, type (buy/sell), price, wallet_before, wallet_after | Histórico de transações |
| `athlete_price_history` | athlete_id, old_price, new_price, change, reason, race_id, breakdown (JSONB) | Auditoria de preços |
| `push_subscriptions` | user_id, endpoint, p256dh, auth | Subscrições de push |
| `push_notification_log` | user_id, type, ref_id, sent_at | Dedup de notificações |
| `support_tickets` | user_id, name, email, subject, message, status, admin_note | Suporte |

### Unique constraints importantes
- `athletes`: `(name, gender, type)`
- `push_notification_log`: `(user_id, type, ref_id)` — usado para dedup

### Funções do banco
- `sync_portfolio_team_for_user()` — Sincroniza `portfolio` → `teams` + `team_athletes`
- `enforce_portfolio_limit()` — Trigger: max 5 atletas no portfolio
- `join_global_league()` — Trigger: novos usuários entram na liga global automaticamente

---

## Rotas

### Públicas / Usuário (`app/(public)/`)
| Rota | Descrição |
|------|-----------|
| `/` | Home — banner de mercado, ranking global, elenco do usuário |
| `/atletas` | Diretório de atletas com filtros |
| `/atletas/[id]` | Detalhe do atleta (stats, histórico de preço) |
| `/elenco` | Elenco do usuário (comprar/vender/exportar PNG) |
| `/provas` | Calendário de provas |
| `/provas/[slug]` | Detalhe da prova + pontuações + time builder |
| `/meu-time/[id]` | Breakdown de pontos do time em uma prova específica |
| `/ligas` | Diretório de ligas |
| `/ligas/criar` | Criar ou entrar em liga |
| `/ligas/[id]` | Detalhe da liga (classificação, membros) |
| `/time/[userId]` | Perfil público do time (com OG image) |
| `/share` | Gerador de cards para Instagram (5 templates) |
| `/trixers` | Lista pública de usuários |
| `/perfil` | Edição de perfil (nome, idioma, senha) |
| `/suporte` | Formulário de suporte |
| `/regras` | Regras e explicação do jogo |
| `/privacidade` | Política de privacidade |

### Auth (`app/(auth)/`)
| Rota | Descrição |
|------|-----------|
| `/login` | Login |
| `/register` | Cadastro |
| `/esqueci-senha` | Recuperação de senha |
| `/nova-senha` | Definir nova senha |

### Admin (`app/admin/`)
| Rota | Descrição |
|------|-----------|
| `/admin/dashboard` | Métricas e saúde do sistema |
| `/admin/provas` | Listar e criar provas |
| `/admin/provas/[id]` | Editar prova |
| `/admin/provas/[id]/startlist` | Gerenciar startlist e preços |
| `/admin/atletas` | Gerenciar atletas (CRUD) |
| `/admin/importar` | Importação de startlists e resultados |
| `/admin/resultados` | Upload de resultados da prova |
| `/admin/mercado` | Ajuste manual de preços |
| `/admin/pontuacao` | Calcular pontos + atualizar mercado |
| `/admin/notificacoes` | Enviar notificações de teste |
| `/admin/suporte` | Gerenciar tickets de suporte |
| `/admin/usuarios` | Gerenciar perfis de usuário |
| `/admin/analytics` | Analytics |

### API
| Rota | Descrição |
|------|-----------|
| `/api/cron/notifications` | Cron: dispara engine de notificações (Bearer CRON_SECRET) |
| `/api/cron/sync-ranks` | Cron: sincroniza rankings PTO + WTCS (segunda, 07h GMT-3) |
| `/api/push/subscribe` | POST/DELETE: registrar/remover subscrição de push |
| `/api/auth/callback` | OAuth callback do Supabase |
| `/api/auth/logout` | Logout |
| `/api/auth/verify-captcha` | Validação Turnstile |

---

## Funcionalidades Implementadas

- [x] Gerenciamento de Elenco (compra/venda, limite de 5, restrição de clube)
- [x] Mercado Dinâmico (preços baseados em PTO + WTCS)
- [x] Ligas Privadas, Públicas e Liga Global automática
- [x] Onboarding com tour guiado no primeiro acesso
- [x] Score Detalhado com breakdown por segmento
- [x] Leaderboard por prova com ranking de usuários
- [x] Exportação do elenco como PNG (html-to-image)
- [x] Gerador de Cards para Instagram (`/share`) — 5 templates, feed e story
- [x] Push Notifications com i18n (PT/EN/ES) e dedup automático
- [x] Notificações: prova se aproximando (7d/1d/hoje), mercado aberto/fechado, atleta fora da startlist
- [x] OG Images dinâmicas para compartilhamento no WhatsApp
- [x] SEO: Sitemap automático, Robots.txt, Meta Tags dinâmicas
- [x] i18n completo PT / EN / ES
- [x] Interface responsiva (mobile-first)
- [x] CAPTCHA via Cloudflare Turnstile no cadastro/login
- [x] Admin completo: provas, atletas, resultados, mercado, pontuação, suporte, usuários

---

## Scripts Úteis

```bash
# Sincronizar rankings mundiais (PTO + WTCS)
node scripts/sync-unified-ranks-v3.mjs

# Tornar usuário admin
node scripts/set-admin.mjs email@exemplo.com

# Seed de prova específica
node scripts/seed-brasilia-2026.mjs

# Importar resultados de prova (CSV)
node scripts/import-results.mjs

# Gerar chaves VAPID (apenas uma vez)
node scripts/generate-vapid-keys.mjs
```

---

## Deploy

Deploy automático via push para `main` no GitHub (Vercel CI/CD).

Deploy manual:
```bash
PATH="/opt/homebrew/Cellar/node/25.9.0_1/bin:$PATH" npx vercel --prod
```

### Variáveis de Ambiente (Vercel)
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
