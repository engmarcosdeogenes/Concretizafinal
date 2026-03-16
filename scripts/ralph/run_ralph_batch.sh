#!/usr/bin/env bash
set -euo pipefail

# Uso: run_ralph_batch.sh <plan_file> <iterations> <tasks_per_iteration> [--auto-mark]
# Exemplo: bash run_ralph_batch.sh docs/planos/plano-engenharia.md 20 1 --auto-mark

PLAN_FILE="${1:-}"
ITER="${2:-1}"
TASKS="${3:-1}"
AUTO_FLAG="${4:-}"

if [[ -z "$PLAN_FILE" ]]; then
  echo "Usage: $0 <plan_file> <iterations> <tasks_per_iteration> [--auto-mark]"
  exit 1
fi

if [[ ! -f "$PLAN_FILE" ]]; then
  echo "Arquivo não encontrado: $PLAN_FILE"
  exit 2
fi

echo "Iniciando batch: plano=$PLAN_FILE iterações=$ITER tarefas/it=$TASKS auto_mark=$AUTO_FLAG"
for i in $(seq 1 "$ITER"); do
  echo
  echo "=============================="
  echo "$(date --iso-8601=seconds) - Iniciando iteração #$i / $ITER"
  bash "$(dirname "$0")/run_plan_once.sh" "$PLAN_FILE" "$TASKS" "$AUTO_FLAG"
  # pequena pausa entre requisições para evitar bursts
  sleep 2
done

echo "Batch finalizado."