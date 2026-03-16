#!/usr/bin/env bash
set -euo pipefail

# Uso: run_plan_once.sh <plan_file> <tasks_count> [--auto-mark]
# Exemplo: bash run_plan_once.sh docs/planos/plano-engenharia.md 1 --auto-mark

PLAN_FILE="${1:-}"
TASKS="${2:-1}"
AUTO_MARK=false
if [[ "${3:-}" == "--auto-mark" ]]; then AUTO_MARK=true; fi

if [[ -z "$PLAN_FILE" ]]; then
  echo "Usage: $0 <plan_file> <tasks_count> [--auto-mark]"
  exit 1
fi

if [[ ! -f "$PLAN_FILE" ]]; then
  echo "Arquivo não encontrado: $PLAN_FILE"
  exit 2
fi

TIMESTAMP="$(date --iso-8601=seconds)"
LOG_DIR="logs/ralph"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/ralph_run_$(basename ${PLAN_FILE//\//_})_$TIMESTAMP.log"
PROGRESS_FILE="progress.txt"

# Prepare snapshots to detect file changes
TMPDIR="$(mktemp -d)"
BEFORE_SNAPSHOT="$TMPDIR/before.sha"
AFTER_SNAPSHOT="$TMPDIR/after.sha"

# If repo git, capture git status before; else use sha1sum snapshot
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git status --porcelain > "$TMPDIR/before.gitstatus"
else
  # snapshot files we care about (src, docs/planos, package.json, etc)
  find src docs -type f -print0 2>/dev/null | xargs -0 sha1sum > "$BEFORE_SNAPSHOT" || true
fi

echo "========================" | tee -a "$LOG_FILE"
echo "Ralph run - $TIMESTAMP" | tee -a "$LOG_FILE"
echo "Plano: $PLAN_FILE | Tarefas solicitadas: $TASKS" | tee -a "$LOG_FILE"
echo "Log: $LOG_FILE" | tee -a "$LOG_FILE"
echo "------------------------" | tee -a "$LOG_FILE"

# Prompt para o Claude/Ralph (em PT-BR). Ajuste se quiser.
CLAUDE_PROMPT=$(cat <<EOF
Ralph, execute somente sobre o arquivo deste repositório: $PLAN_FILE.
NÃO leia outros arquivos do repositório.
Execute as próximas ${TASKS} tarefas marcadas como ❌ (ou X) no arquivo e implemente o que for possível focando em frontend: páginas Next.js, hooks tRPC, stubs de componente, rotas, testes simples e instruções de commit.
Quando concluir cada tarefa, atualize o próprio arquivo $PLAN_FILE substituindo a marca ❌ (ou X) pela frase "✅ certo/finalizado" EXATAMENTE nessa linha, e insira um comentário curto (2-3 linhas) explicando o que foi implementado e os paths dos arquivos criados/modificados.
No final da execução, gere um resumo curto em formato:
- arquivos_criados: [lista caminhos]
- arquivos_alterados: [lista caminhos]
- commit_message_sugerido: "Ralph: progresso - <sub-plano> - lote <n>"
Importante: não altere outros .md além de $PLAN_FILE. Registre tudo também em progress.txt com timestamp.
EOF
)

# Execute Claude (rodar no shell, NÃO dentro do REPL interativo)
# Ajuste --model se necessário (use o modelo que você tem disponível)
CLAUDE_CMD="claude --dangerously-skip-permissions --model claude-opus-4-6 -p"

echo "Executando Claude..."
# chama claude e salva saída
set +e
# Usamos printf para preservar quebras e evitar problemas com variáveis complexas
printf "%s\n" "$CLAUDE_PROMPT" | $CLAUDE_CMD - > "$LOG_FILE".tmp 2>&1
EXIT_CODE=$?
set -e

mv "$LOG_FILE".tmp "$LOG_FILE"
echo "Claude exit code: $EXIT_CODE" | tee -a "$LOG_FILE"

# Append summary to progress file
echo "[$TIMESTAMP] Plano:$PLAN_FILE Tasks:$TASKS Exit:$EXIT_CODE" >> "$PROGRESS_FILE"

# Detect changes (git preferred)
CHANGED_FILES=""
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  # show git status now
  git status --porcelain > "$TMPDIR/after.gitstatus"
  # diff
  CHANGED_FILES=$(comm -13 <(sort "$TMPDIR/before.gitstatus") <(sort "$TMPDIR/after.gitstatus") || true)
  # cleanup formatting
  if [[ -n "$CHANGED_FILES" ]]; then
    echo "Arquivos alterados/novos (git status):" | tee -a "$LOG_FILE"
    echo "$CHANGED_FILES" | tee -a "$LOG_FILE"
  else
    echo "Nenhuma mudança detectada via git status." | tee -a "$LOG_FILE"
  fi
else
  find src docs -type f -print0 2>/dev/null | xargs -0 sha1sum > "$AFTER_SNAPSHOT" || true
  CHANGED_DIFF=$(diff --unchanged-line-format='' --old-line-format='%L' --new-line-format='%L' "$BEFORE_SNAPSHOT" "$AFTER_SNAPSHOT" || true)
  if [[ -n "$CHANGED_DIFF" ]]; then
    echo "Arquivos alterados/novos (snapshot):" | tee -a "$LOG_FILE"
    echo "$CHANGED_DIFF" | tee -a "$LOG_FILE"
    CHANGED_FILES="$CHANGED_DIFF"
  else
    echo "Nenhuma mudança detectada via snapshot." | tee -a "$LOG_FILE"
  fi
fi

# If AUTO_MARK is true, do a local replacement as fallback:
if [[ "$AUTO_MARK" == "true" ]]; then
  echo "AUTO_MARK ativo: verificando e substituindo ❌ / X por '✅ certo/finalizado' no arquivo $PLAN_FILE se encontrado." | tee -a "$LOG_FILE"
  # Patterns comuns: ❌, [X], X (isolado at line start). We will be conservative.
  # 1) replace "❌" -> "✅ certo/finalizado"
  if grep -q "❌" "$PLAN_FILE"; then
    sed -i.bak 's/❌/✅ certo\/finalizado/g' "$PLAN_FILE" && echo "Substituído ❌ -> ✅ certo/finalizado em $PLAN_FILE" | tee -a "$LOG_FILE"
  fi
  # 2) replace " - X " style or "[X]"
  if grep -qE "\[X\]" "$PLAN_FILE" || grep -qE " - X" "$PLAN_FILE"; then
    sed -i.bak -E 's/\[X\]/✅ certo\/finalizado/g; s/ - X/ - ✅ certo\/finalizado/g' "$PLAN_FILE" && echo "Substituído X -> ✅ certo/finalizado em $PLAN_FILE (padrões adicionais)" | tee -a "$LOG_FILE"
  fi
  # remove backup .bak
  rm -f "$PLAN_FILE.bak" || true
fi

# Save a short summary to progress.txt including first 400 chars of Claude output
CLAUDE_SNIPPET="$(head -c 400 "$LOG_FILE" | sed 's/[\r\n]\+/ /g')"
echo "[$TIMESTAMP] $PLAN_FILE exit:$EXIT_CODE changed_files:$(echo "$CHANGED_FILES" | tr '\n' ' ' ) snippet:\"$CLAUDE_SNIPPET\"" >> "$PROGRESS_FILE"

echo "Resumo salvo em $PROGRESS_FILE"
echo "Log completo em $LOG_FILE"

# Cleanup
rm -rf "$TMPDIR"
exit $EXIT_CODE