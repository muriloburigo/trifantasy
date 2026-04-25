# Import Results

Importa os resultados de uma prova de triathlon a partir de uma URL.

## O que faz

1. Faz scraping da URL informada (suporte a PTO, Ironman, sites Next.js, tabelas HTML)
2. Extrai: posição PRO, tempos por segmento (nado/bike/corrida), tempo total, DNF/DNS
3. Associa cada resultado ao atleta via nome ou bib number
4. Faz upsert na tabela `results`

## Pré-requisito

Os atletas precisam estar na startlist da prova. Se não estiverem, execute `/import-startlist` primeiro.

## Como usar

O usuário deve informar:
- **URL** da página de resultados (ex: https://protriathletes.org/events/slug/results)
- **race_id** da prova no banco (UUID) — pode ser buscado em /admin/provas ou via SQL

Peça ao usuário esses dados se não foram informados nos argumentos. Depois execute:

```bash
cd /tmp/trifantasy
export $(grep -v '^#' .env.local | xargs) 2>/dev/null
node scripts/import-results.mjs "$URL" "$RACE_ID"
```

## Variáveis de ambiente necessárias

O script precisa de `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.

## Após executar

- Informe quantos resultados foram importados e os erros
- Se houver erros de "Atleta não encontrado": o atleta está na URL mas não na startlist da prova
  → Solução: importe a startlist primeiro com `/import-startlist`, depois rode novamente
- Após importar resultados com sucesso, lembre o usuário de ir em `/admin/pontuacao` para calcular os Trix Scores
