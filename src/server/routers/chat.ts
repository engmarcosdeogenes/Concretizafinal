import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { rateLimit } from "@/lib/rate-limit"
import { createTRPCRouter, protectedProcedure } from "../trpc"

export const chatRouter = createTRPCRouter({

  listarObras: protectedProcedure
    .query(async ({ ctx }) => {
      const { empresaId } = ctx.session
      return ctx.db.obra.findMany({
        where: { empresaId, status: { not: "CANCELADA" } },
        select: { id: true, nome: true, status: true,
          mensagens: { select: { id: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
          _count: { select: { mensagens: true } },
        },
        orderBy: { updatedAt: "desc" },
      })
    }),

  listar: protectedProcedure
    .input(z.object({ obraId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { empresaId } = ctx.session
      const obra = await ctx.db.obra.findFirst({
        where: { id: input.obraId, empresaId },
        select: { id: true },
      })
      if (!obra) return []
      return ctx.db.mensagemChat.findMany({
        where: { obraId: input.obraId },
        include: { usuario: { select: { id: true, nome: true, avatarUrl: true, role: true } } },
        orderBy: { createdAt: "asc" },
        take: 100,
      })
    }),

  enviar: protectedProcedure
    .input(z.object({
      obraId:   z.string(),
      conteudo: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId, empresaId } = ctx.session

      const rl = rateLimit(`chat:${userId}`, 100, 60 * 60 * 1000) // 100 msgs/hora
      if (!rl.ok) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Limite de mensagens atingido. Tente novamente em breve.",
        })
      }

      const obra = await ctx.db.obra.findFirst({
        where: { id: input.obraId, empresaId },
        select: { id: true },
      })
      if (!obra) throw new Error("Obra não encontrada")
      return ctx.db.mensagemChat.create({
        data: { obraId: input.obraId, usuarioId: userId, conteudo: input.conteudo },
        include: { usuario: { select: { id: true, nome: true, avatarUrl: true, role: true } } },
      })
    }),
})
