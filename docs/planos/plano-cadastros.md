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
