"use client"

import { useState } from "react"
import Link from "next/link"
import { Users2, Settings, Plus, X } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"

type ConfigCorretor = {
  id?: number
  brokerId?: number
  commissionPercentage?: number
  [key: string]: unknown
}

export default function CorretoresPage() {
  const utils = trpc.useUtils()
  const { data: configs = [], isLoading } = trpc.sienge.listarConfigCorretoresComissao.useQuery()

  const [showNovo, setShowNovo] = useState(false)
  const [novoForm, setNovoForm] = useState({ brokerId: "", commissionPercentage: "" })
  const [novoMsg, setNovoMsg] = useState("")

  const criarMut = trpc.sienge.criarConfigCorretorComissao.useMutation({
    onSuccess: () => {
      utils.sienge.listarConfigCorretoresComissao.invalidate()
      setShowNovo(false)
      setNovoForm({ brokerId: "", commissionPercentage: "" })
    },
  })

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    setNovoMsg("")
    try {
      await criarMut.mutateAsync({
        brokerId: Number(novoForm.brokerId),
        commissionPercentage: Number(novoForm.commissionPercentage),
      })
    } catch (err: unknown) {
      setNovoMsg(err instanceof Error ? err.message : "Erro ao criar configuração.")
    }
  }

  const lista = configs as ConfigCorretor[]
  const semSienge = !isLoading && lista.length === 0

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Users2 size={22} className="text-blue-500" />
            Corretores e Comissões
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0055A5]/10 text-[#0055A5]">Sienge</span>
            Configuração de percentual de comissão por corretor
          </p>
        </div>
        {!isLoading && !semSienge && (
          <button onClick={() => setShowNovo(true)} className="btn-orange flex items-center gap-1.5 text-sm">
            <Plus size={15} /> Nova Config
          </button>
        )}
      </div>

      {/* Empty state — Sienge not configured */}
      {semSienge && (
        <div className="bg-white border border-border rounded-xl p-12 text-center">
          <Users2 size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Sienge não configurado</p>
          <p className="text-xs text-[var(--text-muted)] mb-5">Configure a integração para visualizar as configurações de corretores.</p>
          <Link href="/configuracoes/integracoes" className="btn-orange inline-flex gap-2">
            <Settings size={14} /> Configurar Sienge
          </Link>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-4">
            <div className="h-20 bg-muted rounded-xl animate-pulse" />
          </div>
          <div className="h-64 bg-muted rounded-xl animate-pulse" />
        </div>
      )}

      {/* Content */}
      {!isLoading && lista.length > 0 && (
        <>
          {/* KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">Total de Configurações</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{lista.length}</p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_1fr] gap-3 px-5 py-2.5 border-b border-border bg-muted text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
              <span>ID Config</span>
              <span>ID Corretor</span>
              <span className="text-right">% Comissão</span>
            </div>
            <div className="divide-y divide-border">
              {lista.map((cfg, idx) => (
                <div
                  key={cfg.id ?? idx}
                  className="grid grid-cols-[1fr_1fr_1fr] gap-3 px-5 py-3 items-center text-sm hover:bg-muted/30"
                >
                  <p className="font-medium text-[var(--text-primary)] font-mono text-xs">
                    {cfg.id != null ? `#${cfg.id}` : "—"}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] font-mono">
                    {cfg.brokerId != null ? cfg.brokerId : "—"}
                  </p>
                  <p className="text-right text-xs font-semibold text-[var(--text-primary)]">
                    {cfg.commissionPercentage != null
                      ? `${cfg.commissionPercentage}%`
                      : "—"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-center text-[var(--text-muted)]">
            {lista.length} {lista.length === 1 ? "configuração" : "configurações"} · Dados via Sienge
          </p>
        </>
      )}

      {/* Modal Nova Config */}
      {showNovo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Nova Configuração de Corretor</h3>
              <button
                onClick={() => { setShowNovo(false); setNovoMsg("") }}
                className="p-1.5 rounded-lg hover:bg-muted"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCriar} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">ID Corretor (Sienge) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={novoForm.brokerId}
                  onChange={e => setNovoForm(f => ({ ...f, brokerId: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                  placeholder="Ex: 5"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">
                  Percentual de Comissão (%) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  max={100}
                  step={0.01}
                  value={novoForm.commissionPercentage}
                  onChange={e => setNovoForm(f => ({ ...f, commissionPercentage: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                  placeholder="Ex: 3.5"
                />
                <p className="text-[10px] text-[var(--text-muted)] mt-1">Valor entre 0 e 100</p>
              </div>
              {novoMsg && <p className="text-xs text-red-500">{novoMsg}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowNovo(false); setNovoMsg("") }}
                  className="flex-1 border border-border rounded-lg py-2 text-sm text-[var(--text-muted)] hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={criarMut.isPending}
                  className={cn("flex-1 btn-orange", criarMut.isPending && "opacity-70 cursor-not-allowed")}
                >
                  {criarMut.isPending ? "Criando..." : "Criar Config"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
