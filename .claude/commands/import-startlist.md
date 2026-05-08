# Import Startlist

Importa a startlist de uma prova de triathlon a partir de uma URL.

## O que faz

1. Faz scraping da URL informada (suporte a PTO, Ironman, sites Next.js, tabelas HTML)
2. Normaliza nomes, gênero e código de país
3. Calcula preço estimado com base no rank PTO
4. Faz upsert dos atletas na tabela `athletes`
5. Vincula cada atleta à prova via `race_athletes`

## Como usar (script automático)

O usuário deve informar:
- **URL** da página de startlist (ex: https://protriathletes.org/events/slug/startlist)
- **race_id** da prova no banco (UUID) — pode ser buscado em /admin/provas ou via SQL

```bash
cd /tmp/trifantasy-work
export $(grep -v '^#' .env.local | xargs) 2>/dev/null
node scripts/import-startlist.mjs "$URL" "$RACE_ID"
```

Para importar todos (não só PRO), adicione `--all`:

```bash
node scripts/import-startlist.mjs "$URL" "$RACE_ID" --all
```

---

## Processo manual: protrinews.com

O site **protrinews.com** bloqueia bots (retorna 403 ao WebFetch), mas aceita curl com User-Agent de browser. Os dados estão embutidos como JSON no HTML server-side.

### 1. Buscar o race_id da prova

```bash
curl -s "https://YOUR_PROJECT.supabase.co/rest/v1/races?select=id,name,slug&name=ilike.*NOME*" \
  -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY"
```

### 2. Extrair o JSON da página (ambas as abas M e F estão no mesmo HTML)

```python
import re, json

html = open('/tmp/page.html').read()  # curl -s URL -H "User-Agent: Mozilla/5.0" -L > /tmp/page.html

scripts = re.findall(r'<script[^>]*>(.*?)</script>', html, re.DOTALL)
for script in scripts:
    if 'startLists' in script and 'MPRO' in script:
        match = re.match(r'self\.__next_f\.push\(\[1,"(.*)"\]\)$', script, re.DOTALL)
        inner = json.loads('"' + match.group(1) + '"')
        json_match = re.search(r'\{"startLists":', inner)
        # Extrair JSON completo encontrando o { } balanceado a partir daí
        # Campos relevantes em cada entry: athlete_full_name, athlete_country_iso2,
        #   start_list_id (liga a startLists[].program_name: MPRO ou FPRO),
        #   athlete_id (id no protrinews, não no nosso banco)
```

### 3. Cross-reference com a tabela `athletes`

- Normalizar nomes removendo acentos e substituindo hífen por espaço para matching
- Atletas não encontrados pelo nome devem ser criados via API REST do Supabase
- Campos obrigatórios ao criar: `name`, `gender` (M/F), `type` ('pro'), `country`, `country_code`
- O `current_price` usa default T$10 — **atualizar após o passo 5**

### 4. Inserir em `race_athletes`

Campos: `race_id`, `athlete_id`, `price` (= `current_price` do atleta).

### 5. Atualizar T$ dos atletas novos (pós-cadastro)

Após criar novos atletas, consultar rankings para definir o preço correto:

**PTO (longa distância):**
```bash
# Masculino
curl -s "https://stats.protriathletes.org/api/rankings?gender=male&limit=500" \
  -H "User-Agent: Mozilla/5.0" | python3 -c "
import json,sys; r=json.load(sys.stdin)['rankings']
for a in r: print(a['rank'], a['name'], a['points'])"

# Feminino — via HTML (API gender=female retorna MPRO por bug)
curl -s "https://stats.protriathletes.org/rankings/women" \
  -H "User-Agent: Mozilla/5.0" -L > /tmp/pto_women.html
# Extrair trows com data-division="FPRO" → rank + name
```

**WTCS (curta distância/olímpico):**
```bash
curl -s "https://triathlon.org/tri-api/v1/rankings/15" \  # 15=homens, 16=mulheres
  -H "User-Agent: Mozilla/5.0" | python3 -c "
import json,sys; d=json.load(sys.stdin)
for i,r in enumerate(d['data']['rankings'],1): print(i, r['athlete_full_name'])"
```

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
| 121+ | T$10  |

Atualizar via PATCH na tabela `athletes` (campos: `current_price`, `pto_rank`, `wtcs_rank`) e PATCH na `race_athletes` (campo: `price`) para a prova em questão.

---

## Notas importantes

- **Não alterar T$ de atletas já existentes no sistema** — o preço atual reflete histórico de provas
- Atletas com **WTCS rank relevante** (geralmente especialistas olímpicos como Tanja Neubert) podem ter T$ muito maior que o PTO sugere — sempre verificar ambos
- O WTCS atual (triathlon.org) só lista ~40 homens e ~28 mulheres (top do circuito olímpico)
- A **PTO women's API** (`?gender=female`) retorna MPRO por bug — sempre usar o HTML de `/rankings/women`
- Após o processo, recomendar checar `/admin/atletas?race_id=<race_id>` para confirmar
