#!/usr/bin/env node
/*
 * MOTOR DE VERDADE DE MARGEM (Agente 0)
 * --------------------------------------
 * A UTMify recebe COGS=0 (productCosts=0 em toda campanha), entao o profit/roas/roi
 * que ela mostra ignora o custo do produto. Este motor injeta o COGS real do ledger
 * (data/cogs-ledger.json) e recalcula a VERDADE por campanha e por produto.
 *
 * Principio: a UTMify ja desconta spend + fees (gateway/checkout) + tax. O unico buraco
 * e o COGS. Entao:  lucro_real = profit_utmify - COGS_real
 *
 * Uso:
 *   node scripts/margem-real.js [--campaigns data/utmify-campaigns-latest.json]
 *                               [--ledger data/cogs-ledger.json]
 *                               [--status ENABLED]   (filtra; default: ENABLED)
 *                               [--all]               (mostra todas, inclui PAUSED)
 *                               [--json]              (imprime JSON em vez de tabela)
 *
 * Saida sempre gravada em data/margem-real-latest.json (consumida pelo Comando Manha).
 *
 * Valores monetarios de entrada estao em CENTAVOS. Saida em R$ / US$ legivel.
 */

const fs = require('fs');
const path = require('path');

// ---------- args ----------
const argv = process.argv.slice(2);
const getArg = (flag, def) => {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const has = (flag) => argv.includes(flag);

const ROOT = path.resolve(__dirname, '..');
// usa o arquivo real (gerado pelo Comando Manha) se existir; senao cai na amostra sintetica versionada.
const defaultCampaigns = (() => {
  const live = path.join(ROOT, 'data/utmify-campaigns-latest.json');
  return fs.existsSync(live) ? live : path.join(ROOT, 'data/utmify-campaigns-sample.json');
})();
const campaignsPath = path.resolve(getArg('--campaigns', defaultCampaigns));
const ledgerPath = path.resolve(getArg('--ledger', path.join(ROOT, 'data/cogs-ledger.json')));
const statusFilter = has('--all') ? null : getArg('--status', 'ENABLED');
const asJson = has('--json');

// ---------- load ----------
const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
const campaignsFile = JSON.parse(fs.readFileSync(campaignsPath, 'utf8'));
const campaigns = campaignsFile.results || campaignsFile;

// ---------- helpers ----------
const cfg = ledger.config;
const skuById = Object.fromEntries((ledger.skus || []).map((s) => [s.sku, s]));

function fxToBRL(moeda) {
  if (!moeda || moeda === 'BRL') return 1; // BR = fornecedor nacional, sem cambio
  const taxa = cfg.cambio && cfg.cambio[`${moeda}_para_BRL`];
  return typeof taxa === 'number' ? taxa : 1; // se faltar a taxa, trata como ja em BRL
}

// Custo fixo por unidade (centavos, na moeda da loja BR=BRL). Gateway/checkout NAO entram aqui
// porque a UTMify ja os desconta em `fees`; aqui so cobrimos o buraco do COGS.
function cogsUnitFixed(sku) {
  if (!sku) return { valor: null, conhecido: false };
  const fx = fxToBRL(sku.moeda_fornecedor || 'BRL');
  const fornecedor = (sku.custo_fornecedor_origem || 0) * fx;
  const total = fornecedor + (sku.frete_unitario || 0) + (sku.imposto_estimado || 0);
  const conhecido = (sku.custo_fornecedor_origem || 0) > 0 || (sku.frete_unitario || 0) > 0;
  return { valor: total, conhecido };
}

function parseTags(name) {
  const m = [...String(name || '').matchAll(/\[([^\]]+)\]/g)].map((x) => x[1].trim());
  return m;
}

