#!/usr/bin/env bash
set -euo pipefail

# Número total de iterações que você quer rodar (ex: 50)
TOTAL_ITERATIONS=${1:-50}
BATCH_SIZE=5
NUM_BATCHES=$(( (TOTAL_ITERATIONS + BATCH_SIZE - 1) / BATCH_SIZE ))

for (( batch=1; batch<=NUM_BATCHES; batch++ )); do
  echo "=== Iniciando Lote $batch de $NUM_BATCHES (Frontend - Sessão Limpa) ==="

  claude --dangerously-skip-permissions \
    --model claude-opus-4-6 \
    -p "Ralph, estamos na FASE 3 do projeto Concretiza, focando no frontend.
Sua missão neste lote é implementar as próximas $BATCH_SIZE tarefas do plano.md relacionadas ao frontend, começando pelo módulo de Engenharia/Campo (RDO, Orçamento, Estoque).
Para cada tarefa:
- Crie as páginas e componentes React/Next.js necessários.
- Use os hooks tRPC gerados (api.sienge.xxx).
- Garanta tipagem TypeScript e compilação limpa.
- Atualize o plano.md marcando as tarefas concluídas com ✅.
- Informe um resumo do que foi implementado neste lote, incluindo quantas tarefas e quais módulos foram atendidos.

Não pare para pedir confirmação. Se não houver mais tarefas pendentes, diga 'PROJETO_FRONTEND_CONCLUIDO' e encerre."

  echo "=== Lote $batch finalizado. Resetando contexto para economizar tokens... ==="
  sleep 2
done