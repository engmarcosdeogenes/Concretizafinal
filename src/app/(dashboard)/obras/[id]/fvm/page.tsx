"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Package, Plus, CheckCircle2, XCircle, Clock, Truck, RotateCcw, Search, Trash2, Download } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatDataCurta } from "@/lib/format"
import { exportarExcel } from "@/lib/excel"
import { useRole } from "@/hooks/useRole"

type StatusFVM = "PENDENTE" | "RECEBIDO" | "APROVADO" | "REJEITADO" | "DEVOLVIDO"

const STATUS_MAP: Record<StatusFVM, { label: string; cls: string; Icon: React.ElementType }> = {
  PENDENTE:  { label: "Pendente",  cls: "bg-slate-50 text-slate-600 border-slate-200",    Icon: Clock },
  RECEBIDO:  { label: "Recebido",  cls: "bg-blue-50 text-blue-700 border-blue-200",       Icon: Package },
  APROVADO:  { label: "Aprovado",  cls: "bg-green-50 text-green-700 border-green-200",    Icon: CheckCircle2 },
  REJEITADO: { label: "Rejeitado", cls: "bg-red-50 text-red-600 border-red-200",          Icon: XCircle },
  DEVOLVIDO: { label: "Devolvido", cls: "bg-orange-50 text-orange-700 border-orange-200", Icon: RotateCcw },
}

