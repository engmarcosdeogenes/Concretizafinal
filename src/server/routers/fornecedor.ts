import { z } from "zod"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { decrypt, isEncrypted } from "@/lib/encrypt"
import {
  criarCreditorSienge,
  atualizarCreditorSienge,
  ativarCreditorSienge,
  desativarCreditorSienge,
} from "@/lib/sienge/client"

async function getSiengeHelper(ctx: { db: typeof import("../db").db; session: { empresaId: string } }) {
  const config = await ctx.db.integracaoConfig.findUnique({
    where: { empresaId: ctx.session.empresaId },
  })
  if (!config) return null
  const pass = isEncrypted(config.senha) ? decrypt(config.senha) : config.senha
  return { sub: config.subdominio, user: config.usuario, pass }
}

export const fornecedorRouter = createTRPCRouter({

  listar: protectedProcedure.query(async ({ ctx }) => {
    const { empresaId } = ctx.session
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)
    const [fornecedores, novosNoMes] = await Promise.all([
      ctx.db.fornecedor.findMany({
        where: { empresaId },
        orderBy: [{ ativo: "desc" }, { nome: "asc" }],
        select: {
          id: true, nome: true, cnpj: true, categoria: true,
          cidade: true, estado: true, telefone: true, email: true,
          site: true, ativo: true, siengeCreditorId: true,
          notaMedia: true, totalAvaliacoes: true,
          _count: { select: { pedidos: true } },
        },
      }),
      ctx.db.fornecedor.count({
        where: { empresaId, createdAt: { gte: inicioMes } },
      }),
    ])
    return { fornecedores, novosNoMes }
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
      const fornecedor = await ctx.db.fornecedor.create({
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

      // Fire-and-forget: criar creditor no Sienge
      getSiengeHelper(ctx).then(async (cfg) => {
        if (!cfg) return
        const creditorId = await criarCreditorSienge(cfg.sub, cfg.user, cfg.pass, {
          companyName: input.nome,
          cnpj: input.cnpj || undefined,
          email: input.email || undefined,
          phone: input.telefone || undefined,
        })
        if (creditorId) {
          await ctx.db.fornecedor.update({
            where: { id: fornecedor.id },
            data: { siengeCreditorId: creditorId },
          }).catch((err: unknown) => { console.warn("[Sienge sync]", err instanceof Error ? err.message : String(err)) })
        }
      }).catch((err: unknown) => { console.warn("[Sienge sync]", err instanceof Error ? err.message : String(err)) })

      return fornecedor
    }),

  excluir: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.fornecedor.delete({
        where: { id: input.id, empresaId: ctx.session.empresaId },
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

      // Buscar fornecedor antes para ter siengeCreditorId e ativo anterior
      const atual = await ctx.db.fornecedor.findFirst({
        where: { id, empresaId: ctx.session.empresaId },
        select: { siengeCreditorId: true, ativo: true },
      })

      const updated = await ctx.db.fornecedor.update({
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

      // Fire-and-forget Sienge sync
      if (atual?.siengeCreditorId) {
        const creditorId = atual.siengeCreditorId
        getSiengeHelper(ctx).then(async (cfg) => {
          if (!cfg) return
          // Atualizar dados
          const updateData: Record<string, unknown> = {}
          if (data.nome)     updateData.companyName = data.nome
          if (data.cnpj)     updateData.cnpj        = data.cnpj
          if (data.email)    updateData.email        = data.email
          if (data.telefone) updateData.phone        = data.telefone
          if (Object.keys(updateData).length > 0) {
            await atualizarCreditorSienge(cfg.sub, cfg.user, cfg.pass, creditorId, updateData)
          }
          // Toggle ativo se mudou
          if (data.ativo !== undefined && atual.ativo !== data.ativo) {
            if (data.ativo) {
              await ativarCreditorSienge(cfg.sub, cfg.user, cfg.pass, creditorId)
            } else {
              await desativarCreditorSienge(cfg.sub, cfg.user, cfg.pass, creditorId)
            }
          }
        }).catch((err: unknown) => { console.warn("[Sienge sync]", err instanceof Error ? err.message : String(err)) })
      }

      return updated
    }),
})
