# Sync Rankings

Sincroniza os rankings PTO e WTCS de todos os atletas do sistema com as fontes oficiais ao vivo.

**Atualiza APENAS:** `pto_rank` e `wtcs_rank`
**NÃO altera:** `current_price`, `price_change`, `race_athletes.price` nem nenhum outro valor de T$

O output exibe o T$ que seria sugerido pela tabela de preços (informativo), mas não o aplica.

## Como usar

```bash
cd /tmp/trifantasy
export $(grep -v '^#' .env.local | xargs) 2>/dev/null
node scripts/sync-ranks.mjs
```

## O que faz

1. Busca rankings PTO masculino via API JSON (`/rankings/men?limit=500`)
2. Busca rankings PTO feminino via API JSON (`/rankings/women?limit=500`)
   - Fallback automático para HTML scraping se a API retornar dados incorretos (bug conhecido com `?gender=female`)
3. Busca rankings WTCS masculino (`/rankings/15`) e feminino (`/rankings/16`) via API triathlon.org
   - Usa posição no array como rank (campo `rank` da API é nulo)
4. Para cada atleta no banco: atualiza `pto_rank` e `wtcs_rank`, nada mais
5. Exibe (informativo) o T$ sugerido pela tabela de preços vs T$ atual — **sem aplicar nenhuma alteração**

## Fontes de ranking

| Fonte | URL |
|-------|-----|
| PTO men | `https://stats.protriathletes.org/api/rankings/men?limit=500` |
| PTO women | `https://stats.protriathletes.org/api/rankings/women?limit=500` |
| WTCS men | `https://triathlon.org/tri-api/v1/rankings/15` |
| WTCS women | `https://triathlon.org/tri-api/v1/rankings/16` |

## Tabela de T$ sugerido (apenas informativa neste script)

Caso o atleta tenha rank em PTO e WTCS, usa o melhor (menor número = maior preço):

| Rank | T$ |
|------|----|
| 1–7  | 35 |
| 8–15 | 28 |
| 16–25 | 22 |
| 26–40 | 18 |
| 41–60 | 15 |
| 61–80 | 12 |
| 81–120 | 11 |
| 121+ | 10 |

## Notas

- PTO lista até 500 atletas; WTCS lista apenas ~40H / ~28M (top do circuito olímpico)
- Atletas com WTCS rank relevante (especialistas olímpicos) podem ter T$ sugerido bem superior ao que o PTO indica
- Para **aplicar** ajustes de T$ manualmente: `/admin/atletas`
- Para repricing global baseado em performance de prova: `scripts/reprice-athletes.mjs`
- Este script substitui `sync-unified-ranks-v3.mjs` para sync de rankings sem efeitos colaterais em preços
