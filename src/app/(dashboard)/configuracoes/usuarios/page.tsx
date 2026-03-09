"use client"

import { useState } from "react"
import {
  UserPlus, Copy, Check, Trash2, Clock, Mail, Shield,
  Loader2, ChevronDown, ChevronUp, Users, RotateCcw, Save,
  UserX, AlertTriangle,
} from "lucide-react"
import { trpc as api } from "@/lib/trpc/client"
import {
  ROLE_LABELS, ROLE_COLORS, PERMISSAO_LABELS, getDefaultPermissoes, canManageUsers,
} from "@/lib/permissions"
import type { Permissoes } from "@/lib/permissions"
import { PageHeader } from "@/components/shared/PageHeader"
import type { RoleEmpresa } from "@prisma/client"

type RoleConvidavel = "ADMIN" | "ENGENHEIRO" | "MESTRE" | "ENCARREGADO" | "AUXILIAR_ENGENHARIA" | "ALMOXARIFE" | "ESTAGIARIO_ENGENHARIA" | "ESTAGIARIO_ALMOXARIFE"
const ROLES_CONVIDAVEIS: RoleConvidavel[] = [
  "ADMIN", "ENGENHEIRO", "MESTRE", "ENCARREGADO",
  "AUXILIAR_ENGENHARIA", "ALMOXARIFE", "ESTAGIARIO_ENGENHARIA", "ESTAGIARIO_ALMOXARIFE",
]

type Tab = "membros" | "convites"

// ─── Avatar com iniciais ──────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-purple-100 text-purple-700",
  "bg-green-100 text-green-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
]

function AvatarInicial({ nome, size = "md" }: { nome: string; size?: "sm" | "md" }) {
  const idx = nome.charCodeAt(0) % AVATAR_COLORS.length
  const color = AVATAR_COLORS[idx]
  const dim = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm"
  return (
    <div className={`${dim} ${color} rounded-full flex items-center justify-center font-bold flex-shrink-0`}>
      {nome.charAt(0).toUpperCase()}
    </div>
  )
}

// ─── Editor de permissões inline ─────────────────────────────────────────────
interface PermissaoEditorProps {
  usuario: {
    id: string
    nome: string
    email: string
    role: RoleEmpresa
    permissoes: Permissoes
  }
  meuId: string
  meuRole: RoleEmpresa
  onClose: () => void
}

