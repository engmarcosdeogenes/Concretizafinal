"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Building2,
  Download,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Search,
  LinkIcon,
  Unlink,
  MapPin,
  Clock,
} from "lucide-react"
import { toast } from "sonner"
import { trpc } from "@/lib/trpc/client"
import { useObrasListar, useImportarObras } from "@/hooks/useObrasGestao"

export default function ObrasPage() {
  const [search, setSearch] = useState("")
  const [atualizarExistentes, setAtualizarExistentes] = useState(false)

  const { obras, isLoading, isFetching, refetch } = useObrasListar()

  const importarObrasMut = useImportarObras()
  const importarObras = {
    isPending: importarObrasMut.isPending,
    mutate: (input: { atualizarExistentes: boolean }) => {
      importarObrasMut.mutate(input, {
        onSuccess: (data) => {
          const res = data as { criadas?: number; atualizadas?: number }
          toast.success(
            `${res.criadas ?? 0} obras criadas, ${res.atualizadas ?? 0} atualizadas`
          )
        },
        onError: (err) => {
          toast.error(err.message ?? "Erro ao importar obras do Sienge")
        },
      })
    },
  }

  const filtered = obras.filter((o) => {
    const term = search.toLowerCase()
    if (!term) return true
    const nome = (o.nome ?? "").toLowerCase()
    const endereco = (o.endereco ?? "").toLowerCase()
    const siengeId = String(o.siengeId ?? "")
    return nome.includes(term) || endereco.includes(term) || siengeId.includes(term)
  })

  const totalObras = obras.length
  const vinculadas = obras.filter((o) => o.siengeId != null).length
  const semVinculo = totalObras - vinculadas

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Building2 size={18} className="text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            Gestão de Obras
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Cadastro de obras e importação via Sienge
          </p>
        </div>
      </div>

      {/* Action bar */}
      <div className="bg-white rounded-2xl border border-border shadow-sm px-5 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            disabled={importarObras.isPending}
            onClick={() => importarObras.mutate({ atualizarExistentes })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white text-sm font-semibold hover:bg-orange-700 transition-colors disabled:opacity-60"
          >
            {importarObras.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            Importar do Sienge
          </button>
          <label className="flex items-center gap-2 text-xs text-[var(--text-muted)] select-none cursor-pointer">
            <input
              type="checkbox"
              checked={atualizarExistentes}
              onChange={(e) => setAtualizarExistentes(e.target.checked)}
              className="rounded border-border accent-orange-600"
            />
            Atualizar existentes
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <RefreshCw size={12} className={isFetching ? "animate-spin" : ""} />
            Atualizar
          </button>
          <span className="text-xs text-[var(--text-muted)]">
            {totalObras} obra{totalObras !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          label="Total de Obras"
          value={isLoading ? "…" : String(totalObras)}
          icon={Building2}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
        />
        <KpiCard
          label="Vinculadas ao Sienge"
          value={isLoading ? "…" : String(vinculadas)}
          icon={LinkIcon}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
        <KpiCard
          label="Sem vínculo"
          value={isLoading ? "…" : String(semVinculo)}
          icon={Unlink}
          iconBg="bg-slate-100"
          iconColor="text-slate-500"
        />
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, endereço ou ID Sienge..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-white text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-orange-200 transition"
        />
      </div>

      {/* Obras list */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">
            Obras Cadastradas
          </h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Building2
              size={36}
              className="text-[var(--text-muted)] mx-auto mb-3"
            />
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {search
                ? "Nenhuma obra encontrada para a busca"
                : "Nenhuma obra cadastrada"}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {search
                ? "Tente ajustar os termos de busca."
                : "Importe obras do Sienge utilizando o botão acima."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((obra) => (
              <Link
                key={obra.id}
                href={`/obras/${obra.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Building2 size={16} className="text-orange-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {obra.nome}
                    </p>
                    {obra.endereco && (
                      <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 truncate">
                        <MapPin size={10} className="flex-shrink-0" />
                        {obra.endereco}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  <Link
                    href={`/obras/${obra.id}/historico`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    <Clock size={10} />
                    Histórico
                  </Link>
                  {obra.status && (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-[var(--text-muted)]">
                      {obra.status}
                    </span>
                  )}
                  {obra.siengeId != null ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
                      <CheckCircle2 size={10} />
                      Sienge #{obra.siengeId}
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                      Sem vínculo
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
}: {
  label: string
  value: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="bg-white rounded-xl border border-border shadow-sm p-4 flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}
      >
        <Icon size={18} className={iconColor} />
      </div>
      <div>
        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">
          {label}
        </p>
        <p className="text-xl font-bold text-[var(--text-primary)]">{value}</p>
      </div>
    </div>
  )
}
