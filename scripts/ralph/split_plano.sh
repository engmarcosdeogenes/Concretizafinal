#!/usr/bin/env bash
set -euo pipefail

# Roda a partir da raiz do workspace: /workspaces/ProjetoConcretiza
ROOT_DIR="$(pwd)"
PLANS_DIR="$ROOT_DIR/docs/planos"

echo "Criando pasta de planos em: $PLANS_DIR"
mkdir -p "$PLANS_DIR"

cat > "$PLANS_DIR/plano-core.md" <<'MD'
# Concretiza — Plano (core / índice)

Visão do Produto
SaaS de gestão de obra e diário de obra (RDO) para construtoras, engenheiros, mestres e encarregados. PWA (mobile-first), bonito, simples, com IA (fase 2).

Legenda
- ✅ COMPLETO — funcional, lógica real, UI pronta
- ❌ NÃO INICIADO — intencionalmente pendente (Deploy / IA fase 2)

Resumo técnico & Status
- Next.js 15 + TypeScript — ✅
- Tailwind + shadcn/ui — ✅
- tRPC v11 — ✅
- Supabase + Prisma — ✅
- Auth (Supabase) — ✅
- IA (Claude) — integrado (Fase 2)
- Backend (routers tRPC) — ✅ (implementado)
- Frontend (FASE 3) — subdividido em micro-planos (veja links abaixo)

Índice — Sub-Planos (FASE 3)
- Engenharia / Campo (RDO, Orçamento, Estoque): plano-engenharia.md
- Financeiro (CP/CR, Boletos, Balancete): plano-financeiro.md
- Comercial (Contratos, Unidades, Comissões): plano-comercial.md
- Cadastros (Clientes, Credores, Empresas): plano-cadastros.md
- Suprimentos (Solicitações, Cotações, Pedidos, NF-e): plano-suprimentos.md
- Contabilidade (Lançamentos, Balancete): plano-contabilidade.md
- Administração & Perfil (Usuários, Permissões, Mídia): plano-admin.md
- Templates & Formulários: plano-templates.md
- Integrações & Webhooks: plano-integracoes.md
- Rotas Genéricas / Transversais: plano-transversais.md

Observações
- Cada sub-plano contém os itens (❌) que o Ralph deve consumir e atualizar com ✅.
- Use estes arquivos como input direto para prompts menores e lotes.
MD

cat > "$PLANS_DIR/plano-engenharia.md" <<'MD'
# Plano: Engenharia / Campo (RDO, Orçamento, Estoque)

Objetivo:
Transformar as rotas do backend relacionadas à engenharia e ao canteiro em telas e componentes Next.js (listagens, criação, edição, detalhes, uploads, PDFs).

Itens (FASE 3.5)
1. ❌ Implementar Dashboard de Diário de Obra/RDO — equipes, equipamentos, ocorrências, tarefas, semana, histograma  
   Rotas principais: buscarDiarioObra, deletarDiarioObra, listarRdosPorObra, listarTiposDiarioObra, listarTiposOcorrenciaDiarioObra, atualizarEquipamentosDiarioObra, incluirEquipamentosDiarioObra, atualizarEquipesDiarioObra, incluirEquipesDiarioObra, atualizarOcorrenciasDiarioObra, incluirOcorrenciasDiarioObra, atualizarTarefasDiarioObra, incluirTarefasDiarioObra, buscarSemana, histogramaMO

2. ❌ Implementar Predefinições de Equipes e Equipamentos  
   Rotas: salvarEquipamentosPredef, salvarEquipePredef

3. ❌ Implementar Gestão de Orçamento — planilhas, insumos, budget  
   Rotas: listarOrcamento, listarPlanilhasOrcamento, adicionarInsumoOrcamento, atualizarInsumoOrcamento, buscarInsumoOrcamento, listarBulkBudgetItems, listarBulkBusinessBudgets, listarBulkBuildingResources

4. ❌ Implementar Gestão de Estoque e Inventário — saldos, movimentações, apropriações, transferências  
   Rotas: listarEstoque, saldoPorMaterial, transferirEstoque, listarMovimentacoesInventario, buscarMovimentacaoInventario, listarApropriacoesInventario, lancarMovimentacao, listarPendentesParaTransferencia

