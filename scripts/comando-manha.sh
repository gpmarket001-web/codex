#!/usr/bin/env bash
#
# COMANDO MANHA — execucao headless (Agente 1)
# Roda o subagente comando-manha e gera briefings/AAAA-MM-DD.md.
#
# Uso manual:   ./scripts/comando-manha.sh
# Agendado (cron, 6h diario, timezone do servidor):
#   0 6 * * *  cd /caminho/para/codex && ./scripts/comando-manha.sh >> briefings/_cron.log 2>&1
#
# Notas de mecanismo (Claude Code atual):
#   - `claude -p` roda em modo nao-interativo (print) e le subagentes de .claude/agents/.
#   - Em cron, nao ha como aprovar permissoes na hora; use --permission-mode acceptEdits
#     (edicoes/arquivos liberados) e tenha os MCPs ja autenticados no ambiente.
#   - Se o ambiente exigir, troque por --dangerously-skip-permissions (somente em maquina
#     confiavel e dedicada a esta operacao).
#   - MODEL pode ser sobrescrito por env: MODEL=claude-opus-4-8 ./scripts/comando-manha.sh

set -euo pipefail
cd "$(dirname "$0")/.."

MODEL="${MODEL:-}"
MODEL_FLAG=()
[ -n "$MODEL" ] && MODEL_FLAG=(--model "$MODEL")

PROMPT='Use o subagente comando-manha para gerar o briefing de hoje. Siga o fluxo definido: puxe a UTMify (7 dias + PIX pendente), rode scripts/margem-real.js e scripts/protecao-pixel.js, e escreva briefings/AAAA-MM-DD.md. Nao viole o Pixel Protection Protocol.'

claude -p "$PROMPT" \
  --permission-mode acceptEdits \
  "${MODEL_FLAG[@]}"

echo "Comando Manha concluido em $(date '+%F %T')."
