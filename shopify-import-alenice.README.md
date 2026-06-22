# 🛒 Import Shopify BR — Linha Alenice

Arquivo: **`shopify-import-alenice.csv`** · 4 produtos · 5 tamanhos (P/M/G/GG/XG) · 4 ângulos de imagem cada.
Import nativo: **Shopify Admin → Produtos → Importar → enviar o CSV** (não precisa de token/API).

## O que já vem pronto
| Produto | Handle | Preço (POR/DE) | Status | Tamanhos | Imagens |
|---|---|---|---|---|---|
| 🟦 Jeans (hero) | `macacao-jeans-alenice` | R$97,90 / R$249 | **active** | P–XG | 4 ângulos |
| 🧶 Peluciado | `macacao-alenice-peluciado` | R$117,90 / R$269 | **draft** | P–XG | 4 ângulos |
| 🌿 Linho | `macacao-alenice-linho` | R$107,90 / R$239 | **draft** | P–XG | 4 ângulos |
| 🧥 Manga Longa | `macacao-alenice-manga-longa` | R$112,90 / R$259 | **draft** | P–XG | 4 ângulos |

- **Jeans entra `active`** (tem foto real ✓). Os outros 3 entram **`draft`** de propósito: o cérebro
  proíbe vender peça nova sem foto real fiel. Quando a foto/criativo de cada um ficar pronto,
  muda o `Status` pra `active` e `Published` pra `TRUE`.
- `Variant Compare At Price` = preço **DE** (riscado) · `Variant Price` = preço **POR** (âncora).
- Estoque inicial: 50 por tamanho (`Variant Inventory Qty`) — ajuste conforme o real.

## Imagens — já preenchidas
A coluna `Image Src` já vem com as **URLs reais do Higgsfield** (Nano Banana 2, 2K) — 4 ângulos
por produto, centralizadas em `alenice-images.json`. São links CloudFront públicos, então o
import nativo já puxa as imagens (não precisa hospedar à parte).

> Mapa de posição: img1 = Hero · img2 = Silhueta · img3 = Macro · img4 = UGC.
> Ordem casada com o `BRIEFING-CRIATIVO-ALENICE.md`.

### ⚠️ Validar antes de publicar os 3 novos
- **Jeans:** imagens geradas a partir da **sua foto real** ✓ — pronto pra `active`.
- **Peluciado / Linho / Manga Longa:** as imagens vieram de uma **referência sintetizada**
  (a busca de foto real na web foi bloqueada no ambiente). São fiéis ao DNA Alenice, mas
  **não são o SKU exato do fornecedor**. Por isso entram `draft`: antes de publicar, bata a
  peça com o fornecedor real (DSers/AliExpress/SeaRyle) e, se divergir, regenere com a foto
  certa. Os links CloudFront são temporários — para produção, baixe os 4K e hospede no seu CDN.

## Regenerar o CSV
`python3 scripts/build_csv.py` (script-fonte). Edite preços, tamanhos, cópia ou estoque lá
e rode de novo — saída sobrescreve `shopify-import-alenice.csv`.
