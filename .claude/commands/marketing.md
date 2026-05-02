# /marketing — Agente de Marketing do Trixer

**Especialidade: negócio, dados e estratégia.**
Analisa o app (Supabase) + tráfego (GA4), identifica oportunidades, gera briefs para o agente de social media executar.

> Não publica no Instagram. Pensa, analisa e delega.

## Ações disponíveis

### Análise completa do negócio
```bash
npm run marketing -- --action=analyze [--report]
```
- Usuários, portfolios, trades, ligas, taxa de ativação, engajamento 7d
- GA4: usuários ativos, novos, sessões, tendência vs 30d anterior
- Com `--report`: gera relatório salvo em `.agent-reports/marketing-report-YYYY-MM-DD.md`

### Pulso do mercado
```bash
npm run marketing -- --action=market-pulse
```
- Top 5 atletas em alta e em queda no mercado Trixer (dados em tempo real)

### Gerar brief para social media
```bash
npm run marketing -- --action=briefing [--dry-run]
```
- Cruza dados do app + provas + mercado
- Usa Claude para identificar as melhores oportunidades de conteúdo
- Salva em `.agent-reports/brief-YYYY-MM-DD.json`
- Social media executa com: `npm run social -- --action=execute-brief`

## Fluxo de parceria com social-media-agent

```
# 1. Marketing analisa e gera o brief estratégico
npm run marketing -- --action=briefing

# 2. Social media lê o brief e publica o melhor post do momento
npm run social -- --action=execute-brief

# Para ver o brief sem salvar:
npm run marketing -- --action=briefing --dry-run
```

## Env vars necessárias

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave admin do Supabase |
| `ANTHROPIC_API_KEY` | Chave da Claude API |
| `GA4_PROPERTY_ID` | ID da propriedade GA4 (opcional) |
| `GA4_SERVICE_ACCOUNT_KEY_JSON` | JSON da service account GA4 (opcional) |
