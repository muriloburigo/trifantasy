# /marketing — Agente de Marketing do Trixer

Agente autônomo de marketing. Executa ações reais: gera copy com IA, publica no Instagram, analisa dados do Supabase + Google Analytics.

## Ações disponíveis

### Publicar resultado de prova
```bash
node scripts/agents/marketing-agent.mjs --action=post-race-recap --race-id=<uuid> [--dry-run]
```
- Busca resultados reais do banco
- Gera legenda com Claude (tom esportivo, em PT)
- Publica no @trixer.app via Instagram Graph API

### Publicar movimentação do mercado
```bash
node scripts/agents/marketing-agent.mjs --action=post-market-update [--dry-run]
```
- Top 5 atletas em alta e em queda
- Ideal para segunda-feira ou pós-prova

### Publicar prévia de prova
```bash
node scripts/agents/marketing-agent.mjs --action=post-upcoming-race [--race-id=<uuid>] [--dry-run]
```
- Se `--race-id` omitido, usa a próxima prova em aberto
- Mostra favoritos do mercado + quantos dias faltam

### Publicar classificação de liga
```bash
node scripts/agents/marketing-agent.mjs --action=post-league-standings --league-id=<uuid> [--dry-run]
```

### Analisar + gerar relatório editorial
```bash
node scripts/agents/marketing-agent.mjs --action=analyze --report [--dry-run]
```
- Cruza dados do Supabase com Google Analytics (30 dias)
- Gera relatório com: diagnóstico, 3 conteúdos prioritários para a semana, calendário editorial 7 dias
- Salva em `.agent-reports/marketing-report-YYYY-MM-DD.md`

## Env vars necessárias

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave admin do Supabase |
| `MAKE_WEBHOOK_URL` | URL do webhook do Make.com (ver configuração abaixo) |
| `ANTHROPIC_API_KEY` | Chave da Claude API para geração de copy |
| `GA4_PROPERTY_ID` | ID da propriedade GA4 (opcional) |
| `GA4_SERVICE_ACCOUNT_KEY_JSON` | JSON da service account GA4 (opcional) |

## Como configurar o Make.com (10 minutos)

1. Crie conta gratuita em [make.com](https://make.com) (1.000 operações/mês grátis)

2. Clique em **Create a new scenario**

3. Adicione o módulo **Webhooks → Custom webhook**
   - Clique em "Add" → copie a URL gerada (ex: `https://hook.eu1.make.com/abc123...`)
   - Essa URL vai para `MAKE_WEBHOOK_URL` no Vercel

4. Adicione o módulo **Instagram for Business → Create a Photo Post**
   - Conecte sua conta @trixer.app via OAuth (simples, sem Graph API)
   - Campo **Caption**: `{{1.caption}}`
   - Campo **Image URL**: `{{1.imageUrl}}`

5. Salve e ative o cenário (botão no canto inferior esquerdo)

6. Salve `MAKE_WEBHOOK_URL` no Vercel Dashboard → Environment Variables

## Como configurar o Google Analytics (opcional)

1. No Google Cloud Console, crie uma Service Account
2. Baixe o JSON das credenciais
3. No GA4 → Administração → Gestão de acesso → adicione o e-mail da service account como "Leitor"
4. Stringify o JSON e salve como `GA4_SERVICE_ACCOUNT_KEY_JSON`
5. O `GA4_PROPERTY_ID` está em GA4 → Administração → Detalhes da propriedade

## Uso com --dry-run

Sempre rode com `--dry-run` primeiro para ver a legenda gerada antes de publicar:
```bash
node scripts/agents/marketing-agent.mjs --action=post-upcoming-race --dry-run
```

## Sobre as imagens

Por padrão usa a OG image do app. Para usar os cards do `/share`:
1. Exporte o card pelo `/share` e hospede em qualquer URL pública (ex: Supabase Storage)
2. Passe `--image-url=https://...` na chamada do agente
