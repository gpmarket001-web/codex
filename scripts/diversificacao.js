#!/usr/bin/env node
/*
 * DIVERSIFICACAO "PROXIMO ALENICE" (Agente 3)
 * -------------------------------------------
 * Mede a dependencia do hero (Alenice) e acompanha o plantel de candidatos.
 *   - Concentracao: % da receita (grossRevenue de campanhas trackeadas) por produto,
 *     destacando a fatia do hero. 85% num produto = fragilidade, nao forca.
 *   - Pipeline: status de cada produto (candidato -> em-teste -> validado -> escalando -> morto).
 *
 * Operacao BR (Graca). Le campanhas de data/utmify-campaigns-latest.json (fallback sample).
 * Saida: pipeline/validacao.md  +  data/pipeline-latest.json
 *
 * Uso: node scripts/diversificacao.js [--campaigns <path>] [--json]
 */

const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const getArg = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const ROOT = path.resolve(__dirname, '..');

const ledger = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/cogs-ledger.json'), 'utf8'));
const pipeline = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/pipeline.json'), 'utf8'));
const liveCamp = path.join(ROOT, 'data/utmify-campaigns-latest.json');
const campPath = path.resolve(getArg('--campaigns', fs.existsSync(liveCamp) ? liveCamp : path.join(ROOT, 'data/utmify-campaigns-sample.json')));
const campFile = JSON.parse(fs.readFileSync(campPath, 'utf8'));
const campaigns = campFile.results || campFile;

const heroSku = pipeline.hero_sku;
const skuById = Object.fromEntries((ledger.skus || []).map((s) => [s.sku, s]));
const produtoNome = (sku) => (skuById[sku] && skuById[sku].produto) || sku;

// resolve sku da campanha pela tag de produto (mesma regra do margem-real)
function skuDaCampanha(name) {
  const tags = [...String(name || '').matchAll(/\[([^\]]+)\]/g)].map((x) => x[1].trim());
  // so consideramos campanhas da operacao BR (loja resolvida nao-separada)
  const lojaTag = tags.find((t) => ledger.mapa.loja_por_tag[t]);
  const loja = lojaTag ? ledger.mapa.loja_por_tag[lojaTag] : ledger.mapa.loja_default;
  const opSep = (ledger.operacoes[loja] || {}).fonte_dados !== 'utmify';
  if (opSep) return null; // ignora Valrox etc.
  for (const t of tags) if (ledger.mapa.produto_por_tag[t]) return ledger.mapa.produto_por_tag[t];
  return '_outros';
}

// concentracao por produto (grossRevenue das campanhas ENABLED trackeadas)
const porSku = {};
let totalGross = 0;
for (const c of campaigns) {
  if (c.status && c.status !== 'ENABLED') continue;
  const sku = skuDaCampanha(c.name);
  if (sku == null) continue; // operacao separada
  const g = c.grossRevenue || 0;
  porSku[sku] = (porSku[sku] || 0) + g;
  totalGross += g;
}
const distribuicao = Object.entries(porSku)
  .map(([sku, gross]) => ({
    sku,
    produto: sku === '_outros' ? '(outros / sem tag de produto)' : produtoNome(sku),
    grossCentavos: Math.round(gross),
    pct: totalGross > 0 ? Math.round((gross / totalGross) * 1000) / 10 : 0,
  }))
  .sort((a, b) => b.grossCentavos - a.grossCentavos);

const heroPct = (distribuicao.find((d) => d.sku === heroSku) || { pct: 0 }).pct;

// pipeline por status
const ordemStatus = ['escalando', 'validado', 'em-teste', 'candidato', 'morto'];
const porStatus = Object.fromEntries(ordemStatus.map((s) => [s, (pipeline.produtos || []).filter((p) => p.status === s)]));
const nValidadosOuEscalando = porStatus.escalando.length + porStatus.validado.length;