5. ❌ Implementar Gestão de Obras e Importação  
   Rotas: listarObras, importarObras, listarPorObra

6. ❌ Implementar Planejamento — Tarefas e Materiais  
   Rotas: listarTarefas, inserirTarefasPlanilha, salvarMateriais

Notas de execução
- Prioridade inicial sugerida: 1) Listagem RDO + detalhe (galeria + fotos) 2) Criar/Editar RDO 3) Uploads e PDFs.
- Para cada item: criar página em `src/app/obras/[id]/rdo` ou `src/pages/obras/[id]/rdo` conforme seu router, usar hooks tRPC `api.rdo.*`, garantir `tsc --noEmit` OK.
MD

cat > "$PLANS_DIR/plano-financeiro.md" <<'MD'
# Plano: Financeiro (Contas a Pagar / Receber / Bancos / IR)

Objetivo:
Implementar as interfaces financeiras essenciais que consomem endpoints Sienge/tRPC.

Itens (FASE 3.1)
1. ❌ Implementar CRUD de Contas a Pagar  
   Rotas: criarContaPagar, listarContasPagar, lancarDespesa, lancarDespesaNf

2. ❌ Implementar Gestão de Bills — detalhes, parcelas, impostos, anexos, categorias  
   Rotas: buscarBill, atualizarBill, listarParcelasBill, atualizarParcelaBill, listarImpostosBill, listarAnexosBill, downloadAnexoBill, uploadAnexoBill, criarTaxInformation*, listarBudgetCategoriesBill, listarDepartmentsCostBill, listarBuildingsCostBill, atualizarBuildingsCostBill, listarUnitsBill, atualizarUnitsBill, criarBillFromNFe, listarBillsByChangeDate

3. ❌ Implementar Contas a Receber — parcelas, vencimentos, categorias  
   Rotas: listarContasReceber, buscarReceivableBill, listarParcReceivableBill, alterarVencimentoReceivableBill, listarBudgetCategoriesReceivable

4. ❌ Implementar Tela de Pagamentos e Info Bancária  
   Rotas: buscarPaymentInfo, atualizarPaymentInfo

5. ❌ Implementar Envio de Boletos, Extratos e Informes IR por Email/PDF  
   Rotas: enviarBoleto2Via, enviarExtratoClienteEmail, enviarInformeIREmail, enviarSaldoDevedorEmail, getExtratoPdfUrl, getInformeIRPdfUrl, obterSaldoDevedor, listarExtratoCliente

6. ❌ Implementar Dashboard de Inadimplência e Saldos  
   Rotas: listarInadimplentes, listarSaldos, listarBulkDefaulters

7. ❌ Implementar Relatórios Financeiros Bulk  
   Rotas: listarBulkAccountBalances, listarBulkBankMovements, listarBulkBillPayablesInstallments, listarBulkReceivableInstallments, listarBulkCustomerExtractHistory, listarBulkInvoiceItens

Execução
- Começar por: listagem de Bills (tabela), detalhe do Bill (parcelas + anexos), criar/atualizar Bill.
- UI: componente Table + DetailDrawer + UploadFile + Confirmation modal.
- Prioridade: evitar leituras massivas; usar paginação e endpoints bulk apenas para exports.
MD

cat > "$PLANS_DIR/plano-comercial.md" <<'MD'
# Plano: Comercial (Contratos de Venda, Unidades, Reservas, Comissões)

Objetivo:
Implementar telas comerciais que suportam vendas, mapa imobiliário, contratos, reservas e comissões.

Itens (FASE 3.2)
1. ❌ Implementar CRUD de Contratos de Venda com anexos  
   Rotas: criarContratoVenda, atualizarContratoVenda, buscarContratoVenda, cancelarContratoVenda, excluirContratoVenda, listarContratosVenda, listarAnexosContratoVenda, downloadAnexoContratoVenda, uploadAnexoContratoVenda, listarBulkSalesContracts

