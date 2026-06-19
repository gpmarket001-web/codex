# Dossie Vivo — Graca

> Operacao BR feminina premium (UTMify/AppMax/PIX, Google Ads). **ATIVA.** Atualize a cada decisao relevante.
> Quando o operador disser "modo Graca", carregue SO este dossie. (arquivo: grassa.md / chave: grassa / tag: [GRA])

## Estado atual
- Status: **ativa**. Uma das 2 marcas BR ativas (a outra e a Cida). Bravo esta OFF; Valrox (US) pausada.
- Fonte de dados: UTMify dashboard `6928c5f9ae114b9a6890e049` (Principal), moeda BRL, checkout ZedyCheckout, Google Ads (conta `9516124144`). Mesmo dashboard da Cida; separadas pela tag `[GRA]` vs `[CID]`.
- Convencao de nome de campanha: `[GRA] [FORMATO] [PRODUTO] [PUBLICO] [ETAPA] [vAAMMDD]`
  - FORMATO: `DG-IMG` (Demand Gen imagem), `YT-VID` (YouTube video), `SR`/`BUSCA` (Search).
  - PRODUTO: `ALE` (Alenice), `CAS` (Casaco la batida), `CONJ`/`LUIZA`, `TENIS`, `MBL` (Bela).
  - ETAPA: `PRO` (prospeccao), `RMK` (remarketing), `ENT` (entrada), `BRD` (brand).

## Hero product
- **Macacao Alenice Jeans Wide Leg Premium** — domina o investimento ativo (risco de concentracao ~85%, ver Agente 3 / Proximo Alenice).
- Publico vencedor: 45+ demografico + Roupas sociais (NUNCA Roupas esportivas).

## Campanhas ativas (referencia — confira no Comando Manha do dia)
- Topo real (ROAS real folgado vs breakeven): `[GRA] [YT-VID] [ALE] [ENT] [PRO]`, `[GRA] [DG-IMG] [ALE] [SOC] [PRO]`, `[GRA] [DG-IMG] [ALE] [45+] [RMK]`.
- Atencao: varias `[ALE]` com ROAS entre 1.3 e 1.8 parecem lucrativas na UTMify mas ficam ABAIXO do breakeven real assim que o COGS entra. Decisao so e confiavel com o ledger preenchido.

## Pendencias
- **CRITICO:** preencher `data/cogs-ledger.json` (custo fornecedor CNY, frete, preco_venda) do Alenice e demais SKUs. Sem isso o breakeven real e parcial.
- Preencher `config.checkout_br.pedidos_mes_estimados` e `cambio` do dia.
- Diversificar para fora do Alenice (Agente 3).

## Ultima decisao
- (registrar aqui a ultima decisao tomada — data, campanha, acao, motivo)

## Proxima acao
- Preencher ledger -> rodar Comando Manha com COGS real -> revisar quais `[ALE]` cortar/escalar.
