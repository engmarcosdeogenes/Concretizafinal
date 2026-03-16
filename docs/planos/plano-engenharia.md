# Plano: Engenharia / Campo (RDO, Orçamento, Estoque)

Objetivo:
Transformar as rotas do backend relacionadas à engenharia e ao canteiro em telas e componentes Next.js (listagens, criação, edição, detalhes, uploads, PDFs).

Itens (FASE 3.5)
1. ✅ certo/finalizado Implementar Dashboard de Diário de Obra/RDO — equipes, equipamentos, ocorrências, tarefas, semana, histograma
   Rotas principais: buscarDiarioObra, deletarDiarioObra, listarRdosPorObra, listarTiposDiarioObra, listarTiposOcorrenciaDiarioObra, atualizarEquipamentosDiarioObra, incluirEquipamentosDiarioObra, atualizarEquipesDiarioObra, incluirEquipesDiarioObra, atualizarOcorrenciasDiarioObra, incluirOcorrenciasDiarioObra, atualizarTarefasDiarioObra, incluirTarefasDiarioObra, buscarSemana, histogramaMO
   <!-- Implementado: Dashboard RDO com visão semanal (rdo.buscarSemana), histograma MO por função e por mês (analises.histogramaMO), seções Sienge (tiposDiarioObra, tiposOcorrenciaDiarioObra). Hook useHistogramaMO criado. Botão Dashboard adicionado à listagem.
   Arquivos: src/app/(dashboard)/obras/[id]/rdo/dashboard/page.tsx, src/hooks/useHistogramaMO.ts, src/app/(dashboard)/obras/[id]/rdo/page.tsx (modificado) -->

2. ✅ certo/finalizado Implementar Predefinições de Equipes e Equipamentos
   Rotas: salvarEquipamentosPredef, salvarEquipePredef
   <!-- Implementado: Página de predefinições com seletor de obra, tabelas editáveis para equipe (função+quantidade) e equipamentos (nome+quantidade), salvar via tRPC obra.salvarEquipePredef / obra.salvarEquipamentosPredef. Integrado também em RDO novo (carregar/salvar predef) e configurações da obra.
   Arquivos: concretiza/src/app/(dashboard)/enterprise/engenharia/predefinicoes/page.tsx, concretiza/src/server/routers/obra.ts (salvarEquipePredef, salvarEquipamentosPredef), concretiza/src/app/(dashboard)/obras/[id]/rdo/novo/page.tsx, concretiza/src/app/(dashboard)/obras/[id]/configuracoes/page.tsx -->

3. ✅ certo/finalizado Implementar Gestão de Orçamento — planilhas, insumos, budget
   Rotas: listarOrcamento, listarPlanilhasOrcamento, adicionarInsumoOrcamento, atualizarInsumoOrcamento, buscarInsumoOrcamento, listarBulkBudgetItems, listarBulkBusinessBudgets, listarBulkBuildingResources
   <!-- Implementado: Página de planilhas com seletor de estimativa (listarPlanilhasOrcamento), página de insumos com CRUD (adicionarInsumoOrcamento, atualizarInsumoOrcamento, buscarInsumoOrcamento), página budget bulk com abas para itens/budgets/recursos (listarBulkBudgetItems, listarBulkBusinessBudgets, listarBulkBuildingResources). Hook useOrcamento centralizado. Links de navegação no page principal.
   Arquivos: concretiza/src/hooks/useOrcamento.ts, concretiza/src/app/(dashboard)/obras/[id]/orcamento/planilhas/page.tsx, concretiza/src/app/(dashboard)/obras/[id]/orcamento/insumos/page.tsx, concretiza/src/app/(dashboard)/obras/[id]/orcamento/budget/page.tsx, concretiza/src/app/(dashboard)/obras/[id]/orcamento/page.tsx (modificado), concretiza/src/__tests__/hooks/useOrcamento.test.ts -->

4. ✅ certo/finalizado Implementar Gestão de Estoque e Inventário — saldos, movimentações, apropriações, transferências
   Rotas: listarEstoque, saldoPorMaterial, transferirEstoque, listarMovimentacoesInventario, buscarMovimentacaoInventario, listarApropriacoesInventario, lancarMovimentacao, listarPendentesParaTransferencia
   <!-- Implementado: Hook useEstoque centralizado com 7 hooks (useEstoque, useSaldoPorMaterial, useMovimentacoesInventario, useBuscarMovimentacaoInventario, useApropriacoesInventario, useTransferirEstoque, useLancarMovimentacao). Página de Inventário com abas Movimentações e Apropriações. Página de Saldos por Material com tabela e indicadores de status. Links de navegação adicionados à página principal do almoxarifado.
   Arquivos: concretiza/src/hooks/useEstoque.ts, concretiza/src/app/(dashboard)/obras/[id]/almoxarifado/inventario/page.tsx, concretiza/src/app/(dashboard)/obras/[id]/almoxarifado/saldos/page.tsx, concretiza/src/app/(dashboard)/obras/[id]/almoxarifado/page.tsx (modificado), concretiza/src/__tests__/hooks/useEstoque.test.ts -->

5. ✅ certo/finalizado Implementar Gestão de Obras e Importação
   Rotas: listarObras, importarObras, listarPorObra
   <!-- Implementado: Hook centralizado useObrasGestao com 3 hooks (useObrasListar, useImportarObras, useHistoricoObra). Página de Histórico/Audit Log por obra. Página enterprise/engenharia/obras refatorada para usar hook centralizado e link para histórico adicionado. Teste de estrutura criado.
   Arquivos: concretiza/src/hooks/useObrasGestao.ts, concretiza/src/app/(dashboard)/obras/[id]/historico/page.tsx, concretiza/src/app/(dashboard)/enterprise/engenharia/obras/page.tsx (modificado), concretiza/src/__tests__/hooks/useObrasGestao.test.ts -->

6. ✅ certo/finalizado Implementar Planejamento — Tarefas e Materiais
   Rotas: listarTarefas, inserirTarefasPlanilha, salvarMateriais
   <!-- Implementado: Hook centralizado usePlanejamento com 4 hooks (useTarefasSienge, useInserirTarefasPlanilha, useSalvarMateriaisRdo, useTarefasObra). Página de Planejamento com abas Tarefas WBS (internas) e Tarefas Sienge (integração), KPIs consolidados, links para Gerenciar Tarefas e Materiais. Teste de estrutura criado.
   Arquivos: concretiza/src/hooks/usePlanejamento.ts, concretiza/src/app/(dashboard)/obras/[id]/planejamento/page.tsx, concretiza/src/__tests__/hooks/usePlanejamento.test.ts -->

Notas de execução
- Prioridade inicial sugerida: 1) Listagem RDO + detalhe (galeria + fotos) 2) Criar/Editar RDO 3) Uploads e PDFs.
- Para cada item: criar página em `src/app/obras/[id]/rdo` ou `src/pages/obras/[id]/rdo` conforme seu router, usar hooks tRPC `api.rdo.*`, garantir `tsc --noEmit` OK.
