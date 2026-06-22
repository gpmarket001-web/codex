#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gera as paginas de venda HTML da Linha Alenice (1 por produto).

Estrutura segue AGENTS.md secao 14: hero -> oferta -> beneficios -> seguranca ->
tamanhos -> CTA -> detalhes -> FAQ -> objecoes. Premium, mobile-first, CSS inline.
Imagens: dict IMAGES por handle/angulo (URL do Higgsfield). Vazio => placeholder.
"""
import html, json, os

REPO = "/home/user/codex"
OUT_DIR = os.path.join(REPO, "paginas-de-venda")

# URLs reais dos 4 angulos por produto (Higgsfield), centralizadas no JSON.
with open(os.path.join(REPO, "alenice-images.json"), encoding="utf-8") as _f:
    IMAGES = json.load(_f)

PRODUCTS = [
    {
        "handle": "macacao-jeans-alenice",
        "name": "Macacao Jeans Alenice",
        "tagline": "Nao e idade. E atitude.",
        "lead": "O look que ja nasce pronto: modelagem wide leg com cintura marcada, "
                "caimento que alonga e valoriza todo o corpo, com elegancia sem esforco.",
        "de": "249,00", "por": "97,90",
        "accent": "#b5734f", "soft": "#f3e9e2", "season": "O ano todo",
        "bullets": [
            ("Look pronto em segundos", "Uma peca unica e voce sai bem vestida, do dia ao jantar."),
            ("Caimento wide leg que alonga", "Cintura marcada e perna ampla que valoriza a silhueta."),
            ("Conforto premium o dia todo", "Jeans de bom caimento, confortavel sem perder a forma."),
            ("Veste bem todos os corpos", "Modelagem pensada do P ao XG."),
        ],
        "detalhes": [
            ("Tecido", "Jeans de caimento premium."),
            ("Modelagem", "Wide leg com cintura marcada."),
            ("Cor", "Jeans (cor unica)."),
            ("Ocasiao", "Do dia a dia ao jantar, o ano todo."),
        ],
        "faq": [
            ("Veste bem em quem tem mais corpo?", "Sim. A modelagem wide leg com cintura marcada valoriza do P ao XG."),
            ("Como escolho o tamanho?", "Use a tabela de medidas. Na duvida, fale com nosso atendimento que ajudamos voce."),
            ("Qual o prazo de entrega?", "O prazo aparece no checkout pelo seu CEP, e o envio vai com rastreio."),
            ("Posso trocar?", "Sim, a troca e facilitada. E so falar com o atendimento."),
        ],
    },
    {
        "handle": "macacao-alenice-peluciado",
        "name": "Macacao Alenice Peluciado",
        "tagline": "Quentinho com cara de producao.",
        "lead": "A maciez da malha plush com a modelagem wide leg que voce ja conhece: "
                "aconchego do inverno sem abrir mao da elegancia.",
        "de": "269,00", "por": "117,90",
        "accent": "#8a7d6b", "soft": "#eeeae3", "season": "Inverno",
        "bullets": [
            ("Conforto termico de verdade", "Malha peluciada macia que aquece nos dias frios."),
            ("Cara de producao pronta", "O aconchego de ficar em casa com visual de quem se arrumou."),
            ("Caimento wide leg preservado", "Mantem a silhueta alongada mesmo na malha mais quente."),
            ("Veste bem todos os corpos", "Modelagem do P ao XG."),
        ],
        "detalhes": [
            ("Tecido", "Malha peluciada / plush macia."),
            ("Modelagem", "Wide leg com cintura marcada."),
            ("Cor", "Jeans (cor unica)."),
            ("Ocasiao", "Inverno, do home office ao cafe da tarde."),
        ],
        "faq": [
            ("E quente mesmo?", "Sim, a malha peluciada foi feita para os dias frios mantendo o caimento elegante."),
            ("Como escolho o tamanho?", "Use a tabela de medidas. Na duvida, fale com nosso atendimento."),
            ("Qual o prazo de entrega?", "O prazo aparece no checkout pelo seu CEP, com envio rastreado."),
            ("Posso trocar?", "Sim, a troca e facilitada."),
        ],
    },
    {
        "handle": "macacao-alenice-linho",
        "name": "Macacao Alenice Linho",
        "tagline": "Respira no calor sem amassar a elegancia.",
        "lead": "Queda fluida e tecido que ventila, com a modelagem wide leg que veste bem "
                "do dia a noite.",
        "de": "239,00", "por": "107,90",
        "accent": "#9aa07e", "soft": "#eef0e6", "season": "Verao",
        "bullets": [
            ("Leveza e frescor no calor", "Linho que ventila e nao pesa nos dias quentes."),
            ("Versatil do dia a noite", "Um macacao que vai do passeio ao jantar."),
            ("Queda fluida e elegante", "Tecido nobre com caimento que nao perde a forma."),
            ("Veste bem todos os corpos", "Modelagem do P ao XG."),
        ],
        "detalhes": [
            ("Tecido", "Linho / viscolinho leve e respiravel."),
            ("Modelagem", "Wide leg com cintura marcada."),
            ("Cor", "Natural / off-white."),
            ("Ocasiao", "Primavera e verao, festas de fim de ano."),
        ],
        "faq": [
            ("O linho amassa muito?", "O viscolinho tem queda fluida e menos vinco, mantendo o visual elegante."),
            ("Como escolho o tamanho?", "Use a tabela de medidas. Na duvida, fale com nosso atendimento."),
            ("Qual o prazo de entrega?", "O prazo aparece no checkout pelo seu CEP, com envio rastreado."),
            ("Posso trocar?", "Sim, a troca e facilitada."),
        ],
    },
    {
        "handle": "macacao-alenice-manga-longa",
        "name": "Macacao Alenice Manga Longa",
        "tagline": "Cobre sem te transformar em casaco.",
        "lead": "A versao manga longa protege do frio com leveza, mantendo a cintura marcada "
                "e o caimento wide leg que alonga.",
        "de": "259,00", "por": "112,90",
        "accent": "#a88a73", "soft": "#f1e9e2", "season": "Inverno",
        "bullets": [
            ("Cobertura sem peso", "Manga longa que protege os bracos sem volume de casaco."),
            ("Silhueta alongada", "Cintura marcada e wide leg que valoriza a forma."),
            ("Protecao elegante", "Aquece nos dias frios mantendo o visual de producao."),
            ("Veste bem todos os corpos", "Modelagem do P ao XG."),
        ],
        "detalhes": [
            ("Tecido", "Jeans (ou malha), manga longa."),
            ("Modelagem", "Wide leg com cintura marcada."),
            ("Cor", "Jeans (cor unica)."),
            ("Ocasiao", "Inverno, dia a dia com mais cobertura."),
        ],
        "faq": [
            ("Fica muito quente / pesado?", "Nao. Cobre os bracos com leveza, sem o volume de um casaco."),
            ("Como escolho o tamanho?", "Use a tabela de medidas. Na duvida, fale com nosso atendimento."),
            ("Qual o prazo de entrega?", "O prazo aparece no checkout pelo seu CEP, com envio rastreado."),
            ("Posso trocar?", "Sim, a troca e facilitada."),
        ],
    },
]

def img_block(url, alt, ratio="9 / 16"):
    if url:
        return (f'<div class="ph" style="aspect-ratio:{ratio}">'
                f'<img src="{html.escape(url)}" alt="{html.escape(alt)}" loading="lazy"></div>')
    return (f'<div class="ph empty" style="aspect-ratio:{ratio}">'
            f'<span>Imagem em producao<br><small>{html.escape(alt)}</small></span></div>')

def parcela(por):
    val = float(por.replace(".", "").replace(",", "."))
    return f"{val/12:.2f}".replace(".", ",")

def page(p):
    imgs = IMAGES[p["handle"]]
    bullets = "".join(
        f'<li><strong>{html.escape(t)}</strong><span>{html.escape(d)}</span></li>'
        for t, d in p["bullets"])
    detalhes = "".join(
        f'<tr><th>{html.escape(k)}</th><td>{html.escape(v)}</td></tr>'
        for k, v in p["detalhes"])
    faq = "".join(
        f'<details><summary>{html.escape(q)}</summary><p>{html.escape(a)}</p></details>'
        for q, a in p["faq"])
    gallery = "".join([
        img_block(imgs["silhueta"], f"{p['name']} - silhueta de perfil"),
        img_block(imgs["macro"], f"{p['name']} - detalhe do tecido", "1 / 1"),
        img_block(imgs["ugc"], f"{p['name']} - uso real"),
    ])
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{html.escape(p['name'])} | {html.escape(p['tagline'])}</title>
<meta name="description" content="{html.escape(p['lead'])}">
<style>
:root{{--accent:{p['accent']};--soft:{p['soft']};}}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:'Helvetica Neue',Arial,sans-serif;color:#2b2622;background:#fff;line-height:1.55}}
img{{display:block;width:100%;height:100%;object-fit:cover}}
.wrap{{max-width:560px;margin:0 auto;padding:0 18px 90px}}
.ph{{background:var(--soft);border-radius:14px;overflow:hidden}}
.ph.empty{{display:flex;align-items:center;justify-content:center;text-align:center;color:#9a8f85;font-size:13px;border:1px dashed #cdbfb3}}
.tag{{display:inline-block;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin:22px 0 6px}}
h1{{font-size:27px;font-weight:600;letter-spacing:-.01em;margin-bottom:8px}}
.lead{{color:#5b5249;font-size:16px;margin:10px 0 18px}}
.price{{display:flex;align-items:baseline;gap:10px;margin:6px 0}}
.de{{color:#a99e93;text-decoration:line-through;font-size:16px}}
.por{{color:var(--accent);font-size:32px;font-weight:700}}
.parcela{{color:#5b5249;font-size:14px;margin-bottom:14px}}
.cta{{display:block;width:100%;background:var(--accent);color:#fff;text-align:center;
 padding:16px;border:0;border-radius:12px;font-size:17px;font-weight:600;text-decoration:none;
 margin:14px 0;cursor:pointer}}
.sizes{{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 4px}}
.sizes span{{border:1px solid #d8cdc2;border-radius:8px;padding:8px 14px;font-size:14px}}
.trust{{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0;font-size:13px;color:#5b5249}}
.trust div{{background:var(--soft);border-radius:10px;padding:10px 12px;flex:1 1 45%}}
h2{{font-size:20px;font-weight:600;margin:30px 0 12px}}
ul.benef{{list-style:none;display:grid;gap:12px}}
ul.benef li{{background:var(--soft);border-radius:12px;padding:14px 16px}}
ul.benef strong{{display:block;font-size:15px;margin-bottom:3px}}
ul.benef span{{font-size:14px;color:#5b5249}}
.grid{{display:grid;gap:12px;margin-top:12px}}
table{{width:100%;border-collapse:collapse;font-size:14px;margin-top:6px}}
th,td{{text-align:left;padding:10px 8px;border-bottom:1px solid #eee;vertical-align:top}}
th{{width:34%;color:#7a7066;font-weight:600}}
details{{border-bottom:1px solid #eee;padding:12px 2px}}
summary{{font-size:15px;font-weight:600;cursor:pointer;list-style:none}}
summary::-webkit-details-marker{{display:none}}
details p{{margin-top:8px;font-size:14px;color:#5b5249}}
.bar{{position:fixed;left:0;right:0;bottom:0;background:#fff;border-top:1px solid #eee;
 padding:10px 14px;display:flex;align-items:center;gap:12px;max-width:560px;margin:0 auto}}
.bar .por{{font-size:22px}}.bar .cta{{margin:0;flex:1;padding:13px}}
.note{{font-size:12px;color:#a99e93;margin-top:26px;text-align:center}}
</style>
</head>
<body>
<div class="wrap">
  <span class="tag">{html.escape(p['season'])} | Linha Alenice</span>
  {img_block(imgs['hero'], p['name'] + ' - foto principal')}
  <span class="tag" style="margin-top:18px">{html.escape(p['tagline'])}</span>
  <h1>{html.escape(p['name'])}</h1>
  <p class="lead">{html.escape(p['lead'])}</p>
  <div class="price"><span class="de">De R$ {p['de']}</span><span class="por">R$ {p['por']}</span></div>
  <p class="parcela">ou em ate 12x de R$ {parcela(p['por'])} no cartao</p>
  <div class="sizes"><span>P</span><span>M</span><span>G</span><span>GG</span><span>XG</span></div>
  <a class="cta" href="#comprar">Quero o meu</a>
  <div class="trust">
    <div>Envio com rastreio</div><div>Troca facilitada</div>
    <div>Pagamento via PIX ou cartao</div><div>Atendimento dedicado</div>
  </div>

  <h2>Por que voce vai amar</h2>
  <ul class="benef">{bullets}</ul>

  <h2>Veja de perto</h2>
  <div class="grid">{gallery}</div>

  <h2>Detalhes do produto</h2>
  <table>{detalhes}</table>

  <h2>Ainda em duvida?</h2>
  {faq}

  <a class="cta" id="comprar" href="#">Comprar agora - R$ {p['por']}</a>
  <p class="note">Imagens de catalogo. Cores podem variar levemente conforme a tela.</p>
</div>
<div class="bar"><span class="por">R$ {p['por']}</span><a class="cta" href="#comprar">Comprar</a></div>
</body>
</html>
"""

os.makedirs(OUT_DIR, exist_ok=True)
idx = ['<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8">',
       '<title>Linha Alenice - paginas de venda</title></head><body>',
       '<h1>Linha Alenice - paginas de venda</h1><ul>']
for p in PRODUCTS:
    fname = f"{p['handle']}.html"
    with open(os.path.join(OUT_DIR, fname), "w", encoding="utf-8") as f:
        f.write(page(p))
    idx.append(f'<li><a href="{fname}">{html.escape(p["name"])}</a></li>')
    print("OK ->", fname)
idx.append("</ul></body></html>")
with open(os.path.join(OUT_DIR, "index.html"), "w", encoding="utf-8") as f:
    f.write("\n".join(idx))
print("OK -> index.html")
