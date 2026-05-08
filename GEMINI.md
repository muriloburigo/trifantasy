# Trixer — Contexto para Agentes Gemini

Este arquivo complementa o `CLAUDE.md` e o `AGENTS.md`. Leia ambos antes de qualquer alteração.

---

## Antes de qualquer alteração

1. Leia `CLAUDE.md` completo para entender o domínio, schema e mecânicas
2. Supabase pode estar **pausado** — verifique antes de debugar problema de dados
3. Nunca rode `next build` ou `tsc` localmente — Node v25 é incompatível com o projeto
4. Deploy: push para `main` dispara Vercel automaticamente. Deploy manual: `PATH="/opt/homebrew/Cellar/node/25.9.0_1/bin:$PATH" npx vercel --prod`

---

## Importar Startlist — protrinews.com

O site bloqueia bots (403 no WebFetch) mas aceita `curl` com User-Agent de browser. Todos os dados (masculino e feminino) estão embutidos no HTML como JSON dentro de `self.__next_f.push(...)`.

**Fluxo completo:**

1. Baixar o HTML:
   ```bash
   curl -s "https://protrinews.com/race/<slug>" \
     -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
     -H "Accept: text/html" -L > /tmp/page.html
   ```

2. Extrair o JSON via Python — procurar o `<script>` com `startLists` e `MPRO`. O conteúdo está como string JSON escapada dentro de `self.__next_f.push([1,"..."])`. Fazer `json.loads('"' + inner + '"')` para decodificar, depois localizar `{"startLists":` e extrair o objeto balanceando chaves `{}`.

3. Cada `entry` tem: `athlete_full_name`, `athlete_country_iso2`, `start_list_id` (liga a `startLists[].program_name`: `MPRO` ou `FPRO`).

4. Cross-reference com a tabela `athletes` do Supabase (normalizar nomes: minúsculas, sem acentos, hífen→espaço).

5. Atletas não encontrados: criar via POST em `athletes` com `name`, `gender`, `type='pro'`, `country`, `country_code`.

6. Inserir todos em `race_athletes` com `race_id`, `athlete_id`, `price` (= `current_price` do atleta).

7. Para atletas **novos**: consultar PTO e WTCS e aplicar a tabela de preços (ver abaixo). Atualizar `athletes.current_price`, `pto_rank`, `wtcs_rank` e `race_athletes.price`.

**APIs de ranking:**
- PTO masculino: `https://stats.protriathletes.org/api/rankings?gender=male&limit=500` → JSON com `rankings[].{rank, name, points}`
- PTO feminino: HTML de `https://stats.protriathletes.org/rankings/women` (API gender=female retorna MPRO por bug — parsear os `<div class="trow">` com `data-division="FPRO"`)
- WTCS homens: `https://triathlon.org/tri-api/v1/rankings/15` → `data.rankings[].athlete_full_name` (ordem = posição)
- WTCS mulheres: `https://triathlon.org/tri-api/v1/rankings/16`

**Tabela de preços inicial** (mesma para PTO e WTCS — usar o melhor rank entre os dois):

| Rank | Preço |
|------|-------|
| 1–7  | T$35  |
| 8–15 | T$28  |
| 16–25| T$22  |
| 26–40| T$18  |
| 41–60| T$15  |
| 61–80| T$12  |
| 81–120| T$11 |
| 121+ ou sem rank | T$10 |

**Não alterar T$ de atletas já existentes** — o preço atual reflete histórico de provas anteriores.

---

## Cadastro de Atleta Individual

```bash
cd /tmp/trifantasy
export $(grep -v '^#' .env.local | xargs) 2>/dev/null
node scripts/create-athlete.mjs \
  --name "Nome Completo" \
  --gender M \
  --country France \
  --country-code FR \
  --pto-rank 38 \
  --race-id <uuid-da-prova>
```

Após cadastrar, atualizar `pto_rank`, `wtcs_rank` e `current_price` na tabela `athletes` e `price` em `race_athletes` com base na tabela acima.

---

## Notas Importantes

- **Unique constraint de atletas:** `(name, gender, type)` — não apenas nome
- **`portfolio`** = source of truth do elenco. **`teams` + `team_athletes`** = cache para scores
- **`races.status`** lifecycle: `upcoming` → `open` → `locked` → `finished`
- WTCS lista apenas ~40 homens e ~28 mulheres (top do circuito olímpico) — especialistas olímpicos podem ter T$ bem superior ao que o rank PTO sugere
- Preço clamped: **T$1 mínimo, T$35 máximo**
