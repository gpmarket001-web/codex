#!/usr/bin/env node
/*
 * GATE REVISAO BRUTA (Agente 5) — avaliador pre-gasto
 * ---------------------------------------------------
 * Le um checklist de pagina (data/gate/<slug>.json) e decide GO / NO-GO.
 * Regra dura: GO so sai com TODOS os checks em "verde". Qualquer "vermelho" ou
 * "pendente" => NO-GO (bloqueia subir campanha). Exit code 0 = GO, 1 = NO-GO
 * (da pra usar em script/cron para travar o disparo).
 *
 * A coleta automatica (estoque via Shopify, scan de texto/placeholder na PDP) e
 * feita pelo subagente 'gate-revisao', que preenche os checks 'auto' antes de rodar.
 * Os 6 hard checks (funil/oferta/breakeven/tracking/ratios/benchmark) sao do operador.
 *
 * Uso: node scripts/gate-revisao.js --gate data/gate/<slug>.json [--json]
 */

const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const getArg = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const ROOT = path.resolve(__dirname, '..');
const gatePath = getArg('--gate', null);
if (!gatePath) { console.error('Uso: node scripts/gate-revisao.js --gate data/gate/<slug>.json'); process.exit(2); }
const abs = path.resolve(gatePath);
const gate = JSON.parse(fs.readFileSync(abs, 'utf8'));

const checks = gate.checks || [];
const vermelhos = checks.filter((c) => c.status === 'vermelho');
const pendentes = checks.filter((c) => c.status === 'pendente');
const verdes = checks.filter((c) => c.status === 'verde');
const GO = vermelhos.length === 0 && pendentes.length === 0 && checks.length > 0;

const slug = path.basename(abs).replace(/\.json$/, '');
const out = {
  geradoEm: new Date().toISOString(),
  produto: gate.produto || slug,
  url: gate.url || null,
  decisao: GO ? 'GO' : 'NO-GO',
  verdes: verdes.length,
  vermelhos: vermelhos.length,
  pendentes: pendentes.length,
  bloqueios: [...vermelhos, ...pendentes].map((c) => ({ id: c.id, label: c.label, status: c.status, detalhe: c.detalhe || '' })),
};

// ---- markdown ----
const L = [];
L.push(`# Gate Revisao Bruta — ${gate.produto || slug} — ${out.decisao}`);
L.push('');
L.push(`> ${gate.loja ? 'Loja: ' + gate.loja + ' | ' : ''}${gate.url ? 'URL: ' + gate.url : ''}`);
L.push(`> Verificado: ${gate.verificadoEm || new Date().toISOString().slice(0, 10)}`);
L.push('');
L.push(`## DECISAO: ${GO ? '✅ GO — pode subir campanha' : '⛔ NO-GO — NAO liberar verba'}`);
L.push(`Verde: ${verdes.length} · Vermelho: ${vermelhos.length} · Pendente: ${pendentes.length}`);
L.push('');
if (!GO) {
  L.push('### Bloqueios (resolver antes de subir)');
  for (const c of [...vermelhos, ...pendentes]) {
    L.push(`- [${c.status === 'vermelho' ? '🔴 VERMELHO' : '🟡 PENDENTE'}] ${c.label}${c.detalhe ? ' — ' + c.detalhe : ''}`);
  }
  L.push('');
}
L.push('### Checklist completo');
for (const c of checks) {
  const icon = c.status === 'verde' ? '🟢' : c.status === 'vermelho' ? '🔴' : '🟡';
  L.push(`- ${icon} (${c.grupo}) ${c.label}${c.detalhe ? ' — ' + c.detalhe : ''}`);
}
const mdPath = path.join(ROOT, `gate/${slug}.md`);
fs.writeFileSync(mdPath, L.join('\n'));

if (argv.includes('--json')) { process.stdout.write(JSON.stringify(out, null, 2) + '\n'); process.exit(GO ? 0 : 1); }

console.log(`\n=== GATE REVISAO BRUTA — ${gate.produto || slug} ===`);
console.log(GO ? '✅ GO — pode subir campanha' : '⛔ NO-GO — NAO liberar verba');
console.log(`Verde: ${verdes.length} | Vermelho: ${vermelhos.length} | Pendente: ${pendentes.length}`);
if (!GO) {
  console.log('\nBloqueios:');
  for (const c of [...vermelhos, ...pendentes]) {
    console.log(`  [${c.status === 'vermelho' ? 'VERMELHO' : 'PENDENTE'}] ${c.label}${c.detalhe ? ' — ' + c.detalhe : ''}`);
  }
}
console.log(`\nRelatorio: gate/${slug}.md\n`);
process.exit(GO ? 0 : 1);
