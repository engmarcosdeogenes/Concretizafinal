Skill: sync_frontend_backend

Objetivo:
Analise os arquivos gerados pela ferramenta local:
 - backend_endpoints.txt
 - frontend_usages.txt
 - backend_missing_in_frontend.txt

Tarefas (passo a passo):
1) Leia backend_endpoints.txt e frontend_usages.txt.
2) Liste todas as procedures que existem no backend mas não aparecem no frontend (backend_missing_in_frontend.txt).
3) Para cada procedure faltante, gere uma linha no arquivo plano.md (append) com o seguinte formato:
   - ❌ [sienge].[procedureName] — <categoria> — <breve descrição> — <frontend: arquivo sugerido ou hook sugerido>
   Exemplo:
   - ❌ sienge.listarUnits — Categoria B — Listagem de unidades para páginas de unidades — frontend suggestion: pages/units/index.tsx -> api.sienge.listarUnits.useQuery()

4) Priorize automaticamente (A/B/C) usando heurísticas:
   - Categoria A: finance, invoices, purchase-orders, accounts-receivable, accountancy
   - Categoria B: stock, purchase-requests, building-costs, construction-daily-report
   - Categoria C: admin, reports, bulk-data, internal utilities

5) Se algum nome parecer utilitário interno (ex: contains 'internal', 'helper', 'util'), marque com [REVIEW_INTERNAL] e não adicione sugestão de frontend.

6) Ao final, retorne um resumo em markdown (no chat) contendo:
   - Total backend endpoints (n)
   - Total frontend usages (m)
   - Total missing (k)
   - Top 10 missing por prioridade (com linha curta de 1-2 frases cada)

7) Não modifique outras partes do plano.md. Apenas append a seção com cabeçalho:
   ### Integrações Backend não usadas pelo Frontend (geradas automaticamente — <YYYY-MM-DD HH:mm>)

Regras de estilo:
 - Use linguagem curta, direta e em português.
 - Cada item em plano.md deve ser uma única linha.
 - Se houver sugestões de arquivos, prefira caminhos relativos ao diretório `src/` do frontend.

Arquivos de input (existem na raiz do projeto):
 - backend_endpoints.txt
 - frontend_usages.txt
 - backend_missing_in_frontend.txt

Arquivo de saída:
 - plano.md (append)