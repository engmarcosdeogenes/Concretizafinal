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
