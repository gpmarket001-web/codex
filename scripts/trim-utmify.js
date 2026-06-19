#!/usr/bin/env node
/*
 * Normaliza um dump bruto do get_google_ad_objects (nivel campanha) para o formato
 * enxuto que margem-real.js e protecao-pixel.js consomem (data/utmify-campaigns-latest.json).
 *
 * O resultado da MCP da UTMify e grande; o harness costuma salvar em arquivo. Use:
 *   node scripts/trim-utmify.js <caminho-do-dump.json> [--from ISO --to ISO]
 *
 * O dump deve ser o objeto { results: [...], untrackedCount } OU um array de campanhas.
 */
const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const src = argv.find((a) => !a.startsWith('--'));
if (!src) { console.error('Uso: node scripts/trim-utmify.js <dump.json> [--from ISO --to ISO]'); process.exit(1); }
const getArg = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : null; };

const KEEP = ['id', 'campaignId', 'name', 'level', 'status', 'channel', 'dailyBudget',
  'lifetimeBudget', 'budgetId', 'targetCpa', 'totalOrdersCount', 'approvedOrdersCount',
  'pendingOrdersCount', 'revenue', 'grossRevenue', 'pendingRevenue', 'refundedRevenue',
  'tax', 'fees', 'spend', 'productCosts', 'profit', 'roas', 'roi', 'budgetUpdate',
  'createdTime', 'impressions', 'inlineLinkClicks', 'inlineLinkClickCtr'];

const raw = JSON.parse(fs.readFileSync(src, 'utf8'));
const results = (raw.results || raw).filter((c) => c.level === 'campaign' || !c.level);
const out = {
  _fixture: `Dump UTMify normalizado de ${path.basename(src)}. Valores em centavos.`,
  janela: (getArg('--from') && getArg('--to')) ? { from: getArg('--from'), to: getArg('--to') } : (raw.janela || null),
  untrackedCount: raw.untrackedCount ?? null,
  results: results.map((c) => Object.fromEntries(KEEP.map((k) => [k, c[k] ?? null]))),
};
const dest = path.resolve(__dirname, '..', 'data/utmify-campaigns-latest.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 1));
console.log(`OK: ${out.results.length} campanhas -> data/utmify-campaigns-latest.json`);