const out = {
  geradoEm: new Date().toISOString(),
  operacao: pipeline.operacao,
  janela: campFile.janela || null,
  heroSku,
  heroPct,
  meta: pipeline.meta,
  distribuicao,
  pipelinePorStatus: porStatus,
  plantelComVolume: nValidadosOuEscalando,
};
fs.writeFileSync(path.join(ROOT, 'data/pipeline-latest.json'), JSON.stringify(out, null, 1));

const fmt = (c) => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ---- markdown board ----
const L = [];
L.push(`# Pipeline "Proximo Alenice" — ${pipeline.operacao === 'grassa' ? 'Graca' : pipeline.operacao}`);
L.push('');
L.push(`> Meta: ${pipeline.meta}`);
L.push(`> Atualizado: ${new Date().toISOString().slice(0, 10)} | fonte campanhas: \`${path.relative(ROOT, campPath)}\``);
L.push('');
L.push('## Dependencia do hero');
const risco = heroPct >= 70 ? '🔴 ALTA' : heroPct >= 50 ? '🟠 MEDIA' : '🟢 OK';
L.push(`- **${produtoNome(heroSku)}** = **${heroPct}%** da receita trackeada (risco: ${risco}).`);
L.push(`- Plantel com volume (validado/escalando): **${nValidadosOuEscalando}** (meta: 3 a 5).`);
L.push('');
L.push('### Distribuicao de receita (campanhas ENABLED trackeadas)');
L.push('| Produto | % | Receita 7d |');
L.push('|---|---|---|');
for (const d of distribuicao) L.push(`| ${d.produto} | ${d.pct}% | ${fmt(d.grossCentavos)} |`);
L.push('');
L.push('## Board de validacao');
for (const s of ordemStatus) {
  L.push(`### ${s.toUpperCase()} (${porStatus[s].length})`);
  if (!porStatus[s].length) { L.push('- —'); L.push(''); continue; }
  for (const p of porStatus[s]) L.push(`- **${p.produto}** — ${p.notas || ''}`.trimEnd());
  L.push('');
}
L.push('## Framework de teste (validado)');
const fw = pipeline.framework_teste;
L.push(`- Criativo: ${fw.criativo_default}`);
L.push(`- Verba: ${fmt(fw.verba_dia_centavos_min)}–${fmt(fw.verba_dia_centavos_max)}/dia · ${fw.mao_fora_horas}h mao fora`);
L.push(`- Publico: ${fw.publico_vencedor} (NUNCA ${fw.publico_evitar})`);
L.push(`- Variantes de cor/angulo: ${fw.variantes_cor_angulo}`);
fs.writeFileSync(path.join(ROOT, 'pipeline/validacao.md'), L.join('\n'));

if (argv.includes('--json')) { process.stdout.write(JSON.stringify(out, null, 2) + '\n'); process.exit(0); }

console.log('\n=== DIVERSIFICACAO "PROXIMO ALENICE" ===');
const risco2 = heroPct >= 70 ? 'ALTA 🔴' : heroPct >= 50 ? 'MEDIA 🟠' : 'OK 🟢';
console.log(`Hero (${produtoNome(heroSku)}): ${heroPct}% da receita trackeada — risco ${risco2}`);
console.log(`Plantel com volume (validado/escalando): ${nValidadosOuEscalando} (meta 3-5)\n`);
const pad = (s, n) => String(s).padEnd(n).slice(0, n);
const padL = (s, n) => String(s).padStart(n);
console.log(pad('Produto', 44) + padL('%', 8) + padL('Receita 7d', 16));
console.log('-'.repeat(68));
for (const d of distribuicao) console.log(pad(d.produto, 44) + padL(d.pct + '%', 8) + padL(fmt(d.grossCentavos), 16));
console.log('-'.repeat(68));
console.log('\nBoard:');
for (const s of ordemStatus) console.log(`  ${pad(s, 11)} ${porStatus[s].map((p) => p.produto.split(' ').slice(0, 2).join(' ')).join(', ') || '—'}`);
console.log('\nBoard completo: pipeline/validacao.md  |  JSON: data/pipeline-latest.json\n');
