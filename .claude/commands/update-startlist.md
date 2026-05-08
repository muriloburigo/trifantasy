# Update Startlist

Atualiza o startlist de uma prova a partir de uma URL.
Faz tudo em um único comando: busca M + F, deduplica, cadastra novos atletas com T$ inicial correto e busca fotos.

## Como usar

```bash
cd /tmp/trifantasy-work

# Preview (sem gravar nada)
node scripts/update-startlist.mjs <URL> <RACE_ID> --dry-run

# Aplicar
node scripts/update-startlist.mjs <URL> <RACE_ID>
```

## O que faz (em ordem)

1. **Busca rankings ao vivo** — PTO (M e F) + WTCS (M e F) para ter os ranks atualizados antes de criar atletas
2. **Busca o startlist da URL** — MPRO e FPRO no mesmo HTML
   - protrinews.com: usa curl + extração RSC JSON (site bloqueia bots)
   - Outros sites: fetch direto → `__NEXT_DATA__` → JSON embutido → HTML table
3. **Verifica duplicatas** com dois níveis:
   - Match exato (após normalização: minúsculas, sem acentos, hífen→espaço)
   - Match fuzzy (mesmo primeiro + último nome) → **vincula** mas **sinaliza para revisão**
4. **Cria atletas novos** com:
   - `type = 'pro'`, `gender`, `country`, `country_code`
   - T$ inicial = `priceFromRank(min(pto_rank, wtcs_rank))` — melhor dos dois
   - `pto_rank` e `wtcs_rank` preenchidos com dados ao vivo
   - **Nunca altera T$ de atletas já existentes**
5. **Vincula todos em `race_athletes`** (upsert por `race_id, athlete_id`)
   - Preço na `race_athletes` = `current_price` do atleta (existente) ou T$ inicial (novo)
6. **Busca fotos** para atletas sem `photo_url` via `update-athlete-photos.mjs`

## Regras críticas

- **Nunca muda T$ de atletas existentes** — o preço reflete histórico de provas
- **Nunca cria duplicata** — usa `upsert` com `onConflict: name,gender,type`
- Matches fuzzy são vinculados de forma conservadora mas **sempre reportados** — revisar em `/admin/atletas`

## Após executar

- Revisar os matches fuzzy sinalizados (se houver)
- Conferir startlist em `/admin/provas/<id>/startlist`
- Se algum atleta não foi encontrado por mudança de nome, cadastrar manualmente via `/cadastrar-atleta`

## Fontes de ranking usadas

| Fonte | URL |
|-------|-----|
| PTO men | `https://stats.protriathletes.org/api/rankings/men?limit=500` |
| PTO women | `https://stats.protriathletes.org/api/rankings/women?limit=500` |
| WTCS men | `https://triathlon.org/tri-api/v1/rankings/15` |
| WTCS women | `https://triathlon.org/tri-api/v1/rankings/16` |
