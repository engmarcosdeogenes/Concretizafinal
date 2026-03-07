import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"

export const equipeRouter = createTRPCRouter({

  listar: protectedProcedure
    .input(z.object({ obraId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.membroEquipe.findMany({
        where: { obraId: input.obraId },
        orderBy: [{ ativo: "desc" }, { funcao: "asc" }, { nome: "asc" }],
      })
    }),

  criar: protectedProcedure
    .input(z.object({
      obraId:      z.string(),
      nome:        z.string().min(1),
      funcao:      z.string().min(1),
      cpf:         z.string().optional(),
      telefone:    z.string().optional(),
      empresaNome: z.string().optional(),
      dataEntrada: z.string().optional(), // ISO date
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.membroEquipe.create({
        data: {
          obraId:      input.obraId,
          nome:        input.nome,
          funcao:      input.funcao,
          cpf:         input.cpf || null,
          telefone:    input.telefone || null,
          empresaNome: input.empresaNome || null,
          dataEntrada: input.dataEntrada ? new Date(input.dataEntrada) : new Date(),
        },
      })
    }),

  atualizar: protectedProcedure
    .input(z.object({
      id:          z.string(),
      nome:        z.string().min(1).optional(),
      funcao:      z.string().min(1).optional(),
      cpf:         z.string().optional(),
      telefone:    z.string().optional(),
      empresaNome: z.string().optional(),
      ativo:       z.boolean().optional(),
      dataSaida:   z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, dataSaida, ...rest } = input
      return ctx.db.membroEquipe.update({
        where: { id },
        data: {
          ...rest,
          cpf:         rest.cpf !== undefined ? (rest.cpf || null) : undefined,
          telefone:    rest.telefone !== undefined ? (rest.telefone || null) : undefined,
          empresaNome: rest.empresaNome !== undefined ? (rest.empresaNome || null) : undefined,
          dataSaida:   dataSaida !== undefined
            ? (dataSaida ? new Date(dataSaida) : null)
            : undefined,
        },
      })
    }),
})
