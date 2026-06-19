# Dossie Vivo — Valrox

> Operacao MASCULINA nos EUA. **TOTALMENTE SEPARADA da operacao BR.**
> **STATUS ATUAL: PAUSADA** — troca de conta de anuncios; orientaram aguardar liberacao antes de voltar a rodar.
> Quando o operador disser "modo Valrox", carregue SO este dossie.

## REGRA DE SEPARACAO (nao furar)
- Valrox usa **COGS real do fornecedor + Shopify/Stripe + Google Ads**.
- **NAO usa UTMify, NAO usa AppMax, NAO usa PIX.** Nada de PIX pendente aqui.
- Moeda **USD**. Cambio so se o custo do fornecedor estiver em outra moeda.
- Nunca somar receita/lucro do Valrox com o total BR. No `margem-real.js` ele cai em
  `campanhasOperacaoSeparada` (fonte_dados = shopify), fora do agregado BR.

## Estado atual
- Fonte de dados: Shopify (pedidos/receita) + Google Ads (gasto). Gateway Stripe.
- Tag de marca no nome da campanha: `[VLX]`.
- `operacoes.valrox` no ledger: moeda USD, fonte_dados shopify, gateway_pct 0.029.

## Hero product
- (a definir)

## Pendencias
- Implementar o caminho de dados Shopify/Stripe para o motor de margem (hoje o
  `margem-real.js` so processa a fonte UTMify; Valrox esta reservado/estruturado, nao processado).
- Preencher SKUs do Valrox no ledger (custo fornecedor em USD ou moeda de origem, frete, preco_venda em USD).

## Ultima decisao
- (registrar)

## Proxima acao
- Definir hero + estruturar a coleta Shopify (get-order/list-orders) para a margem real em USD.
