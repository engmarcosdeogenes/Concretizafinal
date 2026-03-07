import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc"
import { canInviteMembers } from "@/lib/permissions"

export const conviteRouter = createTRPCRouter({

  // Criar convite (DONO/ADMIN)
  criar: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      role:  z.enum(["ADMIN", "ENGENHEIRO", "MESTRE", "ENCARREGADO"]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!canInviteMembers(ctx.session.role as never)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para convidar membros" })
      }

      // Verifica se email já pertence a alguém na empresa
      const existing = await ctx.db.usuario.findFirst({
        where: { email: input.email, empresaId: ctx.session.empresaId },
      })
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Este e-mail já pertence a um membro da equipe" })
      }

      // Remove convite anterior para o mesmo email se existir
      await ctx.db.convite.deleteMany({
        where: { email: input.email, empresaId: ctx.session.empresaId, usado: false },
      })

      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias

      const convite = await ctx.db.convite.create({
        data: {
          empresaId: ctx.session.empresaId,
          email:     input.email,
          role:      input.role,
          expiresAt,
        },
      })

      return { token: convite.token, link: `/invite/${convite.token}` }
    }),

  // Listar convites da empresa
  listar: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.convite.findMany({
        where:   { empresaId: ctx.session.empresaId },
        orderBy: { createdAt: "desc" },
      })
    }),

  // Buscar convite pelo token (público — para a página de aceitar convite)
  buscarToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const convite = await ctx.db.convite.findUnique({
        where:   { token: input.token },
        include: { empresa: { select: { nome: true } } },
      })

      if (!convite)                          return null
      if (convite.usado)                     return { error: "usado" as const }
      if (convite.expiresAt < new Date())    return { error: "expirado" as const }

      return {
        email:       convite.email,
        role:        convite.role,
        empresaNome: convite.empresa.nome,
      }
    }),

  // Revogar convite
  revogar: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.convite.deleteMany({
        where: { id: input.id, empresaId: ctx.session.empresaId },
      })
      return { ok: true }
    }),
})
