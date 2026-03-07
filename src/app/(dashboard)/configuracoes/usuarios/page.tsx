"use client"

import { useState } from "react"
import { UserPlus, Copy, Check, Trash2, Clock, Mail, Shield, Loader2 } from "lucide-react"
import { trpc as api } from "@/lib/trpc/client"
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/permissions"
import { PageHeader } from "@/components/shared/PageHeader"
import type { RoleEmpresa } from "@prisma/client"

type RoleConvidavel = "ADMIN" | "ENGENHEIRO" | "MESTRE" | "ENCARREGADO"
const ROLES_CONVIDAVEIS: RoleConvidavel[] = ["ADMIN", "ENGENHEIRO", "MESTRE", "ENCARREGADO"]

export default function UsuariosPage() {
  const [email,   setEmail]   = useState("")
  const [role,    setRole]    = useState<RoleConvidavel>("ENGENHEIRO")
  const [copied,  setCopied]  = useState<string | null>(null)
  const [error,   setError]   = useState("")

  const utils = api.useUtils()

  const { data: convites, isLoading } = api.convite.listar.useQuery()

  const criarMutation = api.convite.criar.useMutation({
    onSuccess: () => {
      setEmail("")
      utils.convite.listar.invalidate()
      setError("")
    },
    onError: (e) => setError(e.message),
  })

  const revogarMutation = api.convite.revogar.useMutation({
    onSuccess: () => utils.convite.listar.invalidate(),
  })

  function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    criarMutation.mutate({ email, role })
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
    <div className="p-6 max-w-2xl mx-auto">
      <PageHeader
        title="Usuários"
        subtitle="Convide membros para a equipe e gerencie acessos"
      />

      {/* Formulário de convite */}
      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <UserPlus size={16} className="text-[var(--blue)]" />
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
              className="flex-1 px-4 py-2.5 border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--blue)] transition-colors"
            />

            <select
              value={role}
              onChange={(e) => setRole(e.target.value as RoleConvidavel)}
              className="px-3 py-2.5 border border-[var(--border)] rounded-xl text-sm text-[var(--text-primary)] outline-none focus:border-[var(--blue)] transition-colors bg-white"
            >
              {ROLES_CONVIDAVEIS.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={criarMutation.isPending || !email}
            className="w-full py-2.5 bg-[var(--blue)] hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {criarMutation.isPending ? (
              <><Loader2 size={14} className="animate-spin" /> Gerando link...</>
            ) : (
              <><UserPlus size={14} /> Gerar link de convite</>
            )}
          </button>
        </form>
      </div>

      {/* Lista de convites */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
        </div>
      ) : (
        <div className="space-y-6">

          {/* Pendentes */}
          {pendentes.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock size={12} />
                Aguardando aceite ({pendentes.length})
              </h3>
              <div className="space-y-2">
                {pendentes.map((c) => (
                  <ConviteRow
                    key={c.id}
                    convite={c}
                    onCopy={copyLink}
                    onRevoke={(id) => revogarMutation.mutate({ id })}
                    copied={copied}
                    revoking={revogarMutation.isPending}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Expirados */}
          {expirados.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Clock size={12} />
                Expirados ({expirados.length})
              </h3>
              <div className="space-y-2">
                {expirados.map((c) => (
                  <ConviteRow
                    key={c.id}
                    convite={c}
                    onCopy={copyLink}
                    onRevoke={(id) => revogarMutation.mutate({ id })}
                    copied={copied}
                    revoking={revogarMutation.isPending}
                    expired
                  />
                ))}
              </div>
            </section>
          )}

          {/* Usados */}
          {usados.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-green-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Shield size={12} />
                Aceitos ({usados.length})
              </h3>
              <div className="space-y-2">
                {usados.map((c) => (
                  <ConviteRow
                    key={c.id}
                    convite={c}
                    onCopy={copyLink}
                    onRevoke={(id) => revogarMutation.mutate({ id })}
                    copied={copied}
                    revoking={revogarMutation.isPending}
                    used
                  />
                ))}
              </div>
            </section>
          )}

          {convites?.length === 0 && (
            <div className="text-center py-12 text-[var(--text-muted)] text-sm">
              Nenhum convite enviado ainda.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

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
    <div className={`bg-white rounded-xl border shadow-sm p-4 flex items-center gap-3 ${expired ? "border-red-100 opacity-70" : used ? "border-green-100" : "border-[var(--border)]"}`}>
      <div className="w-8 h-8 bg-[var(--muted)] rounded-full flex items-center justify-center flex-shrink-0">
        <Mail size={14} className="text-[var(--text-muted)]" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{convite.email}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${ROLE_COLORS[convite.role]}`}>
            {ROLE_LABELS[convite.role]}
          </span>
          {used && (
            <span className="text-[10px] text-green-600 font-medium">Aceito</span>
          )}
          {expired && (
            <span className="text-[10px] text-red-500 font-medium">Expirado</span>
          )}
          {!used && !expired && (
            <span className="text-[10px] text-[var(--text-muted)]">
              Expira em {daysLeft}d
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        {!used && !expired && (
          <button
            onClick={() => onCopy(convite.token)}
            title="Copiar link"
            className="p-2 rounded-lg hover:bg-[var(--muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            {copied === convite.token ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
        )}
        <button
          onClick={() => onRevoke(convite.id)}
          disabled={revoking}
          title="Remover convite"
          className="p-2 rounded-lg hover:bg-red-50 text-[var(--text-muted)] hover:text-red-500 transition-colors disabled:opacity-50"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
