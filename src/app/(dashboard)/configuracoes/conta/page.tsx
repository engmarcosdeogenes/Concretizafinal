"use client"

import { useState, useEffect } from "react"
import { User, Save, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { trpc } from "@/lib/trpc/client"

const inputCls = "w-full px-3.5 py-2.5 border border-[var(--border)] rounded-[var(--radius)] text-sm text-[var(--text-primary)] bg-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
const labelCls = "block text-sm font-medium text-[var(--text-primary)] mb-1.5"

const ROLE_LABEL: Record<string, string> = {
  DONO: "Dono", ADMIN: "Administrador", ENGENHEIRO: "Engenheiro",
  MESTRE: "Mestre de Obras", ENCARREGADO: "Encarregado",
}

export default function ConfigContaPage() {
  const [nome, setNome]         = useState("")
  const [telefone, setTelefone] = useState("")
  const [sucesso, setSuc]       = useState(false)
  const [erro, setErro]         = useState("")

  const { data: perfil, isLoading } = trpc.configuracoes.buscarPerfil.useQuery()
  const utils = trpc.useUtils()

  const atualizar = trpc.configuracoes.atualizarPerfil.useMutation({
    onSuccess: () => {
      utils.configuracoes.buscarPerfil.invalidate()
      setSuc(true)
      setTimeout(() => setSuc(false), 3000)
    },
    onError: (e) => setErro(e.message),
  })

  useEffect(() => {
    if (perfil) { setNome(perfil.nome); setTelefone(perfil.telefone ?? "") }
  }, [perfil])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setErro(""); setSuc(false)
    atualizar.mutate({ nome, telefone: telefone || undefined })
  }

  const initials = perfil?.nome
    ? perfil.nome.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
    : "?"

  return (
    <div className="p-6 max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/configuracoes"
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--muted)] transition-colors cursor-pointer">
          <ChevronLeft size={16} />
        </Link>
        <div>
          <h1 className="text-[var(--text-primary)] font-bold text-lg">Minha Conta</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Perfil, nome e contato</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-4 p-5 border-b border-[var(--border)]">
          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">{isLoading ? "…" : initials}</span>
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--text-primary)]">{perfil?.nome ?? "—"}</p>
            <p className="text-[11px] text-[var(--text-muted)]">
              {perfil?.email} · {ROLE_LABEL[perfil?.role ?? ""] ?? perfil?.role}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {erro    && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{erro}</div>}
          {sucesso && <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">Perfil atualizado!</div>}

          <div>
            <label className={labelCls}>Nome completo <span className="text-red-500">*</span></label>
            <input required type="text" value={nome} onChange={e => setNome(e.target.value)}
              placeholder="Seu nome" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Telefone</label>
            <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)}
              placeholder="(11) 99999-9999" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>E-mail</label>
            <input disabled type="email" value={perfil?.email ?? ""}
              className={`${inputCls} opacity-60 cursor-not-allowed`} />
            <p className="text-[11px] text-[var(--text-muted)] mt-1">O e-mail é gerenciado pelo Supabase Auth.</p>
          </div>

          <div>
            <label className={labelCls}>Função</label>
            <input disabled type="text" value={ROLE_LABEL[perfil?.role ?? ""] ?? "—"}
              className={`${inputCls} opacity-60 cursor-not-allowed`} />
          </div>

          <div className="pt-2">
            <button type="submit" disabled={atualizar.isPending}
              className="btn-orange min-h-[44px] disabled:opacity-60 cursor-pointer">
              <Save size={15} />
              {atualizar.isPending ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
