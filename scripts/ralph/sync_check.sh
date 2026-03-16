#!/usr/bin/env bash
# scripts/prepare_and_run_claude_sync.sh
# Executar dentro do devcontainer (onde o claude CLI e node estão disponíveis)

set -euo pipefail

echo "[1/3] Gerando listas de backend/frontend..."
node tools/extract_routes_and_usages.js

echo "[2/3] Arquivos gerados:"
ls -l backend_endpoints.txt frontend_usages.txt backend_missing_in_frontend.txt frontend_only_endpoints.txt || true

echo "[3/3] Agora o Claude precisa comparar e atualizar o plano.md."
echo "Use o comando CLAUDE abaixo (ajuste --model se necessário)."
echo
echo "EXEMPLO (cole como uma linha única):"
echo
echo 'claude --dangerously-skip-permissions --model claude-opus-4-6 -p "'"$(cat <<'PROMPT'
Por favor, faça o seguinte usando os arquivos no diretório do projeto:
- backend_endpoints.txt (lista de procedures tRPC implementadas no backend)
- frontend_usages.txt (lista de procedures consumidas no frontend)
- backend_missing_in_frontend.txt (lista de procedures backend não usadas no frontend)

Tarefas:
1) Leia backend_missing_in_frontend.txt e gere uma seção no plano.md chamada "Integrações Backend não usadas pelo Frontend (geradas automaticamente)". Para cada procedure faltante:
   - Adicione uma linha no formato:
     - ❌ [router].[procedureName] — descrição curta (ex: "Compra: endpoints de cotações") — arquivo sugerido no frontend: candidates (ex: pages/purchase/xyz)
2) Priorize as rotas por critialidade:
   - Categoria A (Alta): finance/accounting/payment / purchase-orders / invoices
   - Categoria B (Média): stock / purchase-requests / building-costs
   - Categoria C (Baixa): admin, reports, bulk-data
3) Se backend_endpoints.txt tem procedimentos que parecem ser apenas utilitários (ex: internal helpers que não deveriam ser expostos), marque-os com [REVIEW_INTERNAL].
4) No fim, gere um resumo em formato markdown com:
   - total backend endpoints
   - total frontend usages
   - total missing -> list count
   - recomendações para alteração no frontend (arquivo e hook sugerido)
5) Não modifique nada além de adicionar a seção no final do plano.md (append). Use linguagem objetiva, uma linha por item.
PROMPT
)'"'

# Observação: cole a linha acima no seu terminal (ou rode manualmente uma versão adaptada).