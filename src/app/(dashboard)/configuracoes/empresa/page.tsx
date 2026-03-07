"use client"

import { useState, useEffect } from "react"
import { Building2, Save, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { trpc } from "@/lib/trpc/client"

const inputCls = "w-full px-3.5 py-2.5 border border-[var(--border)] rounded-[var(--radius)] text-sm text-[var(--text-primary)] bg-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
const labelCls = "block text-sm font-medium text-[var(--text-primary)] mb-1.5"

const PLANO_LABEL: Record<string, string> = {
  BASICO: "Básico", PRO: "Pro", ENTERPRISE: "Enterprise",
}

export default function ConfigEmpresaPage() {
  const [nome, setNome]   = useState("")
  const [cnpj, setCnpj]   = useState("")
  const [sucesso, setSuc] = useState(false)
  const [erro, setErro]   = useState("")

  const { data: empresa, isLoading } = trpc.configuracoes.buscarEmpresa.useQuery()
  const utils = trpc.useUtils()

  const atualizar = trpc.configuracoes.atualizarEmpresa.useMutation({
    onSuccess: () => {
      utils.configuracoes.buscarEmpresa.invalidate()
      setSuc(true)
      setTimeout(() => setSuc(false), 3000)
    },
    onError: (e) => setErro(e.message),
  })

  useEffect(() => {
    if (empresa) { setNome(empresa.nome); setCnpj(empresa.cnpj ?? "") }
  }, [empresa])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setErro(""); setSuc(false)
    atualizar.mutate({ nome, cnpj: cnpj || undefined })
  }

  return (
    <div className="p-6 max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/configuracoes"
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--muted)] transition-colors cursor-pointer">
          <ChevronLeft size={16} />
        </Link>
        <div>
          <h1 className="text-[var(--text-primary)] font-bold text-lg">Dados da Empresa</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Nome, CNPJ e plano atual</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-3 p-5 border-b border-[var(--border)]">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <Building2 size={18} className="text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--text-primary)]">{isLoading ? "Carregando..." : empresa?.nome ?? "—"}</p>
            <p className="text-[11px] text-[var(--text-muted)]">
              Plano: {PLANO_LABEL[empresa?.plano ?? ""] ?? empresa?.plano ?? "—"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {erro    && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{erro}</div>}
          {sucesso && <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">Dados atualizados com sucesso!</div>}

          <div>
            <label className={labelCls}>Nome da empresa <span className="text-red-500">*</span></label>
            <input required type="text" value={nome} onChange={e => setNome(e.target.value)}
              placeholder="Construtora Exemplo Ltda." className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>CNPJ</label>
            <input type="text" value={cnpj} onChange={e => setCnpj(e.target.value)}
              placeholder="00.000.000/0001-00" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Plano atual</label>
            <input disabled type="text" value={PLANO_LABEL[empresa?.plano ?? ""] ?? "—"}
              className={`${inputCls} opacity-60 cursor-not-allowed`} />
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Para alterar o plano, entre em contato com o suporte.</p>
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
