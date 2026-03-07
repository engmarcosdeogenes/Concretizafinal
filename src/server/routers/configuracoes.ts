import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"

export const configuracoesRouter = createTRPCRouter({

  buscarEmpresa: protectedProcedure
    .query(async ({ ctx }) => {
      const { empresaId } = ctx.session
      return ctx.db.empresa.findUnique({
        where: { id: empresaId },
        select: { id: true, nome: true, cnpj: true, plano: true, logoUrl: true, createdAt: true },
      })
    }),

  atualizarEmpresa: protectedProcedure
    .input(z.object({
      nome:  z.string().min(1),
      cnpj:  z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { empresaId } = ctx.session
      return ctx.db.empresa.update({
        where: { id: empresaId },
        data: { nome: input.nome, cnpj: input.cnpj ?? null },
      })
    }),

  buscarPerfil: protectedProcedure
    .query(async ({ ctx }) => {
      const { userId } = ctx.session
      return ctx.db.usuario.findUnique({
        where: { id: userId },
        select: { id: true, nome: true, email: true, telefone: true, role: true, avatarUrl: true, createdAt: true },
      })
    }),

  atualizarPerfil: protectedProcedure
    .input(z.object({
      nome:     z.string().min(1),
      telefone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx.session
      return ctx.db.usuario.update({
        where: { id: userId },
        data: { nome: input.nome, telefone: input.telefone ?? null },
      })
    }),
})