2. ❌ Implementar Gestão de Avalistas de Contrato  
   Rotas: adicionarAvalistaContratoVenda, atualizarAvalistaContratoVenda, buscarAvalistaContratoVenda, listarAvalistasContratoVenda, atualizarTelefonesAvalistaContratoVenda

3. ❌ Implementar CRUD de Unidades Imobiliárias — endereço, características, filhas  
   Rotas: criarUnidade, atualizarUnidade, buscarUnidade, atualizarEnderecoUnidade, buscarAgrupamentosUnidade, criarCaracteristicaUnidade, listarCaracteristicasUnidade, vincularCaracteristicasUnidade, criarSituacaoUnidade, listarSituacoesUnidade, adicionarUnidadeFilha, uploadAnexoUnidade

4. ❌ Implementar Gestão de Reservas de Unidades  
   Rotas: criarReservaUnidade, inativarReservaUnidade, listarReservas, atenderReserva, listarItensReservaEstoque

5. ❌ Implementar Mapa Imobiliário e Entrega de Chaves  
   Rotas: listarMapaImobiliario, listarEntregaChaves

6. ❌ Implementar CRUD de Comissões — autorização, liberação, cancelamento  
   Rotas: criarComissao, atualizarComissao, buscarComissao, excluirComissao, listarComissoes, autorizarComissoes, cancelarComissoes, liberarComissoes, comissoesCountFilters

7. ❌ Implementar Gestão de Corretores e Config de Comissão  
   Rotas: adicionarCorretorComissao, removerCorretorComissao, criarConfigCorretorComissao, atualizarConfigCorretorComissao, excluirConfigCorretorComissao, listarConfigCorretoresComissao, criarConfigEmpreendimentoComissao, atualizarConfigEmpreendimentoComissao, buscarConfigEmpreendimentoComissao

Execução
- Prioridade sugerida: Mapa Imobiliário (visual) + Contratos (detalhe/anexos) → depois reservas e comissões.
- Padrão de rotas: pages em `/src/app/comercial/...` ou `src/pages/comercial/...`.
MD

cat > "$PLANS_DIR/plano-cadastros.md" <<'MD'
# Plano: Cadastros (Clientes, Credores, Empresas)

Objetivo:
Cobrir os cadastros essenciais do negócio com CRUDs completos e anexos.

Itens (FASE 3.3)
1. ❌ Implementar CRUD Completo de Clientes — cônjuge, endereço, renda, telefones, procurador, anexos  
   Rotas: criarCliente, atualizarCliente, buscarClientePorId, buscarClienteSiengePorId, listarClientes, atualizarConjugeCliente, atualizarEnderecoCliente, atualizarRendaFamiliarCliente, sobrescreverTelefonesCliente, criarProcuradorCliente, listarAnexosCliente, downloadAnexoCliente, uploadAnexoCliente

2. ❌ Implementar CRUD Completo de Credores/Fornecedores — contato, dados bancários, PIX, procuradores, representantes  
   Rotas: buscarCreditorPorId, atualizarContatoCredor, atualizarDesoneracaoFolhaCredor, atualizarProcuradorCredor, atualizarRepresentantesCredor, inserirContaBancariaCredor, atualizarContaBancariaCredor, listarDadosBancariosCredor, inserirPixCredor, atualizarPixCredor, atualizarTelefoneCredor, toggleAtivoCreditor, buscarDadosBancariosPorCnpj

3. ❌ Implementar Gestão de Empresas (atualizarEmpresa, buscarEmpresa, listarEmpresas)

Execução
- Comece por: tela de detalhe do cliente + upload/anexos.
- Garantir: validação Zod de formulários e UX para documentos grandes (70MB).
MD

cat > "$PLANS_DIR/plano-suprimentos.md" <<'MD'
# Plano: Suprimentos (Solicitações, Cotações, Pedidos, NF-e)

Objetivo:
Implementar o fluxo de compras completo: solicitações → cotações → pedidos → NF-e → integração Sienge.

