import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { decrypt, isEncrypted } from "@/lib/encrypt"
import { criarSolicitacaoSienge } from "@/lib/sienge/client"

const StatusSolicitacao = z.enum(["RASCUNHO", "PENDENTE", "APROVADA", "REJEITADA", "CANCELADA"])

export const solicitacaoRouter = createTRPCRouter({

  listar: protectedProcedure
    .input(z.object({ obraId: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const { empresaId } = ctx.session
      return ctx.db.solicitacaoCompra.findMany({
        where: {
          obra: { empresaId },
          ...(input?.obraId ? { obraId: input.obraId } : {}),
        },
        orderBy: [{ urgencia: "desc" }, { createdAt: "desc" }],
        include: {
          obra:        { select: { id: true, nome: true } },
          solicitante: { select: { id: true, nome: true } },
          itens: {
            include: { material: { select: { id: true, nome: true, unidade: true } } },
          },
        },
      })
    }),

  buscarPorId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const sol = await ctx.db.solicitacaoCompra.findUnique({
        where: { id: input.id },
        include: {
          obra:        { select: { id: true, nome: true, empresaId: true } },
          solicitante: { select: { id: true, nome: true } },
          itens: {
            include: { material: { select: { id: true, nome: true, unidade: true } } },
          },
          pedidos: {
            select: { id: true, status: true, total: true, fornecedor: { select: { nome: true } } },
          },
        },
      })
      if (!sol || sol.obra.empresaId !== ctx.session.empresaId) {
        throw new TRPCError({ code: "NOT_FOUND" })
      }
      return sol
    }),

  criar: protectedProcedure
    .input(z.object({
      obraId:      z.string(),
      urgencia:    z.number().int().min(1).max(3).default(2),
      observacoes: z.string().optional(),
      itens: z.array(z.object({
        materialId: z.string(),
        quantidade: z.number().positive(),
        unidade:    z.string().optional(),
        observacao: z.string().optional(),
      })).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx.session
      return ctx.db.solicitacaoCompra.create({
        data: {
          obraId:       input.obraId,
          solicitanteId: userId,
          urgencia:     input.urgencia,
          observacoes:  input.observacoes || null,
          status:       "RASCUNHO",
          itens: {
            create: input.itens.map(item => ({
              materialId: item.materialId,
              quantidade: item.quantidade,
              unidade:    item.unidade || null,
              observacao: item.observacao || null,
            })),
          },
        },
      })
    }),

  atualizarStatus: protectedProcedure
    .input(z.object({
      id:     z.string(),
      status: StatusSolicitacao,
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.solicitacaoCompra.update({
        where: { id: input.id },
        data:  { status: input.status },
      })
      // Fire-and-forget: criar no Sienge quando enviada para aprovação
      if (input.status === "PENDENTE") {
        ctx.db.solicitacaoCompra.findFirst({
          where: { id: input.id },
          include: {
            itens: { include: { material: { select: { nome: true } } } },
            obra:  { select: { siengeId: true } },
          },
        }).then(async sol => {
          if (!sol?.obra?.siengeId || sol.siengePurchaseRequestId) return
          const config = await ctx.db.integracaoConfig.findUnique({
            where: { empresaId: ctx.session.empresaId },
          })
          if (!config) return
          const senha = isEncrypted(config.senha) ? decrypt(config.senha) : config.senha
          const sienge = await criarSolicitacaoSienge(config.subdominio, config.usuario, senha, {
            buildingId:   parseInt(sol.obra.siengeId),
            requestDate:  new Date().toISOString().split("T")[0],
            observations: sol.observacoes ?? undefined,
            items: sol.itens.map(i => ({
              description: i.material.nome,
              quantity:    i.quantidade,
              unit:        i.unidade ?? undefined,
            })),
          })
          await ctx.db.solicitacaoCompra.update({
            where: { id: input.id },
            data:  { siengePurchaseRequestId: sienge.id },
          }).catch((err: unknown) => { console.warn("[Sienge sync]", err instanceof Error ? err.message : String(err)) })
        }).catch((err: unknown) => { console.warn("[Sienge sync]", err instanceof Error ? err.message : String(err)) })
      }
      return result
    }),

  atualizar: protectedProcedure
    .input(z.object({
      id:          z.string(),
      urgencia:    z.number().int().min(1).max(3).optional(),
      observacoes: z.string().optional(),
      itens: z.array(z.object({
        materialId: z.string(),
        quantidade: z.number().positive(),
        unidade:    z.string().optional(),
        observacao: z.string().optional(),
      })).min(1).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const sol = await ctx.db.solicitacaoCompra.findFirst({
        where: { id: input.id, obra: { empresaId: ctx.session.empresaId }, status: "RASCUNHO" },
      })
      if (!sol) throw new TRPCError({ code: "NOT_FOUND", message: "Solicitação não encontrada ou não pode ser editada" })

      return ctx.db.$transaction(async (tx) => {
        if (input.itens) {
          await tx.itemSolicitacao.deleteMany({ where: { solicitacaoId: input.id } })
          await tx.itemSolicitacao.createMany({
            data: input.itens.map((item) => ({
              solicitacaoId: input.id,
              materialId:    item.materialId,
              quantidade:    item.quantidade,
              unidade:       item.unidade || null,
              observacao:    item.observacao || null,
            })),
          })
        }
        return tx.solicitacaoCompra.update({
          where: { id: input.id },
          data: {
            urgencia:    input.urgencia    ?? sol.urgencia,
            observacoes: input.observacoes !== undefined ? (input.observacoes || null) : undefined,
          },
        })
      })
    }),

  excluir: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const sol = await ctx.db.solicitacaoCompra.findFirst({
        where: { id: input.id, obra: { empresaId: ctx.session.empresaId }, status: "RASCUNHO" },
      })
      if (!sol) throw new TRPCError({ code: "NOT_FOUND", message: "Solicitação não encontrada ou não pode ser excluída" })
      return ctx.db.solicitacaoCompra.delete({ where: { id: input.id } })
    }),

  aprovarItens: protectedProcedure
    .input(z.object({
      solicitacaoId: z.string(),
      itens: z.array(z.object({
        itemId:   z.string(),
        aprovado: z.boolean(),
        obs:      z.string().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verificar que a solicitação pertence à empresa
      const sol = await ctx.db.solicitacaoCompra.findFirstOrThrow({
        where: { id: input.solicitacaoId, obra: { empresaId: ctx.session.empresaId } },
      })
      // Atualizar cada item
      await Promise.all(input.itens.map((item) =>
        ctx.db.itemSolicitacao.update({
          where: { id: item.itemId },
          data: {
            statusAprovacao: item.aprovado ? "APROVADO" : "REJEITADO",
            obsAprovacao:    item.obs ?? null,
          },
        })
      ))
      return ctx.db.solicitacaoCompra.findUnique({
        where: { id: sol.id },
        include: {
          obra:        { select: { id: true, nome: true, empresaId: true } },
          solicitante: { select: { id: true, nome: true } },
          itens: {
            include: { material: { select: { id: true, nome: true, unidade: true } } },
          },
          pedidos: {
            select: { id: true, status: true, total: true, fornecedor: { select: { nome: true } } },
          },
        },
      })
    }),

  listarPendentesParaTransferencia: protectedProcedure
    .input(z.object({ obraId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { empresaId } = ctx.session
      const solicitacoes = await ctx.db.solicitacaoCompra.findMany({
        where: {
          status: { in: ["PENDENTE", "APROVADA"] },
          obraId: { not: input.obraId },
          obra:   { empresaId },
        },
        include: {
          obra: { select: { id: true, nome: true } },
          itens: {
            include: { material: { select: { id: true, nome: true, unidade: true } } },
          },
        },
      })
      // Agrupar por obra
      const porObra = new Map<string, { obraId: string; obraNome: string; itens: { descricao: string; quantidade: number; unidade: string }[] }>()
      for (const sol of solicitacoes) {
        if (!porObra.has(sol.obraId)) {
          porObra.set(sol.obraId, { obraId: sol.obraId, obraNome: sol.obra.nome, itens: [] })
        }
        const entry = porObra.get(sol.obraId)!
        for (const item of sol.itens) {
          entry.itens.push({
            descricao:  item.material.nome,
            quantidade: item.quantidade,
            unidade:    item.unidade ?? item.material.unidade,
          })
        }
      }
      return [...porObra.values()]
    }),
})
