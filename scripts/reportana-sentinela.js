#!/usr/bin/env node
/*
 * SENTINELA REPORTANA (Agente 7)
 * ------------------------------
 * Recuperacao de carrinho/PIX/pedido-pendente = margem pura. Este script vigia:
 *   - taxa de recuperacao da semana mais recente vs baseline (alerta se cair alem da tolerancia);
 *   - integridade dos fluxos (opcional): preview_html/preview_body preenchidos,
 *     variaveis quebradas (placeholder {{...}} sobrando) e nos orfaos.
 *
 * Objetivo: detectar regressao em DIAS, nao meses.
 *
 * Uso:
 *   node scripts/reportana-sentinela.js [--dados data/reportana-recuperacao.json]
 *                                       [--fluxos data/reportana-fluxos.json] [--json]
 * Saida: data/reportana-sentinela-latest.json
 */

const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const getArg = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const ROOT = path.resolve(__dirname, '..');
const dadosPath = path.resolve(getArg('--dados', path.join(ROOT, 'data/reportana-recuperacao.json')));
const fluxosPath = path.resolve(getArg('--fluxos', path.join(ROOT, 'data/reportana-fluxos.json')));

const dados = JSON.parse(fs.readFileSync(dadosPath, 'utf8'));
const baseline = dados.baseline_taxa || {};
const tol = dados.tolerancia_queda ?? 0.15;
const semanas = dados.semanas || [];

// semana mais recente (ordem lexicografica de "AAAA-Sxx" funciona dentro do mesmo ano)
const ultimaSemana = [...new Set(semanas.map((s) => s.semana))].sort().slice(-1)[0] || null;
const anterior = [...new Set(semanas.map((s) => s.semana))].sort().slice(-2)[0] || null;
const taxaDe = (sem, fluxo) => {
  const r = semanas.find((s) => s.semana === sem && s.fluxo === fluxo);
  return r && r.enviados > 0 ? r.recuperados / r.enviados : null;
};

const alertas = [];
const linhasRecup = [];
const fluxosDaUltima = semanas.filter((s) => s.semana === ultimaSemana);
for (const row of fluxosDaUltima) {
  const taxa = row.enviados > 0 ? row.recuperados / row.enviados : 0;
  const base = baseline[row.fluxo];
  const limite = base != null ? base * (1 - tol) : null;
  const taxaAnt = anterior ? taxaDe(anterior, row.fluxo) : null;
  const caiuVsBaseline = limite != null && taxa < limite;
  const caiuVsAnterior = taxaAnt != null && taxa < taxaAnt;
  if (caiuVsBaseline) {
    alertas.push({
      fluxo: row.fluxo,
      tipo: 'queda-vs-baseline',
      msg: `${row.fluxo}: taxa ${(taxa * 100).toFixed(1)}% < limite ${(limite * 100).toFixed(1)}% (baseline ${(base * 100).toFixed(1)}%).`,
    });
  }
  linhasRecup.push({
    fluxo: row.fluxo,
    taxa: Math.round(taxa * 1000) / 10,
    baselinePct: base != null ? Math.round(base * 1000) / 10 : null,
    taxaAnteriorPct: taxaAnt != null ? Math.round(taxaAnt * 1000) / 10 : null,
    deltaVsAnterior: taxaAnt != null ? Math.round((taxa - taxaAnt) * 1000) / 10 : null,
    receitaRecuperadaCentavos: row.receita_recuperada || 0,
    statusBaseline: caiuVsBaseline ? 'ABAIXO' : 'ok',
  });
}

// integridade de fluxos (opcional)
const integridade = [];
if (fs.existsSync(fluxosPath)) {
  const fluxos = JSON.parse(fs.readFileSync(fluxosPath, 'utf8'));
  const lista = fluxos.fluxos || fluxos;
  for (const fl of lista) {
    const nodes = fl.nodes || [];
    const ids = new Set(nodes.map((n) => n.id));
    const referenciados = new Set();
    for (const n of nodes) for (const nx of n.next || []) referenciados.add(nx);
    for (const n of nodes) {
      const probs = [];
      const corpo = `${n.preview_html || ''} ${n.preview_body || ''} ${n.body || ''}`;
      if (n.tipo === 'mensagem' || n.preview_html !== undefined) {
        if (!n.preview_html) probs.push('preview_html vazio');
        if (!n.preview_body) probs.push('preview_body vazio');
      }
      if (/\{\{\s*\}\}/.test(corpo) || /\{\{[^}]*\}\}/.test(corpo) === false && /\{\{/.test(corpo)) probs.push('variavel quebrada (placeholder sem fechamento)');
      if (/\{\{\s*\}\}/.test(corpo)) probs.push('variavel vazia {{ }}');
      const orfao = !n.start && !referenciados.has(n.id);
      if (orfao) probs.push('no orfao (ninguem aponta para ele)');
      if (probs.length) integridade.push({ fluxo: fl.nome || fl.id, node: n.id, problemas: probs });
    }
  }
}

const out = {
  geradoEm: new Date().toISOString(),
  ultimaSemana,
  recuperacao: linhasRecup,
  alertasRecuperacao: alertas,
  integridadeFluxos: integridade,
  temFluxos: fs.existsSync(fluxosPath),
};
fs.writeFileSync(path.join(ROOT, 'data/reportana-sentinela-latest.json'), JSON.stringify(out, null, 1));

if (argv.includes('--json')) { process.stdout.write(JSON.stringify(out, null, 2) + '\n'); process.exit(0); }

const fmt = (c) => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pad = (s, n) => String(s).padEnd(n).slice(0, n);
const padL = (s, n) => String(s).padStart(n);
console.log(`\n=== SENTINELA REPORTANA — semana ${ultimaSemana || '?'} ===`);
console.log(pad('Fluxo', 22) + padL('Taxa', 8) + padL('Baseline', 10) + padL('vs ant.', 9) + padL('Recuperado', 16) + '  Status');
console.log('-'.repeat(78));
for (const r of linhasRecup) {
  console.log(
    pad(r.fluxo, 22) +
      padL(r.taxa + '%', 8) +
      padL(r.baselinePct != null ? r.baselinePct + '%' : '—', 10) +
      padL(r.deltaVsAnterior != null ? (r.deltaVsAnterior >= 0 ? '+' : '') + r.deltaVsAnterior + 'pp' : '—', 9) +
      padL(fmt(r.receitaRecuperadaCentavos), 16) +
      '  ' + (r.statusBaseline === 'ABAIXO' ? '🔴 ABAIXO' : '🟢 ok')
  );
}
console.log('-'.repeat(78));
if (alertas.length) {
  console.log('\n⚠️  ALERTAS DE RECUPERACAO:');
  for (const a of alertas) console.log('  - ' + a.msg);
} else {
  console.log('\nNenhuma queda vs baseline. Recuperacao saudavel.');
}
if (out.temFluxos) {
  if (integridade.length) {
    console.log('\n⚠️  INTEGRIDADE DE FLUXOS:');
    for (const i of integridade) console.log(`  - [${i.fluxo}] node ${i.node}: ${i.problemas.join('; ')}`);
  } else console.log('\nFluxos: sem variaveis quebradas/nos orfaos/preview vazio.');
} else {
  console.log('\n(integridade de fluxos: forneca data/reportana-fluxos.json para checar variaveis/nos orfaos/preview)');
}
console.log('\nJSON: data/reportana-sentinela-latest.json\n');
