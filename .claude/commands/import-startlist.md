# Import Startlist

Importa a startlist de uma prova de triathlon a partir de uma URL.

## O que faz

1. Faz scraping da URL informada (suporte a PTO, Ironman, sites Next.js, tabelas HTML)
2. Normaliza nomes, gênero e código de país
3. Calcula preço estimado com base no rank PTO
4. Faz upsert dos atletas na tabela `athletes`
5. Vincula cada atleta à prova via `race_athletes`

## Como usar

O usuário deve informar:
- **URL** da página de startlist (ex: https://protriathletes.org/events/slug/startlist)
- **race_id** da prova no banco (UUID) — pode ser buscado em /admin/provas ou via SQL

Peça ao usuário esses dados se não foram informados nos argumentos. Depois execute:

```bash
cd /tmp/trifantasy
node scripts/import-startlist.mjs "$URL" "$RACE_ID"
```

Para importar todos (não só PRO), adicione `--all`:

```bash
node scripts/import-startlist.mjs "$URL" "$RACE_ID" --all
```

## Variáveis de ambiente necessárias

O script precisa de `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.
Carregue do `.env.local`:

```bash
cd /tmp/trifantasy
export $(grep -v '^#' .env.local | xargs) 2>/dev/null
node scripts/import-startlist.mjs "$URL" "$RACE_ID"
```

## Após executar

- Informe ao usuário quantos atletas foram importados e quais erros ocorreram
- Se houver erros de "athlete not found", é esperado — o atleta já pode existir com nome diferente
- Recomende checar `/admin/atletas?race_id=<race_id>` para confirmar o resultado
