# Atualizar Fotos de Atletas

Busca e atualiza as fotos (`photo_url`) dos atletas no banco de dados.

## O que faz

1. **Phase 1 — Harvest em bulk** das páginas de ranking (em paralelo):
   - PTO Rankings Men/Women (`stats.protriathletes.org/rankings`)
   - World Triathlon WTCS Rankings (`triathlon.org/world-rankings`)
   - ProTriNews OpenRank (`protrinews.com/rankings`)
   Extrai o mapa completo de `nome → foto` de cada fonte.

2. **Phase 2 — Match + fallback por atleta**:
   - Busca no mapa de bulk (match exato e fuzzy por primeiro+último nome)
   - Fallback: página individual PTO (`stats.protriathletes.org/athlete/{slug}`)
   - Fallback: API de busca World Triathlon (`triathlon.org/api/v1/athletes`)

3. Salva a `photo_url` no banco para cada atleta encontrado.

## Como usar

Peça ao usuário as opções desejadas se não informadas:

```bash
cd /tmp/trifantasy
node scripts/update-athlete-photos.mjs
```

### Opções disponíveis

| Flag | Descrição |
|------|-----------|
| `--gender=M\|F\|all` | Filtra por gênero (padrão: `all`) |
| `--type=pro\|age_grouper\|all` | Filtra por tipo (padrão: `pro`) |
| `--force` | Reprocessa atletas que já têm foto |
| `--dry-run` | Mostra o que faria sem salvar |
| `--limit=N` | Limita a N atletas (útil para testar) |

### Exemplos de uso

```bash
# Apenas atletas PRO sem foto (padrão)
node scripts/update-athlete-photos.mjs

# Apenas mulheres PRO
node scripts/update-athlete-photos.mjs --gender=F --type=pro

# Testar com 10 atletas, sem salvar
node scripts/update-athlete-photos.mjs --limit=10 --dry-run

# Forçar re-fetch de todos os PROs masculinos
node scripts/update-athlete-photos.mjs --gender=M --type=pro --force
```

## Variáveis de ambiente necessárias

O script lê `.env.local` automaticamente. Precisa de:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Após executar

- Informe ao usuário:
  - Quantas fotos foram atualizadas (`★` = encontrado em bulk, `↳` = fallback)
  - Quantos atletas ficaram sem foto
  - Se houver erros de banco, liste-os
- Atletas PRO sem foto são listados explicitamente no output
- Se muitos PROs ficaram sem foto, pode ser que o slug PTO difira do nome no banco — tente com `--dry-run` para identificar os casos

## Observações

- O script respeita rate-limit: 350ms entre requests para não sobrecarregar as fontes
- Imagens placeholder (UUIDs conhecidos) são automaticamente ignoradas
- A normalização de nomes remove acentos e trata variações de grafia
- Fotos são salvas como URLs externas (não fazem upload para o Supabase Storage)
