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
