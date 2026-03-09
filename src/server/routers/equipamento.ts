import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"

const StatusEquipamento = z.enum(["DISPONIVEL", "EM_USO", "MANUTENCAO", "INATIVO"])

export const equipamentoRouter = createTRPCRouter({

  listar: protectedProcedure.query(async ({ ctx }) => {
    const { empresaId } = ctx.session
    return ctx.db.equipamento.findMany({
      where: { empresaId },
      orderBy: [{ status: "asc" }, { nome: "asc" }],
    })
  }),

  criar: protectedProcedure
    .input(z.object({
      nome:   z.string().min(1),
      tipo:   z.string().optional(),
      modelo: z.string().optional(),
      placa:  z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { empresaId } = ctx.session
      return ctx.db.equipamento.create({
        data: {
          empresaId,
          nome:   input.nome,
          tipo:   input.tipo || null,
          modelo: input.modelo || null,
          placa:  input.placa || null,
        },
      })
    }),

  excluir: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.equipamento.delete({
        where: { id: input.id, empresaId: ctx.session.empresaId },
      })
    }),

  atualizar: protectedProcedure
    .input(z.object({
      id:     z.string(),
      nome:   z.string().min(1).optional(),
      tipo:   z.string().optional(),
      modelo: z.string().optional(),
      placa:  z.string().optional(),
      status: StatusEquipamento.optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.db.equipamento.update({
        where: { id, empresaId: ctx.session.empresaId },
        data: {
          ...data,
          tipo:   data.tipo !== undefined ? (data.tipo || null) : undefined,
          modelo: data.modelo !== undefined ? (data.modelo || null) : undefined,
          placa:  data.placa !== undefined ? (data.placa || null) : undefined,
        },
      })
    }),
})