function StatusChip({ status }: { status: string }) {
  const s = STATUS_MAP[status as StatusFVM] ?? STATUS_MAP.PENDENTE
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap ${s.cls}`}>
      <s.Icon size={9} />
      {s.label}
    </span>
  )
}

export default function FvmPage() {
  const params = useParams()
  const obraId = params.id as string

  const [busca, setBusca] = useState("")
  const [statusFiltro, setStatusFiltro] = useState("")

  const { canDelete, canFvs } = useRole()
  const utils = trpc.useUtils()
  const { data: fvms = [], isLoading } = trpc.fvm.listar.useQuery({ obraId })
  const excluir = trpc.fvm.excluir.useMutation({
    onSuccess: () => { utils.fvm.listar.invalidate({ obraId }); toast.success("FVM excluída") },
    onError: (e) => toast.error(e.message),
  })

  const fvmsFiltradas = fvms.filter((f) => {
    const matchBusca = !busca || f.material.toLowerCase().includes(busca.toLowerCase()) || (f.codigo ?? "").toLowerCase().includes(busca.toLowerCase()) || (f.fornecedorNome ?? "").toLowerCase().includes(busca.toLowerCase())
    const matchStatus = !statusFiltro || f.status === statusFiltro
    return matchBusca && matchStatus
  })

  const total     = fvms.length
  const aprovados = fvms.filter(f => f.status === "APROVADO").length
  const rejeitados = fvms.filter(f => f.status === "REJEITADO" || f.status === "DEVOLVIDO").length
  const pendentes = fvms.filter(f => f.status === "PENDENTE" || f.status === "RECEBIDO").length

  function handleExcluir(e: React.MouseEvent, id: string, material: string) {
    e.preventDefault()
    if (!confirm(`Excluir FVM "${material}"? Esta ação não pode ser desfeita.`)) return
    excluir.mutate({ id })
  }

  return (
    <div className="p-6 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Fichas de Verificação de Material</h2>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">
            Controle de recebimento e conformidade dos materiais entregues na obra
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {fvms.length > 0 && (
            <button
              onClick={() => exportarExcel(fvms.map(f => ({
                Código:     f.codigo ?? "",
                Material:   f.material,
                Fornecedor: f.fornecedorNome ?? "",
                Quantidade: f.quantidade,
                Unidade:    f.unidade ?? "",
                Status:     f.status,
                Data:       formatDataCurta(f.data),
                NF:         f.notaFiscal ?? "",
              })), "FVM")}
              className="btn-ghost min-h-[44px] cursor-pointer"
              title="Exportar para Excel"
            >
              <Download size={15} />
              Excel
            </button>
          )}
          {canFvs && (
            <Link href={`/obras/${obraId}/fvm/nova`} className="btn-orange min-h-[44px] cursor-pointer">
              <Plus size={15} />
              Nova FVM
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Recebidos",  value: total,     color: "text-blue-600",  sub: "materiais verificados" },
          { label: "Aprovados",        value: aprovados, color: "text-green-600", sub: total > 0 ? `${Math.round(aprovados / total * 100)}% do total` : "—" },
          { label: "Reprovados",       value: rejeitados,color: "text-red-500",   sub: "devolução/substituição" },
          { label: "Pendentes",        value: pendentes, color: "text-amber-600", sub: "aguardando inspeção" },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className="bg-white rounded-2xl border border-border shadow-sm p-4">
            <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
            <p className="text-xs font-medium text-[var(--text-primary)] mt-0.5">{label}</p>
            <p className="text-[10px] text-[var(--text-muted)]">{sub}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-white border border-border p-2 rounded-xl shadow-sm">
        <label className="flex items-center gap-2 px-3 h-[40px] flex-1">
          <Search size={16} className="text-[var(--text-muted)]" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por material, código ou fornecedor..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </label>
        <div className="hidden md:block w-px h-6 bg-border" />
        <select
          value={statusFiltro}
          onChange={e => setStatusFiltro(e.target.value)}
          className="h-10 px-3 bg-transparent border border-border rounded-xl text-sm font-medium text-[var(--text-primary)] outline-none cursor-pointer"
        >
          <option value="">Todos os status</option>
          <option value="PENDENTE">Pendente</option>
          <option value="RECEBIDO">Recebido</option>
          <option value="APROVADO">Aprovado</option>
          <option value="REJEITADO">Rejeitado</option>
          <option value="DEVOLVIDO">Devolvido</option>
        </select>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="grid grid-cols-[70px_1fr_130px_90px_130px_44px] gap-3 px-5 py-3 bg-muted border-b border-border">
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Código</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Material / Fornecedor</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Quantidade</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Recebimento</span>
          <span className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">Status</span>
          <span />
        </div>

        {isLoading && (
          <div className="py-12 text-center text-sm text-[var(--text-muted)]">Carregando...</div>
        )}

        {!isLoading && fvmsFiltradas.length === 0 && (
          <div className="py-12 text-center">
            <Package size={32} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
            <p className="text-sm font-medium text-[var(--text-primary)]">Nenhum material encontrado</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Registre a primeira ficha de verificação de material</p>
          </div>
        )}

        {fvmsFiltradas.map((fvm) => (
          <div
            key={fvm.id}
            className="grid grid-cols-[70px_1fr_130px_90px_130px_44px] gap-3 px-5 py-4 border-b border-border last:border-0 hover:bg-muted transition-colors items-center group"
          >
            <Link href={`/obras/${obraId}/fvm/${fvm.id}`} className="contents no-underline">
              <span className="text-[11px] font-mono font-semibold text-[var(--text-muted)] bg-muted px-1.5 py-0.5 rounded">
                {fvm.codigo ?? "—"}
              </span>

              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--text-primary)] truncate">{fvm.material}</p>
                {fvm.fornecedorNome && (
                  <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                    <Truck size={9} />
                    {fvm.fornecedorNome}
                  </p>
                )}
                {fvm.notaFiscal && (
                  <p className="text-[10px] text-[var(--text-muted)] opacity-70">{fvm.notaFiscal}</p>
                )}
              </div>

              <p className="text-xs text-[var(--text-muted)]">
                {fvm.quantidade}{fvm.unidade ? ` ${fvm.unidade}` : ""}
              </p>

              <p className="text-xs text-[var(--text-muted)]">{formatDataCurta(fvm.data)}</p>

              <StatusChip status={fvm.status} />
            </Link>

            {canDelete && (
              <button
                onClick={(e) => handleExcluir(e, fvm.id, fvm.material)}
                disabled={excluir.isPending}
                className="opacity-0 group-hover:opacity-100 p-2 text-[var(--text-muted)] hover:text-red-600 rounded-md hover:bg-red-50 transition-all disabled:opacity-30"
                title="Excluir"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
