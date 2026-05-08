# Fetch Results

Busca e importa os resultados de uma prova a partir de uma URL, sempre buscando **masculino (MPRO) e feminino (FPRO)**.

## Pré-requisito

Os atletas precisam estar na startlist da prova. Se não estiverem, execute `/import-startlist` primeiro.

## Como usar

```bash
cd /tmp/trifantasy-work
node scripts/fetch-results.mjs <URL> <RACE_ID>
```

Dry-run (ver o que seria importado sem gravar):

```bash
node scripts/fetch-results.mjs <URL> <RACE_ID> --dry-run
```

## O que faz

1. Detecta o site e escolhe a estratégia de scraping:
   - **protrinews.com** → curl com User-Agent de browser + extração do RSC JSON (`self.__next_f.push(...)`)
   - **Outros sites** → fetch direto → `__NEXT_DATA__` → JSON embutido → HTML tables
2. Extrai resultados separados para MPRO e FPRO do mesmo HTML
3. Exibe preview dos top 5 de cada gênero antes de importar
4. Associa atletas por bib number (preferencial) ou nome
5. Faz upsert na tabela `results`

## Campos extraídos

`pro_pos`, `swim_time`, `t1_time`, `bike_time`, `t2_time`, `run_time`, `finish_time`, `dnf`, `dns`

## Sites com URL separada por gênero

Se o site não tiver ambos os gêneros no mesmo HTML (ex: cada aba é uma URL diferente), rode duas vezes:

```bash
node scripts/fetch-results.mjs <URL_MASCULINO> <RACE_ID>
node scripts/fetch-results.mjs <URL_FEMININO>  <RACE_ID>
```

## Após importar

Ir em `/admin/pontuacao` para calcular os Trix Scores.
Se houver erros de "Atleta não encontrado na startlist", rode `/import-startlist` primeiro.
