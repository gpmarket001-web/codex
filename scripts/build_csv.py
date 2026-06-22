#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Gera o CSV nativo de import da Shopify BR para a Linha Alenice (4 produtos)."""
import csv, json, os

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIZES = ["P", "M", "G", "GG", "XG"]
ANGLES = ["hero", "silhueta", "macro", "ugc"]  # 4 angulos -> 4 imagens

with open(os.path.join(REPO, "alenice-images.json"), encoding="utf-8") as _f:
    IMAGES = json.load(_f)

# Colunas padrao do import nativo da Shopify
COLUMNS = [
    "Handle", "Title", "Body (HTML)", "Vendor", "Product Category", "Type", "Tags",
    "Published", "Option1 Name", "Option1 Value", "Variant SKU", "Variant Grams",
    "Variant Inventory Tracker", "Variant Inventory Qty", "Variant Inventory Policy",
    "Variant Fulfillment Service", "Variant Price", "Variant Compare At Price",
    "Variant Requires Shipping", "Variant Taxable", "Variant Barcode", "Image Src",
    "Image Position", "Image Alt Text", "Gift Card", "SEO Title", "SEO Description",
    "Google Shopping / Google Product Category", "Variant Weight Unit", "Status",
]

GOOGLE_CAT = "Apparel & Accessories > Clothing > One-Pieces > Jumpsuits & Rompers"

def body(intro, bullets, oferta):
    seg = ("<li>Envio com rastreio</li><li>Troca facilitada</li>"
           "<li>Atendimento dedicado</li><li>Pagamento via PIX ou cartao</li>")
    b = "".join(f"<li>{x}</li>" for x in bullets)
    return (
        f"<p>{intro}</p>"
        f"<h3>Por que voce vai amar</h3><ul>{b}</ul>"
        f"<p><strong>Oferta:</strong> {oferta}</p>"
        f"<h3>Compra segura</h3><ul>{seg}</ul>"
        f"<h3>Tamanhos</h3><p>Disponivel do P ao XG. Em caso de duvida no tamanho, "
        f"fale com nosso atendimento que ajudamos voce a escolher.</p>"
    )

PRODUCTS = [
    {
        "handle": "macacao-jeans-alenice",
        "code": "JEANS",
        "title": "Macacao Jeans Alenice Wide Leg",
        "vendor": "Alenice",
        "type": "Macacao",
        "tags": "Linha Alenice, Macacao, Wide Leg, Jeans, Look Pronto, Hero",
        "published": "TRUE",
        "status": "active",
        "price": "97.90", "compare": "249.00",
        "alt": "Macacao jeans Alenice wide leg, modelagem que alonga e valoriza",
        "seo_title": "Macacao Jeans Alenice Wide Leg | Look Pronto e Elegante",
        "seo_desc": "Macacao jeans wide leg com caimento que alonga. De R$249 por R$97,90. Envio com rastreio e troca facilitada.",
        "body": body(
            "Nao e idade. E atitude. O Macacao Jeans Alenice e o look que ja nasce pronto: "
            "modelagem wide leg com cintura marcada, caimento que alonga e valoriza todo o corpo, "
            "com elegancia sem esforco.",
            ["Modelagem wide leg com cintura marcada que alonga a silhueta",
             "Jeans de caimento premium, confortavel o dia todo",
             "Look pronto em segundos, do dia ao jantar",
             "Valoriza todos os corpos, do P ao XG"],
            "De R$249 por R$97,90."),
    },
    {
        "handle": "macacao-alenice-peluciado",
        "code": "PLUSH",
        "title": "Macacao Alenice Peluciado Inverno",
        "vendor": "Alenice",
        "type": "Macacao",
        "tags": "Linha Alenice, Macacao, Wide Leg, Peluciado, Inverno, Plush",
        "published": "FALSE",
        "status": "draft",
        "price": "117.90", "compare": "269.00",
        "alt": "Macacao Alenice peluciado wide leg, aconchego do inverno com elegancia",
        "seo_title": "Macacao Alenice Peluciado | Quentinho com Cara de Producao",
        "seo_desc": "Macacao peluciado wide leg para o inverno. De R$269 por R$117,90. Conforto termico com caimento elegante.",
        "body": body(
            "Quentinho com cara de producao. O Macacao Alenice Peluciado traz a maciez da malha "
            "plush com a modelagem wide leg que voce ja conhece: aconchego do inverno sem abrir mao "
            "da elegancia.",
            ["Malha peluciada macia, conforto termico para os dias frios",
             "Modelagem wide leg que mantem a silhueta alongada",
             "Cara de producao pronta, com a maciez de ficar em casa",
             "Valoriza todos os corpos, do P ao XG"],
            "De R$269 por R$117,90."),
    },
    {
        "handle": "macacao-alenice-linho",
        "code": "LINHO",
        "title": "Macacao Alenice Linho Verao",
        "vendor": "Alenice",
        "type": "Macacao",
        "tags": "Linha Alenice, Macacao, Wide Leg, Linho, Verao, Leveza",
        "published": "FALSE",
        "status": "draft",
        "price": "107.90", "compare": "239.00",
        "alt": "Macacao Alenice de linho wide leg, leveza elegante para o calor",
        "seo_title": "Macacao Alenice Linho | Respira no Calor com Elegancia",
        "seo_desc": "Macacao de linho wide leg para o verao. De R$239 por R$107,90. Leveza e frescor com caimento elegante.",
        "body": body(
            "Respira no calor sem amassar a elegancia. O Macacao Alenice de Linho tem queda fluida e "
            "tecido que ventila, com a modelagem wide leg que veste bem do dia a noite.",
            ["Linho de queda fluida, fresco e leve para o calor",
             "Modelagem wide leg versatil, do dia a noite",
             "Tecido nobre que respira sem perder o caimento",
             "Valoriza todos os corpos, do P ao XG"],
            "De R$239 por R$107,90."),
    },
    {
        "handle": "macacao-alenice-manga-longa",
        "code": "MGLONGA",
        "title": "Macacao Alenice Inverno Manga Longa",
        "vendor": "Alenice",
        "type": "Macacao",
        "tags": "Linha Alenice, Macacao, Wide Leg, Manga Longa, Inverno",
        "published": "FALSE",
        "status": "draft",
        "price": "112.90", "compare": "259.00",
        "alt": "Macacao Alenice manga longa wide leg, cobertura elegante para o inverno",
        "seo_title": "Macacao Alenice Manga Longa | Cobre sem Encasacar",
        "seo_desc": "Macacao manga longa wide leg para o inverno. De R$259 por R$112,90. Cobertura elegante que mantem a silhueta.",
        "body": body(
            "O macacao que cobre sem te transformar em casaco. A versao manga longa da Alenice protege "
            "do frio com leveza, mantendo a cintura marcada e o caimento wide leg que alonga.",
            ["Manga longa que cobre os bracos com leveza, sem encasacar",
             "Modelagem wide leg com cintura marcada que alonga",
             "Protecao elegante para os dias frios",
             "Valoriza todos os corpos, do P ao XG"],
            "De R$259 por R$112,90."),
    },
]

