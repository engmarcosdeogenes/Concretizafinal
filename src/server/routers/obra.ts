import { z } from "zod"
import { Prisma } from "@prisma/client"
import { createTRPCRouter, protectedProcedure } from "../trpc"

const equipePredefSchema = z.array(z.object({
  funcao: z.string().min(1),
  quantidade: z.number().int().min(1),
}))

const equipamentosPredefSchema = z.array(z.object({
  nome: z.string().min(1),
  quantidade: z.number().int().min(1),
}))

export const obraRouter = createTRPCRouter({
  listar: protectedProcedure
    .input(z.object({ grupo: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.obra.findMany({
        where: {
          empresaId: ctx.session.empresaId,
          ...(input?.grupo ? { grupo: input.grupo } : {}),
        },
        include: {
          _count: { select: { rdos: true, fvs: true, ocorrencias: true, midias: true } },
        },
        orderBy: { updatedAt: "desc" },
      })
    }),

  buscarPorId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.obra.findFirst({
        where: { id: input.id, empresaId: ctx.session.empresaId },
        include: {
          usuarios: { include: { usuario: true } },
          rdos: {
            take: 5, orderBy: { data: "desc" },
            include: { responsavel: { select: { nome: true } } },
          },
          fvs: { take: 5, orderBy: { data: "desc" } },
          ocorrencias: { where: { status: "ABERTA" } },
          equipe: { where: { ativo: true } },
          _count: {
            select: {
              rdos: true, fvs: true, fvm: true,
              ocorrencias: true, documentos: true, midias: true,
            },
          },
        },
      })
    }),

  criar: protectedProcedure
    .input(z.object({
      nome: z.string().min(1),
      descricao: z.string().optional(),
      endereco: z.string().optional(),
      cidade: z.string().optional(),
      estado: z.string().optional(),
      orcamento: z.number().optional(),
      dataInicio: z.string().optional(),
      dataFim: z.string().optional(),
      imagemUrl: z.string().optional(),
      grupo: z.string().optional(),
      numContrato: z.string().optional(),
      prazoContratualDias: z.number().int().positive().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.obra.create({
        data: {
          ...input,
          empresaId: ctx.session.empresaId,
          dataInicio: input.dataInicio ? new Date(input.dataInicio) : undefined,
          dataFim: input.dataFim ? new Date(input.dataFim) : undefined,
        },
      })
    }),

  atualizar: protectedProcedure
    .input(z.object({
      id:                  z.string(),
      nome:                z.string().min(1).optional(),
      descricao:           z.string().optional().nullable(),
      endereco:            z.string().optional().nullable(),
      cidade:              z.string().optional().nullable(),
      estado:              z.string().optional().nullable(),
      orcamento:           z.number().positive().optional().nullable(),
      dataInicio:          z.string().optional().nullable(),
      dataFim:             z.string().optional().nullable(),
      imagemUrl:           z.string().optional().nullable(),
      status:              z.enum(["PLANEJAMENTO","EM_ANDAMENTO","PAUSADA","CONCLUIDA","CANCELADA"]).optional(),
      progresso:           z.number().min(0).max(100).optional(),
      grupo:               z.string().optional().nullable(),
      numContrato:         z.string().optional().nullable(),
      prazoContratualDias: z.number().int().positive().optional().nullable(),
      equipePredef:        equipePredefSchema.optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, dataInicio, dataFim, equipePredef, ...rest } = input
      return ctx.db.obra.update({
        where: { id, empresaId: ctx.session.empresaId },
        data: {
          ...rest,
          dataInicio:   dataInicio   !== undefined ? (dataInicio   ? new Date(dataInicio) : null) : undefined,
          dataFim:      dataFim      !== undefined ? (dataFim      ? new Date(dataFim)    : null) : undefined,
          equipePredef: equipePredef !== undefined ? (equipePredef ?? Prisma.JsonNull) : undefined,
        },
      })
    }),

  salvarEquipePredef: protectedProcedure
    .input(z.object({
      id: z.string(),
      equipePredef: equipePredefSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.obra.update({
        where: { id: input.id, empresaId: ctx.session.empresaId },
        data: { equipePredef: input.equipePredef },
      })
    }),

  salvarEquipamentosPredef: protectedProcedure
    .input(z.object({
      id: z.string(),
      equipamentosPredef: equipamentosPredefSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.obra.update({
        where: { id: input.id, empresaId: ctx.session.empresaId },
        data: { equipamentosPredef: input.equipamentosPredef },
      })
    }),

  excluir: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.obra.delete({
        where: { id: input.id, empresaId: ctx.session.empresaId },
      })
    }),
})
