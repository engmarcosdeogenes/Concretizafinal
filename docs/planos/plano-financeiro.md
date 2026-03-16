# Plano: Financeiro (Contas a Pagar / Receber / Bancos / IR)

Objetivo:
Implementar as interfaces financeiras essenciais que consomem endpoints Sienge/tRPC.

Itens (FASE 3.1)
1. ✅ certo/finalizado Implementar CRUD de Contas a Pagar
   Rotas: criarContaPagar, listarContasPagar, lancarDespesa, lancarDespesaNf
   <!-- Implementado: rotas tRPC lancarDespesa e lancarDespesaNf no sienge router (com tracking local de lançamento financeiro).
   Página contas-pagar atualizada com modal "Importar NF-e", campo categoria, e botões Lançar Despesa / Importar NF-e.
   Paths: concretiza/src/server/routers/sienge.ts, concretiza/src/app/(dashboard)/financeiro/contas-pagar/page.tsx, concretiza/src/app/(dashboard)/financeiro/contas-pagar/__tests__/page.test.tsx -->

2. ✅ certo/finalizado Implementar Gestão de Bills — detalhes, parcelas, impostos, anexos, categorias
   Rotas: buscarBill, atualizarBill, listarParcelasBill, atualizarParcelaBill, listarImpostosBill, listarAnexosBill, downloadAnexoBill, uploadAnexoBill, criarTaxInformation*, listarBudgetCategoriesBill, listarDepartmentsCostBill, listarBuildingsCostBill, atualizarBuildingsCostBill, listarUnitsBill, atualizarUnitsBill, criarBillFromNFe, listarBillsByChangeDate
   <!-- Implementado: Página de listagem de Bills com filtro por período, busca, paginação e drawer de detalhes.
   Drawer exibe: resumo do bill, abas para parcelas, impostos, anexos (com upload), categorias, obras e unidades — todos consumindo rotas tRPC já existentes.
   Paths: concretiza/src/app/(dashboard)/financeiro/bills/page.tsx, concretiza/src/app/(dashboard)/financeiro/bills/BillDetailDrawer.tsx, concretiza/src/app/(dashboard)/financeiro/bills/__tests__/page.test.tsx -->

3. ✅ certo/finalizado Implementar Contas a Receber — parcelas, vencimentos, categorias
   Rotas: listarContasReceber, buscarReceivableBill, listarParcReceivableBill, alterarVencimentoReceivableBill, listarBudgetCategoriesReceivable
   <!-- Implementado: ReceivableDetailDrawer com abas Parcelas (com edição de vencimento inline) e Categorias, consumindo rotas tRPC existentes.
   Página recebimentos atualizada para abrir drawer ao clicar em uma conta. Teste unitário criado.
   Paths: concretiza/src/app/(dashboard)/financeiro/recebimentos/ReceivableDetailDrawer.tsx, concretiza/src/app/(dashboard)/financeiro/recebimentos/page.tsx, concretiza/src/app/(dashboard)/financeiro/recebimentos/__tests__/page.test.tsx -->

4. ✅ certo/finalizado Implementar Tela de Pagamentos e Info Bancária
   Rotas: buscarPaymentInfo, atualizarPaymentInfo
   <!-- Implementado: Página de consulta e edição de informações de pagamento por parcela de título.
   Formulário de busca por billId + installmentId + tipo (PIX, boleto, transferência, tributos). Exibe campos editáveis e salva via tRPC mutation.
   Paths: concretiza/src/app/(dashboard)/financeiro/pagamentos/page.tsx, concretiza/src/app/(dashboard)/financeiro/pagamentos/__tests__/page.test.tsx -->

5. ✅ certo/finalizado Implementar Envio de Boletos, Extratos e Informes IR por Email/PDF
   Rotas: enviarBoleto2Via, enviarExtratoClienteEmail, enviarInformeIREmail, enviarSaldoDevedorEmail, getExtratoPdfUrl, getInformeIRPdfUrl, obterSaldoDevedor, listarExtratoCliente
   <!-- Implementado: Página "Documentos Financeiros" com 3 abas: Extrato do Cliente (consulta + download PDF + envio email), Informe de IR (gerar PDF + envio email), Saldo Devedor (consulta + envio email). Consome todas as 8 rotas tRPC listadas. Boletos 2ª via já existia em /financeiro/boletos. Teste unitário criado.
   Paths: concretiza/src/app/(dashboard)/financeiro/documentos/page.tsx, concretiza/src/app/(dashboard)/financeiro/documentos/__tests__/page.test.tsx -->

6. ✅ certo/finalizado Implementar Dashboard de Inadimplência e Saldos
   Rotas: listarInadimplentes, listarSaldos, listarBulkDefaulters
   <!-- Implementado: Dashboard com 3 abas — Resumo & Saldos (KPIs + tabela de saldos bancários), Inadimplentes (lista expansível com títulos por cliente), Detalhamento Bulk (consulta filtrada por empresa/obra). Consome as 3 rotas tRPC: listarSaldos, listarInadimplentes, listarBulkDefaulters. Teste unitário com 7 cenários.
   Paths: concretiza/src/app/(dashboard)/financeiro/inadimplencia/page.tsx, concretiza/src/app/(dashboard)/financeiro/inadimplencia/__tests__/page.test.tsx -->

7. ✅ certo/finalizado Implementar Relatórios Financeiros Bulk
   Rotas: listarBulkAccountBalances, listarBulkBankMovements, listarBulkBillPayablesInstallments, listarBulkReceivableInstallments, listarBulkCustomerExtractHistory, listarBulkInvoiceItens
   <!-- Implementado: Página com 6 abas — Saldos Contábeis, Movimentos Bancários, Parcelas a Pagar, Parcelas a Receber, Extrato de Clientes (com filtro customerId), Itens de NF. Cada aba consome a respectiva rota tRPC bulk com filtros de empresa/período. Tabela dinâmica renderiza qualquer schema retornado. Exportação CSV incluída. 6 testes unitários.
   Paths: concretiza/src/app/(dashboard)/financeiro/relatorios-bulk/page.tsx, concretiza/src/app/(dashboard)/financeiro/relatorios-bulk/__tests__/page.test.tsx -->

Execução
- Começar por: listagem de Bills (tabela), detalhe do Bill (parcelas + anexos), criar/atualizar Bill.
- UI: componente Table + DetailDrawer + UploadFile + Confirmation modal.
- Prioridade: evitar leituras massivas; usar paginação e endpoints bulk apenas para exports.
