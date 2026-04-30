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
| `INSTAGRAM_BUSINESS_ACCOUNT_ID` | ID da conta business @trixer.app |
| `INSTAGRAM_ACCESS_TOKEN` | Token de longa duração da Graph API |
| `ANTHROPIC_API_KEY` | Chave da Claude API para geração de copy |
| `GA4_PROPERTY_ID` | ID da propriedade GA4 (ex: `123456789`) |
| `GA4_SERVICE_ACCOUNT_KEY_JSON` | JSON da service account com acesso ao GA4 |

## Como obter o Instagram Access Token

1. Acesse [developers.facebook.com](https://developers.facebook.com)
2. Crie um app → Produto: Instagram Graph API
3. Adicione a conta @trixer.app como conta de teste
4. Gere um token de longa duração (60 dias → pode ser renovado programaticamente)
5. Salve `INSTAGRAM_BUSINESS_ACCOUNT_ID` e `INSTAGRAM_ACCESS_TOKEN` no `.env.local` e no Vercel

## Como configurar o Google Analytics

1. No Google Cloud Console, crie uma Service Account
2. Baixe o JSON das credenciais
3. No GA4, vá em Administração → Gestão de acesso → adicione o e-mail da service account com papel "Leitor"
4. Stringify o JSON e salve como `GA4_SERVICE_ACCOUNT_KEY_JSON`
5. O `GA4_PROPERTY_ID` está em GA4 → Administração → Detalhes da propriedade

## Uso com --dry-run

Sempre rode com `--dry-run` primeiro para ver a legenda gerada e a imagem antes de publicar:
```bash
node scripts/agents/marketing-agent.mjs --action=post-upcoming-race --dry-run
```

## Sobre as imagens

O Instagram Graph API exige uma URL pública para a imagem (não upload direto).
Passe `--image-url=https://...` com a URL da imagem, ou use o card gerado pelo `/share` e hospedado no Supabase Storage.

Roadmap: integrar com o `/share` para gerar + hospedar o card automaticamente antes de postar.
