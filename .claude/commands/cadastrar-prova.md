# Cadastrar Prova

Cria uma nova prova no banco de dados do Trixer de forma interativa.

## O que faz

1. Pergunta ao usuário os dados da prova (nome, data, local, país, distância, status)
2. Gera o slug automaticamente a partir do nome
3. Insere na tabela `races`
4. Mostra o ID gerado e os próximos passos recomendados

## Como usar

Peça ao usuário os seguintes dados se ele não informou:
- **Nome** da prova (ex: IRONMAN 70.3 Florianópolis)
- **Data** no formato YYYY-MM-DD
- **Local** (cidade)
- **País** e código do país (2 letras)
- **Distância**: `full`, `70.3`, `ows` ou `other`
- **Status**: `upcoming` (padrão), `open`, `locked` ou `finished`
- **Tem campo PRO?** (s/n)

Depois execute carregando as variáveis de ambiente:

```bash
cd /tmp/trifantasy
export $(grep -v '^#' .env.local | xargs) 2>/dev/null
node scripts/create-race.mjs
```

Para modo não-interativo (quando o usuário já forneceu todos os dados):

```bash
cd /tmp/trifantasy
export $(grep -v '^#' .env.local | xargs) 2>/dev/null
node scripts/create-race.mjs \
  --name "IRONMAN 70.3 Florianópolis" \
  --date "2026-05-31" \
  --location "Florianópolis" \
  --country "Brazil" \
  --country-code "BR" \
  --distance "70.3" \
  --status "upcoming" \
  --pro
```

## Após criar

- Informe o ID e o slug gerado para o usuário
- Lembre que o próximo passo é importar a startlist: `/import-startlist`
- O status inicial recomendado é `upcoming` — mude para `open` quando quiser liberar compras e escalação
