#!/usr/bin/env node
/*
 * FILA DE MINERACAO (Agente 2) — ranqueador deterministico
 * --------------------------------------------------------
 * Recebe candidatos (produtos vencedores de concorrentes) e produz uma fila
 * "TESTAR PRIMEIRO" ranqueada por:
 *   - longevidade do anuncio (30+ dias = sinal de lucratividade)
 *   - de-duplicacao contra data/ja-testados.json (nunca recomenda o ja testado)
 *   - breakeven ROAS estimado via Agente 0 (economia da operacao; Valrox = USD/Stripe, sem PIX)
 *
 * Coleta dos candidatos = trabalho do subagente 'mineracao' (skill ecomm-mining-engine +
 * Google Ads Transparency MCP quando disponiveis; senao WebSearch/WebFetch). Este script
 * so RANQUEIA o que ja foi coletado em data/mineracao/candidatos-<op>.json.
 *
 * Uso:
 *   node scripts/mineracao-rank.js [--candidatos <path>] [--operacao valrox] [--json]
 * Saida: mineracao/AAAA-Sxx.md  +  data/mineracao/rank-latest.json
 */

const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const getArg = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const ROOT = path.resolve(__dirname, '..');
const operacao = getArg('--operacao', 'valrox');

const defaultCand = (() => {
  const live = path.join(ROOT, `data/mineracao/candidatos-${operacao === 'valrox' ? 'eua' : operacao}.json`);
  return fs.existsSync(live) ? live : path.join(ROOT, 'data/mineracao/candidatos-eua-sample.json');
})();
const candPath = path.resolve(getArg('--candidatos', defaultCand));

const ledger = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/cogs-ledger.json'), 'utf8'));
const fornFile = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/fornecedores.json'), 'utf8'));
const testadosFile = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/ja-testados.json'), 'utf8'));
const candFile = JSON.parse(fs.readFileSync(candPath, 'utf8'));
const candidatos = candFile.candidatos || candFile;

const op = ledger.operacoes[operacao] || {};
const moeda = op.moeda || 'USD';
const fornById = Object.fromEntries((fornFile.fornecedores || []).map((f) => [f.id, f]));
const testados = (testadosFile.testados || []).filter((t) => !t.operacao || t.operacao === operacao);

const NOW = new Date();
const dias = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

// breakeven estimado via Agente 0 (mesma logica do margem-real, economia da operacao)
function breakevenEstimado(preco, custo) {
  if (!preco || preco <= 0 || custo == null) return null;
  const gatewayPct = op.gateway_pct || 0;
  let checkoutPct = 0;
  let rateio = 0;
  if (op.fonte_dados === 'utmify') {
    checkoutPct = (ledger.config.checkout_br && ledger.config.checkout_br.percentual_receita) || 0;
    const pm = (ledger.config.checkout_br && ledger.config.checkout_br.pedidos_mes_estimados) || 0;
    rateio = pm > 0 ? ledger.config.checkout_br.mensalidade_centavos / pm : 0;
  }
  const custoVar = custo + preco * gatewayPct + preco * checkoutPct + rateio;
  const contrib = preco - custoVar;
  return {
    contribPorPedido: Math.round(contrib),
    margemPct: Math.round((contrib / preco) * 100),
    breakevenROAS: contrib > 0 ? Math.round((preco / contrib) * 100) / 100 : null,
  };
}

function jaTestado(nome) {
  const n = String(nome).toLowerCase();
  return testados.find((t) => t.match && n.includes(String(t.match).toLowerCase())) || null;
}

const analisados = candidatos.map((c) => {
  const fimRef = c.ainda_ativo ? NOW.toISOString().slice(0, 10) : c.ultimo_visto;
  const longevidade = c.primeiro_visto ? dias(c.primeiro_visto, fimRef) : null;
  const dup = jaTestado(c.produto);
  const be = breakevenEstimado(c.preco_visto, c.custo_estimado);
  const forn = c.fornecedor_id ? fornById[c.fornecedor_id] : null;

  // score: longevidade domina (sinal de lucratividade); bonus de margem; zera se ja testado
  let score = 0;
  if (!dup) {
    score = Math.min(longevidade || 0, 120); // teto p/ nao explodir
    if (be && be.margemPct != null) score += Math.max(0, be.margemPct) * 0.5;
  }
  let bucket;
  if (dup) bucket = 'JA TESTADO (pular)';
  else if ((longevidade || 0) >= 30) bucket = 'TESTAR PRIMEIRO';
  else bucket = 'OBSERVAR';

  return {
    produto: c.produto,
    concorrente: c.concorrente,
    longevidadeDias: longevidade,
    aindaAtivo: !!c.ainda_ativo,
    jaTestado: dup ? { resultado: dup.resultado, data: dup.data } : null,
    fornecedor: forn ? forn.nome : (c.fornecedor_id || null),
    custoEstimado: c.custo_estimado ?? null,
    precoVisto: c.preco_visto ?? null,
    breakeven: be,
    angulo: c.angulo || null,
    bucket,
    score: Math.round(score * 10) / 10,
    notas: c.notas || null,
  };
});