function PermissaoEditor({ usuario, meuId, meuRole, onClose }: PermissaoEditorProps) {
  const utils = api.useUtils()

  const [localRole,   setLocalRole]   = useState<RoleConvidavel>(usuario.role as RoleConvidavel)
  const [localPerms,  setLocalPerms]  = useState<Permissoes>(usuario.permissoes)
  const [confirmDel,  setConfirmDel]  = useState(false)
  const [error,       setError]       = useState("")

  const roleChanged  = localRole  !== usuario.role
  const permsChanged = JSON.stringify(localPerms) !== JSON.stringify(usuario.permissoes)
  const hasChanges   = roleChanged || permsChanged

  const atualizarRoleMut = api.configuracoes.atualizarRole.useMutation({
    onSuccess: () => { utils.configuracoes.listarUsuarios.invalidate(); onClose() },
    onError:   (e) => setError(e.message),
  })

  const atualizarPermsMut = api.configuracoes.atualizarPermissoes.useMutation({
    onSuccess: () => { utils.configuracoes.listarUsuarios.invalidate(); onClose() },
    onError:   (e) => setError(e.message),
  })

  const removerMut = api.configuracoes.removerUsuario.useMutation({
    onSuccess: () => { utils.configuracoes.listarUsuarios.invalidate(); onClose() },
    onError:   (e) => setError(e.message),
  })

  const isSaving = atualizarRoleMut.isPending || atualizarPermsMut.isPending

  function handleRoleChange(newRole: RoleConvidavel) {
    setLocalRole(newRole)
    setLocalPerms(getDefaultPermissoes(newRole))
  }

  function handleTogglePerm(key: keyof Permissoes) {
    setLocalPerms((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function handleRestaurar() {
    setLocalPerms(getDefaultPermissoes(localRole))
  }

  async function handleSalvar() {
    setError("")
    if (roleChanged) {
      await atualizarRoleMut.mutateAsync({ usuarioId: usuario.id, role: localRole })
    } else if (permsChanged) {
      await atualizarPermsMut.mutateAsync({ usuarioId: usuario.id, permissoes: localPerms })
    }
  }

  const ehDono = usuario.role === "DONO"
  const ehProprio = usuario.id === meuId
  const podeManejar = canManageUsers(meuRole as never) && !ehDono

  return (
    <div className="border-t border-border mt-0 pt-4 pb-1 px-1 space-y-4">
      {error && (
        <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs flex items-center gap-2">
          <AlertTriangle size={12} /> {error}
        </div>
      )}

      {ehDono ? (
        <p className="text-xs text-[var(--text-muted)] italic">
          As permissões do dono da empresa não podem ser alteradas.
        </p>
      ) : (
        <>
          {/* Role */}
          <div>
            <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1.5 block">
              Cargo no sistema
            </label>
            <select
              value={localRole}
              onChange={(e) => handleRoleChange(e.target.value as RoleConvidavel)}
              disabled={!podeManejar}
              className="w-full px-3 py-2 border border-border rounded-xl text-sm text-[var(--text-primary)] bg-white outline-none focus:border-[var(--blue)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {ROLES_CONVIDAVEIS.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
            {roleChanged && (
              <p className="text-[10px] text-orange-500 mt-1">
                Ao salvar, as permissões serão redefinidas para o padrão do novo cargo.
              </p>
            )}
          </div>

          {/* Permissões granulares */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                Permissões
              </label>
              {podeManejar && (
                <button
                  onClick={handleRestaurar}
                  className="text-[10px] text-[var(--text-muted)] hover:text-[var(--blue)] flex items-center gap-1 transition-colors"
                >
                  <RotateCcw size={10} /> Restaurar padrão do cargo
                </button>
              )}
            </div>

            <div className="space-y-2">
              {(Object.keys(PERMISSAO_LABELS) as (keyof Permissoes)[]).map((key) => (
                <label
                  key={key}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors ${
                    podeManejar ? "cursor-pointer hover:bg-muted/40" : "cursor-default"
                  } ${localPerms[key] ? "border-blue-200 bg-blue-50/40" : "border-border bg-white"}`}
                >
                  <input
                    type="checkbox"
                    checked={localPerms[key]}
                    onChange={() => handleTogglePerm(key)}
                    disabled={!podeManejar}
                    className="w-4 h-4 rounded accent-[var(--blue)] cursor-pointer disabled:cursor-not-allowed"
                  />
                  <span className="text-sm text-[var(--text-primary)]">{PERMISSAO_LABELS[key]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Ações */}
          {podeManejar && (
            <div className="flex items-center justify-between pt-1">
              {/* Remover usuário */}
              {!ehProprio && (
                <div>
                  {confirmDel ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-500">Confirmar remoção?</span>
                      <button
                        onClick={() => removerMut.mutate({ usuarioId: usuario.id })}
                        disabled={removerMut.isPending}
                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60"
                      >
                        {removerMut.isPending ? <Loader2 size={12} className="animate-spin" /> : "Sim, remover"}
                      </button>
                      <button
                        onClick={() => setConfirmDel(false)}
                        className="px-3 py-1.5 border border-border text-xs rounded-lg hover:bg-muted transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDel(true)}
                      className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 transition-colors"
                    >
                      <UserX size={13} /> Remover da empresa
                    </button>
                  )}
                </div>
              )}

              {/* Salvar */}
              <button
                onClick={handleSalvar}
                disabled={!hasChanges || isSaving}
                className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-[var(--blue)] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-colors"
              >
                {isSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Salvar alterações
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Card de usuário ──────────────────────────────────────────────────────────
interface UserCardProps {
  usuario: {
    id: string
    nome: string
    email: string
    role: RoleEmpresa
    permissoes: Permissoes
    createdAt: Date | string
  }
  meuId: string
  meuRole: RoleEmpresa
  expandido: boolean
  onToggle: () => void
}

function UserCard({ usuario, meuId, meuRole, expandido, onToggle }: UserCardProps) {
  const ehProprio    = usuario.id === meuId
  const ehDono       = usuario.role === "DONO"
  const podeManejar  = canManageUsers(meuRole as never) && !ehDono

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${expandido ? "border-blue-200 shadow-blue-50 shadow-md" : "border-border"}`}>
      <div className="p-4 flex items-center gap-3">
        <AvatarInicial nome={usuario.nome} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{usuario.nome}</p>
            {ehProprio && (
              <span className="text-[10px] bg-muted text-[var(--text-muted)] px-1.5 py-0.5 rounded-full font-medium">
                Você
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] truncate">{usuario.email}</p>
          <div className="mt-1">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${ROLE_COLORS[usuario.role]}`}>
              {ROLE_LABELS[usuario.role]}
            </span>
          </div>
        </div>

        {(podeManejar || ehProprio) && (
          <button
            onClick={onToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors border ${
              expandido
                ? "bg-blue-50 border-blue-200 text-blue-600"
                : "border-border text-[var(--text-muted)] hover:border-[var(--blue)] hover:text-[var(--blue)]"
            }`}
          >
            <Shield size={12} />
            Acessos
            {expandido ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>

      {expandido && (
        <div className="px-4 pb-4">
          <PermissaoEditor
            usuario={usuario}
            meuId={meuId}
            meuRole={meuRole}
            onClose={onToggle}
          />
        </div>
      )}
    </div>
  )
}

// ─── Aba de convites ──────────────────────────────────────────────────────────
function AbaConvites() {
  const [email,  setEmail]  = useState("")
  const [role,   setRole]   = useState<RoleConvidavel>("ENGENHEIRO")
  const [copied, setCopied] = useState<string | null>(null)
  const [error,  setError]  = useState("")

  const utils = api.useUtils()
  const { data: convites, isLoading } = api.convite.listar.useQuery()

  const criarMut = api.convite.criar.useMutation({
    onSuccess: () => { setEmail(""); utils.convite.listar.invalidate(); setError("") },
    onError:   (e) => setError(e.message),
  })

  const revogarMut = api.convite.revogar.useMutation({
    onSuccess: () => utils.convite.listar.invalidate(),
  })

  function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    criarMut.mutate({ email, role })
  }

  function copyLink(token: string) {
    const link = `${window.location.origin}/invite/${token}`
    navigator.clipboard.writeText(link)
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  const pendentes = convites?.filter((c) => !c.usado && new Date(c.expiresAt) > new Date()) ?? []
  const expirados = convites?.filter((c) => !c.usado && new Date(c.expiresAt) <= new Date()) ?? []
  const usados    = convites?.filter((c) => c.usado) ?? []

  return (
    <div className="space-y-6">
      {/* Formulário */}
      <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <UserPlus size={15} className="text-[var(--blue)]" />
          Convidar novo membro
        </h2>

        <form onSubmit={handleCriar} className="space-y-3">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <input
              type="email"
              placeholder="email@empresa.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--blue)] transition-colors"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as RoleConvidavel)}
              className="px-3 py-2.5 border border-border rounded-xl text-sm text-[var(--text-primary)] outline-none focus:border-[var(--blue)] transition-colors bg-white"
            >
              {ROLES_CONVIDAVEIS.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={criarMut.isPending || !email}
            className="w-full py-2.5 bg-[var(--blue)] hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {criarMut.isPending
              ? <><Loader2 size={14} className="animate-spin" /> Gerando link...</>
              : <><UserPlus size={14} /> Gerar link de convite</>}
          </button>
        </form>
      </div>

      {/* Lista de convites */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={22} className="animate-spin text-[var(--text-muted)]" />
        </div>
      ) : (
        <div className="space-y-5">
          {pendentes.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock size={12} /> Aguardando aceite ({pendentes.length})
              </h3>
              <div className="space-y-2">
                {pendentes.map((c) => (
                  <ConviteRow key={c.id} convite={c} onCopy={copyLink} onRevoke={(id) => revogarMut.mutate({ id })} copied={copied} revoking={revogarMut.isPending} />
                ))}
              </div>
            </section>
          )}
          {expirados.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock size={12} /> Expirados ({expirados.length})
              </h3>
              <div className="space-y-2">
                {expirados.map((c) => (
                  <ConviteRow key={c.id} convite={c} onCopy={copyLink} onRevoke={(id) => revogarMut.mutate({ id })} copied={copied} revoking={revogarMut.isPending} expired />
                ))}
              </div>
            </section>
          )}
          {usados.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-green-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Shield size={12} /> Aceitos ({usados.length})
              </h3>
              <div className="space-y-2">
                {usados.map((c) => (
                  <ConviteRow key={c.id} convite={c} onCopy={copyLink} onRevoke={(id) => revogarMut.mutate({ id })} copied={copied} revoking={revogarMut.isPending} used />
                ))}
              </div>
            </section>
          )}
          {convites?.length === 0 && (
            <div className="text-center py-10 text-[var(--text-muted)] text-sm">
              Nenhum convite enviado ainda.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Linha de convite ─────────────────────────────────────────────────────────
interface ConviteRowProps {
  convite:  { id: string; email: string; role: RoleEmpresa; token: string; expiresAt: Date | string }
  onCopy:   (token: string) => void
  onRevoke: (id: string) => void
  copied:   string | null
  revoking: boolean
  expired?: boolean
  used?:    boolean
}

function ConviteRow({ convite, onCopy, onRevoke, copied, revoking, expired, used }: ConviteRowProps) {
  const expiresAt = new Date(convite.expiresAt)
  const daysLeft  = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-3.5 flex items-center gap-3 ${expired ? "border-red-100 opacity-70" : used ? "border-green-100" : "border-border"}`}>
      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
        <Mail size={14} className="text-[var(--text-muted)]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{convite.email}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${ROLE_COLORS[convite.role]}`}>
            {ROLE_LABELS[convite.role]}
          </span>
          {used    && <span className="text-[10px] text-green-600 font-medium">Aceito</span>}
          {expired && <span className="text-[10px] text-red-500 font-medium">Expirado</span>}
          {!used && !expired && <span className="text-[10px] text-[var(--text-muted)]">Expira em {daysLeft}d</span>}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {!used && !expired && (
          <button onClick={() => onCopy(convite.token)} title="Copiar link" className="p-2 rounded-lg hover:bg-muted text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            {copied === convite.token ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
        )}
        <button onClick={() => onRevoke(convite.id)} disabled={revoking} title="Remover convite" className="p-2 rounded-lg hover:bg-red-50 text-[var(--text-muted)] hover:text-red-500 transition-colors disabled:opacity-50">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function UsuariosPage() {
  const [tab,       setTab]       = useState<Tab>("membros")
  const [expandido, setExpandido] = useState<string | null>(null)

  const { data: perfil }   = api.configuracoes.buscarPerfil.useQuery()
  const { data: usuarios, isLoading } = api.configuracoes.listarUsuarios.useQuery()

  const meuId   = perfil?.id   ?? ""
  const meuRole = (perfil?.role ?? "ENCARREGADO") as RoleEmpresa

  function toggleUser(id: string) {
    setExpandido((prev) => (prev === id ? null : id))
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader
        title="Usuários"
        subtitle="Gerencie membros da equipe e seus acessos"
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6">
        <button
          onClick={() => setTab("membros")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            tab === "membros"
              ? "bg-white text-[var(--text-primary)] shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          <Users size={14} />
          Membros da equipe
          {usuarios && (
            <span className="bg-muted text-[var(--text-muted)] text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
              {usuarios.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("convites")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            tab === "convites"
              ? "bg-white text-[var(--text-primary)] shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          <UserPlus size={14} />
          Convites
        </button>
      </div>

      {/* Aba Membros */}
      {tab === "membros" && (
        <>
          {canManageUsers(meuRole as never) && (
            <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 flex items-start gap-2">
              <Shield size={13} className="mt-0.5 flex-shrink-0" />
              <span>
                Clique em <strong>Acessos</strong> em qualquer membro para gerenciar o cargo e as permissões individuais.
              </span>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 size={22} className="animate-spin text-[var(--text-muted)]" />
            </div>
          ) : (
            <div className="space-y-3">
              {usuarios?.map((u) => (
                <UserCard
                  key={u.id}
                  usuario={u as Parameters<typeof UserCard>[0]["usuario"]}
                  meuId={meuId}
                  meuRole={meuRole}
                  expandido={expandido === u.id}
                  onToggle={() => toggleUser(u.id)}
                />
              ))}
              {(!usuarios || usuarios.length === 0) && (
                <div className="text-center py-12 text-[var(--text-muted)] text-sm">
                  Nenhum membro encontrado.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Aba Convites */}
      {tab === "convites" && <AbaConvites />}
    </div>
  )
}
