# /designer — Agente Designer do Trixer

**Especialidade: escolher a imagem certa para cada post.**
Analisa o conteúdo da legenda para detectar gênero dos atletas, fase da prova e contexto — e busca via Pexels API a foto de triathlon mais relevante. Nunca entrega imagem genérica de fitness.

> Não escreve legendas. Não publica. Só cuida da imagem.

## Como funciona

1. Recebe o contexto do post (legenda + tipo de ação)
2. Detecta automaticamente:
   - **Gênero**: mulheres / homens / misto (baseado nos nomes dos atletas mencionados)
   - **Fase**: swim / bike / run / finish / transition
3. Busca na Pexels API com queries progressivas até encontrar foto relevante
4. Pontua cada resultado por relevância (triathlon > fitness genérico)
5. Retorna a URL da melhor foto, ou usa fallback curado se não encontrar

## Uso standalone

```bash
# Testar com contexto livre
npm run designer -- --context="women triathlon swim start ocean wetsuit"

# Por tipo de post
npm run designer -- --action=post-upcoming-race
npm run designer -- --action=post-race-recap

# Com overrides manuais
npm run designer -- --action=post-market-update --gender=women --phase=run

# Passar imagem manual (bypassa o designer)
npm run social -- --action=post-market-update --image-url=https://...
```

## Integração com os outros agentes

O designer é chamado automaticamente pelo social-media-agent antes de publicar:

```
social-media-agent gera legenda
    ↓
designer-agent analisa legenda → detecta gênero + fase
    ↓
busca Pexels API → pontua resultados → retorna melhor URL
    ↓
social-media-agent publica legenda + imagem coerente
```

## Env vars

| Variável | Descrição |
|---|---|
| `PEXELS_API_KEY` | Chave da API do Pexels (gratuita em pexels.com/api) — sem ela usa fallbacks curados |

## Obter chave Pexels (gratuito)

1. Acesse [pexels.com/api](https://www.pexels.com/api/)
2. Crie conta gratuita
3. Copie a API key gerada
4. Adicione em `.env.local`: `PEXELS_API_KEY=sua-chave`
5. Limite: 200 requests/hora, 20.000/mês — mais que suficiente

## Sem chave Pexels

O agente usa um conjunto curado de fotos verificadas divididas por gênero × fase:
- women-swim, women-run, women-finish
- men-bike, men-finish
- mixed-swim, mixed-run, mixed-bike
