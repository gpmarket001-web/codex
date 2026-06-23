# Blocos Shopify — Roleta Arraiá

Histórico versionado do bloco de roleta (popup de captura + cupom) usado no tema.

## Arquivo atual
- `roleta-arraia-v11.liquid` — versão recomendada.

## Changelog v10 → v11 (Clean Premium+)

O **motor de funil v8/v9/v10 ficou 100% intacto**: gatilhos (home delay,
product idle/fallback, exit-intent desktop, scroll velocity mobile, return-tab),
pesos de prêmio, last-chance, captura de lead + webhook, UTMify, social proof e
timer não mudaram.

Mudanças cirúrgicas, todas marcadas com `[v11]` no código (fáceis de reverter):

1. **Correção de timing com `prefers-reduced-motion`** — antes, com movimento
   reduzido a roda parava em 2,4s mas o resultado só aparecia em 4,9s (≈2,5s de
   tela parada). Agora o tempo de giro está centralizado em `SPIN_MS`
   (4,8s normal / 2,4s reduzido) e o resultado aparece quando a roda realmente para.
2. **Acessibilidade de foco** — trap de `Tab` dentro do modal, foco inicial no
   primeiro campo ao abrir e devolução do foco ao elemento anterior ao fechar.
   Após girar, o foco vai para o botão de resgate.
3. **Scroll-lock real no iOS** — `position: fixed` + restauração de scroll no
   lugar de `overflow: hidden` (que não trava o Safari mobile). O fundo não rola
   mais atrás do popup.
4. **`aria-label` nos inputs** (e-mail e WhatsApp) + anel de foco dourado
   visível só para teclado (`:focus-visible`).
5. **Altura do modal com `dvh`** — a barra de endereço do Safari mobile não corta
   mais o botão de ação.

## Como reverter qualquer item v11
Buscar por `[v11]` no arquivo. Cada bloco está isolado e comentado.

## Ideia 1% melhor (próximo ciclo, ainda não implementada)
Personalizar o `redirect_url` por prêmio: quem tira 20%/brinde cai direto na
coleção de maior margem (ex.: "Look de Arraiá" com o Macacão Alenice em
destaque), aumentando ticket médio sem baixar a percepção premium.
