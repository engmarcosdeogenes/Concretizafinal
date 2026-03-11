import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import {
  testarConexao,
  listarObras,
  listarFornecedoresSienge,
  listarPedidosSienge,
} from "@/lib/sienge/client"
import { encrypt, decrypt, isEncrypted } from "@/lib/encrypt"

// Helper para buscar config validada (com senha descriptografada)
async function getConfig(ctx: { db: typeof import("../db").db; session: { empresaId: string } }) {
  const config = await ctx.db.integracaoConfig.findUnique({
    where: { empresaId: ctx.session.empresaId },
  })
  if (!config) throw new TRPCError({ code: "NOT_FOUND", message: "Credenciais Sienge não configuradas." })
  const senhaDecrypted = isEncrypted(config.senha) ? decrypt(config.senha) : config.senha
  return { ...config, senha: senhaDecrypted }
}

export const integracoesRouter = createTRPCRouter({

  // ── Configuração ──────────────────────────────────────────────────────────

  buscarConfig: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.integracaoConfig.findUnique({
        where: { empresaId: ctx.session.empresaId },
        select: { id: true, tipo: true, subdominio: true, usuario: true, ativo: true, updatedAt: true },
      })
    }),

  salvarConfig: protectedProcedure
    .input(z.object({
      subdominio: z.string().min(1),
      usuario:    z.string().min(1),
      senha:      z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const senhaEncryptada = isEncrypted(input.senha) ? input.senha : encrypt(input.senha)
      const data = { ...input, senha: senhaEncryptada }
      return ctx.db.integracaoConfig.upsert({
        where:  { empresaId: ctx.session.empresaId },
        create: { ...data, tipo: "SIENGE", empresaId: ctx.session.empresaId },
        update: data,
      })
    }),

  testarConexao: protectedProcedure
    .mutation(async ({ ctx }) => {
      const config = await getConfig(ctx)
      const ok = await testarConexao(config.subdominio, config.usuario, config.senha)
      return { sucesso: ok }
    }),

  // ── Sincronizações ────────────────────────────────────────────────────────

  importarObras: protectedProcedure
    .input(z.object({ atualizarExistentes: z.boolean().default(false) }).optional())
    .mutation(async ({ ctx, input }) => {
      const config = await getConfig(ctx)
      const atualizarExistentes = input?.atualizarExistentes ?? false

      let obras: Awaited<ReturnType<typeof listarObras>>
      try {
        obras = await listarObras(config.subdominio, config.usuario, config.senha)
      } catch (err) {
        await ctx.db.integracaoSync.create({
          data: { integracaoId: config.id, tipo: "IMPORTAR_OBRAS", status: "ERRO",
                  detalhes: err instanceof Error ? err.message : "Erro desconhecido", registros: 0 },
        })
        throw new TRPCError({ code: "BAD_REQUEST", message: err instanceof Error ? err.message : "Erro ao conectar ao Sienge." })
      }

      let criadas = 0
      let atualizadas = 0
      for (const obra of obras) {
        const siengeId = String(obra.id)
        const existe = await ctx.db.obra.findFirst({
          where: { siengeId, empresaId: ctx.session.empresaId },
          select: { id: true },
        })
        if (!existe) {
          await ctx.db.obra.create({
            data: {
              nome:      obra.name ?? `Obra Sienge #${obra.id}`,
              endereco:  obra.adress ?? undefined,
              siengeId,
              empresaId: ctx.session.empresaId,
            },
          })
          criadas++
        } else if (atualizarExistentes) {
          await ctx.db.obra.update({
            where: { id: existe.id },
            data: {
              nome:    obra.name ?? undefined,
              endereco: obra.adress ?? undefined,
            },
          })
          atualizadas++
        }
      }

      await ctx.db.integracaoSync.create({
        data: { integracaoId: config.id, tipo: "IMPORTAR_OBRAS", status: "SUCESSO",
                registros: criadas + atualizadas,
                detalhes: `${criadas} criada(s), ${atualizadas} atualizada(s) de ${obras.length} encontrada(s) no Sienge.` },
      })
      return { criadas, atualizadas, total: obras.length }
    }),

  importarFornecedores: protectedProcedure
    .mutation(async ({ ctx }) => {
      const config = await getConfig(ctx)

      let fornecedores: Awaited<ReturnType<typeof listarFornecedoresSienge>>
      try {
        fornecedores = await listarFornecedoresSienge(config.subdominio, config.usuario, config.senha)
      } catch (err) {
        await ctx.db.integracaoSync.create({
          data: { integracaoId: config.id, tipo: "IMPORTAR_FORNECEDORES", status: "ERRO",
                  detalhes: err instanceof Error ? err.message : "Erro desconhecido", registros: 0 },
        })
        throw new TRPCError({ code: "BAD_REQUEST", message: err instanceof Error ? err.message : "Erro ao buscar fornecedores do Sienge." })
      }

      let criados = 0
      for (const f of fornecedores) {
        // Verificar duplicata por CNPJ (se tiver) ou por nome
        const where = f.cnpj
          ? { empresaId_cnpj: { empresaId: ctx.session.empresaId, cnpj: f.cnpj } }
          : undefined

        let existe = false
        if (where) {
          const found = await ctx.db.fornecedor.findFirst({
            where: { empresaId: ctx.session.empresaId, cnpj: f.cnpj },
            select: { id: true },
          })
          existe = !!found
        } else {
          const found = await ctx.db.fornecedor.findFirst({
            where: { empresaId: ctx.session.empresaId, nome: f.name },
            select: { id: true },
          })
          existe = !!found
        }

        if (!existe) {
          await ctx.db.fornecedor.create({
            data: {
              empresaId:       ctx.session.empresaId,
              nome:            f.name,
              cnpj:            f.cnpj ?? undefined,
              cidade:          f.address?.cityName ?? undefined,
              estado:          f.address?.state ?? undefined,
              siengeCreditorId: f.id,
            },
          })
          criados++
        }
      }

      await ctx.db.integracaoSync.create({
        data: { integracaoId: config.id, tipo: "IMPORTAR_FORNECEDORES", status: "SUCESSO",
                registros: criados, detalhes: `${criados} fornecedor(es) importado(s) de ${fornecedores.length} encontrado(s) no Sienge.` },
      })
      return { criados, total: fornecedores.length }
    }),

  // ── Pedidos Sienge (leitura direta da API, sem armazenar no DB) ───────────

  pedidosSienge: protectedProcedure
    .input(z.object({ obraId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const config = await ctx.db.integracaoConfig.findUnique({
        where: { empresaId: ctx.session.empresaId },
      })
      if (!config) return []

      // Se passou obraId, busca o siengeId da obra
      let buildingId: number | undefined
      if (input.obraId) {
        const obra = await ctx.db.obra.findFirst({
          where: { id: input.obraId, empresaId: ctx.session.empresaId },
          select: { siengeId: true },
        })
        if (obra?.siengeId) buildingId = parseInt(obra.siengeId, 10)
      }

      try {
        return await listarPedidosSienge(config.subdominio, config.usuario, config.senha, buildingId)
      } catch {
        return []
      }
    }),

  // ── Histórico ─────────────────────────────────────────────────────────────

  listarSyncs: protectedProcedure
    .query(async ({ ctx }) => {
      const config = await ctx.db.integracaoConfig.findUnique({
        where:  { empresaId: ctx.session.empresaId },
        select: { id: true },
      })
      if (!config) return []
      return ctx.db.integracaoSync.findMany({
        where:   { integracaoId: config.id },
        orderBy: { createdAt: "desc" },
        take:    20,
      })
    }),
})
