# SALA DE COMANDO — Indice de Construcao

Portfolio de agentes/scripts da operacao. Construir na ordem das camadas. Este arquivo rastreia o que ja existe no repo.

## Regra mestre (todo agente herda)
> Nunca decidir com dado do mesmo dia. Sempre 7 dias + PIX pendente. Checar `budgetUpdate` em todas as campanhas antes de qualquer recomendacao. Max 2 toques/campanha por dia, 48h entre mudancas, 72h mao fora em campanha nova, max +20% de budget. **Valrox e operacao separada da BR.**

## Status

| # | Agente | Status | Onde |
|---|--------|--------|------|
| 0 | Motor de Verdade de Margem | ✅ construido | `data/cogs-ledger.json`, `scripts/margem-real.js` |
| 1 | Comando Manha (cockpit) | ✅ construido | `.claude/agents/comando-manha.md`, `scripts/comando-manha.sh`, `scripts/protecao-pixel.js`, `scripts/trim-utmify.js` |
| 1.5 | Dossie Vivo por Marca | ✅ construido | `dossie/{grassa,cida,bravo,valrox,liso}.md` — BR ativas: Graca + Cida; Bravo OFF; Valrox (US) pausada |
| 2 | Fila de Mineracao | ✅ construido (foco EUA/Valrox) | `.claude/agents/mineracao.md`, `scripts/mineracao-rank.js`, `scripts/mineracao.sh`, `data/{fornecedores,ja-testados}.json`, `data/mineracao/`, `mineracao/` |
| 3 | Diversificacao "Proximo Alenice" | ✅ construido | `.claude/agents/diversificacao.md`, `scripts/diversificacao.js`, `data/pipeline.json`, `pipeline/validacao.md` |
| 4 | Despachante de Criativo | ⏳ backlog | — |
| 5 | Gate Revisao Bruta | ✅ construido | `.claude/agents/gate-revisao.md`, `scripts/gate-revisao.js`, `data/gate/_template.json`, `gate/` |
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

## Agente 2 — Fila de Mineracao (foco EUA/Valrox)
Alimenta o pipeline com demanda real validada. Operacao alvo atual: **Valrox (moda masculina US)** — separada da BR.
- `node scripts/mineracao-rank.js --operacao valrox` — ranqueia candidatos por longevidade do anuncio (30+ dias = sinal de lucro), de-duplica contra `data/ja-testados.json`, cruza com `data/fornecedores.json` (SeaRyle / Tres Cliques / AliExpress) e estima breakeven via Agente 0 (USD/Stripe, sem PIX). Saida: `mineracao/AAAA-Sxx.md`.
- `.claude/agents/mineracao.md` — subagente que coleta candidatos (skill ecomm-mining-engine + Google Ads Transparency MCP quando houver; senao WebSearch/WebFetch no Transparency Center + AliExpress) e grava `data/mineracao/candidatos-eua.json`.
- `scripts/mineracao.sh` — wrapper headless semanal. Cron: `0 7 * * 1 cd <repo> && ./scripts/mineracao.sh >> mineracao/_cron.log 2>&1`
- `data/ja-testados.json` — memoria de dedup; atualize quando testar um produto.

### Rodar agora (amostra sintetica de candidatos US)
```
node scripts/mineracao-rank.js --operacao valrox
```
