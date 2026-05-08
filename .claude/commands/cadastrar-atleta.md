# Cadastrar Atleta

Cadastra um novo atleta PRO que ainda não está no sistema, e opcionalmente o vincula a uma prova.

## O que faz

1. Verifica se já existe atleta PRO com nome similar (evita duplicatas)
2. Pergunta os dados: nome, gênero, país, rank PTO, preço, foto
3. Calcula o preço automaticamente pelo rank PTO se não informado
4. Insere ou atualiza na tabela `athletes` (upsert por name+gender+type)
5. Opcionalmente vincula à prova via `race_athletes` com preço e bib

## Como usar

Peça ao usuário os dados se não foram informados:
- **Nome completo** do atleta
- **Gênero** (M ou F)
- **País** e código (2 letras)
- **Rank PTO** (se tiver — define o preço automaticamente)
- **Prova** para vincular (opcional)

Execute carregando as variáveis de ambiente:

```bash
cd /tmp/trifantasy
export $(grep -v '^#' .env.local | xargs) 2>/dev/null
node scripts/create-athlete.mjs
```

Para modo não-interativo:

```bash
cd /tmp/trifantasy
export $(grep -v '^#' .env.local | xargs) 2>/dev/null
node scripts/create-athlete.mjs \
  --name "Kristian Blummenfelt" \
  --gender M \
  --country Norway \
  --country-code NO \
  --pto-rank 1 \
  --race-id <uuid-da-prova> \
  --bib 1
```

## Tabela de preços inicial

A mesma tabela se aplica ao rank **PTO** (longa distância) e ao rank **WTCS** (olímpico). Usar o **melhor rank entre os dois** (número menor = preço maior).

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

**Fontes de ranking:**
- PTO masculino: `https://stats.protriathletes.org/api/rankings?gender=male&limit=500`
- PTO feminino: HTML de `https://stats.protriathletes.org/rankings/women` (a API com `gender=female` retorna MPRO por bug)
- WTCS masculino: `https://triathlon.org/tri-api/v1/rankings/15`
- WTCS feminino: `https://triathlon.org/tri-api/v1/rankings/16`

**Atenção:** O WTCS lista apenas ~40H / ~28M (top do circuito olímpico). Especialistas olímpicos como Tanja Neubert podem ter WTCS rank muito melhor que o PTO, resultando em T$ bem superior ao esperado.

## Após cadastrar

- Informe o ID gerado
- Se precisar editar depois: `/admin/atletas?race_id=all&edit=<id>`
- Para vincular a provas adicionais: use `/admin/provas/<id>/startlist` ou `/import-startlist`
- Atualizar também `pto_rank` e `wtcs_rank` na tabela `athletes` para manter o banco sincronizado
