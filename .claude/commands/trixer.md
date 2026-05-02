# /trixer — Agente Orquestrador do Trixer

**Lidera e coordena todos os agentes especializados.**
Entende o momento do negócio, decide quais agentes acionar e em qual ordem para chegar no melhor resultado.

## Agentes sob coordenação

| Agente | Especialidade |
|---|---|
| `marketing-agent` | Negócio: KPIs, funil, brief estratégico |
| `social-media-agent` | Canal: conteúdo, timing, publicação |
| `designer-agent` | Imagem: gênero, fase, busca Pexels |
| `growth-agent` | Retenção: push, funil, virality |

## Ações disponíveis

### Pipeline diário (recomendado)
```bash
npm run trixer -- --action=run [--dry-run]
```
Decide o que fazer com base no contexto (dia, hora, provas próximas):
- Marketing gera brief estratégico
- Se prova ≤7 dias: social publica prévia de prova
- Senão: social executa a oportunidade de maior prioridade do brief

### Publicar 1 post agora
```bash
npm run trixer -- --action=post [--dry-run]
```
Pipeline completo: brief → imagem → legenda → Instagram.

### Planejamento semanal
```bash
npm run trixer -- --action=weekly
```
Ciclo completo segunda-feira:
1. Marketing: análise de negócio + relatório
2. Growth: funil + virality das ligas
3. Social: calendário editorial 7 dias
4. Social: relatório de engajamento
5. Orquestrador: resumo executivo com Claude

### Modo prova (race week)
```bash
npm run trixer -- --action=race-week --race-id=<uuid>
```
Para rodar 48-72h antes de cada prova:
1. Social: post de prévia da prova
2. Growth: push de engajamento para usuários sem elenco
3. Marketing: pulso do mercado

### Status rápido
```bash
npm run trixer -- --action=status
```
Snapshot em 5 segundos: usuários, próxima prova, top mover, brief do dia.

## Fluxo de operação sugerido

```
Segunda (09h):   npm run trixer -- --action=weekly
Terça-Quinta:    npm run trixer -- --action=run
Race week (-48h): npm run trixer -- --action=race-week --race-id=<uuid>
Qualquer hora:   npm run trixer -- --action=status
```

## Dry-run

Sempre disponível para preview sem publicar:
```bash
npm run trixer -- --action=post --dry-run
npm run trixer -- --action=race-week --race-id=<uuid> --dry-run
```
