import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"

const widgetConfigSchema = z.object({
  id: z.string(),
  visivel: z.boolean(),
  ordem: z.number(),
})

export const dashboardConfigRouter = createTRPCRouter({
  buscar: protectedProcedure.query(async ({ ctx }) => {
    const config = await ctx.db.dashboardConfig.findUnique({
      where: { usuarioId: ctx.session.userId },
    })
    return config?.widgets as Array<{ id: string; visivel: boolean; ordem: number }> | null
  }),

  salvar: protectedProcedure
    .input(z.object({ widgets: z.array(widgetConfigSchema) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.dashboardConfig.upsert({
        where: { usuarioId: ctx.session.userId },
        create: {
          usuarioId: ctx.session.userId,
          empresaId: ctx.session.empresaId,
          widgets: input.widgets,
        },
        update: {
          widgets: input.widgets,
        },
      })
      return { ok: true }
    }),
})
