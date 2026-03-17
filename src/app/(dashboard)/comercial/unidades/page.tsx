"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Building2,
  Settings,
  Plus,
  X,
  Search,
  Home,
  CheckCircle,
  Clock,
  ArrowLeftRight,
  Pencil,
  Layers,
  AreaChart,
  DollarSign,
} from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"
import { formatMoeda } from "@/lib/format"

// ── Types ────────────────────────────────────────────────────────────────────

type StatusKey = "DISPONIVEL" | "RESERVADA" | "VENDIDA" | "PERMUTADA" | "OUTRO"

type Unidade = {
  id: number
  number?: string
  name?: string
  status?: string
  type?: string
  floor?: string | number
  area?: number
  price?: number
  buildingName?: string
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStatusConfig(status?: string): {
  label: string
  key: StatusKey
  badge: string
  dot: string
  icon: React.ElementType
} {
  const s = (status ?? "").toUpperCase()
  if (s.includes("DISPONIVEL") || s.includes("DISPONÍVEL") || s === "AVAILABLE" || s === "FREE")
    return { label: "Disponível", key: "DISPONIVEL", badge: "bg-green-100 text-green-700 border-green-200", dot: "bg-green-500", icon: CheckCircle }
  if (s.includes("RESERV") || s === "RESERVED" || s === "BOOKED")
    return { label: "Reservada", key: "RESERVADA", badge: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500", icon: Clock }
  if (s.includes("VEND") || s === "SOLD")
    return { label: "Vendida", key: "VENDIDA", badge: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500", icon: Home }
  if (s.includes("PERMUT") || s === "TRADED")
    return { label: "Permutada", key: "PERMUTADA", badge: "bg-purple-100 text-purple-700 border-purple-200", dot: "bg-purple-500", icon: ArrowLeftRight }
  return { label: status ?? "—", key: "OUTRO", badge: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400", icon: Home }
}

function displayName(u: Unidade) {
  return u.number ?? u.name ?? `#${u.id}`
}

// ── Component ─────────────────────────────────────────────────────────────────

const FILTROS_STATUS = [
  { key: "TODOS",     label: "Todos" },
  { key: "DISPONIVEL", label: "Disponíveis" },
  { key: "RESERVADA",  label: "Reservadas" },
  { key: "VENDIDA",    label: "Vendidas" },
  { key: "PERMUTADA",  label: "Permutadas" },
] as const

type NovoForm = {
  enterpriseId: string
  name: string
  number: string
  type: string
  floor: string
  area: string
  price: string
}

type EditForm = {
  name: string
  number: string
  type: string
  floor: string
  area: string
  price: string
  status: string
}

const EMPTY_NOVO: NovoForm = {
  enterpriseId: "",
  name: "",
  number: "",
  type: "",
  floor: "",
  area: "",
  price: "",
}

const EMPTY_EDIT: EditForm = {
  name: "",
  number: "",
  type: "",
  floor: "",
  area: "",
  price: "",
  status: "",
}

export default function UnidadesPage() {
  const utils = trpc.useUtils()

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: unidades = [], isLoading } = trpc.sienge.listarMapaImobiliario.useQuery()
  const { data: obrasRaw = [] } = trpc.integracoes.listarObrasSienge.useQuery()

  // ── Filters ────────────────────────────────────────────────────────────────
  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState<string>("TODOS")

  // ── Create modal ───────────────────────────────────────────────────────────
  const [showNovo, setShowNovo] = useState(false)
  const [novoForm, setNovoForm] = useState<NovoForm>(EMPTY_NOVO)
  const [novoMsg, setNovoMsg] = useState("")

  // ── Edit modal ─────────────────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<Unidade | null>(null)
  const [editForm, setEditForm] = useState<EditForm>(EMPTY_EDIT)
  const [editMsg, setEditMsg] = useState("")

  // ── Mutations ──────────────────────────────────────────────────────────────
  const criarMut = trpc.sienge.criarUnidade.useMutation({
    onSuccess: () => {
      utils.sienge.listarMapaImobiliario.invalidate()
      setShowNovo(false)
      setNovoForm(EMPTY_NOVO)
      setNovoMsg("")
    },
  })

  const editarMut = trpc.sienge.atualizarUnidade.useMutation({
    onSuccess: () => {
      utils.sienge.listarMapaImobiliario.invalidate()
      setEditTarget(null)
      setEditForm(EMPTY_EDIT)
      setEditMsg("")
    },
  })

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    setNovoMsg("")
    try {
      await criarMut.mutateAsync({
        enterpriseId: Number(novoForm.enterpriseId),
        name: novoForm.name,
        ...(novoForm.number && { number: novoForm.number }),
        ...(novoForm.type && { type: novoForm.type }),
        ...(novoForm.floor && { floor: novoForm.floor }),
        ...(novoForm.area && { area: Number(novoForm.area) }),
        ...(novoForm.price && { price: Number(novoForm.price) }),
      })
    } catch (err: unknown) {
      setNovoMsg(err instanceof Error ? err.message : "Erro ao criar unidade.")
    }
  }

  function openEdit(u: Unidade) {
    setEditTarget(u)
    setEditForm({
      name: u.name ?? "",
      number: u.number ?? "",
      type: u.type ?? "",
      floor: u.floor != null ? String(u.floor) : "",
      area: u.area != null ? String(u.area) : "",
      price: u.price != null ? String(u.price) : "",
      status: u.status ?? "",
    })
    setEditMsg("")
  }

  async function handleEditar(e: React.FormEvent) {
    e.preventDefault()
    if (!editTarget) return
    setEditMsg("")
    try {
      await editarMut.mutateAsync({
        unitId: editTarget.id,
        data: {
          ...(editForm.name && { name: editForm.name }),
          ...(editForm.number && { number: editForm.number }),
          ...(editForm.type && { type: editForm.type }),
          ...(editForm.floor && { floor: editForm.floor }),
          ...(editForm.area && { area: Number(editForm.area) }),
          ...(editForm.price && { price: Number(editForm.price) }),
          ...(editForm.status && { status: editForm.status }),
        },
      })
    } catch (err: unknown) {
      setEditMsg(err instanceof Error ? err.message : "Erro ao atualizar unidade.")
    }
  }

  // ── Derived data ───────────────────────────────────────────────────────────
  const semSienge = !isLoading && unidades.length === 0

  const stats = useMemo(() => {
    const total      = unidades.length
    const disponivel = unidades.filter(u => getStatusConfig(u.status).key === "DISPONIVEL").length
    const reservada  = unidades.filter(u => getStatusConfig(u.status).key === "RESERVADA").length
    const vendida    = unidades.filter(u => getStatusConfig(u.status).key === "VENDIDA").length
    const permutada  = unidades.filter(u => getStatusConfig(u.status).key === "PERMUTADA").length
    const vgv        = unidades
      .filter(u => getStatusConfig(u.status).key === "DISPONIVEL" && u.price)
      .reduce((acc, u) => acc + (u.price ?? 0), 0)
    return { total, disponivel, reservada, vendida, permutada, vgv }
  }, [unidades])

  const filtradas = useMemo(() => {
    return unidades.filter(u => {
      if (filtroStatus !== "TODOS" && getStatusConfig(u.status).key !== filtroStatus) return false
      if (busca.trim()) {
        const q = busca.toLowerCase()
        const nome = displayName(u).toLowerCase()
        const tipo = (u.type ?? "").toLowerCase()
        const bloco = (u.buildingName ?? "").toLowerCase()
        if (!nome.includes(q) && !tipo.includes(q) && !bloco.includes(q)) return false
      }
      return true
    })
  }, [unidades, filtroStatus, busca])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Layers size={22} className="text-orange-500" />
            Unidades Imobiliárias
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0055A5]/10 text-[#0055A5]">
              Sienge
            </span>
            Cadastro e gestão de unidades por empreendimento
          </p>
        </div>
        {!isLoading && !semSienge && (
          <button
            onClick={() => { setShowNovo(true); setNovoMsg("") }}
            className="btn-orange flex items-center gap-1.5 text-sm"
          >
            <Plus size={15} />
            Nova Unidade
          </button>
        )}
      </div>

      {/* Empty — Sienge not configured */}
      {semSienge && (
        <div className="bg-white border border-border rounded-xl p-12 text-center">
          <Building2 size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Sienge não configurado</p>
          <p className="text-xs text-[var(--text-muted)] mb-5">
            Configure a integração Sienge para gerenciar as unidades imobiliárias.
          </p>
          <Link href="/configuracoes/integracoes" className="btn-orange inline-flex gap-2">
            <Settings size={14} />
            Configurar Sienge
          </Link>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-64 bg-muted rounded-xl animate-pulse" />
        </div>
      )}

      {!isLoading && unidades.length > 0 && (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white border border-border rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">Total</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.total}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-green-700 mb-1">Disponíveis</p>
              <p className="text-2xl font-bold text-green-800">{stats.disponivel}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 mb-1">Reservadas</p>
              <p className="text-2xl font-bold text-amber-800">{stats.reservada}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-700 mb-1">Vendidas</p>
              <p className="text-2xl font-bold text-blue-800">{stats.vendida}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-purple-700 mb-1">Permutadas</p>
              <p className="text-2xl font-bold text-purple-800">{stats.permutada}</p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-orange-700 mb-1 flex items-center gap-1">
                <DollarSign size={10} /> VGV Disponível
              </p>
              <p className="text-base font-bold text-orange-800 truncate">{formatMoeda(stats.vgv)}</p>
            </div>
          </div>

          {/* Toolbar: filters + search */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Status filter pills */}
            <div className="flex flex-wrap items-center gap-2">
              {FILTROS_STATUS.map(f => {
                const count =
                  f.key === "TODOS" ? stats.total :
                  f.key === "DISPONIVEL" ? stats.disponivel :
                  f.key === "RESERVADA" ? stats.reservada :
                  f.key === "VENDIDA" ? stats.vendida :
                  stats.permutada
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFiltroStatus(f.key)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      filtroStatus === f.key
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-white text-[var(--text-muted)] border-border hover:border-orange-300"
                    )}
                  >
                    {f.label}
                    {f.key !== "TODOS" && (
                      <span className="ml-1.5 text-[10px] opacity-70">{count}</span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 bg-white border border-border rounded-xl px-3 py-2 sm:ml-auto sm:w-64">
              <Search size={13} className="text-[var(--text-muted)] flex-shrink-0" />
              <input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="flex-1 text-sm bg-transparent focus:outline-none"
                placeholder="Buscar por unidade, tipo ou bloco..."
              />
              {busca && (
                <button onClick={() => setBusca("")} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-[2fr_1.2fr_1fr_0.8fr_0.8fr_1fr_80px] gap-3 px-5 py-2.5 border-b border-border bg-muted text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
              <span>Unidade</span>
              <span>Tipo</span>
              <span>Bloco</span>
              <span className="text-center">Andar</span>
              <span className="text-right">Área</span>
              <span className="text-right">Valor</span>
              <span className="text-center">Status</span>
            </div>

            <div className="divide-y divide-border">
              {filtradas.map(u => {
                const cfg = getStatusConfig(u.status)
                const IconSt = cfg.icon
                return (
                  <div
                    key={u.id}
                    className="grid grid-cols-[2fr_1.2fr_1fr_0.8fr_0.8fr_1fr_80px] gap-3 px-5 py-3 items-center text-sm hover:bg-muted/30 group"
                  >
                    {/* Name */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn("w-2 h-2 rounded-full flex-shrink-0", cfg.dot)} />
                      <p className="font-semibold text-[var(--text-primary)] truncate">
                        {displayName(u)}
                      </p>
                    </div>

                    {/* Type */}
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {u.type ?? "—"}
                    </p>

                    {/* Building / Block */}
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {u.buildingName ?? "—"}
                    </p>

                    {/* Floor */}
                    <p className="text-xs text-[var(--text-muted)] text-center">
                      {u.floor != null ? u.floor : "—"}
                    </p>

                    {/* Area */}
                    <p className="text-xs text-[var(--text-muted)] text-right">
                      {u.area ? (
                        <span className="flex items-center justify-end gap-0.5">
                          <AreaChart size={10} className="opacity-50" />
                          {u.area} m²
                        </span>
                      ) : "—"}
                    </p>

                    {/* Price */}
                    <p className="text-xs font-semibold text-[var(--text-primary)] text-right">
                      {u.price ? formatMoeda(u.price) : "—"}
                    </p>

                    {/* Status + Edit */}
                    <div className="flex items-center justify-center gap-1.5">
                      <span className={cn("inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold border", cfg.badge)}>
                        <IconSt size={9} />
                        {cfg.label}
                      </span>
                      <button
                        onClick={() => openEdit(u)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-all"
                        title="Editar unidade"
                      >
                        <Pencil size={12} className="text-[var(--text-muted)]" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {filtradas.length === 0 && (
            <div className="text-center py-12 text-sm text-[var(--text-muted)]">
              Nenhuma unidade encontrada com os filtros selecionados.
            </div>
          )}

          <p className="text-xs text-center text-[var(--text-muted)]">
            {filtradas.length} de {unidades.length} unidades · Dados via Sienge
          </p>
        </>
      )}

      {/* ── Modal: Nova Unidade ───────────────────────────────────────────────── */}
      {showNovo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Nova Unidade</h3>
              <button
                onClick={() => { setShowNovo(false); setNovoMsg("") }}
                className="p-1.5 rounded-lg hover:bg-muted"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCriar} className="space-y-4">
              {/* Enterprise */}
              <div>
                <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">
                  Empreendimento (Sienge) *
                </label>
                {obrasRaw.length > 0 ? (
                  <select
                    required
                    value={novoForm.enterpriseId}
                    onChange={e => setNovoForm(f => ({ ...f, enterpriseId: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                  >
                    <option value="">Selecione o empreendimento...</option>
                    {obrasRaw.map(o => (
                      <option key={o.id} value={o.id}>{o.nome}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    required
                    min={1}
                    value={novoForm.enterpriseId}
                    onChange={e => setNovoForm(f => ({ ...f, enterpriseId: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                    placeholder="ID do empreendimento Sienge"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="col-span-2">
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">
                    Nome / Identificação *
                  </label>
                  <input
                    type="text"
                    required
                    value={novoForm.name}
                    onChange={e => setNovoForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                    placeholder="Ex: Apto 101"
                  />
                </div>

                {/* Number */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">
                    Número / Código
                  </label>
                  <input
                    type="text"
                    value={novoForm.number}
                    onChange={e => setNovoForm(f => ({ ...f, number: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                    placeholder="Ex: 101"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">
                    Tipo
                  </label>
                  <input
                    type="text"
                    value={novoForm.type}
                    onChange={e => setNovoForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                    placeholder="Ex: Apartamento"
                  />
                </div>

                {/* Floor */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">
                    Andar
                  </label>
                  <input
                    type="text"
                    value={novoForm.floor}
                    onChange={e => setNovoForm(f => ({ ...f, floor: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                    placeholder="Ex: 1"
                  />
                </div>

                {/* Area */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">
                    Área (m²)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={novoForm.area}
                    onChange={e => setNovoForm(f => ({ ...f, area: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                    placeholder="Ex: 65.00"
                  />
                </div>

                {/* Price */}
                <div className="col-span-2">
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={novoForm.price}
                    onChange={e => setNovoForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                    placeholder="Ex: 350000.00"
                  />
                </div>
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
                  {criarMut.isPending ? "Criando..." : "Criar Unidade"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Editar Unidade ─────────────────────────────────────────────── */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Editar Unidade
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {displayName(editTarget)} · ID {editTarget.id}
                </p>
              </div>
              <button
                onClick={() => { setEditTarget(null); setEditMsg("") }}
                className="p-1.5 rounded-lg hover:bg-muted"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditar} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="col-span-2">
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">
                    Nome / Identificação
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                    placeholder="Ex: Apto 101"
                  />
                </div>

                {/* Number */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">
                    Número / Código
                  </label>
                  <input
                    type="text"
                    value={editForm.number}
                    onChange={e => setEditForm(f => ({ ...f, number: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                    placeholder="Ex: 101"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">
                    Tipo
                  </label>
                  <input
                    type="text"
                    value={editForm.type}
                    onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                    placeholder="Ex: Apartamento"
                  />
                </div>

                {/* Floor */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">
                    Andar
                  </label>
                  <input
                    type="text"
                    value={editForm.floor}
                    onChange={e => setEditForm(f => ({ ...f, floor: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                    placeholder="Ex: 1"
                  />
                </div>

                {/* Area */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">
                    Área (m²)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.area}
                    onChange={e => setEditForm(f => ({ ...f, area: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                    placeholder="Ex: 65.00"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.price}
                    onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                    placeholder="Ex: 350000.00"
                  />
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">
                    Status
                  </label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                  >
                    <option value="">Manter status atual</option>
                    <option value="DISPONIVEL">Disponível</option>
                    <option value="RESERVADA">Reservada</option>
                    <option value="VENDIDA">Vendida</option>
                    <option value="PERMUTADA">Permutada</option>
                  </select>
                </div>
              </div>

              {editMsg && <p className="text-xs text-red-500">{editMsg}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setEditTarget(null); setEditMsg("") }}
                  className="flex-1 border border-border rounded-lg py-2 text-sm text-[var(--text-muted)] hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editarMut.isPending}
                  className={cn("flex-1 btn-orange", editarMut.isPending && "opacity-70 cursor-not-allowed")}
                >
                  {editarMut.isPending ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
