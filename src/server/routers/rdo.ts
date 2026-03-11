import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { logAudit } from "@/lib/audit"
import { notificarEmpresa } from "@/lib/push"
import { StatusPresencaMO } from "@prisma/client"
import { criarRdoSienge } from "@/lib/sienge/client"
import { decrypt, isEncrypted } from "@/lib/encrypt"

const PODE_VERIFICAR_ENG  = ["ENGENHEIRO", "ADMIN", "DONO"] as const
const PODE_VERIFICAR_CORD = ["ADMIN", "DONO"] as const

const assinaturaSchema = z.object({
  label: z.string().min(1),
  imagemUrl: z.string().optional().nullable(),
  ordem: z.number().int().default(0),
})

export const rdoRouter = createTRPCRouter({
  listar: protectedProcedure
    .input(z.object({ obraId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.rDO.findMany({
        where: {
          obraId: input.obraId,
          obra: { empresaId: ctx.session.empresaId },
        },
        include: {
          atividades: { select: { descricao: true } },
          equipe: { select: { quantidade: true } },
          responsavel: { select: { nome: true } },
        },
        orderBy: { data: "desc" },
      })
    }),

  buscarPorId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const rdo = await ctx.db.rDO.findFirst({
        where: {
          id: input.id,
          obra: { empresaId: ctx.session.empresaId },
        },
        include: {
          atividades: { include: { tarefaObra: { select: { id: true, codigo: true, nome: true } } } },
          equipe: true,
          assinaturas: { orderBy: { ordem: "asc" } },
          materiaisRecebidos: true,
          materiaisUtilizados: true,
          responsavel: { select: { nome: true } },
          verificacoes: {
            orderBy: { criadoEm: "asc" },
            include: { usuario: { select: { nome: true } } },
          },
          obra: {
            select: {
              nome: true,
              endereco: true,
              numContrato: true,
              prazoContratualDias: true,
              dataInicio: true,
            },
          },
        },
      })
      if (!rdo) throw new TRPCError({ code: "NOT_FOUND", message: "RDO não encontrado" })
      return rdo
    }),

  registrarVisualizacao: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const rdo = await ctx.db.rDO.findFirst({
        where: { id: input.id, obra: { empresaId: ctx.session.empresaId } },
      })
      if (!rdo) return
      return ctx.db.rDO.update({
        where: { id: input.id },
        data: { visualizacoes: { increment: 1 } },
      })
    }),

  // ─── Assinaturas ────────────────────────────────────────────────────────────

  salvarAssinaturas: protectedProcedure
    .input(z.object({
      rdoId: z.string(),
      assinaturas: z.array(assinaturaSchema),
    }))
    .mutation(async ({ ctx, input }) => {
      const rdo = await ctx.db.rDO.findFirst({
        where: { id: input.rdoId, obra: { empresaId: ctx.session.empresaId } },
      })
      if (!rdo) throw new TRPCError({ code: "NOT_FOUND" })

      return ctx.db.$transaction(async (tx) => {
        await tx.assinaturaRDO.deleteMany({ where: { rdoId: input.rdoId } })
        if (input.assinaturas.length > 0) {
          await tx.assinaturaRDO.createMany({
            data: input.assinaturas.map((a, i) => ({
              rdoId: input.rdoId,
              label: a.label,
              imagemUrl: a.imagemUrl ?? null,
              ordem: a.ordem ?? i,
            })),
          })
        }
        return tx.assinaturaRDO.findMany({
          where: { rdoId: input.rdoId },
          orderBy: { ordem: "asc" },
        })
      })
    }),

  // ─── Materiais no RDO ────────────────────────────────────────────────────────

  salvarMateriais: protectedProcedure
    .input(z.object({
      rdoId: z.string(),
      recebidos: z.array(z.object({
        materialNome: z.string().min(1),
        quantidade: z.number().positive(),
        unidade: z.string().optional(),
        fornecedor: z.string().optional(),
      })),
      utilizados: z.array(z.object({
        materialNome: z.string().min(1),
        quantidade: z.number().positive(),
        unidade: z.string().optional(),
        localAplicado: z.string().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const rdo = await ctx.db.rDO.findFirst({
        where: { id: input.rdoId, obra: { empresaId: ctx.session.empresaId } },
      })
      if (!rdo) throw new TRPCError({ code: "NOT_FOUND" })

      return ctx.db.$transaction(async (tx) => {
        await tx.rDOMaterialRecebido.deleteMany({ where: { rdoId: input.rdoId } })
        await tx.rDOMaterialUtilizado.deleteMany({ where: { rdoId: input.rdoId } })

        if (input.recebidos.length > 0) {
          await tx.rDOMaterialRecebido.createMany({
            data: input.recebidos.map((m) => ({ ...m, rdoId: input.rdoId })),
          })
        }
        if (input.utilizados.length > 0) {
          await tx.rDOMaterialUtilizado.createMany({
            data: input.utilizados.map((m) => ({ ...m, rdoId: input.rdoId })),
          })
        }
      })
    }),

  criar: protectedProcedure
    .input(z.object({
      obraId: z.string(),
      data: z.string(),
      clima: z.string().optional(),
      temperaturaMin: z.number().optional(),
      temperaturaMax: z.number().optional(),
      ocorreuChuva: z.boolean().default(false),
      observacoes: z.string().optional(),
      valoresCamposPersonalizados: z.record(z.string(), z.unknown()).optional(),
      atividades: z.array(z.object({
        descricao: z.string(),
        quantidade: z.number().optional(),
        unidade: z.string().optional(),
        tarefaObraId: z.string().optional(),
      })),
      equipe: z.array(z.object({
        funcao: z.string(),
        quantidade: z.number().int(),
        statusPresenca: z.nativeEnum(StatusPresencaMO).optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const { obraId, data, atividades, equipe, valoresCamposPersonalizados, ...rest } = input

      const obra = await ctx.db.obra.findFirst({
        where: { id: obraId, empresaId: ctx.session.empresaId },
      })
      if (!obra) throw new TRPCError({ code: "NOT_FOUND", message: "Obra não encontrada" })

      return ctx.db.$transaction(async (tx) => {
        const rdo = await tx.rDO.create({
          data: {
            obraId,
            data: new Date(data),
            responsavelId: ctx.session.userId,
            ...rest,
            ...(valoresCamposPersonalizados ? { valoresCamposPersonalizados: valoresCamposPersonalizados as never } : {}),
          },
        })

        if (atividades.length > 0) {
          await tx.rDOAtividade.createMany({
            data: atividades.map((a) => ({ ...a, rdoId: rdo.id })),
          })
        }

        if (equipe.length > 0) {
          await tx.rDOEquipe.createMany({
            data: equipe.map((e) => ({
              rdoId: rdo.id,
              funcao: e.funcao,
              quantidade: e.quantidade,
              statusPresenca: e.statusPresenca ?? "PRESENTE",
            })),
          })
        }

        await logAudit(ctx, { entityType: "RDO", entityId: rdo.id, obraId, acao: "criou" })
        return rdo
      })
    }),

  duplicar: protectedProcedure
    .input(z.object({ rdoId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const original = await ctx.db.rDO.findFirst({
        where: { id: input.rdoId, obra: { empresaId: ctx.session.empresaId } },
        include: { atividades: true, equipe: true },
      })
      if (!original) throw new TRPCError({ code: "NOT_FOUND" })

      const hoje = new Date()
      hoje.setHours(12, 0, 0, 0)

      return ctx.db.$transaction(async (tx) => {
        const novo = await tx.rDO.create({
          data: {
            obraId:         original.obraId,
            data:           hoje,
            clima:          original.clima,
            temperaturaMin: original.temperaturaMin,
            temperaturaMax: original.temperaturaMax,
            ocorreuChuva:   false,
            observacoes:    undefined,
            responsavelId:  ctx.session.userId,
            status:         "RASCUNHO",
          },
        })
        if (original.equipe.length > 0) {
          await tx.rDOEquipe.createMany({
            data: original.equipe.map(e => ({
              rdoId:          novo.id,
              funcao:         e.funcao,
              quantidade:     e.quantidade,
              statusPresenca: e.statusPresenca,
            })),
          })
        }
        if (original.atividades.length > 0) {
          await tx.rDOAtividade.createMany({
            data: original.atividades.map(a => ({
              rdoId:      novo.id,
              descricao:  a.descricao,
              quantidade: a.quantidade,
              unidade:    a.unidade,
            })),
          })
        }
        return novo
      })
    }),

  buscarSemana: protectedProcedure
    .input(z.object({
      obraId:     z.string(),
      dataInicio: z.string(), // ISO date — início da semana (segunda-feira)
    }))
    .query(async ({ ctx, input }) => {
      const inicio = new Date(input.dataInicio)
      const fim    = new Date(inicio)
      fim.setDate(fim.getDate() + 6)
      fim.setHours(23, 59, 59, 999)

      const obra = await ctx.db.obra.findFirst({
        where: { id: input.obraId, empresaId: ctx.session.empresaId },
        select: { nome: true, endereco: true },
      })
      if (!obra) throw new TRPCError({ code: "NOT_FOUND", message: "Obra não encontrada" })

      const rdos = await ctx.db.rDO.findMany({
        where: {
          obraId: input.obraId,
          data:   { gte: inicio, lte: fim },
        },
        include: {
          atividades:  true,
          equipe:      true,
          responsavel: { select: { nome: true } },
        },
        orderBy: { data: "asc" },
      })

      return { obra, rdos, dataInicio: inicio, dataFim: fim }
    }),

  atualizarStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(["RASCUNHO", "ENVIADO", "EM_REVISAO", "APROVADO", "REJEITADO"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const rdo = await ctx.db.rDO.findFirst({
        where: { id: input.id, obra: { empresaId: ctx.session.empresaId } },
      })
      if (!rdo) throw new TRPCError({ code: "NOT_FOUND" })

      const updated = await ctx.db.rDO.update({
        where: { id: input.id },
        data: { status: input.status },
      })
      await logAudit(ctx, {
        entityType: "RDO", entityId: input.id, obraId: rdo.obraId,
        acao: input.status === "APROVADO" ? "aprovou" : input.status === "REJEITADO" ? "rejeitou" : `status→${input.status}`,
      })
      if (input.status === "APROVADO") {
        notificarEmpresa(ctx.session.empresaId, {
          title: "RDO Aprovado",
          body:  `${ctx.session.nome} aprovou um Relatório Diário de Obra`,
          url:   `/obras/${rdo.obraId}/rdo/${input.id}`,
        }).catch(() => {})
      }

      // Fire-and-forget: sincronizar RDO ao Sienge quando ENVIADO
      if (input.status === "ENVIADO" && !rdo.siengeReportId) {
        const rdoCompleto = await ctx.db.rDO.findFirst({
          where: { id: input.id },
          include: {
            atividades: { select: { descricao: true } },
            equipe: { select: { quantidade: true } },
            obra: { select: { siengeId: true } },
          },
        })
        if (rdoCompleto?.obra?.siengeId) {
          const integracaoConfig = await ctx.db.integracaoConfig.findUnique({
            where: { empresaId: ctx.session.empresaId },
          })
          if (integracaoConfig) {
            const pass = isEncrypted(integracaoConfig.senha) ? decrypt(integracaoConfig.senha) : integracaoConfig.senha
            criarRdoSienge(integracaoConfig.subdominio, integracaoConfig.usuario, pass, {
              buildingId:     parseInt(rdoCompleto.obra.siengeId),
              date:           rdoCompleto.data.toISOString().split("T")[0],
              weather:        rdoCompleto.clima ?? undefined,
              minTemperature: rdoCompleto.temperaturaMin ?? undefined,
              maxTemperature: rdoCompleto.temperaturaMax ?? undefined,
              rain:           rdoCompleto.ocorreuChuva,
              observations:   rdoCompleto.observacoes ?? undefined,
              activities:     rdoCompleto.atividades.map((a) => a.descricao),
              workers:        rdoCompleto.equipe.reduce((s, e) => s + e.quantidade, 0),
            })
              .then((r) => ctx.db.rDO.update({ where: { id: input.id }, data: { siengeReportId: String(r.id) } }))
              .catch(() => {})
          }
        }
      }

      return updated
    }),

  atualizar: protectedProcedure
    .input(z.object({
      id:             z.string(),
      clima:          z.string().optional().nullable(),
      temperaturaMin: z.number().optional().nullable(),
      temperaturaMax: z.number().optional().nullable(),
      ocorreuChuva:   z.boolean().optional(),
      observacoes:    z.string().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.rDO.findFirstOrThrow({
        where: { id: input.id, obra: { empresaId: ctx.session.empresaId } },
      })
      const { id, ...data } = input
      const updated = await ctx.db.rDO.update({ where: { id }, data })
      await logAudit(ctx, { entityType: "RDO", entityId: id, obraId: updated.obraId, acao: "atualizou" })
      return updated
    }),

  verificar: protectedProcedure
    .input(z.object({
      rdoId:     z.string(),
      acao:      z.enum(["APROVAR", "REJEITAR"]),
      comentario: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const role = ctx.session.role as string

      const rdo = await ctx.db.rDO.findFirst({
        where: { id: input.rdoId, obra: { empresaId: ctx.session.empresaId } },
        include: {
          atividades: { where: { tarefaObraId: { not: null } } },
        },
      })
      if (!rdo) throw new TRPCError({ code: "NOT_FOUND" })

      // Engenheiro age sobre ENVIADO
      if (rdo.status === "ENVIADO") {
        if (!(PODE_VERIFICAR_ENG as readonly string[]).includes(role))
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para verificar nesta etapa" })

        if (input.acao === "APROVAR") {
          await ctx.db.$transaction(async (tx) => {
            await tx.rDO.update({ where: { id: input.rdoId }, data: { status: "EM_REVISAO" } })
            await tx.verificacaoRDO.create({
              data: { rdoId: input.rdoId, usuarioId: ctx.session.userId, etapa: "ENGENHEIRO", status: "APROVADO", comentario: input.comentario },
            })
          })
        } else {
          await ctx.db.$transaction(async (tx) => {
            await tx.rDO.update({ where: { id: input.rdoId }, data: { status: "RASCUNHO" } })
            await tx.verificacaoRDO.create({
              data: { rdoId: input.rdoId, usuarioId: ctx.session.userId, etapa: "ENGENHEIRO", status: "REJEITADO", comentario: input.comentario },
            })
          })
        }
        return
      }

      // Coordenador age sobre EM_REVISAO
      if (rdo.status === "EM_REVISAO") {
        if (!(PODE_VERIFICAR_CORD as readonly string[]).includes(role))
          throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para aprovar nesta etapa" })

        if (input.acao === "APROVAR") {
          await ctx.db.$transaction(async (tx) => {
            await tx.rDO.update({ where: { id: input.rdoId }, data: { status: "APROVADO" } })
            await tx.verificacaoRDO.create({
              data: { rdoId: input.rdoId, usuarioId: ctx.session.userId, etapa: "COORDENADOR", status: "APROVADO", comentario: input.comentario },
            })
            // Atualizar tarefas com base nas atividades vinculadas
            for (const atividade of rdo.atividades) {
              if (!atividade.tarefaObraId || !atividade.quantidade) continue
              const tarefa = await tx.tarefaObra.findUnique({ where: { id: atividade.tarefaObraId } })
              if (!tarefa) continue
              const novaExec = tarefa.quantidadeExecutada + atividade.quantidade
              const novaPct  = tarefa.quantidadeTotal > 0
                ? Math.min(100, (novaExec / tarefa.quantidadeTotal) * 100)
                : 0
              await tx.tarefaObra.update({
                where: { id: atividade.tarefaObraId },
                data: {
                  quantidadeExecutada: novaExec,
                  percentual: novaPct,
                  status: novaPct >= 100 ? "CONCLUIDO" : "EM_ANDAMENTO",
                },
              })
            }
          })
          await logAudit(ctx, { entityType: "RDO", entityId: input.rdoId, obraId: rdo.obraId, acao: "aprovou" })
          notificarEmpresa(ctx.session.empresaId, {
            title: "RDO Aprovado",
            body:  `${ctx.session.nome} aprovou o Relatório Diário de Obra`,
            url:   `/obras/${rdo.obraId}/rdo/${input.rdoId}`,
          }).catch(() => {})
        } else {
          await ctx.db.$transaction(async (tx) => {
            await tx.rDO.update({ where: { id: input.rdoId }, data: { status: "RASCUNHO" } })
            await tx.verificacaoRDO.create({
              data: { rdoId: input.rdoId, usuarioId: ctx.session.userId, etapa: "COORDENADOR", status: "REJEITADO", comentario: input.comentario },
            })
          })
          await logAudit(ctx, { entityType: "RDO", entityId: input.rdoId, obraId: rdo.obraId, acao: "rejeitou" })
        }
        return
      }

      throw new TRPCError({ code: "BAD_REQUEST", message: "RDO não está em estado verificável" })
    }),

  excluir: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const rdo = await ctx.db.rDO.findFirstOrThrow({
        where: { id: input.id, obra: { empresaId: ctx.session.empresaId } },
      })
      await logAudit(ctx, { entityType: "RDO", entityId: input.id, obraId: rdo.obraId, acao: "excluiu" })
      return ctx.db.rDO.delete({ where: { id: input.id } })
    }),
})
