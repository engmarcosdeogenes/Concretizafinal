import { z } from "zod"
import { TRPCError } from "@trpc/server"
import { createTRPCRouter, protectedProcedure } from "../trpc"
import { canManageUsers, getDefaultPermissoes } from "@/lib/permissions"

const permissoesSchema = z.object({
  verFinanceiro:       z.boolean(),
  aprovarRdo:          z.boolean(),
  aprovarFvs:          z.boolean(),
  gerenciarEquipe:     z.boolean(),
  criarSolicitacoes:   z.boolean(),
  gerenciarDocumentos: z.boolean(),
  gerarRelatorios:     z.boolean(),
})

export const configuracoesRouter = createTRPCRouter({

  buscarEmpresa: protectedProcedure
    .query(async ({ ctx }) => {
      const { empresaId } = ctx.session
      return ctx.db.empresa.findUnique({
        where: { id: empresaId },
        select: { id: true, nome: true, cnpj: true, plano: true, logoUrl: true, createdAt: true },
      })
    }),

  atualizarEmpresa: protectedProcedure
    .input(z.object({
      nome:  z.string().min(1),
      cnpj:  z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { empresaId } = ctx.session
      return ctx.db.empresa.update({
        where: { id: empresaId },
        data: { nome: input.nome, cnpj: input.cnpj ?? null },
      })
    }),

  buscarPerfil: protectedProcedure
    .query(async ({ ctx }) => {
      const { userId } = ctx.session
      return ctx.db.usuario.findUnique({
        where: { id: userId },
        select: { id: true, nome: true, email: true, telefone: true, role: true, avatarUrl: true, createdAt: true },
      })
    }),

  atualizarPerfil: protectedProcedure
    .input(z.object({
      nome:     z.string().min(1),
      telefone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx.session
      return ctx.db.usuario.update({
        where: { id: userId },
        data: { nome: input.nome, telefone: input.telefone ?? null },
      })
    }),

  // ─── Gestão de usuários da empresa ─────────────────────────────────────────

  listarUsuarios: protectedProcedure
    .query(async ({ ctx }) => {
      const usuarios = await ctx.db.usuario.findMany({
        where:   { empresaId: ctx.session.empresaId, ativo: true },
        select:  { id: true, nome: true, email: true, role: true, avatarUrl: true, permissoes: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      })
      return usuarios.map((u) => ({
        ...u,
        permissoes: (u.permissoes ?? getDefaultPermissoes(u.role)) as ReturnType<typeof getDefaultPermissoes>,
      }))
    }),

  atualizarPermissoes: protectedProcedure
    .input(z.object({
      usuarioId:  z.string(),
      permissoes: permissoesSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      if (!canManageUsers(ctx.session.role as never)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para gerenciar usuários" })
      }
      const target = await ctx.db.usuario.findFirst({
        where:  { id: input.usuarioId, empresaId: ctx.session.empresaId },
        select: { id: true, role: true },
      })
      if (!target) throw new TRPCError({ code: "NOT_FOUND" })
      if (target.role === "DONO") throw new TRPCError({ code: "FORBIDDEN", message: "Não é possível alterar permissões do dono" })

      return ctx.db.usuario.update({
        where: { id: input.usuarioId },
        data:  { permissoes: input.permissoes },
      })
    }),

  atualizarRole: protectedProcedure
    .input(z.object({
      usuarioId: z.string(),
      role:      z.enum(["ADMIN", "ENGENHEIRO", "MESTRE", "ENCARREGADO", "AUXILIAR_ENGENHARIA", "ALMOXARIFE", "ESTAGIARIO_ENGENHARIA", "ESTAGIARIO_ALMOXARIFE"]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!canManageUsers(ctx.session.role as never)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para gerenciar usuários" })
      }
      const target = await ctx.db.usuario.findFirst({
        where:  { id: input.usuarioId, empresaId: ctx.session.empresaId },
        select: { id: true, role: true },
      })
      if (!target) throw new TRPCError({ code: "NOT_FOUND" })
      if (target.role === "DONO") throw new TRPCError({ code: "FORBIDDEN", message: "Não é possível alterar o cargo do dono" })

      return ctx.db.usuario.update({
        where: { id: input.usuarioId },
        data:  { role: input.role, permissoes: getDefaultPermissoes(input.role) },
      })
    }),

  removerUsuario: protectedProcedure
    .input(z.object({ usuarioId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!canManageUsers(ctx.session.role as never)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Sem permissão para remover usuários" })
      }
      if (input.usuarioId === ctx.session.userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Não é possível remover a si mesmo" })
      }
      const target = await ctx.db.usuario.findFirst({
        where:  { id: input.usuarioId, empresaId: ctx.session.empresaId },
        select: { id: true, role: true },
      })
      if (!target) throw new TRPCError({ code: "NOT_FOUND" })
      if (target.role === "DONO") throw new TRPCError({ code: "FORBIDDEN", message: "Não é possível remover o dono da empresa" })

      return ctx.db.usuario.update({
        where: { id: input.usuarioId },
        data:  { ativo: false },
      })
    }),
})
