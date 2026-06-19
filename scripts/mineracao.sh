#!/usr/bin/env bash
#
# FILA DE MINERACAO — execucao headless semanal (Agente 2)
# Roda o subagente 'mineracao' e gera mineracao/AAAA-Sxx.md.
#
# Uso manual:   ./scripts/mineracao.sh [operacao]      (default: valrox)
# Agendado (cron, toda segunda 7h):
#   0 7 * * 1  cd /caminho/para/codex && ./scripts/mineracao.sh >> mineracao/_cron.log 2>&1
#
# Notas (mesmas do comando-manha.sh): em cron use --permission-mode acceptEdits e tenha
# os MCPs/skills ja autenticados; MODEL pode ser sobrescrito por env.

set -euo pipefail
cd "$(dirname "$0")/.."

OPERACAO="${1:-valrox}"
MODEL="${MODEL:-}"
MODEL_FLAG=()
[ -n "$MODEL" ] && MODEL_FLAG=(--model "$MODEL")

PROMPT="Use o subagente mineracao para gerar a fila da operacao ${OPERACAO}. Colete candidatos (moda masculina US para valrox), grave em data/mineracao/candidatos-eua.json e rode scripts/mineracao-rank.js --operacao ${OPERACAO}. Mantenha a operacao separada da BR."

claude -p "$PROMPT" \
  --permission-mode acceptEdits \
  "${MODEL_FLAG[@]}"

echo "Mineracao (${OPERACAO}) concluida em $(date '+%F %T')."
