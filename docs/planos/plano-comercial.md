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
