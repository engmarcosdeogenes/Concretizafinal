"use client"

import { use, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Users, FileDown, Calendar, Building2, Tag } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatMoeda } from "@/lib/format"
import { cn } from "@/lib/utils"

function formatDoc(cpf?: string, cnpj?: string) {
  if (cpf) return cpf
  if (cnpj) return cnpj
  return "—"
}

function formatDate(d?: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

function StatusBadge({ status }: { status?: string }) {
  const s = (status ?? "").toUpperCase()
  if (s === "ACTIVE" || s === "ATIVO")
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">Ativo</span>
  if (s === "CANCELLED" || s === "CANCELADO")
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">Cancelado</span>
  return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">{status ?? "—"}</span>
}

export default function ClientePerfilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clienteId } = use(params)
  const [ano, setAno] = useState(new Date().getFullYear() - 1)
  const anosDisponiveis = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 - i)

  const { data, isLoading } = trpc.sienge.buscarClientePorId.useQuery({ clienteId })

  const cliente   = data?.cliente ?? null
  const contratos = data?.contratos ?? []

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        <div className="h-16 bg-muted rounded-xl animate-pulse" />
        <div className="h-64 bg-muted rounded-xl animate-pulse" />
      </div>
    )
  }

  if (!cliente) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-4">
        <Link href="/comercial/clientes" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <ArrowLeft size={16} /> Clientes
        </Link>
        <div className="bg-white border border-border rounded-xl p-12 text-center">
          <Users size={36} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">Cliente não encontrado</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">O cliente não foi localizado no Sienge.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
        <Link href="/comercial" className="hover:text-[var(--text-primary)] transition-colors">Comercial</Link>
        <span>›</span>
        <Link href="/comercial/clientes" className="hover:text-[var(--text-primary)] transition-colors">Clientes</Link>
        <span>›</span>
        <span className="text-[var(--text-primary)] font-medium">{cliente.name ?? "—"}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Users size={20} className="text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{cliente.name ?? "—"}</h1>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0055A5]/10 text-[#0055A5]">Cliente Sienge</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--text-muted)]">
            <span>{formatDoc(cliente.cpf, cliente.cnpj)}</span>
            {cliente.email && <span>{cliente.email}</span>}
          </div>
        </div>
      </div>

      {/* Contratos de Venda */}
      <div className="bg-white border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Tag size={15} className="text-blue-600" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Contratos de Venda</h2>
        </div>

        {contratos.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <Building2 size={28} className="text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">Nenhum contrato de venda encontrado</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Não há contratos vinculados a este cliente.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted text-[var(--text-muted)] uppercase text-[10px] tracking-wide">
                  <th className="px-3 py-2 text-left font-semibold">Empreendimento</th>
                  <th className="px-3 py-2 text-left font-semibold">Unidade</th>
                  <th className="px-3 py-2 text-right font-semibold">Valor</th>
                  <th className="px-3 py-2 text-left font-semibold">Assinatura</th>
                  <th className="px-3 py-2 text-center font-semibold">Status</th>
                  <th className="px-3 py-2 text-center font-semibold">Extrato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {contratos.map(c => (
                  <tr key={c.id} className="hover:bg-muted/30">
                    <td className="px-3 py-2.5 font-medium text-[var(--text-primary)] truncate max-w-[160px]">{c.buildingName ?? "—"}</td>
                    <td className="px-3 py-2.5 text-xs text-[var(--text-muted)]">{c.unitName ?? "—"}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-[var(--text-primary)]">{c.totalValue ? formatMoeda(c.totalValue) : "—"}</td>
                    <td className="px-3 py-2.5 text-xs text-[var(--text-muted)]">
                      <div className="flex items-center gap-1">
                        <Calendar size={11} />
                        {formatDate(c.signatureDate)}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <a
                        href={`/api/sienge/pdf/extrato/${c.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-[10px] font-semibold text-[var(--text-muted)] hover:border-orange-300 hover:text-orange-600 transition-all"
                      >
                        <FileDown size={11} /> PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Informe de Rendimentos IR */}
      <div className="bg-white border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FileDown size={15} className="text-purple-600" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Informe de Rendimentos IR</h2>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={ano}
            onChange={e => setAno(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-border text-sm bg-white focus:outline-none focus:border-orange-400"
          >
            {anosDisponiveis.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <a
            href={`/api/sienge/pdf/ir/${clienteId}?ano=${ano}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-all",
              "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100"
            )}
          >
            <FileDown size={14} /> Baixar Informe {ano}
          </a>
        </div>
      </div>

      <Link
        href="/comercial/clientes"
        className="inline-flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 transition-colors"
      >
        <ArrowLeft size={14} /> Voltar para lista de clientes
      </Link>
    </div>
  )
}
