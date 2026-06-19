# SALA DE COMANDO — Indice de Construcao

Portfolio de agentes/scripts da operacao. Construir na ordem das camadas. Este arquivo rastreia o que ja existe no repo.

## Regra mestre (todo agente herda)
> Nunca decidir com dado do mesmo dia. Sempre 7 dias + PIX pendente. Checar `budgetUpdate` em todas as campanhas antes de qualquer recomendacao. Max 2 toques/campanha por dia, 48h entre mudancas, 72h mao fora em campanha nova, max +20% de budget. **Valrox e operacao separada da BR.**

## Status

| # | Agente | Status | Onde |
|---|--------|--------|------|
| 0 | Motor de Verdade de Margem | ✅ construido | `data/cogs-ledger.json`, `scripts/margem-real.js` |
| 1 | Comando Manha (cockpit) | ✅ construido | `.claude/agents/comando-manha.md`, `scripts/comando-manha.sh`, `scripts/protecao-pixel.js`, `scripts/trim-utmify.js` |
| 1.5 | Dossie Vivo por Marca | ✅ construido | `dossie/{grassa,cida,bravo,valrox,liso}.md` (operacoes separadas) |
| 2 | Fila de Mineracao | ⏳ backlog | — |
| 3 | Diversificacao "Proximo Alenice" | ⏳ backlog | — |
| 4 | Despachante de Criativo | ⏳ backlog | — |
| 5 | Gate Revisao Bruta | ⏳ backlog | — |
| 6 | Kit de Ativacao Meta | ⏳ backlog | — |
| 7 | Sentinela Reportana | ⏳ backlog | — |

## Estrutura
```
data/      cogs-ledger.json, utmify-campaigns-sample.json, toques-log.json, *-latest.json (runtime/saidas, gitignored)
scripts/   margem-real.js, protecao-pixel.js, trim-utmify.js, comando-manha.sh
dossie/    contexto vivo por marca
briefings/ saida diaria do Comando Manha (AAAA-MM-DD.md)
.claude/agents/  subagentes (comando-manha)
```

## Agente 0 — Motor de Verdade de Margem
Conserta o COGS=0 da UTMify. A UTMify recebe `productCosts=0`, entao seu profit/roas/roi sao ficcao.
- `data/cogs-ledger.json` — fonte da verdade de custo por SKU (CNY/USD -> moeda da loja, frete, imposto, preco_venda). **Preencher os `_TODO`.**
- `node scripts/margem-real.js` — cruza UTMify x ledger e calcula, por campanha, ROAS real vs breakeven real, lucro 7d real (realizado e com PIX pendente). Por produto: breakeven ROAS e margem por pedido.
- Mantem operacoes SEPARADAS: dentro do BR, tabela e subtotal por marca (Grassa/Cida/Bravo, via `resumoPorLoja`); Valrox (Shopify/Stripe, USD) cai em `campanhasOperacaoSeparada`, fora do agregado BR; Liso (SaaS) nao entra na margem de produto. Marcas nunca se misturam.

> Demonstrado: com COGS realista do Alenice, o breakeven sobe de ~1.2 para ~2.0–2.6 e varias campanhas que pareciam lucrativas viram negativas. Sem o ledger preenchido, as campanhas saem marcadas `COGS?`.

## Agente 1 — Comando Manha
Cockpit diario. Roda headless e gera 1 briefing.
- `node scripts/protecao-pixel.js` — Pixel Protection Protocol deterministico (bloqueios 48h/72h/2-toques, alerta +20%) a partir de `budgetUpdate.updatedAt` e do log de toques.
- `data/toques-log.json` — registre aqui cada mudanca manual de budget para checar "2 toques/dia" e "+20%" com precisao. Formato:
  `[{"campaignId":"...","data":"2026-06-19T14:00:00-03:00","budgetAntes":3500,"budgetDepois":4000}]`
- `.claude/agents/comando-manha.md` — subagente que puxa UTMify 7d + PIX, roda os motores e escreve `briefings/AAAA-MM-DD.md` (MIT, 3 decisoes, alertas, sazonalidade).
- `scripts/comando-manha.sh` — wrapper headless. Agendar via cron: `0 6 * * * cd <repo> && ./scripts/comando-manha.sh >> briefings/_cron.log 2>&1`

### Rodar agora (com a amostra sintetica ja incluida)
```
node scripts/margem-real.js
node scripts/protecao-pixel.js
```
Para dados frescos: o subagente `comando-manha` puxa a UTMify e roda `scripts/trim-utmify.js` para atualizar `data/utmify-campaigns-latest.json`.
