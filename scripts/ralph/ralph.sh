#!/usr/bin/env bash
set -euo pipefail

# Reta final: 54 itens restantes. Vamos buscar o 100%!
TOTAL_GOAL=55
BATCH_SIZE=5 

NUM_BATCHES=$((TOTAL_GOAL / BATCH_SIZE))

for ((b=1; b<=NUM_BATCHES; b++)); do
  echo "=== Iniciando Lote $b de $NUM_BATCHES (Sessão Limpa) ==="
  
  claude --dangerously-skip-permissions \
    --model claude-opus-4-6 \
    -p "Ralph, estamos na RETA FINAL. Restam apenas 54 itens para completar 100% do projeto.
Sua missão é implementar os próximos $BATCH_SIZE itens sem parar:
1. Localize os próximos ❌ no plano.md (provavelmente NFes, Estoque, Engenharia ou Bulk Data).
2. Implemente Client Sienge + Router tRPC + Zod + Audit Log.
3. Garanta que o TypeScript compile (tsc --noEmit).
4. Atualize plano.md (❌ -> ✅) e progress.txt.
Se o grep não retornar mais nenhum ❌, diga 'PROJETO_CONCLUIDO_100_POR_CENTO' e encerre.
Não peça confirmação. Execute agora."

  echo "=== Lote $b finalizado. Resetando contexto... ==="
  sleep 2
done