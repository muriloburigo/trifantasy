# /social-media — Agente de Social Media do Trixer

**Especialidade: canal Instagram, engajamento e publicação.**
Sabe o que engaja no nicho de triathlon, decide o melhor tipo de post para o momento e executa autonomamente.

> Não analisa o negócio. Cria, decide e publica.

## Ações disponíveis

### Modo autônomo (recomendado)
```bash
npm run social -- --action=auto [--dry-run]
```
- Analisa: dia da semana, hora, histórico de posts, provas próximas, movimentos de mercado
- Decide se deve postar agora (baseado em pesquisa de engajamento do nicho tri)
- Escolhe o melhor tipo de conteúdo para o momento
- Gera a legenda e publica

### Executar brief do marketing-agent
```bash
npm run social -- --action=execute-brief [--brief=.agent-reports/brief-YYYY-MM-DD.json]
```
- Lê o brief gerado pelo marketing-agent
- Executa a oportunidade de maior prioridade ainda não publicada
- Marca como executada no arquivo de brief
- Pode rodar múltiplas vezes para executar todas as oportunidades

### Publicar post específico
```bash
# Preview de prova
npm run social -- --action=post-upcoming-race [--race-id=<uuid>] [--dry-run]

# Resultado de prova
npm run social -- --action=post-race-recap --race-id=<uuid> [--dry-run]

# Movimentação do mercado
npm run social -- --action=post-market-update [--dry-run]

# Classificação de liga
npm run social -- --action=post-league-standings --league-id=<uuid> [--dry-run]
```

### Relatório de engajamento
```bash
npm run social -- --action=engagement-report
```
- Analisa o histórico de posts (`.agent-reports/post-log.json`)
- Cruza com pesquisa de engajamento do nicho de triathlon
- Identifica o que está faltando, o que está excessivo, horários sub-ótimos
- Salva em `.agent-reports/engagement-report-YYYY-MM-DD.md`

### Calendário de conteúdo (7 dias)
```bash
npm run social -- --action=content-calendar
```
- Cruza calendário de provas + dados de mercado + melhores horários por dia
- Gera calendário editorial para os próximos 7 dias
- Inclui tipo de post, ângulo da legenda, horário recomendado
- Salva em `.agent-reports/content-calendar-YYYY-MM-DD.md`

## Fluxo completo de operação semanal

```bash
# Segunda-feira: marketing analisa + gera brief
npm run marketing -- --action=briefing

# Social media decide o melhor post do momento
npm run social -- --action=execute-brief

# Ao longo da semana: modo autônomo
npm run social -- --action=auto

# Sexta: gerar calendário da próxima semana
npm run social -- --action=content-calendar

# Quando quiser ver performance:
npm run social -- --action=engagement-report
```

## Intelligence de engajamento (built-in)

O agente já conhece:
- **Melhores dias**: Terça–Quinta > Domingo > Sexta > Segunda
- **Melhores horários**: 7h–8h, 12h–13h, 18h–19h30 (UTC-3)
- **Mix ideal**: 40% race/atleta · 30% mercado/game · 20% comunidade · 10% cultura tri
- **O que salva mais**: análise de atleta, carrosséis táticos
- **O que gera comentários**: "quem você escalaria?" , decisões de pick
- **O que viraliza pós-prova**: recap nas primeiras 2h

## Env vars necessárias

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave admin do Supabase |
| `MAKE_WEBHOOK_URL` | URL do webhook Make.com → Instagram |
| `ANTHROPIC_API_KEY` | Chave da Claude API |