def blank_row():
    return {c: "" for c in COLUMNS}

rows = []
for p in PRODUCTS:
    for i, size in enumerate(SIZES):
        r = blank_row()
        r["Handle"] = p["handle"]
        # dados de produto so na primeira linha
        if i == 0:
            r["Title"] = p["title"]
            r["Body (HTML)"] = p["body"]
            r["Vendor"] = p["vendor"]
            r["Product Category"] = GOOGLE_CAT
            r["Type"] = p["type"]
            r["Tags"] = p["tags"]
            r["Published"] = p["published"]
            r["SEO Title"] = p["seo_title"]
            r["SEO Description"] = p["seo_desc"]
            r["Google Shopping / Google Product Category"] = GOOGLE_CAT
            r["Status"] = p["status"]
        r["Option1 Name"] = "Tamanho"
        r["Option1 Value"] = size
        r["Variant SKU"] = f"ALN-{p['code']}-{size}"
        r["Variant Grams"] = "500"
        r["Variant Inventory Tracker"] = "shopify"
        r["Variant Inventory Qty"] = "50"
        r["Variant Inventory Policy"] = "deny"
        r["Variant Fulfillment Service"] = "manual"
        r["Variant Price"] = p["price"]
        r["Variant Compare At Price"] = p["compare"]
        r["Variant Requires Shipping"] = "TRUE"
        r["Variant Taxable"] = "TRUE"
        r["Variant Weight Unit"] = "g"
        # imagens: 1 por linha enquanto houver angulos (4 imagens, 5 variantes)
        if i < len(ANGLES):
            angle = ANGLES[i]
            url = IMAGES.get(p["handle"], {}).get(angle, "")
            r["Image Src"] = url or f"REPLACE-WITH-CDN-URL/{p['handle']}-{angle}-4k.jpg"
            r["Image Position"] = str(i + 1)
            r["Image Alt Text"] = f"{p['alt']} - {angle}"
        rows.append(r)

out = "/home/user/codex/shopify-import-alenice.csv"
with open(out, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=COLUMNS)
    w.writeheader()
    w.writerows(rows)
print(f"OK -> {out} ({len(rows)} linhas de variante + header)")
