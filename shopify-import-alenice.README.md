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

## ⚠️ Imagens — o único passo manual antes do import
A coluna `Image Src` está com placeholder:
`REPLACE-WITH-CDN-URL/<handle>-<angulo>-4k.jpg` (ângulos: `hero`, `silhueta`, `macro`, `ugc`).

Shopify só importa imagem por **URL pública**. Dois caminhos:

1. **Recomendado:** gere os 4 ângulos no Higgsfield (4K) → hospede (CDN próprio, ou suba na
   Shopify e copie a URL do arquivo) → substitua cada placeholder pela URL real → importe.
2. **Atalho:** apague o conteúdo das células `Image Src` → importe só o texto/variantes →
   anexe as imagens manualmente na página de cada produto depois.

> Mapa de posição já definido: img1 = Hero 3/4 · img2 = Silhueta · img3 = Macro · img4 = UGC.
> Ordem casada com o `BRIEFING-CRIATIVO-ALENICE.md`.

## Regenerar o CSV
`python3 scripts/build_csv.py` (script-fonte). Edite preços, tamanhos, cópia ou estoque lá
e rode de novo — saída sobrescreve `shopify-import-alenice.csv`.