const ordem = { 'TESTAR PRIMEIRO': 0, OBSERVAR: 1, 'JA TESTADO (pular)': 2 };
analisados.sort((a, b) => (ordem[a.bucket] - ordem[b.bucket]) || (b.score - a.score));

// ISO week
function isoWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThu = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week = 1 + Math.round(((date - firstThu) / 86400000 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7);
  return { year: date.getUTCFullYear(), week };
}
const { year, week } = isoWeek(NOW);
const semana = `${year}-S${String(week).padStart(2, '0')}`;

const money = (c) =>
  c == null ? '—' : (c / 100).toLocaleString(moeda === 'USD' ? 'en-US' : 'pt-BR', { style: 'currency', currency: moeda });

const out = {
  geradoEm: NOW.toISOString(),
  operacao,
  semana,
  fonteCandidatos: path.relative(ROOT, candPath),
  total: analisados.length,
  testarPrimeiro: analisados.filter((a) => a.bucket === 'TESTAR PRIMEIRO').length,
  itens: analisados,
};
fs.writeFileSync(path.join(ROOT, 'data/mineracao/rank-latest.json'), JSON.stringify(out, null, 1));

// ---- markdown ----
const linhas = [];
linhas.push(`# Fila de Mineracao — ${operacao.toUpperCase()} — ${semana}`);
linhas.push('');
linhas.push(`> Operacao: **${op.loja || operacao}** (${moeda}${op.fonte_dados ? ', ' + op.fonte_dados : ''}). Fonte candidatos: \`${out.fonteCandidatos}\`.`);
if (op.status && op.status !== 'ativa') {
  linhas.push(`> ⚠️ Operacao **${op.status.toUpperCase()}** — esta e a fila de preparo; nao subir ate reativar a conta (passar pelo Gate Revisao Bruta).`);
}
linhas.push('');
const fmtItem = (a) => {
  const be = a.breakeven;
  const beTxt = be
    ? (be.breakevenROAS != null ? `breakeven ROAS ~${be.breakevenROAS} (margem ${be.margemPct}%)` : 'sem margem no preco visto')
    : 'breakeven: custo? (confirmar no fornecedor)';
  const dupTxt = a.jaTestado ? ` — JA TESTADO (${a.jaTestado.resultado}, ${a.jaTestado.data})` : '';
  return [
    `### ${a.produto}${dupTxt}`,
    `- Concorrente: ${a.concorrente || '—'} | Longevidade: **${a.longevidadeDias != null ? a.longevidadeDias + ' dias' : '—'}**${a.aindaAtivo ? ' (ainda ativo)' : ''}`,
    `- Fornecedor: ${a.fornecedor || '—'} | Custo est.: ${money(a.custoEstimado)} | Preco visto: ${money(a.precoVisto)}`,
    `- Breakeven: ${beTxt}`,
    a.angulo ? `- Angulo provavel: ${a.angulo}` : null,
    a.notas ? `- Notas: ${a.notas}` : null,
  ].filter(Boolean).join('\n');
};
for (const bucket of ['TESTAR PRIMEIRO', 'OBSERVAR', 'JA TESTADO (pular)']) {
  const itens = analisados.filter((a) => a.bucket === bucket);
  if (!itens.length) continue;
  linhas.push(`## ${bucket}`);
  linhas.push('');
  for (const a of itens) { linhas.push(fmtItem(a)); linhas.push(''); }
}
const mdPath = path.join(ROOT, `mineracao/${semana}.md`);
fs.writeFileSync(mdPath, linhas.join('\n'));

if (argv.includes('--json')) { process.stdout.write(JSON.stringify(out, null, 2) + '\n'); process.exit(0); }

console.log(`\n=== FILA DE MINERACAO — ${operacao.toUpperCase()} — ${semana} ===`);
console.log(`Candidatos: ${out.total} | TESTAR PRIMEIRO: ${out.testarPrimeiro} | fonte: ${out.fonteCandidatos}`);
const pad = (s, n) => String(s).padEnd(n).slice(0, n);
const padL = (s, n) => String(s).padStart(n);
console.log('\n' + pad('Produto', 42) + pad('Bucket', 20) + padL('Longev.', 9) + padL('BrkROAS', 9) + padL('Score', 8));
console.log('-'.repeat(88));
for (const a of analisados) {
  console.log(
    pad(a.produto, 42) +
      pad(a.bucket, 20) +
      padL(a.longevidadeDias != null ? a.longevidadeDias + 'd' : '—', 9) +
      padL(a.breakeven && a.breakeven.breakevenROAS != null ? a.breakeven.breakevenROAS : (a.breakeven ? 'sem mrg' : 'custo?'), 9) +
      padL(a.score, 8)
  );
}
console.log('-'.repeat(88));
console.log(`\nFila gravada em mineracao/${semana}.md  |  JSON em data/mineracao/rank-latest.json\n`);
