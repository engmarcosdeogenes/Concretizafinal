"use client"

import { useState } from "react"
import { Network, Building2, Loader2, AlertCircle, RefreshCw, DollarSign, Package, FileText } from "lucide-react"
import { trpc } from "@/lib/trpc/client"

const fmt = (v?: number | null) =>
  v != null ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—"

export default function EnterprisePage() {
  const { data: empresas = [], isLoading, error, refetch, isFetching } = trpc.sienge.listarEmpresas.useQuery()
  const [selectedId, setSelectedId] = useState<number | null>(null)

  // KPIs cross-company from Sienge
  const { data: contasPagar = [] } = trpc.sienge.listarContasPagar.useQuery({})
  const { data: pedidos    = [] } = trpc.pedido.listar.useQuery()

  const totalPagar   = contasPagar.reduce((s, c) => s + ((c as { value?: number }).value ?? 0), 0)
  const totalPedidos = pedidos.length

  const empresaAtual = selectedId != null ? empresas.find(e => e.id === selectedId) : null

  if (!isLoading && error) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Header />
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-3 mt-6">
          <AlertCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Sienge não configurado</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Configure a integração Sienge em <a href="/configuracoes/integracoes" className="underline font-medium">Configurações → Integrações</a> para visualizar o grupo empresarial.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <Header />

      {/* KPIs globais */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          label="Empresas no Grupo"
          value={isLoading ? "…" : String(empresas.length)}
          icon={Building2}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
        />
        <KpiCard
          label="Contas a Pagar (Total)"
          value={isLoading ? "…" : fmt(totalPagar)}
          icon={DollarSign}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
        />
        <KpiCard
          label="Pedidos de Compra"
          value={isLoading ? "…" : String(totalPedidos)}
          icon={Package}
          iconBg="bg-sky-100"
          iconColor="text-sky-600"
        />
      </div>

      {/* Seletor de empresa */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Empresas do Grupo Sienge</h2>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <RefreshCw size={12} className={isFetching ? "animate-spin" : ""} />
            Atualizar
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : empresas.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Network size={36} className="text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">Nenhuma empresa encontrada</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Verifique se a integração Sienge está ativa e o usuário tem permissão para listar empresas.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {empresas.map((empresa) => (
              <button
                key={empresa.id}
                type="button"
                onClick={() => setSelectedId(selectedId === empresa.id ? null : empresa.id)}
                className={`w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/40 transition-colors ${
                  selectedId === empresa.id ? "bg-violet-50 border-l-2 border-violet-500" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Building2 size={16} className="text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{empresa.name}</p>
                    {empresa.cnpj && (
                      <p className="text-xs text-[var(--text-muted)] font-mono">{empresa.cnpj}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {empresa.active === false && (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                      Inativa
                    </span>
                  )}
                  {empresa.active !== false && (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
                      Ativa
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detalhes da empresa selecionada */}
      {empresaAtual && (
        <div className="bg-white rounded-2xl border border-border shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <FileText size={16} className="text-violet-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">{empresaAtual.name}</h3>
              <p className="text-xs text-[var(--text-muted)]">ID Sienge: {empresaAtual.id}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InfoRow label="CNPJ"    value={empresaAtual.cnpj ?? "—"} mono />
            <InfoRow label="ID Sienge" value={String(empresaAtual.id)} mono />
            <InfoRow label="Status"  value={empresaAtual.active === false ? "Inativa" : "Ativa"} />
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-4 italic">
            Para dados detalhados desta empresa (obras, saldos, pedidos), utilize os filtros por empresa nos módulos de Suprimentos e Financeiro.
          </p>
        </div>
      )}
    </div>
  )
}

function Header() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <Network size={18} className="text-violet-600" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Grupo Empresarial</h1>
        <p className="text-sm text-[var(--text-muted)]">Visão consolidada das empresas do grupo via Sienge</p>
      </div>
    </div>
  )
}

function KpiCard({ label, value, icon: Icon, iconBg, iconColor }: {
  label: string; value: string; icon: React.ElementType; iconBg: string; iconColor: string
}) {
  return (
    <div className="bg-white rounded-xl border border-border shadow-sm p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div>
        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold text-[var(--text-primary)]">{value}</p>
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-muted/30 rounded-xl px-4 py-3">
      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`text-sm font-semibold text-[var(--text-primary)] ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  )
}
