import { createTRPCRouter } from "../trpc"
import { obraRouter } from "./obra"
import { conviteRouter } from "./convite"
import { rdoRouter } from "./rdo"
import { fvsRouter } from "./fvs"
import { fvmRouter } from "./fvm"
import { ocorrenciaRouter } from "./ocorrencia"
import { fornecedorRouter } from "./fornecedor"
import { materialRouter } from "./material"
import { equipamentoRouter } from "./equipamento"
import { solicitacaoRouter } from "./solicitacao"
import { pedidoRouter } from "./pedido"
import { equipeRouter } from "./equipe"
import { movimentacaoRouter } from "./movimentacao"
import { documentoRouter } from "./documento"
import { painelRouter } from "./painel"
import { financeiroRouter } from "./financeiro"
import { analisesRouter } from "./analises"
import { configuracoesRouter } from "./configuracoes"
import { chatRouter } from "./chat"

export const appRouter = createTRPCRouter({
  obra:           obraRouter,
  convite:        conviteRouter,
  rdo:            rdoRouter,
  fvs:            fvsRouter,
  fvm:            fvmRouter,
  ocorrencia:     ocorrenciaRouter,
  fornecedor:     fornecedorRouter,
  material:       materialRouter,
  equipamento:    equipamentoRouter,
  solicitacao:    solicitacaoRouter,
  pedido:         pedidoRouter,
  equipe:         equipeRouter,
  movimentacao:   movimentacaoRouter,
  documento:      documentoRouter,
  painel:         painelRouter,
  financeiro:     financeiroRouter,
  analises:       analisesRouter,
  configuracoes:  configuracoesRouter,
  chat:           chatRouter,
})

export type AppRouter = typeof appRouter
