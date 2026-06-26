# Grassa Boutique — Relatório de Implementação SEO/GEO

Loja: **grassaboutique.shop** (G'Boutique · Shopify Basic · BRL).
Data: 2026-06-26. Branch: `claude/grassa-seo-optimization-63hc1l`.

Este relatório registra **o que foi aplicado na loja viva** (via Shopify Admin API),
corrige imprecisões do plano original com **dado real**, entrega os **templates de
schema JSON-LD** prontos para o tema, e deixa um **backlog priorizado** do que falta.

---

## 0. Correções de fato vs. o plano original

O plano de abertura assumia alguns dados que a API mostrou diferentes. Registrado para
não propagar erro:

| Item | Plano assumia | Realidade na loja |
|------|---------------|-------------------|
| Handle do herói | `macacao-jeans-wide-leg-alenice-brinde` | `macacao-jeans-alenice` |
| Preço do herói | R$ 129,90 | **R$ 97,90** |
| Meta do herói | "CSS cru" a corrigir | **já estava limpa e otimizada** (sessão anterior) |
| Estoque | implícito disponível | **0 em toda a loja** (`tracksInventory: true`) |

> ⚠️ **Achado comercial crítico (fora de SEO):** todos os produtos auditados estão com
> `totalInventory: 0` e `inventoryPolicy: DENY`. Ou seja: a loja **não vende** no estado
> atual, e claims de "Últimas peças"/`InStock` são tecnicamente falsos hoje. Repor estoque
> (ou ajustar a narrativa) é pré-requisito para qualquer ganho de SEO/CRO virar receita.
> Por integridade, **nenhum schema InStock fixo foi escrito no catálogo** — o template
> abaixo deriva disponibilidade do estoque real.

---

## 1. Aplicado na loja (Shopify Admin API)

### 1.1 Meta title + meta description — família macacão/macaquinho (carro-chefe)
7 produtos que estavam com `seo.title`/`seo.description` = `null` (Google caía no body =
CSS). Copy baseada **só em atributos reais** (preço, cores, tamanhos). Sem fabricação.

| Produto | Novo meta title | Cores/Tamanhos usados (reais) |
|---------|-----------------|-------------------------------|
| Macaquinho Bruna | Macaquinho Feminino Bruna Curto \| Grassa Boutique | Marrom/Preto · PP–XXG |
| Macaquinho Lara | Macaquinho Feminino Lara Soltinho \| Grassa Boutique | Marrom/Preto · PP–XXG |
| Macacão Luísa Luxo Longo | Macacão Feminino Longo Luísa \| 6 Cores \| Grassa | 6 cores · P–G1 |
| Macacão Bela (Decote V) | Macacão Feminino Bela Decote em V \| Grassa Boutique | 7 cores · PP–GG |
| Macaquinho Eloisa | Macaquinho Feminino Eloisa até EEXG \| Grassa | 5 cores · PP–EEXG |
| Macaquinho Camila | Macaquinho Feminino Camila até EEXG \| Grassa | Preto/Nude/Vermelho · PP–EEXG |
| Macacão Fernanda | Macacão Feminino Fernanda até EEXG \| Grassa | 5 cores · PP–EEXG |

(As meta descriptions completas estão na loja; cada uma ~145–155 char, com benefício +
faixa de tamanho + ocasião + "troca em 7 dias".)

### 1.2 Alt text de imagem
- **Featured image dos 7 produtos acima**: alt descritivo com keyword (estavam vazios).
- **Herói Alenice**: preenchidos os **8** alts de imagem que faltavam (restavam vazios
  após a sessão anterior ter feito só os 3 primeiros). Agora 11/11 com alt.

Total: **15 imagens** receberam alt text com keyword.

### 1.3 Já estava feito (sessões anteriores — confirmado, não duplicado)
`Macacão Alenice`, `Macacão Zoe`, `Macacão Isabella`, `Kit 2 Conjuntos Maria Alice`,
`Conjunto Casaquinho Luiza`, `Conjunto Daniela`, `Bolsa Aurora`, `Alenice + Camisa Linho`
— todos com `seo.title` + `seo.description` preenchidos.

---

## 2. Schema JSON-LD — templates para o tema

> O Shopify Admin API **não dá acesso aos arquivos do tema**. Estes templates precisam ser
> colados manualmente no tema (Admin → Loja virtual → Temas → Editar código), ou via app de
> metafields. Por isso ficam versionados aqui em `seo/`.

### 2.1 `Product` — dinâmico e honesto (cola em `sections/main-product.liquid`)
**Antes de colar, cheque se o tema já injeta `Product` schema** (muitos temas Dawn-based
injetam). Se já injeta, complete `brand`/`sku` em vez de duplicar — dois blocos `Product`
na mesma página confundem o Google.

```liquid
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": {{ product.title | json }},
  "image": {{ product.featured_image | image_url: width: 1200 | prepend: "https:" | json }},
  "description": {{ product.description | strip_html | truncate: 320 | json }},
  "brand": { "@type": "Brand", "name": {{ shop.name | json }} },
  "sku": {{ product.selected_or_first_available_variant.sku | json }},
  "offers": {
    "@type": "Offer",
    "url": {{ shop.url | append: product.url | json }},
    "price": "{{ product.price | divided_by: 100.0 }}",
    "priceCurrency": {{ shop.currency | json }},
    "availability": "{% if product.available %}https://schema.org/InStock{% else %}https://schema.org/OutOfStock{% endif %}",
    "itemCondition": "https://schema.org/NewCondition"
  }
}
</script>
```
- `availability` segue o **estoque real** → enquanto a loja estiver zerada, sai `OutOfStock`
  (honesto). Quando repor, vira `InStock` sozinho.
- `aggregateRating` **propositalmente ausente** — só adicionar com review real (Judge.me/
  Reportana). Estrela fabricada = penalização Google + quebra de marca.

### 2.2 `BreadcrumbList` (cola na PDP)
```liquid
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Início", "item": {{ shop.url | json }} },
    {% if collection %}{ "@type": "ListItem", "position": 2, "name": {{ collection.title | json }}, "item": {{ shop.url | append: collection.url | json }} },{% endif %}
    { "@type": "ListItem", "position": 3, "name": {{ product.title | json }}, "item": {{ shop.url | append: product.url | json }} }
  ]
}
</script>
```

### 2.3 `Organization` (uma vez, em `layout/theme.liquid` antes de `</head>`)
```liquid
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Grassa Boutique",
  "url": "https://grassaboutique.shop",
  "logo": "https://grassaboutique.shop/[CAMINHO-DO-LOGO].png",
  "description": "Moda feminina elegante para mulheres 40+ — conjuntos, macacões e peças atemporais.",
  "sameAs": ["[URL-INSTAGRAM]", "[URL-FACEBOOK]"]
}
</script>
```
Substituir `[CAMINHO-DO-LOGO]`, `[URL-INSTAGRAM]`, `[URL-FACEBOOK]`. Testar tudo no
**Rich Results Test** (`search.google.com/test/rich-results`).

---

## 3. Backlog priorizado (não aplicado — próxima leva)

Catálogo tem ~50 produtos; **~35 ainda sem `seo.title`/`seo.description`** e quase todas as
imagens sem alt. Prioridade por categoria/tráfego:

**P1 — terminar macacões/conjuntos (carro-chefe + ticket alto):**
- Conjuntos sem meta: Assimétrico Anarruga, Linho Officer, Gola Alta Saia Midi, Confort
  Slim, Bold, Carmen, Gysele, Luna Barbosa, Anne, Lavinia Morante, Túnica Aline, Madeleine,
  Stephanie, Luna em Linho Natural.

**P2 — vestidos (volume de catálogo):**
- Angelina, Marina, Lorena, Camille, Zahara, Cecília, Nicole, Modal Anastácia, Midi Roma,
  Aurora, Sarja, Estella, Renda Jana, Longo Éter Tule, Daphne, Rafaella, Kit 3 Jasmin,
  Kit 3 FinaFlor, e o produto genérico de título "Vestidos" (renomear).

**P3 — outros:** Tênis Ortopédico Graça.

**Higiene de catálogo (fazer já):**
- 🔴 `Macacão Jeans Wide Leg Alenice (Cópia)` (ID 8548608377004) é **duplicata do herói**.
  Conteúdo duplicado canibaliza o ranking do original. **Setar como rascunho ou deletar.**
- Vários produtos com `productType` vazio → preencher (ajuda coleções automáticas e schema).
- Bodies de PDP começam com bloco `<style>`/CSS: ok para SEO (a meta limpa sobrepõe o
  snippet), mas garanta que cada PDP sem meta receba `seo.description` antes do Google
  reindexar, senão o snippet vira CSS.

**Coleções:** dar `seo.title`/`seo.description` + imagem a `collections/macacoes`,
`collections/vestidos`, `collections/conjuntos` (não auditado em detalhe aqui).

---

## 4. GEO / AI-visibility — próximos passos (semanas)
1. Schema robusto (seção 2) aplicado no tema — sinal técnico que a IA lê.
2. Conteúdo factual de ocasião ("como usar macacão 40+", "look social feminino maduro").
3. Prova social em terceiros (Google Business, Reclame Aqui, reviews reais) → maior peso na IA.
4. Página de curadoria ("Guia de macacões Grassa") com tabela referenciável.

## 5. Resumo do que mudou neste branch
- `seo/schema-templates.liquid` — os 3 blocos JSON-LD prontos.
- `seo/grassa-implementation-report.md` — este documento.
- (loja viva) 7 metas + 15 alts aplicados via API — registrado na seção 1.
- Repo `gra-a`, mesmo branch: on-page da LP Alenice (title/meta/OG/JSON-LD).