function resolveCampaign(name) {
  const tags = parseTags(name);
  const lojaTag = tags.find((t) => ledger.mapa.loja_por_tag[t]);
  const loja = lojaTag ? ledger.mapa.loja_por_tag[lojaTag] : ledger.mapa.loja_default;
  let sku = null;
  for (const t of tags) {
    if (ledger.mapa.produto_por_tag[t]) {
      sku = skuById[ledger.mapa.produto_por_tag[t]] || null;
      break;
    }
  }
  return { loja, sku, tags };
}

const fmtBRL = (cents) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtUSD = (cents) =>
  (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const money = (cents, moeda) => (moeda === 'USD' ? fmtUSD(cents) : fmtBRL(cents));
const r2 = (n) => (n == null || !isFinite(n) ? null : Math.round(n * 100) / 100);

// ---------- per-campaign real margin ----------
function analisarCampanha(c) {
  const { loja, sku, tags } = resolveCampaign(c.name);
  const op = ledger.operacoes[loja] || {};
  const moeda = op.moeda || 'BRL';
  const cogsUnit = cogsUnitFixed(sku);

  const gross = c.grossRevenue || 0;
  const spend = c.spend || 0;
  const fees = c.fees || 0;
  const tax = c.tax || 0;
  const approved = c.approvedOrdersCount || 0;
  const total = c.totalOrdersCount || 0;
  const pending = c.pendingOrdersCount || 0;
  const pendingRev = c.pendingRevenue || 0;

  // profit que a UTMify calcula (COGS=0): gross - spend - fees - tax
  const profitUtmify = gross - spend - fees - tax;

  // --- cenario REALIZADO (apenas pedidos aprovados) ---
  const cogsRealizado = cogsUnit.conhecido ? cogsUnit.valor * approved : 0;
  const lucroRealizado = profitUtmify - cogsRealizado;
  const contribAntesAds = gross - fees - tax - cogsRealizado; // contribuicao antes do trafego
  const breakevenROAS = contribAntesAds > 0 ? gross / contribAntesAds : null;
  const realROAS = spend > 0 ? gross / spend : null;
  const acimaDaLinha = lucroRealizado > 0;

  // --- cenario COM PIX PENDENTE (projetado, com haircut de aprovacao) ---
  const pixRate = cfg.pix.taxa_aprovacao_estimada || 0;
  const feeRatio = gross > 0 ? fees / gross : 0;
  const taxRatio = gross > 0 ? tax / gross : 0;
  const pendGrossAdj = pendingRev * pixRate;
  const pendFees = pendGrossAdj * feeRatio;
  const pendTax = pendGrossAdj * taxRatio;
  const pendCogs = cogsUnit.conhecido ? cogsUnit.valor * pending * pixRate : 0;
  const lucroComPix = lucroRealizado + pendGrossAdj - pendFees - pendTax - pendCogs;

  return {
    campaignId: c.campaignId,
    nome: c.name,
    loja,
    operacaoSeparada: op.fonte_dados !== 'utmify',
    sku: sku ? sku.sku : null,
    cogsConhecido: cogsUnit.conhecido,
    cogsUnitCentavos: cogsUnit.conhecido ? Math.round(cogsUnit.valor) : null,
    status: c.status,
    moeda,
    pedidos: { total, aprovados: approved, pendentes: pending },
    realROAS: r2(realROAS),
    breakevenROAS: r2(breakevenROAS),
    acimaDaLinha,
    lucro7dRealizadoCentavos: Math.round(lucroRealizado),
    lucro7dComPixCentavos: Math.round(lucroComPix),
    profitUtmifyCentavos: Math.round(profitUtmify),
    spendCentavos: Math.round(spend),
    grossCentavos: Math.round(gross),
  };
}

// ---------- per-product breakeven (standalone) ----------
function breakevenProduto(sku) {
  const op = ledger.operacoes[sku.loja] || {};
  const moeda = op.moeda || 'BRL';
  const cogsUnit = cogsUnitFixed(sku);
  const preco = sku.preco_venda || 0;
  if (!cogsUnit.conhecido || preco <= 0) {
    return { sku: sku.sku, produto: sku.produto, moeda, pronto: false };
  }
  const gatewayPct = op.gateway_pct || 0;
  let checkoutPct = 0;
  let rateio = 0;
  if (op.fonte_dados === 'utmify') {
    checkoutPct = cfg.checkout_br.percentual_receita || 0;
    const pm = cfg.checkout_br.pedidos_mes_estimados || 0;
    rateio = pm > 0 ? (cfg.checkout_br.mensalidade_centavos || 0) / pm : 0;
  }
  const custoVar = cogsUnit.valor + preco * gatewayPct + preco * checkoutPct + rateio;
  const contribPorPedido = preco - custoVar;
  const breakevenROAS = contribPorPedido > 0 ? preco / contribPorPedido : null;
  return {
    sku: sku.sku,
    produto: sku.produto,
    moeda,
    pronto: true,
    precoCentavos: Math.round(preco),
    cogsUnitCentavos: Math.round(cogsUnit.valor),
    contribPorPedidoCentavos: Math.round(contribPorPedido),
    breakevenROAS: r2(breakevenROAS),
    margemPorPedidoPct: r2((contribPorPedido / preco) * 100),
  };
}

// ---------- run ----------
let camps = campaigns.map(analisarCampanha);
if (statusFilter) camps = camps.filter((c) => c.status === statusFilter);

// separar BR (utmify) x Valrox (operacao separada)
const camposBR = camps.filter((c) => !c.operacaoSeparada);
const campsSeparadas = camps.filter((c) => c.operacaoSeparada);

const produtos = (ledger.skus || []).map(breakevenProduto);

const totalLucroBR = camposBR.reduce((s, c) => s + c.lucro7dRealizadoCentavos, 0);
const totalLucroBRComPix = camposBR.reduce((s, c) => s + c.lucro7dComPixCentavos, 0);
const semCogs = camposBR.filter((c) => !c.cogsConhecido).length;

// operacoes BR mantidas SEPARADAS por marca (Grassa/Cida/Bravo nao se misturam)
const lojasBR = [...new Set(camposBR.map((c) => c.loja))];
const resumoPorLoja = lojasBR.map((loja) => {
  const lst = camposBR.filter((c) => c.loja === loja);
  return {
    loja,
    campanhas: lst.length,
    lucro7dRealizadoCentavos: lst.reduce((s, c) => s + c.lucro7dRealizadoCentavos, 0),
    lucro7dComPixCentavos: lst.reduce((s, c) => s + c.lucro7dComPixCentavos, 0),
    campanhasSemCogs: lst.filter((c) => !c.cogsConhecido).length,
  };
});

const out = {
  geradoEm: new Date().toISOString(),
  janela: campaignsFile.janela || null,
  fonteCampanhas: path.relative(ROOT, campaignsPath),
  resumoBR: {
    campanhas: camposBR.length,
    lucro7dRealizadoCentavos: totalLucroBR,
    lucro7dComPixCentavos: totalLucroBRComPix,
    campanhasSemCogs: semCogs,
  },
  resumoPorLoja,
  campanhasBR: camposBR,
  campanhasOperacaoSeparada: campsSeparadas,
  produtosBreakeven: produtos,
};

fs.writeFileSync(path.join(ROOT, 'data/margem-real-latest.json'), JSON.stringify(out, null, 1));

if (asJson) {
  process.stdout.write(JSON.stringify(out, null, 2) + '\n');
  process.exit(0);
}

// ---------- pretty print ----------
const shortName = (n) => String(n).replace(/\s*\[v\d+\]\s*$/, '').slice(0, 42);
const pad = (s, n) => String(s).padEnd(n).slice(0, n);
const padL = (s, n) => String(s).padStart(n);

console.log('\n=== MOTOR DE VERDADE DE MARGEM ===');
console.log(`Janela: ${out.janela ? out.janela.from + ' -> ' + out.janela.to : '(ver fixture)'}`);
console.log(`Fonte: ${out.fonteCampanhas}  |  filtro status: ${statusFilter || 'TODAS'}`);

const nomeLoja = (loja) => (ledger.operacoes[loja] && ledger.operacoes[loja].loja) || loja;
const cabecalho = () =>
  console.log(
    pad('Campanha', 44) + pad('ROAS', 7) + pad('Brkeven', 8) + pad('Linha', 7) +
      padL('Lucro7d real', 16) + padL('c/ PIX pend.', 16)
  );

// uma tabela SEPARADA por marca — Grassa, Cida e Bravo nunca se misturam
for (const loja of lojasBR) {
  const lst = camposBR
    .filter((c) => c.loja === loja)
    .sort((a, b) => a.lucro7dRealizadoCentavos - b.lucro7dRealizadoCentavos);
  console.log(`\n--- ${nomeLoja(loja).toUpperCase()} (UTMify/AppMax) ---`);
  cabecalho();
  console.log('-'.repeat(98));
  for (const c of lst) {
    const linha = !c.cogsConhecido ? 'COGS?' : c.acimaDaLinha ? 'ACIMA' : 'ABAIXO';
    console.log(
      pad(shortName(c.nome), 44) +
        pad(c.realROAS != null ? c.realROAS.toFixed(2) : '-', 7) +
        pad(c.breakevenROAS != null ? c.breakevenROAS.toFixed(2) : '-', 8) +
        pad(linha, 7) +
        padL(money(c.lucro7dRealizadoCentavos, c.moeda), 16) +
        padL(money(c.lucro7dComPixCentavos, c.moeda), 16)
    );
  }
  const sub = resumoPorLoja.find((r) => r.loja === loja);
  console.log('-'.repeat(98));
  console.log(
    pad(`Subtotal ${nomeLoja(loja)} (${sub.campanhas} camp.)`, 65) +
      padL(money(sub.lucro7dRealizadoCentavos, 'BRL'), 16) +
      padL(money(sub.lucro7dComPixCentavos, 'BRL'), 16)
  );
}
console.log('\n' + '='.repeat(98));
console.log(
  pad(`TOTAL BR (${camposBR.length} camp., ${lojasBR.length} marca(s))`, 65) +
    padL(money(totalLucroBR, 'BRL'), 16) +
    padL(money(totalLucroBRComPix, 'BRL'), 16)
);
if (semCogs > 0) {
  console.log(`\n  ATENCAO: ${semCogs} campanha(s) marcada(s) "COGS?" — SKU sem custo no ledger.`);
  console.log('  Breakeven e lucro delas ainda sao FICCAO ate preencher data/cogs-ledger.json.');
}

if (campsSeparadas.length) {
  console.log('\n--- OPERACAO SEPARADA (Valrox: Shopify/Stripe, NAO UTMify) ---');
  for (const c of campsSeparadas) console.log('  ' + shortName(c.nome) + ' (' + c.loja + ')');
  console.log('  (fonte de dados shopify — fora do escopo deste relatorio BR)');
}

console.log('\n--- BREAKEVEN POR PRODUTO ---');
console.log(pad('Produto', 40) + padL('Preco', 13) + padL('COGS', 13) + padL('Margem/ped', 14) + padL('BrkevenROAS', 13));
console.log('-'.repeat(93));
for (const p of produtos) {
  if (!p.pronto) {
    console.log(pad(p.produto, 40) + padL('— ledger incompleto (preencha custo + preco_venda) —', 53));
    continue;
  }
  console.log(
    pad(p.produto, 40) +
      padL(money(p.precoCentavos, p.moeda), 13) +
      padL(money(p.cogsUnitCentavos, p.moeda), 13) +
      padL(p.margemPorPedidoPct.toFixed(0) + '%', 14) +
      padL(p.breakevenROAS != null ? p.breakevenROAS.toFixed(2) : 'sem margem', 13)
  );
}
console.log('-'.repeat(93));
console.log('\nSaida JSON: data/margem-real-latest.json\n');
