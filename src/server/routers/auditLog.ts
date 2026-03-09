import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"

export const auditLogRouter = createTRPCRouter({

  listarPorEntidade: protectedProcedure
    .input(z.object({ entityType: z.string(), entityId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.auditLog.findMany({
        where: {
          entityType: input.entityType,
          entityId:   input.entityId,
          empresaId:  ctx.session.empresaId,
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
    }),

  listarPorObra: protectedProcedure
    .input(z.object({ obraId: z.string(), take: z.number().default(30) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.auditLog.findMany({
        where: { obraId: input.obraId, empresaId: ctx.session.empresaId },
        orderBy: { createdAt: "desc" },
        take: input.take,
      })
    }),
})
