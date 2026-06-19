#!/usr/bin/env node
/*
 * PIXEL PROTECTION PROTOCOL (parte determinística do Comando Manha / Agente 1)
 * ---------------------------------------------------------------------------
 * Avalia cada campanha ENABLED contra as regras de disciplina e emite flags:
 *   - mudou budget ha <48h         -> BLOQUEAR novo ajuste
 *   - campanha nova <72h           -> MAO FORA
 *   - 2 toques hoje                -> PARAR (nao mexer mais hoje)
 *   - ajuste >+20%                 -> ALERTA
 *
 * Fontes:
 *   - data/utmify-campaigns-latest.json (createdTime, budgetUpdate.updatedAt, dailyBudget)
 *   - data/toques-log.json (opcional): log append-only de mudancas manuais feitas por voce.
 *       formato: [{ "campaignId": "...", "data": "2026-06-19T14:00:00-03:00",
 *                   "budgetAntes": 3500, "budgetDepois": 4000 }]
 *     Sem o log, usamos budgetUpdate.updatedAt da UTMify como ultima mudanca conhecida
 *     (mas o log e mais preciso para "2 toques/dia" e "%").
 *
 * Saida sempre gravada em data/protecao-pixel-latest.json.
 * Uso: node scripts/protecao-pixel.js [--campaigns ...] [--json]
 */

const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const getArg = (f, d) => { const i = argv.indexOf(f); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const ROOT = path.resolve(__dirname, '..');
const liveCampaigns = path.join(ROOT, 'data/utmify-campaigns-latest.json');
const defaultCampaigns = fs.existsSync(liveCampaigns) ? liveCampaigns : path.join(ROOT, 'data/utmify-campaigns-sample.json');
const campaignsPath = path.resolve(getArg('--campaigns', defaultCampaigns));
const toquesPath = path.join(ROOT, 'data/toques-log.json');

const TZ_OFFSET = '-03:00'; // operacao BR
const NOW = new Date();

const campaignsFile = JSON.parse(fs.readFileSync(campaignsPath, 'utf8'));
const campaigns = campaignsFile.results || campaignsFile;
let toques = [];
if (fs.existsSync(toquesPath)) {
  try { toques = JSON.parse(fs.readFileSync(toquesPath, 'utf8')); } catch (_) { toques = []; }
}

const hoursSince = (d) => (d ? (NOW - new Date(d)) / 36e5 : null);
const ymd = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
const hojeStr = ymd(NOW);

function avaliar(c) {
  if (c.status !== 'ENABLED') return null;

  const toquesCampanha = toques.filter((t) => String(t.campaignId) === String(c.campaignId));
  const toquesHoje = toquesCampanha.filter((t) => ymd(t.data) === hojeStr);

  // ultima mudanca conhecida: max(log, budgetUpdate.updatedAt)
  const updFromUtmify = c.budgetUpdate && c.budgetUpdate.updatedAt;
  const updFromLog = toquesCampanha.map((t) => t.data).sort().slice(-1)[0];
  const ultimaMudanca = [updFromUtmify, updFromLog].filter(Boolean).sort().slice(-1)[0] || null;
  const horasDesdeMudanca = hoursSince(ultimaMudanca);

  const idadeHoras = hoursSince(c.createdTime);

  // maior ajuste percentual hoje (a partir do log)
  let maiorAjustePct = null;
  for (const t of toquesHoje) {
    if (t.budgetAntes > 0 && t.budgetDepois != null) {
      const pct = ((t.budgetDepois - t.budgetAntes) / t.budgetAntes) * 100;
      if (maiorAjustePct == null || pct > maiorAjustePct) maiorAjustePct = pct;
    }
  }

  const flags = [];
  if (idadeHoras != null && idadeHoras < 72)
    flags.push({ nivel: 'BLOQUEIO', regra: 'campanha-nova-72h', msg: `Campanha nova (${idadeHoras.toFixed(0)}h) — MAO FORA ate 72h.` });
  if (horasDesdeMudanca != null && horasDesdeMudanca < 48)
    flags.push({ nivel: 'BLOQUEIO', regra: 'mudanca-48h', msg: `Budget mudou ha ${horasDesdeMudanca.toFixed(0)}h — BLOQUEAR novo ajuste (min 48h).` });
  if (toquesHoje.length >= 2)
    flags.push({ nivel: 'BLOQUEIO', regra: '2-toques-dia', msg: `${toquesHoje.length} toques hoje — PARAR, nao mexer mais hoje.` });
  if (maiorAjustePct != null && maiorAjustePct > 20)
    flags.push({ nivel: 'ALERTA', regra: 'ajuste-20pct', msg: `Ajuste de +${maiorAjustePct.toFixed(0)}% hoje — acima do teto de +20%.` });

  return {
    campaignId: c.campaignId,
    nome: c.name,
    dailyBudgetCentavos: c.dailyBudget,
    idadeHoras: idadeHoras != null ? Math.round(idadeHoras) : null,
    horasDesdeUltimaMudanca: horasDesdeMudanca != null ? Math.round(horasDesdeMudanca) : null,
    ultimaMudanca,
    toquesHoje: toquesHoje.length,
    maiorAjustePctHoje: maiorAjustePct != null ? Math.round(maiorAjustePct) : null,
    podeAjustar: flags.every((f) => f.nivel !== 'BLOQUEIO'),
    flags,
  };
}

const result = campaigns.map(avaliar).filter(Boolean);
const comFlags = result.filter((r) => r.flags.length);
const bloqueadas = result.filter((r) => !r.podeAjustar);

const out = {
  geradoEm: NOW.toISOString(),
  hoje: hojeStr,
  temToquesLog: fs.existsSync(toquesPath),
  totalEnabled: result.length,
  bloqueadas: bloqueadas.length,
  campanhas: result,
};
fs.writeFileSync(path.join(ROOT, 'data/protecao-pixel-latest.json'), JSON.stringify(out, null, 1));

if (argv.includes('--json')) { process.stdout.write(JSON.stringify(out, null, 2) + '\n'); process.exit(0); }

console.log('\n=== PIXEL PROTECTION PROTOCOL ===');
console.log(`Hoje: ${hojeStr}  |  campanhas ENABLED: ${result.length}  |  bloqueadas p/ ajuste: ${bloqueadas.length}`);
if (!out.temToquesLog) {
  console.log('NOTA: data/toques-log.json ausente — usando budgetUpdate.updatedAt da UTMify como ultima mudanca.');
  console.log('      Crie o log para checar "2 toques/dia" e teto de "+20%" com precisao.');
}
if (!comFlags.length) { console.log('\nNenhuma flag de protocolo. Mao livre dentro das demais regras.\n'); process.exit(0); }
console.log('\n--- FLAGS ---');
for (const r of comFlags) {
  console.log(`\n• ${r.nome.replace(/\s*\[v\d+\]\s*$/, '')}`);
  for (const f of r.flags) console.log(`    [${f.nivel}] ${f.msg}`);
}
console.log('\nSaida JSON: data/protecao-pixel-latest.json\n');
