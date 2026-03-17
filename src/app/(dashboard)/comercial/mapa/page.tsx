"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Building2, Settings, Home, CheckCircle, Clock, ArrowLeftRight, BookmarkPlus, X, BookmarkX } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"
import { formatMoeda } from "@/lib/format"

type StatusKey = "DISPONIVEL" | "RESERVADA" | "VENDIDA" | "PERMUTADA" | "OUTRO"

function getStatusConfig(status?: string): { label: string; key: StatusKey; bg: string; border: string; badge: string; icon: React.ElementType } {
  const s = (status ?? "").toUpperCase()
  if (s.includes("DISPONIVEL") || s.includes("DISPONÍVEL") || s === "AVAILABLE" || s === "FREE")
    return { label: "Disponível", key: "DISPONIVEL", bg: "bg-green-50", border: "border-green-200", badge: "bg-green-100 text-green-700", icon: CheckCircle }
  if (s.includes("RESERV") || s === "RESERVED" || s === "BOOKED")
    return { label: "Reservada", key: "RESERVADA", bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700", icon: Clock }
  if (s.includes("VEND") || s === "SOLD")
    return { label: "Vendida", key: "VENDIDA", bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-700", icon: Home }
  if (s.includes("PERMUT") || s === "TRADED")
    return { label: "Permutada", key: "PERMUTADA", bg: "bg-purple-50", border: "border-purple-200", badge: "bg-purple-100 text-purple-700", icon: ArrowLeftRight }
  return { label: status ?? "—", key: "OUTRO", bg: "bg-gray-50", border: "border-gray-200", badge: "bg-gray-100 text-gray-600", icon: Home }
}

export default function MapaImobiliarioPage() {
  const utils = trpc.useUtils()
  const { data: unidades = [], isLoading } = trpc.sienge.listarMapaImobiliario.useQuery()
  const { data: obras = [] } = trpc.obra.listar.useQuery()
  const [filtroStatus, setFiltroStatus] = useState<string>("TODOS")
  const [filtroObra, setFiltroObra] = useState("")

  // Reserva de unidade
  const [reservaModal, setReservaModal] = useState<{ unitId: number; name: string } | null>(null)
  const [reservaForm, setReservaForm] = useState({ customerId: "", brokerId: "", observation: "" })
  const [reservaMsg, setReservaMsg] = useState("")
  const criarReservaMut = trpc.sienge.criarReservaUnidade.useMutation({
    onSuccess: () => { utils.sienge.listarMapaImobiliario.invalidate(); setReservaModal(null); setReservaForm({ customerId:"", brokerId:"", observation:"" }) }
  })
  const inativarReservaMut = trpc.sienge.inativarReservaUnidade.useMutation({
    onSuccess: () => utils.sienge.listarMapaImobiliario.invalidate()
  })
  const [confirmInativar, setConfirmInativar] = useState<{ unitId: number; name: string } | null>(null)

  async function handleReservar(e: React.FormEvent) {
    e.preventDefault()
    setReservaMsg("")
    if (!reservaModal) return
    try {
      await criarReservaMut.mutateAsync({
        unitId: reservaModal.unitId,
        customerId: Number(reservaForm.customerId),
        ...(reservaForm.brokerId && { brokerId: Number(reservaForm.brokerId) }),
        ...(reservaForm.observation && { observation: reservaForm.observation }),
      })
    } catch (err: unknown) {
      setReservaMsg(err instanceof Error ? err.message : "Erro ao reservar unidade.")
    }
  }

  const semSienge = !isLoading && unidades.length === 0

  // KPIs
  const stats = useMemo(() => {
    const total      = unidades.length
    const disponivel = unidades.filter(u => getStatusConfig(u.status).key === "DISPONIVEL").length
    const reservada  = unidades.filter(u => getStatusConfig(u.status).key === "RESERVADA").length
    const vendida    = unidades.filter(u => getStatusConfig(u.status).key === "VENDIDA").length
    const permutada  = unidades.filter(u => getStatusConfig(u.status).key === "PERMUTADA").length
    return { total, disponivel, reservada, vendida, permutada }
  }, [unidades])

  const filtradas = useMemo(() => {
    return unidades.filter(u => {
      if (filtroStatus !== "TODOS" && getStatusConfig(u.status).key !== filtroStatus) return false
      return true
    })
  }, [unidades, filtroStatus])

  const obrasComSienge = obras.filter(o => o.siengeId)

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Building2 size={22} className="text-blue-500" />
          Mapa Imobiliário
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0055A5]/10 text-[#0055A5]">Sienge</span>
          Disponibilidade de unidades por empreendimento
        </p>
      </div>

      {/* Empty state */}
      {semSienge && (
        <div className="bg-white border border-border rounded-xl p-12 text-center">
          <Building2 size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Sienge não configurado</p>
          <p className="text-xs text-[var(--text-muted)] mb-5">
            Configure a integração Sienge para visualizar o mapa imobiliário.
          </p>
          <Link href="/configuracoes/integracoes" className="btn-orange inline-flex gap-2">
            <Settings size={14} />
            Configurar Sienge
          </Link>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && unidades.length > 0 && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Total",       value: stats.total,      cls: "bg-white border-border" },
              { label: "Disponíveis", value: stats.disponivel, cls: "bg-green-50 border-green-200" },
              { label: "Reservadas",  value: stats.reservada,  cls: "bg-amber-50 border-amber-200" },
              { label: "Vendidas",    value: stats.vendida,    cls: "bg-blue-50 border-blue-200" },
              { label: "Permutadas",  value: stats.permutada,  cls: "bg-purple-50 border-purple-200" },
            ].map(k => (
              <div key={k.label} className={cn("rounded-xl border p-4", k.cls)}>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">{k.label}</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{k.value}</p>
              </div>
            ))}
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2">
            {["TODOS", "DISPONIVEL", "RESERVADA", "VENDIDA", "PERMUTADA"].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setFiltroStatus(s)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                  filtroStatus === s
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-[var(--text-muted)] border-border hover:border-orange-300"
                )}
              >
                {s === "TODOS" ? "Todos" : s === "DISPONIVEL" ? "Disponíveis" : s === "RESERVADA" ? "Reservadas" : s === "VENDIDA" ? "Vendidas" : "Permutadas"}
                {s !== "TODOS" && (
                  <span className="ml-1.5 text-[10px] opacity-70">
                    {s === "DISPONIVEL" ? stats.disponivel : s === "RESERVADA" ? stats.reservada : s === "VENDIDA" ? stats.vendida : stats.permutada}
                  </span>
                )}
              </button>
            ))}
            {obrasComSienge.length > 0 && (
              <select
                value={filtroObra}
                onChange={e => setFiltroObra(e.target.value)}
                className="ml-auto h-8 px-3 border border-border rounded-lg text-xs text-[var(--text-primary)] bg-white outline-none focus:border-orange-400"
              >
                <option value="">Todos os empreendimentos</option>
                {obrasComSienge.map(o => (
                  <option key={o.id} value={o.siengeId ?? ""}>{o.nome}</option>
                ))}
              </select>
            )}
          </div>

          {/* Grid de unidades */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filtradas.map(u => {
              const cfg = getStatusConfig(u.status)
              const IconStatus = cfg.icon
              return (
                <div
                  key={u.id}
                  className={cn(
                    "rounded-xl border p-3 transition-shadow hover:shadow-sm",
                    cfg.bg,
                    cfg.border
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-bold text-[var(--text-primary)]">
                      {u.number ?? u.name ?? `#${u.id}`}
                    </p>
                    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 flex items-center gap-0.5", cfg.badge)}>
                      <IconStatus size={9} />
                    </span>
                  </div>

                  {u.type && (
                    <p className="text-[10px] text-[var(--text-muted)] truncate">{u.type}</p>
                  )}
                  {u.floor !== undefined && u.floor !== null && (
                    <p className="text-[10px] text-[var(--text-muted)]">Andar: {u.floor}</p>
                  )}
                  {u.area && (
                    <p className="text-[10px] text-[var(--text-muted)]">{u.area} m²</p>
                  )}
                  {u.price && (
                    <p className="text-xs font-semibold text-[var(--text-primary)] mt-1">{formatMoeda(u.price)}</p>
                  )}

                  <p className={cn("text-[10px] font-semibold mt-1.5", cfg.badge.includes("green") ? "text-green-700" : cfg.badge.includes("amber") ? "text-amber-700" : cfg.badge.includes("blue") ? "text-blue-700" : cfg.badge.includes("purple") ? "text-purple-700" : "text-gray-600")}>
                    {cfg.label}
                  </p>
                  {cfg.key === "DISPONIVEL" && (
                    <button onClick={() => setReservaModal({ unitId: u.id, name: u.number ?? u.name ?? `#${u.id}` })}
                      className="mt-2 w-full flex items-center justify-center gap-1 px-2 py-1 rounded bg-amber-100 text-amber-700 text-[10px] font-medium hover:bg-amber-200 transition-colors">
                      <BookmarkPlus size={10} /> Reservar
                    </button>
                  )}
                  {cfg.key === "RESERVADA" && (
                    <button onClick={() => setConfirmInativar({ unitId: u.id, name: u.number ?? u.name ?? `#${u.id}` })}
                      className="mt-2 w-full flex items-center justify-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 text-[10px] font-medium hover:bg-red-200 transition-colors">
                      <BookmarkX size={10} /> Cancelar Reserva
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {filtradas.length === 0 && (
            <div className="text-center py-12 text-sm text-[var(--text-muted)]">
              Nenhuma unidade com o filtro selecionado.
            </div>
          )}

          <p className="text-xs text-center text-[var(--text-muted)]">
            {filtradas.length} de {unidades.length} unidades · Dados via Sienge
          </p>
        </>
      )}

      {/* Modal Reservar */}
      {reservaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Reservar Unidade {reservaModal.name}</h3>
              <button onClick={() => { setReservaModal(null); setReservaMsg("") }} className="p-1.5 rounded hover:bg-muted"><X size={16} /></button>
            </div>
            <form onSubmit={handleReservar} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">ID Cliente Sienge *</label>
                <input type="number" required value={reservaForm.customerId} onChange={e => setReservaForm(f => ({ ...f, customerId: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Ex: 123" />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">ID Corretor (opcional)</label>
                <input type="number" value={reservaForm.brokerId} onChange={e => setReservaForm(f => ({ ...f, brokerId: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm" placeholder="Ex: 5" />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Observação</label>
                <textarea rows={2} value={reservaForm.observation} onChange={e => setReservaForm(f => ({ ...f, observation: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              {reservaMsg && <p className="text-xs text-red-500">{reservaMsg}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => { setReservaModal(null); setReservaMsg("") }}
                  className="flex-1 border border-border rounded-lg py-2 text-sm text-[var(--text-muted)] hover:bg-muted">Cancelar</button>
                <button type="submit" disabled={criarReservaMut.isPending}
                  className="flex-1 btn-orange">{criarReservaMut.isPending ? "Reservando..." : "Confirmar Reserva"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Inativar Reserva */}
      {confirmInativar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-4">
            <BookmarkX size={32} className="mx-auto text-red-500" />
            <p className="font-semibold text-[var(--text-primary)]">Cancelar reserva da unidade {confirmInativar.name}?</p>
            <p className="text-xs text-[var(--text-muted)]">A unidade voltará ao status Disponível.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmInativar(null)} className="flex-1 border border-border rounded-lg py-2 text-sm hover:bg-muted">Voltar</button>
              <button onClick={async () => { await inativarReservaMut.mutateAsync({ unitId: confirmInativar.unitId }); setConfirmInativar(null) }}
                disabled={inativarReservaMut.isPending}
                className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-600 disabled:opacity-50">
                {inativarReservaMut.isPending ? "Cancelando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
