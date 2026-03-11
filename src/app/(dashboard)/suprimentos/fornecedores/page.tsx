"use client"

import { useState, useMemo, useEffect } from "react"
import * as XLSX from "xlsx"
import Link from "next/link"
import { Building2, Plus, X, Phone, Mail, MapPin, Search, Filter, Users, Calendar, TrendingUp, FileSpreadsheet, FileJson } from "lucide-react"
import { trpc } from "@/lib/trpc/client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

type Fornecedor = {
  id: string; nome: string; cnpj?: string | null; categoria?: string | null
  cidade?: string | null; estado?: string | null; telefone?: string | null
  email?: string | null; site?: string | null; ativo: boolean
  _count: { pedidos: number }
}

type FormState = {
  nome: string; cnpj: string; categoria: string; cidade: string
  estado: string; telefone: string; email: string; site: string
}

const EMPTY_FORM: FormState = {
  nome: "", cnpj: "", categoria: "", cidade: "", estado: "", telefone: "", email: "", site: "",
}

const getCategoriaBadgeVariant = (cat?: string | null) => {
  if (!cat) return "secondary"
  const l = cat.toLowerCase()
  if (l.includes("materiais")) return "default"
  if (l.includes("equipamentos")) return "outline" // ou algum customizado
  if (l.includes("serviços") || l.includes("servicos")) return "secondary"
  return "secondary"
}

