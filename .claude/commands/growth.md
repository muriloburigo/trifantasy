# /growth — Agente de Growth do Trixer

Agente autônomo de growth. Analisa o funil de conversão, identifica gargalos, dispara push notifications de reativação e gera relatórios priorizados com IA.

## Ações disponíveis

### Relatório completo de growth
```bash
node scripts/agents/growth-agent.mjs --action=report [--dry-run]
```
- Funil completo: registrado → portfolio → trade → liga
- Dados do Google Analytics: aquisição por canal, páginas mais visitadas, retenção
- Análise com Claude: diagnóstico, top 3 experimentos, ações imediatas, 5 KPIs críticos
- Salva em `.agent-reports/growth-report-YYYY-MM-DD.md`

### Ver funil de conversão
```bash
node scripts/agents/growth-agent.mjs --action=funnel
```
- Percentuais de conversão em cada etapa do funil
- Identifica o maior drop-off

### Disparar push de reativação
```bash
node scripts/agents/growth-agent.mjs --action=reactivate-push [--dry-run] [--limit=50]
```
- Encontra usuários inativos há >14 dias com push ativo
- Envia notificação personalizada com CTA da próxima prova
- Dedup automático (não renotifica quem já recebeu hoje)

### Disparar push de engajamento por prova
```bash
node scripts/agents/growth-agent.mjs --action=race-engagement-push --race-id=<uuid> [--dry-run] [--limit=100]
```
- Identifica usuários com push que ainda não montaram elenco com atletas desta prova
- Envia notificação com contagem regressiva para fechar o mercado
- Ideal para rodar 48h antes de cada prova

### Análise de viralidade das ligas
```bash
node scripts/agents/growth-agent.mjs --action=league-virality
```
- Ranking de ligas por número de membros
- % de ligas que atingiram tamanho "viral" (≥5 membros)
- Identifica ligas com maior potencial de crescimento orgânico

## Env vars necessárias

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave admin do Supabase |
| `ANTHROPIC_API_KEY` | Chave da Claude API para análise de growth |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Chave VAPID pública (Web Push) |
| `VAPID_PRIVATE_KEY` | Chave VAPID privada |
| `VAPID_EMAIL` | E-mail VAPID (ex: `mailto:contato@trixer.app`) |
| `GA4_PROPERTY_ID` | ID da propriedade GA4 (opcional, enriquece relatório) |
| `GA4_SERVICE_ACCOUNT_KEY_JSON` | JSON service account GA4 (opcional) |

## Funil monitorado

```
Registrado
    ↓ (gap: usuários sem portfolio)
Portfolio ativo
    ↓ (gap: usuários que nunca compraram/venderam)
Fez ≥1 trade
    ↓ (gap: usuários que jogam sozinhos)
Participa de liga
    ↓ (gap: usuários sem notificações)
Push habilitado
    ↓ (gap: usuários que pararam de jogar)
Ativo últimos 7d
```

## Métricas chave

- **Ativação**: % usuários registrados → portfolio (meta: >60%)
- **Engajamento**: % usuários ativos nos últimos 7 dias (meta: >30%)
- **Social**: % usuários em liga privada (meta: >40%)
- **Retenção D30**: % usuários que fizeram trade no mês (meta: >25%)
- **Push opt-in**: % usuários com push ativo (meta: >50%)

## Integração com calendário de provas

Para maximizar o impacto, rode `race-engagement-push` 48h antes de cada prova:
```bash
# Encontre o race_id
node scripts/create-race.mjs --list

# Dispare o push (--dry-run primeiro)
node scripts/agents/growth-agent.mjs --action=race-engagement-push --race-id=<uuid> --dry-run
node scripts/agents/growth-agent.mjs --action=race-engagement-push --race-id=<uuid>
```

## Relatórios salvos

Todos os relatórios são salvos em `.agent-reports/` (pasta no gitignore).
Para comparar semana a semana:
```bash
ls -la .agent-reports/
diff .agent-reports/growth-report-2026-04-23.md .agent-reports/growth-report-2026-04-30.md
```
