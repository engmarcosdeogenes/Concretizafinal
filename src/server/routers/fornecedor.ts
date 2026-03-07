import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"

export const fornecedorRouter = createTRPCRouter({

  listar: protectedProcedure.query(async ({ ctx }) => {
    const { empresaId } = ctx.session
    return ctx.db.fornecedor.findMany({
      where: { empresaId },
      orderBy: [{ ativo: "desc" }, { nome: "asc" }],
      include: { _count: { select: { pedidos: true } } },
    })
  }),

  criar: protectedProcedure
    .input(z.object({
      nome:      z.string().min(1),
      cnpj:      z.string().optional(),
      categoria: z.string().optional(),
      cidade:    z.string().optional(),
      estado:    z.string().optional(),
      telefone:  z.string().optional(),
      email:     z.string().email().optional().or(z.literal("")),
      site:      z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { empresaId } = ctx.session
      return ctx.db.fornecedor.create({
        data: {
          empresaId,
          nome:      input.nome,
          cnpj:      input.cnpj || null,
          categoria: input.categoria || null,
          cidade:    input.cidade || null,
          estado:    input.estado || null,
          telefone:  input.telefone || null,
          email:     input.email || null,
          site:      input.site || null,
        },
      })
    }),

  atualizar: protectedProcedure
    .input(z.object({
      id:        z.string(),
      nome:      z.string().min(1).optional(),
      cnpj:      z.string().optional(),
      categoria: z.string().optional(),
      cidade:    z.string().optional(),
      estado:    z.string().optional(),
      telefone:  z.string().optional(),
      email:     z.string().email().optional().or(z.literal("")),
      site:      z.string().optional(),
      ativo:     z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input
      return ctx.db.fornecedor.update({
        where: { id, empresaId: ctx.session.empresaId },
        data: {
          ...data,
          cnpj:      data.cnpj !== undefined ? (data.cnpj || null) : undefined,
          categoria: data.categoria !== undefined ? (data.categoria || null) : undefined,
          cidade:    data.cidade !== undefined ? (data.cidade || null) : undefined,
          estado:    data.estado !== undefined ? (data.estado || null) : undefined,
          telefone:  data.telefone !== undefined ? (data.telefone || null) : undefined,
          email:     data.email !== undefined ? (data.email || null) : undefined,
          site:      data.site !== undefined ? (data.site || null) : undefined,
        },
      })
    }),
})
