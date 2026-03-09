import type { RoleEmpresa } from "@prisma/client"

// Hierarquia de roles (maior número = mais permissão)
const ROLE_LEVEL: Record<RoleEmpresa, number> = {
  ESTAGIARIO_ALMOXARIFE:  0,
  ESTAGIARIO_ENGENHARIA:  0,
  ALMOXARIFE:             1,
  AUXILIAR_ENGENHARIA:    1,
  ENCARREGADO:            2,
  MESTRE:                 3,
  ENGENHEIRO:             4,
  ADMIN:                  5,
  DONO:                   6,
}

export function hasRole(userRole: RoleEmpresa, required: RoleEmpresa): boolean {
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[required]
}

export function canManageUsers(role: RoleEmpresa): boolean {
  return hasRole(role, "ADMIN")
}

export function canInviteMembers(role: RoleEmpresa): boolean {
  return hasRole(role, "ADMIN")
}

export function canManageObras(role: RoleEmpresa): boolean {
  return hasRole(role, "ENGENHEIRO")
}

export function canViewFinanceiro(role: RoleEmpresa): boolean {
  return hasRole(role, "ADMIN")
}

export const ROLE_LABELS: Record<RoleEmpresa, string> = {
  DONO:                   "Dono",
  ADMIN:                  "Administrador",
  ENGENHEIRO:             "Engenheiro",
  MESTRE:                 "Mestre de Obras",
  ENCARREGADO:            "Encarregado",
  AUXILIAR_ENGENHARIA:    "Auxiliar de Engenharia",
  ALMOXARIFE:             "Almoxarife",
  ESTAGIARIO_ENGENHARIA:  "Estagiário de Engenharia",
  ESTAGIARIO_ALMOXARIFE:  "Estagiário de Almoxarifado",
}

export const ROLE_COLORS: Record<RoleEmpresa, string> = {
  DONO:                   "bg-purple-50 text-purple-700",
  ADMIN:                  "bg-blue-50 text-blue-700",
  ENGENHEIRO:             "bg-green-50 text-green-700",
  MESTRE:                 "bg-yellow-50 text-yellow-700",
  ENCARREGADO:            "bg-slate-50 text-slate-600",
  AUXILIAR_ENGENHARIA:    "bg-teal-50 text-teal-700",
  ALMOXARIFE:             "bg-orange-50 text-orange-700",
  ESTAGIARIO_ENGENHARIA:  "bg-cyan-50 text-cyan-700",
  ESTAGIARIO_ALMOXARIFE:  "bg-rose-50 text-rose-600",
}

// ─── Permissões granulares ────────────────────────────────────────────────────

export type Permissoes = {
  verFinanceiro:       boolean
  aprovarRdo:          boolean
  aprovarFvs:          boolean
  gerenciarEquipe:     boolean
  criarSolicitacoes:   boolean
  gerenciarDocumentos: boolean
  gerarRelatorios:     boolean
}

const DEFAULTS: Record<RoleEmpresa, Permissoes> = {
  DONO: {
    verFinanceiro: true, aprovarRdo: true, aprovarFvs: true,
    gerenciarEquipe: true, criarSolicitacoes: true,
    gerenciarDocumentos: true, gerarRelatorios: true,
  },
  ADMIN: {
    verFinanceiro: true, aprovarRdo: true, aprovarFvs: true,
    gerenciarEquipe: true, criarSolicitacoes: true,
    gerenciarDocumentos: true, gerarRelatorios: true,
  },
  ENGENHEIRO: {
    verFinanceiro: true, aprovarRdo: true, aprovarFvs: true,
    gerenciarEquipe: true, criarSolicitacoes: true,
    gerenciarDocumentos: true, gerarRelatorios: true,
  },
  MESTRE: {
    verFinanceiro: false, aprovarRdo: false, aprovarFvs: false,
    gerenciarEquipe: true, criarSolicitacoes: true,
    gerenciarDocumentos: false, gerarRelatorios: true,
  },
  ENCARREGADO: {
    verFinanceiro: false, aprovarRdo: false, aprovarFvs: false,
    gerenciarEquipe: false, criarSolicitacoes: false,
    gerenciarDocumentos: false, gerarRelatorios: false,
  },
  // ── Novos roles ──────────────────────────────────────────────────────────────
  AUXILIAR_ENGENHARIA: {
    verFinanceiro:    false,
    aprovarRdo:       false,
    aprovarFvs:       false,
    gerenciarEquipe:  false,
    criarSolicitacoes: false,
    gerenciarDocumentos: false,
    gerarRelatorios:  false,
  },
  ALMOXARIFE: {
    verFinanceiro:    false,
    aprovarRdo:       false,
    aprovarFvs:       false,
    gerenciarEquipe:  false,
    criarSolicitacoes: true,   // pode criar solicitações de compra
    gerenciarDocumentos: true, // gerencia documentos de materiais
    gerarRelatorios:  true,    // gera relatórios de estoque
  },
  ESTAGIARIO_ENGENHARIA: {
    verFinanceiro:    false,
    aprovarRdo:       false,
    aprovarFvs:       false,
    gerenciarEquipe:  false,
    criarSolicitacoes: false,
    gerenciarDocumentos: false,
    gerarRelatorios:  false,
  },
  ESTAGIARIO_ALMOXARIFE: {
    verFinanceiro:    false,
    aprovarRdo:       false,
    aprovarFvs:       false,
    gerenciarEquipe:  false,
    criarSolicitacoes: false,
    gerenciarDocumentos: false,
    gerarRelatorios:  false,
  },
}

export function getDefaultPermissoes(role: RoleEmpresa): Permissoes {
  return { ...DEFAULTS[role] }
}

export const PERMISSAO_LABELS: Record<keyof Permissoes, string> = {
  verFinanceiro:       "Ver dados financeiros",
  aprovarRdo:          "Aprovar / Rejeitar RDO",
  aprovarFvs:          "Aprovar / Rejeitar FVS",
  gerenciarEquipe:     "Gerenciar equipe",
  criarSolicitacoes:   "Criar solicitações de compra",
  gerenciarDocumentos: "Gerenciar documentos",
  gerarRelatorios:     "Gerar relatórios PDF",
}