export default function FornecedoresPage() {
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Fornecedor | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [erro, setErro] = useState("")
  const [busca, setBusca] = useState("")
  const [filtroCategoria, setFiltroCategoria] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("")
  const [pagina, setPagina] = useState(1)
  const POR_PAGINA = 20

  const utils = trpc.useUtils()
  const { data: resultado, isLoading } = trpc.fornecedor.listar.useQuery()
  const fornecedores = resultado?.fornecedores ?? []
  const novosNoMes   = resultado?.novosNoMes ?? 0

  const criar = trpc.fornecedor.criar.useMutation({
    onSuccess: () => { utils.fornecedor.listar.invalidate(); fecharModal() },
    onError: (e) => setErro(e.message),
  })
  const atualizar = trpc.fornecedor.atualizar.useMutation({
    onSuccess: () => { utils.fornecedor.listar.invalidate(); fecharModal() },
    onError: (e) => setErro(e.message),
  })

  function abrirCriar() {
    setEditing(null); setForm(EMPTY_FORM); setErro(""); setShowModal(true)
  }

  function abrirEditar(f: Fornecedor) {
    setEditing(f)
    setForm({
      nome: f.nome, cnpj: f.cnpj ?? "", categoria: f.categoria ?? "",
      cidade: f.cidade ?? "", estado: f.estado ?? "", telefone: f.telefone ?? "",
      email: f.email ?? "", site: f.site ?? "",
    })
    setErro(""); setShowModal(true)
  }

  function fecharModal() {
    setShowModal(false); setEditing(null); setForm(EMPTY_FORM); setErro("")
  }

  function toggleAtivo(f: Fornecedor) {
    atualizar.mutate({ id: f.id, ativo: !f.ativo })
  }

  function set(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setErro("")
    if (editing) {
      atualizar.mutate({ id: editing.id, ...form })
    } else {
      criar.mutate(form)
    }
  }

  // Reset para pg 1 ao mudar filtros
  useEffect(() => { setPagina(1) }, [busca, filtroCategoria, filtroStatus])

  const filtered = useMemo(() => fornecedores.filter(f => {
    const q = busca.toLowerCase()
    const matchBusca = !busca ||
      f.nome.toLowerCase().includes(q) ||
      (f.categoria ?? "").toLowerCase().includes(q) ||
      (f.cidade ?? "").toLowerCase().includes(q) ||
      (f.cnpj ?? "").includes(busca)
    const matchCategoria = !filtroCategoria ||
      (f.categoria ?? "").toLowerCase() === filtroCategoria.toLowerCase()
    const matchStatus = !filtroStatus ||
      (filtroStatus === "ativo" ? f.ativo : !f.ativo)
    return matchBusca && matchCategoria && matchStatus
  }), [fornecedores, busca, filtroCategoria, filtroStatus])

  function exportarCSV() {
    const headers = ["Nome", "CNPJ", "Categoria", "Cidade", "Estado", "Telefone", "E-mail", "Status", "Pedidos"]
    const rows = filtered.map(f => [
      f.nome, f.cnpj ?? "", f.categoria ?? "", f.cidade ?? "", f.estado ?? "",
      f.telefone ?? "", f.email ?? "", f.ativo ? "Ativo" : "Inativo", String(f._count.pedidos),
    ])
    const csv = [headers, ...rows]
      .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n")
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = "fornecedores.csv"; a.click()
    URL.revokeObjectURL(url)
  }

  function exportarExcel() {
    const dados = filtered.map(f => ({
      Nome: f.nome, CNPJ: f.cnpj ?? "", Categoria: f.categoria ?? "",
      Cidade: f.cidade ?? "", Estado: f.estado ?? "", Telefone: f.telefone ?? "",
      "E-mail": f.email ?? "", Status: f.ativo ? "Ativo" : "Inativo", Pedidos: f._count.pedidos,
    }))
    const ws = XLSX.utils.json_to_sheet(dados)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Fornecedores")
    XLSX.writeFile(wb, "fornecedores.xlsx")
  }

  const totalPaginas = Math.ceil(filtered.length / POR_PAGINA)
  const paginado = filtered.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  const isPending = criar.isPending || atualizar.isPending

  const ativos = fornecedores.filter(f => f.ativo).length
  const txAtividade = fornecedores.length > 0 ? ((ativos / fornecedores.length) * 100).toFixed(1) : "0"

  const categoriasUnicas = new Set(fornecedores.map(f => f.categoria?.toLowerCase().trim()).filter(Boolean))

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between space-y-2 mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Fornecedores</h2>
          <p className="text-muted-foreground mt-0.5">Gerencie seus fornecedores e parceiros comerciais.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={exportarExcel} variant="outline" className="h-9 px-3 gap-1.5 bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700">
            <FileSpreadsheet size={16} /> Excel
          </Button>
          <Button onClick={exportarCSV} variant="outline" className="h-9 px-3 gap-1.5 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:text-blue-700">
            <FileJson size={16} /> CSV
          </Button>
          <Button onClick={abrirCriar} className="h-9 ml-2 font-semibold shadow-sm">
            <Plus size={16} className="mr-2" />
            Novo Fornecedor
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Fornecedores Ativos</p>
              <p className="text-3xl font-bold">{ativos}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100/50 flex items-center justify-center">
              <Users size={24} className="text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Novos no Mês</p>
              <p className="text-3xl font-bold">{novosNoMes}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100/50 flex items-center justify-center">
              <Calendar size={24} className="text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Taxa de Atividade</p>
              <p className="text-3xl font-bold">{txAtividade}%</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-violet-100/50 flex items-center justify-center">
              <TrendingUp size={24} className="text-violet-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Categorias</p>
              <p className="text-3xl font-bold">{categoriasUnicas.size}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100/50 flex items-center justify-center">
              <Building2 size={24} className="text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-card border p-2 py-3 px-4 rounded-xl shadow-sm">
        <div className="flex-1 relative max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nome, CNPJ ou cidade..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-9 bg-muted/50 focus-visible:bg-transparent"
          />
        </div>

        <div className="hidden md:block w-px h-6 bg-border mx-2" />

        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center border rounded-md h-9 px-3 bg-white text-sm font-medium">
            <Filter size={14} className="text-muted-foreground mr-2" />
            <select
              value={filtroCategoria}
              onChange={e => setFiltroCategoria(e.target.value)}
              className="bg-transparent border-none outline-none cursor-pointer"
            >
              <option value="">Todas as categorias</option>
              {Array.from(categoriasUnicas).sort().map(cat => (
                <option key={cat} value={cat!}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center border rounded-md h-9 px-3 bg-white text-sm font-medium">
            <Filter size={14} className="text-muted-foreground mr-2" />
            <select
              value={filtroStatus}
              onChange={e => setFiltroStatus(e.target.value)}
              className="bg-transparent border-none outline-none cursor-pointer"
            >
              <option value="">Todos os Status</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full min-w-[1000px] text-left border-collapse text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-5 py-4 font-semibold text-muted-foreground">Nome do Fornecedor</th>
              <th className="px-5 py-4 font-semibold text-muted-foreground">CNPJ</th>
              <th className="px-5 py-4 font-semibold text-muted-foreground">Categoria</th>
              <th className="px-5 py-4 font-semibold text-muted-foreground">Cidade</th>
              <th className="px-5 py-4 font-semibold text-muted-foreground">Telefone/Email</th>
              <th className="px-5 py-4 font-semibold text-muted-foreground">Status</th>
              <th className="px-5 py-4 font-semibold text-muted-foreground text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">Carregando...</td>
              </tr>
            )}

            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center">
                  <div className="bg-primary/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 size={32} className="text-primary opacity-80" />
                  </div>
                  <p className="text-base font-bold text-foreground">
                    {busca ? "Nenhum fornecedor encontrado" : "Nenhum fornecedor cadastrado"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Busque ou crie um novo para continuar.</p>
                </td>
              </tr>
            )}

            {paginado.map(f => (
              <tr key={f.id} className="hover:bg-muted/50 transition-colors group">
                <td className="px-5 py-4">
                  <span className="font-bold text-foreground group-hover:text-primary transition-colors">{f.nome}</span>
                </td>

                <td className="px-5 py-4 text-muted-foreground font-mono">
                  {f.cnpj || "—"}
                </td>

                <td className="px-5 py-4">
                  <Badge variant={getCategoriaBadgeVariant(f.categoria)}>
                    {f.categoria || "Geral"}
                  </Badge>
                </td>

                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin size={14} className="shrink-0" />
                    <span className="truncate max-w-[150px] font-medium">{f.cidade ? `${f.cidade}${f.estado ? ` - ${f.estado}` : ''}` : "—"}</span>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <div className="flex flex-col gap-1 text-xs text-muted-foreground font-medium">
                    <div className="flex items-center gap-2">
                      <Phone size={12} className="shrink-0" /> <span className="truncate">{f.telefone || "Não info"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={12} className="shrink-0" /> <span className="truncate max-w-[150px]">{f.email || "Não info"}</span>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4">
                  <Badge variant={f.ativo ? "default" : "secondary"}>
                    {f.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </td>

                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/suprimentos/fornecedores/${f.id}`}
                      className="px-2 py-1.5 text-xs border border-border rounded-lg hover:bg-muted transition-colors text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      Detalhes
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => abrirEditar(f)}
                      className="font-semibold text-primary"
                    >
                      Editar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground">
            Mostrando {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, filtered.length)} de {filtered.length} fornecedores
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPagina(1)}
              disabled={pagina === 1}
              className="px-2 py-1.5 text-xs border border-border rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >«</button>
            <button
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >Anterior</button>
            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
              const start = Math.max(1, Math.min(pagina - 2, totalPaginas - 4))
              const pg = start + i
              return (
                <button
                  key={pg}
                  onClick={() => setPagina(pg)}
                  className={`w-8 h-7 text-xs rounded-lg border transition-colors ${
                    pg === pagina
                      ? "bg-primary text-primary-foreground border-primary font-bold"
                      : "border-border hover:bg-muted"
                  }`}
                >{pg}</button>
              )
            })}
            <button
              onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas}
              className="px-3 py-1.5 text-xs border border-border rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >Próxima</button>
            <button
              onClick={() => setPagina(totalPaginas)}
              disabled={pagina === totalPaginas}
              className="px-2 py-1.5 text-xs border border-border rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >»</button>
          </div>
        </div>
      )}

      {/* Modal criar/editar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm transition-all duration-200">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-6 border-b bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 size={20} className="text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{editing ? "Editar Fornecedor" : "Novo Fornecedor"}</h2>
                  <p className="text-sm text-muted-foreground">Preencha os dados abaixo.</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={fecharModal} className="rounded-full">
                <X size={18} />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1 overflow-y-auto">
              {erro && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium">{erro}</div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Nome da Empresa <span className="text-destructive">*</span></label>
                  <Input required type="text" value={form.nome} onChange={e => set("nome", e.target.value)} placeholder="Razão social ou nome fantasia" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">CNPJ</label>
                    <Input type="text" value={form.cnpj} onChange={e => set("cnpj", e.target.value)} placeholder="00.000.000/0001-00" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Categoria</label>
                    <Input type="text" value={form.categoria} onChange={e => set("categoria", e.target.value)} placeholder="Ex: Materiais, Serviços" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Cidade</label>
                    <Input type="text" value={form.cidade} onChange={e => set("cidade", e.target.value)} placeholder="São Paulo" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Estado</label>
                    <Input type="text" value={form.estado} onChange={e => set("estado", e.target.value)} placeholder="SP" maxLength={2} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Telefone</label>
                    <Input type="text" value={form.telefone} onChange={e => set("telefone", e.target.value)} placeholder="(11) 99999-9999" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">E-mail</label>
                    <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="contato@empresa.com.br" />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t flex items-center justify-between">
                {editing ? (
                  <Button
                    type="button"
                    variant={editing.ativo ? "destructive" : "default"}
                    onClick={() => toggleAtivo(editing)}
                    className="font-semibold"
                  >
                    {editing.ativo ? "Desativar Fornecedor" : "Reativar Fornecedor"}
                  </Button>
                ) : <div />}

                <div className="flex gap-3">
                  <Button type="button" variant="ghost" onClick={fecharModal} className="font-semibold">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isPending} className="font-semibold px-6 shadow-sm">
                    {isPending ? "Salvando..." : editing ? "Salvar alterações" : "Cadastrar Info"}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