Itens (FASE 3.4)
1. ❌ Implementar Gestão de Solicitações de Compra — itens, autorização, reprovação, apropriações, anexos  
   Rotas: buscarSolicitacao, listarSolicitacoesPorObra, autorizarSolicitacao, reprovarSolicitacao, autorizarItemSolicitacao, autorizarItensSolicitacao, reprovarItemSolicitacao, criarItensSolicitacao, listarTodosItensSolicitacao, listarApropriacoesSolicitacaoItem, listarRequisitosEntregaSolicitacaoItem, listarAnexosSolicitacao, downloadAnexoSolicitacao

2. ❌ Implementar Gestão de Cotações — itens, fornecedores, negociações, autorização  
   Rotas: criarCotacao, listarCotacoes, criarItemCotacao, criarItemCotacaoFromSolicitacao, incluirFornecedorItemCotacao, criarNegociacaoCotacao, atualizarNegociacaoCotacao, atualizarItemNegociacaoCotacao, autorizarNegociacaoCotacao, listarNegociacoesCotacao, listarBulkPurchaseQuotations

3. ❌ Implementar Gestão de Pedidos de Compra — itens, autorização, reprovação, entregas, anexos, totais  
   Rotas: buscarPedido, listarPedidosPorObra, buscarItemPedido, listarItensPedido, buscarTotalizacaoPedido, autorizarPedido, reprovarPedido, reprovarPedidoComObs, buscarDirectBillingPedido, listarDeliverySchedulesPedido, criarEntregasPedidoNfCompra, listarEntregasAtendidasNfCompra, listarAnexosPedido, downloadAnexoPedido, uploadAnexoPedido, pedidosSienge, listarBuildingsAppropriationsPedidoItem

4. ❌ Implementar Visualizador de NF-e Completo — detalhes, tributos, transportadoras, pagamentos  
   Rotas: listarNFe, buscarNFeDetalhe, buscarNFeCarriers, buscarNFeDeliveries, buscarNFeIcms, buscarNFeIssqn, buscarNFeIssuersRecipients, buscarNFeItemIcms, buscarNFeItemIpi, buscarNFeItemIssqn, buscarNFeItemPisCofins, buscarNFeItemSimplifiedIcms, buscarNFeLinkedNfes, buscarNFePayments, listarBuildingsAppropriationsNfItem

5. ❌ Implementar Purchase Invoice e Nota Fiscal (cadastrar, listar itens, salvarNotaFiscal)  
   Rotas: buscarPurchaseInvoice, cadastrarPurchaseInvoice, listarItensPurchaseInvoice, salvarNotaFiscal

6. ❌ Implementar Importação de Fornecedores  
   Rotas: importarFornecedores

Execução
- Prioridade: Cotações (UI para criar/registar respostas) e Visualizador de NF-e (detalhe fiscal).
- Use paginação e lazy-loading para tabelas grandes (bulk).
MD

cat > "$PLANS_DIR/plano-contabilidade.md" <<'MD'
# Plano: Contabilidade (Lançamentos e Balancete)

Objetivo:
Criar telas e jobs para integração contábil (lançamentos, batch async, balancete e plano de contas).

Itens (FASE 3.7)
1. ❌ Implementar Lançamentos Contábeis — CRUD e processamento async  
   Rotas: listarLancamentosContabeis, salvarLancamentosContabeis, salvarLancamentosContabeisAsync, statusLancamentosContabeisAsync, criarLoteContabil

2. ❌ Implementar Balancete e Plano de Contas  
   Rotas: listarBalancete, buscarPlanosContas, salvarPlanosContas

Execução
- Implementar import/preview de lote contábil e monitor de status async.
- UI: upload CSV/Excel → preview → enviar → mostrar status (polling ou webhook).
MD

cat > "$PLANS_DIR/plano-admin.md" <<'MD'
# Plano: Administração / Usuários / Perfil / Mídia

Objetivo:
Controles administrativos e gestão de usuários/perfis/permissões.

Itens (FASE 3.9)
1. ❌ Implementar Gestão de Usuários e Permissões  
   Rotas: listarUsuarios, removerUsuario, atualizarPermissoes, atualizarRole

