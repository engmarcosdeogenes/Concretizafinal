import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { criarLoteContabilSienge } from "@/lib/sienge/client"
import { decrypt, isEncrypted } from "@/lib/encrypt"

export const fvmRouter = createTRPCRouter({
  listar: protectedProcedure
    .input(z.object({ obraId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.fVM.findMany({
        where: {
          ...(input.obraId ? { obraId: input.obraId } : {}),
          obra: { empresaId: ctx.session.empresaId },
        },
        orderBy: { data: "desc" },
      })
    }),

  buscarPorId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const fvm = await ctx.db.fVM.findFirst({
        where: {
          id: input.id,
          obra: { empresaId: ctx.session.empresaId },
        },
      })
      if (!fvm) throw new TRPCError({ code: "NOT_FOUND", message: "FVM não encontrada" })
      return fvm
    }),

  criar: protectedProcedure
    .input(z.object({
      obraId: z.string(),
      material: z.string().min(1),
      codigo: z.string().optional(),
      fornecedorNome: z.string().optional(),
      quantidade: z.number(),
      unidade: z.string().optional(),
      data: z.string(),
      notaFiscal: z.string().optional(),
      observacoes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { obraId, data, ...rest } = input

      const obra = await ctx.db.obra.findFirst({
        where: { id: obraId, empresaId: ctx.session.empresaId },
      })
      if (!obra) throw new TRPCError({ code: "NOT_FOUND", message: "Obra não encontrada" })

      return ctx.db.fVM.create({
        data: { obraId, data: new Date(data), ...rest },
      })
    }),

  atualizarStatus: protectedProcedure
    .input(z.object({
      id:     z.string(),
      status: z.enum(["PENDENTE", "RECEBIDO", "APROVADO", "REJEITADO", "DEVOLVIDO"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const fvm = await ctx.db.fVM.findFirst({
        where: { id: input.id, obra: { empresaId: ctx.session.empresaId } },
      })
      if (!fvm) throw new TRPCError({ code: "NOT_FOUND" })

      const updated = await ctx.db.fVM.update({
        where: { id: input.id },
        data: { status: input.status },
      })

      // Fire-and-forget: lançamento contábil ao aprovar recebimento de material
      if (input.status === "APROVADO") {
        void (async () => {
          try {
            const empresa = await ctx.db.empresa.findUnique({
              where: { id: ctx.session.empresaId },
              select: { planosContas: true },
            })
            const planos = (empresa?.planosContas ?? {}) as Record<string, string>
            const accountCode = planos["Materiais"] ?? planos["materiais"]
            if (!accountCode) return
            const config = await ctx.db.integracaoConfig.findUnique({ where: { empresaId: ctx.session.empresaId } })
            if (!config?.ativo) return
            const senhaDecrypt = isEncrypted(config.senha) ? decrypt(config.senha) : config.senha
            // Usa quantidade como valor aproximado se não há valorTotal
            await criarLoteContabilSienge(config.subdominio, config.usuario, senhaDecrypt, [{
              accountCode,
              costCenterCode: planos["centroCusto"],
              description: `FVM aprovado — ${fvm.material} (${fvm.fornecedorNome ?? ""})`,
              value: fvm.quantidade,
              date: new Date().toISOString().slice(0, 10),
              documentNumber: fvm.notaFiscal ?? undefined,
              debitOrCredit: "D",
            }])
          } catch (err: unknown) { console.warn("[Sienge sync]", err instanceof Error ? err.message : String(err)) }
        })()
      }

      return updated
    }),

  excluir: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.fVM.findFirstOrThrow({
        where: { id: input.id, obra: { empresaId: ctx.session.empresaId } },
      })
      return ctx.db.fVM.delete({ where: { id: input.id } })
    }),

  // Lança uma despesa financeira associada a esta FVM (com NF)
  lancarDespesaNf: protectedProcedure
    .input(z.object({
      fvmId:    z.string(),
      descricao: z.string().min(1),
      valor:    z.number().positive(),
      data:     z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const fvm = await ctx.db.fVM.findFirst({
        where: { id: input.fvmId, obra: { empresaId: ctx.session.empresaId } },
      })
      if (!fvm) throw new TRPCError({ code: "NOT_FOUND" })

      return ctx.db.lancamentoFinanceiro.create({
        data: {
          obraId:    fvm.obraId,
          tipo:      "DESPESA",
          categoria: "Materiais",
          descricao: input.descricao,
          valor:     input.valor,
          data:      input.data ? new Date(input.data) : new Date(),
        },
      })
    }),
})
