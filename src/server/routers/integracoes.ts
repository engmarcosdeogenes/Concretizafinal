import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import {
  testarConexao,
  listarObras,
  listarFornecedoresSienge,
  listarPedidosSienge,
  listarItensPedidoSienge,
  listarTodosItensSolicitacaoSienge,
  listarContasReceberSienge,
  listarEstoqueSienge,
  listarClientesSienge,
  listarContasPagarSienge,
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

  // ── Clientes Sienge ───────────────────────────────────────────────────────

  importarClientes: protectedProcedure
    .mutation(async ({ ctx }) => {
      const config = await getConfig(ctx)

      let clientes: Awaited<ReturnType<typeof listarClientesSienge>>
      try {
        clientes = await listarClientesSienge(config.subdominio, config.usuario, config.senha)
      } catch (err) {
        await ctx.db.integracaoSync.create({
          data: { integracaoId: config.id, tipo: "IMPORTAR_CLIENTES", status: "ERRO",
                  detalhes: err instanceof Error ? err.message : "Erro desconhecido", registros: 0 },
        })
        throw new TRPCError({ code: "BAD_REQUEST", message: err instanceof Error ? err.message : "Erro ao buscar clientes do Sienge." })
      }

      await ctx.db.integracaoSync.create({
        data: { integracaoId: config.id, tipo: "IMPORTAR_CLIENTES", status: "SUCESSO",
                registros: clientes.length,
                detalhes: `${clientes.length} cliente(s) lido(s) do Sienge.` },
      })

      // Modelo Cliente não existe no Prisma — retornamos os dados brutos
      return { count: clientes.length, dados: clientes.slice(0, 5) }
    }),

  // ── Contas a Pagar Sienge ─────────────────────────────────────────────────

  importarContasPagar: protectedProcedure
    .mutation(async ({ ctx }) => {
      const config = await getConfig(ctx)

      let contas: Awaited<ReturnType<typeof listarContasPagarSienge>>
      try {
        contas = await listarContasPagarSienge(config.subdominio, config.usuario, config.senha)
      } catch (err) {
        await ctx.db.integracaoSync.create({
          data: { integracaoId: config.id, tipo: "IMPORTAR_CONTAS_PAGAR", status: "ERRO",
                  detalhes: err instanceof Error ? err.message : "Erro desconhecido", registros: 0 },
        })
        throw new TRPCError({ code: "BAD_REQUEST", message: err instanceof Error ? err.message : "Erro ao buscar contas a pagar do Sienge." })
      }

      // Buscar todas as obras da empresa que tenham siengeId
      const obras = await ctx.db.obra.findMany({
        where: { empresaId: ctx.session.empresaId, siengeId: { not: null } },
        select: { id: true, siengeId: true },
      })
      const obraPorSiengeId = new Map(obras.map(o => [o.siengeId!, o.id]))

      let criados = 0
      let pulados = 0
      for (const conta of contas) {
        // Precisamos de um obraId — tentar mapear via buildingId se disponível
        // SiengeContaPagar não tem buildingId direto, então usamos a primeira obra vinculada
        // como fallback (se houver obras vinculadas)
        const obraId = obraPorSiengeId.size > 0
          ? [...obraPorSiengeId.values()][0]
          : null

        if (!obraId) { pulados++; continue }

        const descricao = conta.creditorName
          ? `Conta a pagar — ${conta.creditorName}${conta.documentNumber ? ` (Doc: ${conta.documentNumber})` : ""}`
          : `Conta a pagar Sienge #${conta.id}`

        const valor = conta.amount ?? 0
        const data  = conta.dueDate ? new Date(conta.dueDate) : new Date()

        // Verificar duplicata: mesma obra + descrição + valor + data
        const existente = await ctx.db.lancamentoFinanceiro.findFirst({
          where: { obraId, descricao, valor, data },
          select: { id: true },
        })
        if (!existente) {
          await ctx.db.lancamentoFinanceiro.create({
            data: { obraId, tipo: "DESPESA", categoria: "Contas a Pagar (Sienge)", descricao, valor, data },
          })
          criados++
        }
      }

      await ctx.db.integracaoSync.create({
        data: { integracaoId: config.id, tipo: "IMPORTAR_CONTAS_PAGAR", status: "SUCESSO",
                registros: criados,
                detalhes: `${criados} lançamento(s) criado(s), ${pulados} pulado(s) (sem obra vinculada) de ${contas.length} conta(s) no Sienge.` },
      })
      return { criados, pulados, total: contas.length }
    }),

  // ── Vinculação de Obras ───────────────────────────────────────────────────

  vincularObra: protectedProcedure
    .input(z.object({
      obraId:   z.string(),
      siengeId: z.string().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const obra = await ctx.db.obra.findFirst({
        where: { id: input.obraId, empresaId: ctx.session.empresaId },
      })
      if (!obra) throw new TRPCError({ code: "NOT_FOUND", message: "Obra não encontrada." })
      return ctx.db.obra.update({
        where: { id: input.obraId },
        data:  { siengeId: input.siengeId },
      })
    }),

  listarObrasSienge: protectedProcedure
    .query(async ({ ctx }) => {
      const config = await ctx.db.integracaoConfig.findUnique({
        where: { empresaId: ctx.session.empresaId },
      })
      if (!config) return []
      try {
        const senhaDecrypted = isEncrypted(config.senha) ? decrypt(config.senha) : config.senha
        const obras = await listarObras(config.subdominio, config.usuario, senhaDecrypted)
        return obras.map(o => ({ id: String(o.id), nome: o.name ?? o.commercialName ?? `Obra Sienge #${o.id}` }))
      } catch {
        return []
      }
    }),

  listarObrasComVinculo: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.obra.findMany({
        where:   { empresaId: ctx.session.empresaId },
        select:  { id: true, nome: true, siengeId: true, status: true },
        orderBy: { nome: "asc" },
      })
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

  // ── Importar Pedidos de Compra do Sienge ──────────────────────────────────

  importarPedidosCompra: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { empresaId } = ctx.session
      const config = await getConfig(ctx)

      const pedidosSienge = await listarPedidosSienge(config.subdominio, config.usuario, config.senha)

      let criados = 0, pulados = 0

      for (const ps of pedidosSienge) {
        try {
          const jaExiste = await ctx.db.pedidoCompra.findFirst({
            where: { siengePurchaseOrderId: ps.id },
          })
          if (jaExiste) { pulados++; continue }

          const fornecedor = ps.supplierId
            ? await ctx.db.fornecedor.findFirst({
                where: { siengeCreditorId: ps.supplierId, empresaId },
              })
            : null

          if (!fornecedor) { pulados++; continue }

          const itensSienge = await listarItensPedidoSienge(config.subdominio, config.usuario, config.senha, ps.id)

          if (!itensSienge.length) { pulados++; continue }

          const itensParaCriar: Array<{
            materialId: string
            quantidade: number
            precoUnit: number | null
            total: number | null
            unidade: string | null
          }> = []

          for (const item of itensSienge) {
            const nomeNormalizado = item.resourceDescription?.trim() || `Material Sienge #${item.resourceId ?? "unknown"}`

            let material = item.resourceId
              ? await ctx.db.materialCatalogo.findFirst({
                  where: { siengeResourceId: String(item.resourceId), empresaId },
                })
              : null

            if (!material) {
              material = await ctx.db.materialCatalogo.findFirst({
                where: { nome: nomeNormalizado, empresaId },
              })
            }

            if (!material) {
              material = await ctx.db.materialCatalogo.create({
                data: {
                  empresaId,
                  nome: nomeNormalizado,
                  unidade: item.unit || "UN",
                  categoria: "Importado Sienge",
                  siengeResourceId: item.resourceId ? String(item.resourceId) : null,
                },
              })
            }

            itensParaCriar.push({
              materialId: material.id,
              quantidade: item.quantity ?? 1,
              precoUnit: item.unitPrice ?? null,
              total: item.totalPrice ?? null,
              unidade: item.unit || null,
            })
          }

          if (!itensParaCriar.length) { pulados++; continue }

          const statusMap: Record<string, string> = {
            OPEN: "ENVIADO",
            APPROVED: "CONFIRMADO",
            CLOSED: "ENTREGUE",
            CANCELLED: "CANCELADO",
            AUTHORIZED: "CONFIRMADO",
          }
          const statusLocal = statusMap[String(ps.status ?? "OPEN").toUpperCase()] ?? "ENVIADO"

          await ctx.db.pedidoCompra.create({
            data: {
              fornecedorId: fornecedor.id,
              status: statusLocal as "RASCUNHO" | "ENVIADO" | "CONFIRMADO" | "ENTREGUE_PARCIAL" | "ENTREGUE" | "CANCELADO",
              total: ps.totalAmount ?? null,
              observacoes: ps.notes || null,
              siengePurchaseOrderId: ps.id,
              itens: {
                create: itensParaCriar,
              },
            },
          })
          criados++
        } catch (err: unknown) {
          console.warn("[Sienge importarPedidos] erro no pedido", ps.id, ":", err instanceof Error ? err.message : String(err))
          pulados++
        }
      }

      await ctx.db.integracaoSync.create({
        data: {
          integracaoId: config.id,
          tipo: "IMPORTAR_PEDIDOS",
          status: "SUCESSO",
          registros: criados,
          detalhes: `${criados} criados, ${pulados} pulados`,
        },
      })

      return { criados, pulados, total: pedidosSienge.length }
    }),

  // ── Importar Solicitações de Compra do Sienge ─────────────────────────────

  importarSolicitacoesCompra: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { empresaId } = ctx.session
      const config = await getConfig(ctx)

      const todoItens = await listarTodosItensSolicitacaoSienge(config.subdominio, config.usuario, config.senha)

      const porSolicitacao = new Map<number, typeof todoItens>()
      for (const item of todoItens) {
        const id = item.purchaseRequestId
        if (!porSolicitacao.has(id)) porSolicitacao.set(id, [])
        porSolicitacao.get(id)!.push(item)
      }

      let criados = 0, pulados = 0

      const adminUser = await ctx.db.usuario.findFirst({
        where: { empresaId, role: { in: ["DONO", "ADMIN"] } },
        select: { id: true },
      })
      if (!adminUser) return { criados: 0, pulados: porSolicitacao.size, total: 0, erro: "Nenhum admin encontrado" }

      for (const [solicitacaoId, itens] of porSolicitacao) {
        try {
          const jaExiste = await ctx.db.solicitacaoCompra.findFirst({
            where: { siengePurchaseRequestId: solicitacaoId },
          })
          if (jaExiste) { pulados++; continue }

          const buildingId = itens[0]?.buildingId
          if (!buildingId) { pulados++; continue }

          const obra = await ctx.db.obra.findFirst({
            where: { siengeId: String(buildingId), empresaId },
          })
          if (!obra) { pulados++; continue }

          const itensCriar: Array<{
            materialId: string
            quantidade: number
            unidade: string | null
          }> = []

          for (const item of itens) {
            const nomeNorm = item.description?.trim() || "Material Sienge"
            let material = await ctx.db.materialCatalogo.findFirst({
              where: { nome: nomeNorm, empresaId },
            })
            if (!material) {
              material = await ctx.db.materialCatalogo.create({
                data: {
                  empresaId,
                  nome: nomeNorm,
                  unidade: item.unit || "UN",
                  categoria: "Importado Sienge",
                },
              })
            }
            itensCriar.push({
              materialId: material.id,
              quantidade: item.quantity ?? 1,
              unidade: item.unit || null,
            })
          }

          if (!itensCriar.length) { pulados++; continue }

          const statusMapSol: Record<string, string> = {
            PENDING: "PENDENTE",
            APPROVED: "APROVADA",
            REJECTED: "REJEITADA",
            CANCELLED: "CANCELADA",
          }
          const primeiroItem = itens[0]!
          const statusLocal = statusMapSol[String(primeiroItem.status ?? "PENDING").toUpperCase()] ?? "PENDENTE"

          await ctx.db.solicitacaoCompra.create({
            data: {
              obraId: obra.id,
              solicitanteId: adminUser.id,
              status: statusLocal as "RASCUNHO" | "PENDENTE" | "APROVADA" | "REJEITADA" | "CANCELADA",
              urgencia: 2,
              siengePurchaseRequestId: solicitacaoId,
              itens: {
                create: itensCriar,
              },
            },
          })
          criados++
        } catch (err: unknown) {
          console.warn("[Sienge importarSolicitacoes]", err instanceof Error ? err.message : String(err))
          pulados++
        }
      }

      await ctx.db.integracaoSync.create({
        data: {
          integracaoId: config.id,
          tipo: "IMPORTAR_SOLICITACOES",
          status: "SUCESSO",
          registros: criados,
          detalhes: `${criados} criadas, ${pulados} puladas`,
        },
      })

      return { criados, pulados, total: porSolicitacao.size }
    }),

  // ── Importar Contas a Receber do Sienge ───────────────────────────────────

  importarContasReceber: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { empresaId } = ctx.session
      const config = await getConfig(ctx)

      const contasSienge = await listarContasReceberSienge(config.subdominio, config.usuario, config.senha)

      const obras = await ctx.db.obra.findMany({
        where: { empresaId },
        select: { id: true, siengeId: true },
      })
      const obrasBySiengeId = new Map(obras.filter(o => o.siengeId).map(o => [o.siengeId!, o.id]))
      const obraDefault = obras.find(o => o.siengeId)

      let criados = 0, pulados = 0

      for (const conta of contasSienge) {
        try {
          const valor = conta.valor ?? 0
          if (!valor || valor <= 0) { pulados++; continue }

          const siengeObraId = conta.obraId ? String(conta.obraId) : null
          const obraId = (siengeObraId && obrasBySiengeId.get(siengeObraId)) ?? obraDefault?.id
          if (!obraId) { pulados++; continue }

          const descricao = conta.titulo || `Conta a receber — ${conta.clienteNome || "Sienge"}`
          const data = conta.dataVencimento ? new Date(conta.dataVencimento) : new Date()

          const jaExiste = await ctx.db.lancamentoFinanceiro.findFirst({
            where: {
              obraId,
              tipo: "RECEITA",
              descricao,
              valor,
              data: {
                gte: new Date(data.getFullYear(), data.getMonth(), data.getDate()),
                lt:  new Date(data.getFullYear(), data.getMonth(), data.getDate() + 1),
              },
            },
          })
          if (jaExiste) { pulados++; continue }

          await ctx.db.lancamentoFinanceiro.create({
            data: {
              obraId,
              tipo: "RECEITA",
              categoria: conta.clienteNome || "Sienge",
              descricao,
              valor,
              data,
              recorrencia: "NENHUMA",
            },
          })
          criados++
        } catch (err: unknown) {
          console.warn("[Sienge importarContasReceber]", err instanceof Error ? err.message : String(err))
          pulados++
        }
      }

      await ctx.db.integracaoSync.create({
        data: {
          integracaoId: config.id,
          tipo: "IMPORTAR_CONTAS_RECEBER",
          status: "SUCESSO",
          registros: criados,
          detalhes: `${criados} criadas, ${pulados} puladas`,
        },
      })

      return { criados, pulados, total: contasSienge.length }
    }),

  // ── Importar Estoque do Sienge ────────────────────────────────────────────

  importarEstoque: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { empresaId } = ctx.session
      const config = await getConfig(ctx)

      const obras = await ctx.db.obra.findMany({
        where: { empresaId, siengeId: { not: null } },
        select: { id: true, siengeId: true },
      })

      let criados = 0, pulados = 0
      const hoje = new Date()
      const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
      const fimDia   = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1)

      for (const obra of obras) {
        try {
          const estoqueItems = await listarEstoqueSienge(
            config.subdominio, config.usuario, config.senha,
            parseInt(obra.siengeId!),
          )

          for (const item of estoqueItems) {
            try {
              const saldo = item.saldoAtual ?? 0
              if (saldo <= 0) { pulados++; continue }

              const nomeNorm = item.materialNome || `Material #${item.materialId}`
              const siengeResourceId = item.materialId ? String(item.materialId) : null

              let material = siengeResourceId
                ? await ctx.db.materialCatalogo.findFirst({
                    where: { siengeResourceId, empresaId },
                  })
                : null

              if (!material) {
                material = await ctx.db.materialCatalogo.findFirst({
                  where: { nome: nomeNorm, empresaId },
                })
              }
              if (!material) {
                material = await ctx.db.materialCatalogo.create({
                  data: {
                    empresaId,
                    nome: nomeNorm,
                    unidade: item.unidade || "UN",
                    categoria: "Importado Sienge",
                    siengeResourceId,
                  },
                })
              }

              const jaImportado = await ctx.db.movimentacaoMaterial.findFirst({
                where: {
                  obraId:    obra.id,
                  materialId: material.id,
                  observacao: "Importado do Sienge (snapshot)",
                  data: { gte: inicioDia, lt: fimDia },
                },
              })
              if (jaImportado) { pulados++; continue }

              await ctx.db.movimentacaoMaterial.create({
                data: {
                  obraId:    obra.id,
                  materialId: material.id,
                  tipo:       "ENTRADA",
                  quantidade: saldo,
                  data:       new Date(),
                  observacao: "Importado do Sienge (snapshot)",
                },
              })
              criados++
            } catch (err: unknown) {
              console.warn("[Sienge importarEstoque item]", err instanceof Error ? err.message : String(err))
              pulados++
            }
          }
        } catch (err: unknown) {
          console.warn("[Sienge importarEstoque obra]", obra.id, err instanceof Error ? err.message : String(err))
        }
      }

      const total = criados + pulados

      await ctx.db.integracaoSync.create({
        data: {
          integracaoId: config.id,
          tipo: "IMPORTAR_ESTOQUE",
          status: "SUCESSO",
          registros: criados,
          detalhes: `${criados} movimentações de estoque criadas, ${pulados} puladas`,
        },
      })

      return { criados, pulados, total }
    }),

  // ── Sincronizar Tudo (best-effort) ────────────────────────────────────────

  sincronizarTudo: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { empresaId } = ctx.session
      const config = await getConfig(ctx)

      const resultado: Record<string, unknown> = {}
      const erros: string[] = []

      // 1. Obras
      try {
        const obrasData = await listarObras(config.subdominio, config.usuario, config.senha)
        let criadas = 0
        for (const obra of obrasData) {
          const siengeId = String(obra.id)
          const existe = await ctx.db.obra.findFirst({ where: { siengeId, empresaId }, select: { id: true } })
          if (!existe) {
            await ctx.db.obra.create({
              data: { nome: obra.name ?? `Obra Sienge #${obra.id}`, endereco: obra.adress ?? undefined, siengeId, empresaId },
            })
            criadas++
          }
        }
        resultado.obras = { criadas, total: obrasData.length }
      } catch (e: unknown) { erros.push(`obras: ${e instanceof Error ? e.message : String(e)}`) }

      // 2. Fornecedores
      try {
        const fornsData = await listarFornecedoresSienge(config.subdominio, config.usuario, config.senha)
        let criados = 0
        for (const f of fornsData) {
          const existe = await ctx.db.fornecedor.findFirst({
            where: f.cnpj ? { empresaId, cnpj: f.cnpj } : { empresaId, nome: f.name },
            select: { id: true },
          })
          if (!existe) {
            await ctx.db.fornecedor.create({
              data: {
                empresaId,
                nome: f.name,
                cnpj: f.cnpj ?? undefined,
                cidade: f.address?.cityName ?? undefined,
                estado: f.address?.state ?? undefined,
                siengeCreditorId: f.id,
              },
            })
            criados++
          }
        }
        resultado.fornecedores = { criados, total: fornsData.length }
      } catch (e: unknown) { erros.push(`fornecedores: ${e instanceof Error ? e.message : String(e)}`) }

      // 3. Estoque (+ cria materiais)
      try {
        const obras = await ctx.db.obra.findMany({
          where: { empresaId, siengeId: { not: null } },
          select: { id: true, siengeId: true },
        })
        let criados = 0
        for (const obra of obras) {
          const itemsObra = await listarEstoqueSienge(config.subdominio, config.usuario, config.senha, parseInt(obra.siengeId!)).catch(() => [])
          for (const item of itemsObra) {
            try {
              const saldo = item.saldoAtual ?? 0
              if (saldo <= 0) continue
              const nomeNorm = item.materialNome || `Material #${item.materialId}`
              const siengeResourceId = item.materialId ? String(item.materialId) : null
              let material = siengeResourceId
                ? await ctx.db.materialCatalogo.findFirst({ where: { siengeResourceId, empresaId } })
                : null
              if (!material) material = await ctx.db.materialCatalogo.findFirst({ where: { nome: nomeNorm, empresaId } })
              if (!material) {
                await ctx.db.materialCatalogo.create({
                  data: { empresaId, nome: nomeNorm, unidade: item.unidade || "UN", categoria: "Importado Sienge", siengeResourceId },
                })
                criados++
              }
            } catch { /* continue */ }
          }
        }
        resultado.estoque = { materiais: criados }
      } catch (e: unknown) { erros.push(`estoque: ${e instanceof Error ? e.message : String(e)}`) }

      // 4. Pedidos de compra
      try {
        const pedidosSienge = await listarPedidosSienge(config.subdominio, config.usuario, config.senha)
        let criados = 0
        for (const ps of pedidosSienge) {
          try {
            const jaExiste = await ctx.db.pedidoCompra.findFirst({ where: { siengePurchaseOrderId: ps.id } })
            if (jaExiste) continue
            const fornecedor = ps.supplierId
              ? await ctx.db.fornecedor.findFirst({ where: { siengeCreditorId: ps.supplierId, empresaId } })
              : null
            if (!fornecedor) continue
            const itensSienge = await listarItensPedidoSienge(config.subdominio, config.usuario, config.senha, ps.id)
            if (!itensSienge.length) continue
            const itensParaCriar = []
            for (const item of itensSienge) {
              const nomeNorm = item.resourceDescription?.trim() || `Material #${item.resourceId}`
              let material = item.resourceId
                ? await ctx.db.materialCatalogo.findFirst({ where: { siengeResourceId: String(item.resourceId), empresaId } })
                : null
              if (!material) material = await ctx.db.materialCatalogo.findFirst({ where: { nome: nomeNorm, empresaId } })
              if (!material) {
                material = await ctx.db.materialCatalogo.create({
                  data: { empresaId, nome: nomeNorm, unidade: item.unit || "UN", categoria: "Importado Sienge", siengeResourceId: item.resourceId ? String(item.resourceId) : null },
                })
              }
              itensParaCriar.push({ materialId: material.id, quantidade: item.quantity ?? 1, precoUnit: item.unitPrice ?? null, total: item.totalPrice ?? null, unidade: item.unit || null })
            }
            if (!itensParaCriar.length) continue
            const statusMap: Record<string, string> = { OPEN: "ENVIADO", APPROVED: "CONFIRMADO", CLOSED: "ENTREGUE", CANCELLED: "CANCELADO", AUTHORIZED: "CONFIRMADO" }
            await ctx.db.pedidoCompra.create({
              data: {
                fornecedorId: fornecedor.id,
                status: (statusMap[String(ps.status ?? "OPEN").toUpperCase()] ?? "ENVIADO") as "RASCUNHO" | "ENVIADO" | "CONFIRMADO" | "ENTREGUE_PARCIAL" | "ENTREGUE" | "CANCELADO",
                total: ps.totalAmount ?? null,
                observacoes: ps.notes || null,
                siengePurchaseOrderId: ps.id,
                itens: { create: itensParaCriar },
              },
            })
            criados++
          } catch { /* continue */ }
        }
        resultado.pedidos = { criados }
      } catch (e: unknown) { erros.push(`pedidos: ${e instanceof Error ? e.message : String(e)}`) }

      // 5. Contas a receber
      try {
        const contasReceber = await listarContasReceberSienge(config.subdominio, config.usuario, config.senha)
        const obras = await ctx.db.obra.findMany({ where: { empresaId }, select: { id: true, siengeId: true } })
        const obrasBySiengeId = new Map(obras.filter(o => o.siengeId).map(o => [o.siengeId!, o.id]))
        const obraDefault = obras.find(o => o.siengeId)
        let criados = 0
        for (const conta of contasReceber) {
          try {
            const valor = conta.valor ?? 0
            if (!valor || valor <= 0) continue
            const siengeObraId = conta.obraId ? String(conta.obraId) : null
            const obraId = (siengeObraId && obrasBySiengeId.get(siengeObraId)) ?? obraDefault?.id
            if (!obraId) continue
            const descricao = conta.titulo || `Conta a receber — ${conta.clienteNome || "Sienge"}`
            const data = conta.dataVencimento ? new Date(conta.dataVencimento) : new Date()
            const jaExiste = await ctx.db.lancamentoFinanceiro.findFirst({
              where: {
                obraId, tipo: "RECEITA", descricao, valor,
                data: { gte: new Date(data.getFullYear(), data.getMonth(), data.getDate()), lt: new Date(data.getFullYear(), data.getMonth(), data.getDate() + 1) },
              },
            })
            if (jaExiste) continue
            await ctx.db.lancamentoFinanceiro.create({
              data: { obraId, tipo: "RECEITA", categoria: conta.clienteNome || "Sienge", descricao, valor, data, recorrencia: "NENHUMA" },
            })
            criados++
          } catch { /* continue */ }
        }
        resultado.contasReceber = { criados }
      } catch (e: unknown) { erros.push(`contasReceber: ${e instanceof Error ? e.message : String(e)}`) }

      // Registrar sync geral
      await ctx.db.integracaoSync.create({
        data: {
          integracaoId: config.id,
          tipo: "SINCRONIZAR_TUDO",
          status: erros.length === 0 ? "SUCESSO" : "PARCIAL",
          registros: Object.values(resultado).reduce((acc: number, v) => {
            if (typeof v === "object" && v !== null && "criados" in v) return acc + (v as { criados: number }).criados
            if (typeof v === "object" && v !== null && "criadas" in v) return acc + (v as { criadas: number }).criadas
            return acc
          }, 0),
          detalhes: erros.length > 0 ? `Erros: ${erros.join("; ")}` : "Sincronização completa",
        },
      })

      return { ...resultado, erros }
    }),
})