2. ❌ Implementar Tela de Perfil do Usuário  
   Rotas: buscarPerfil, atualizarPerfil, me, buscarToken

3. ❌ Implementar Galeria de Mídias (upload/listagem)  
   Rotas: galeria, midia.upload, midia.listar

Execução
- Páginas em `/configuracoes/usuarios`, `/configuracoes/minha-conta`, `/midia/galeria`.
- Garantir RBAC visual conforme roles.
MD

cat > "$PLANS_DIR/plano-templates.md" <<'MD'
# Plano: Templates, Formulários e Avaliações

Objetivo:
Gerenciar templates reutilizáveis, respostas e avaliações de fornecedores.

Itens (FASE 3.10)
1. ❌ Implementar CRUD de Templates com duplicação  
   Rotas: criarTemplate, atualizarTemplate, buscarTemplate, excluirTemplate, listarTemplates, duplicar

2. ❌ Implementar Sistema de Respostas/Formulários  
   Rotas: criarResposta, buscarResposta, excluirResposta, finalizarResposta, listarRespostas

3. ❌ Implementar Campos Personalizados e Configuração  
   Rotas: buscarCamposPersonalizados, salvarCamposPersonalizados, buscarConfig, salvarConfig

4. ❌ Implementar Avaliação de Fornecedores  
   Rotas: salvarAvaliacao, listarCriteriosAvaliacao

5. ❌ Implementar Assinaturas Digitais  
   Rotas: salvarAssinaturas

Execução
- Componentes reutilizáveis: TemplateEditor, FormRenderer, SignatureCanvas.
MD

cat > "$PLANS_DIR/plano-integracoes.md" <<'MD'
# Plano: Integrações, Webhooks e Sincronização

Objetivo:
Painéis e utilitários para configurar conexões Sienge e monitorar operações async.

Itens (FASE 3.11)
1. ❌ Implementar Painel de Webhooks — registro, status, remoção  
   Rotas: buscarWebhook, buscarStatusWebhook, registrarWebhook, removerWebhook

2. ❌ Implementar Painel de Sincronizações e Conexão Sienge  
   Rotas: listarSyncs, testarConexao, incluirAnexoSienge, downloadAnexoSienge

3. ❌ Implementar Monitor de Operações Bulk Async  
   Rotas: consultarBulkAsyncResult, consultarBulkAsyncStatus

Execução
- UI: tela em `/configuracoes/integracoes` com logs, botões de reexecução e indicadores de saúde.
MD

cat > "$PLANS_DIR/plano-transversais.md" <<'MD'
# Plano: Rotas Genéricas e Transversais

Objetivo:
Implementar telas utilitárias que aparecem em múltiplos lugares (CRUD genérico, aprovações, resumos).

Itens (FASE 3.12)
1. ❌ Implementar Actions Genéricas de CRUD  
   Rotas: buscar, listar, criar, excluir, enviar, limpar, salvar, atualizar, verificar, revogar

2. ❌ Implementar Aprovação/Reprovação Genérica de Itens  
   Rotas: aprovarItem, aprovarItens, atualizarItem, atualizarStatus, atualizarPosicao

3. ❌ Implementar Dashboard Resumo Geral  
   Rotas: resumo, resumoGeral

4. ❌ Implementar Listagem por Entidade e Contratos  
   Rotas: listarPorEntidade, listarContratos, registrarVisualizacao

Execução
- Estes itens servem como componentes cross-cutting (ConfirmModal, BulkActions, AuditLog viewer).
MD

echo "Arquivos criados em: $PLANS_DIR"
echo "Próximo passo sugerido:"
echo "1) Revisar os arquivos em docs/planos/"
echo "2) Rodar lotes menores no Ralph referenciando apenas um desses arquivos por vez."
echo
echo "Exemplo: para rodar Ralph só com o plano de engenharia:"
echo "claude --dangerously-skip-permissions --model claude-opus-4-6 -p \"Ralph, leia docs/planos/plano-engenharia.md e implemente as tarefas listadas...\""

echo "Feito."