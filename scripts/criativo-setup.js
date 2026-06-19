#!/usr/bin/env node
/*
 * DESPACHANTE DE CRIATIVO (Agente 4) — setup local (GRATIS, sem geracao)
 * ---------------------------------------------------------------------
 * Prepara a pasta criativos/<produto>/ no padrao validado, com brief, roteiro de
 * narracao PT-BR (estrutura 0-4 / 4-8 / 8-10) e placeholder de copy. NAO gera imagem
 * nem video (isso e o subagente 'despachante-criativo' via Higgsfield, que custa creditos
 * e so roda com OK do operador).
 *
 * Uso: node scripts/criativo-setup.js --produto "Macacao Alenice" [--foto <url|path>] [--loja grassa]
 */

const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const getArg = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const ROOT = path.resolve(__dirname, '..');
const produto = getArg('--produto', null);
if (!produto) { console.error('Uso: node scripts/criativo-setup.js --produto "<nome>" [--foto <url|path>] [--loja <loja>]'); process.exit(2); }
const foto = getArg('--foto', '');
const loja = getArg('--loja', '');

const padrao = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/criativo-padrao.json'), 'utf8'));
const slug = produto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const dir = path.join(ROOT, 'criativos', slug);
fs.mkdirSync(path.join(dir, 'imagens'), { recursive: true });
fs.mkdirSync(path.join(dir, 'video'), { recursive: true });
fs.writeFileSync(path.join(dir, 'imagens/.gitkeep'), '');
fs.writeFileSync(path.join(dir, 'video/.gitkeep'), '');

const brief = {
  produto,
  loja,
  foto_referencia: foto,
  status: 'aguardando-geracao',
  padrao,
  criadoEm: new Date().toISOString(),
};
fs.writeFileSync(path.join(dir, 'brief.json'), JSON.stringify(brief, null, 2));

const roteiro = `# Roteiro de narracao (PT-BR) — ${produto}

> Estrutura validada. Narracao entra no CapCut depois. Mantenha leve, premium, humana.

## 0–4s — Gancho de identidade
> (fale com a cliente 35/40+; desejo + reconhecimento. Ex.: "Aquela peca que resolve seu look em segundos...")
-

## 4–8s — Nome + diferencial
> (nome do produto + o diferencial concreto: caimento, conforto, anti-amassado, etc.)
-

## 8–10s — End card
> (CTA + seguranca: "Compre com envio seguro e troca facilitada.")
-
`;
fs.writeFileSync(path.join(dir, 'roteiro-narracao.md'), roteiro);

const copy = `# Copy de anuncio — ${produto}

> Gerar via skill ecomm-copy-fashion. Respeitar limites do Google (titulos 30 / longos 90 / descricoes 90 — ver AGENTS.md secao 10).

## Titulos curtos (10–15)
-

## Titulos longos (5)
-

## Descricoes (5)
-
`;
fs.writeFileSync(path.join(dir, 'copy.md'), copy);

console.log(`\n=== DESPACHANTE DE CRIATIVO — setup ===`);
console.log(`Produto: ${produto}${loja ? ' (' + loja + ')' : ''}`);
console.log(`Pasta criada: criativos/${slug}/`);
console.log('  - brief.json (padrao validado + status aguardando-geracao)');
console.log('  - roteiro-narracao.md (0-4 / 4-8 / 8-10)');
console.log('  - copy.md (placeholder ecomm-copy-fashion)');
console.log('  - imagens/  video/  (saida da geracao)');
console.log('\nProximo passo (custa creditos — so com OK): subagente despachante-criativo roda o lote no Higgsfield');
console.log('(Nano Banana 2 p/ fidelidade, GPT Image 2 p/ lote barato, Kling 3.0 sound off, export 2K).\n');
