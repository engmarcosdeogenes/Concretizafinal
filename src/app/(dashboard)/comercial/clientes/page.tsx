"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Users, Settings, FileDown, Search, Plus, X } from "lucide-react"
import { trpc } from "@/lib/trpc/client"

function formatDoc(cpf?: string, cnpj?: string) {
  if (cpf) return cpf
  if (cnpj) return cnpj
  return "—"
}

export default function ClientesPage() {
  const utils = trpc.useUtils()
  const { data: clientes = [], isLoading } = trpc.sienge.listarClientes.useQuery()
  const [busca, setBusca] = useState("")
  const [ano, setAno] = useState(new Date().getFullYear() - 1)

  // Nova Cliente
  const [showNovo, setShowNovo] = useState(false)
  const [novoForm, setNovoForm] = useState({ name: "", cpf: "", cnpj: "", email: "", birthDate: "", rg: "" })
  const [novoMsg, setNovoMsg] = useState("")

  const criarMut = trpc.sienge.criarCliente.useMutation({
    onSuccess: () => {
      utils.sienge.listarClientes.invalidate()
      setShowNovo(false)
      setNovoForm({ name: "", cpf: "", cnpj: "", email: "", birthDate: "", rg: "" })
    },
  })

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    setNovoMsg("")
    try {
      await criarMut.mutateAsync({
        name: novoForm.name,
        ...(novoForm.cpf && { cpf: novoForm.cpf }),
        ...(novoForm.cnpj && { cnpj: novoForm.cnpj }),
        ...(novoForm.email && { email: novoForm.email }),
        ...(novoForm.birthDate && { birthDate: novoForm.birthDate }),
        ...(novoForm.rg && { rg: novoForm.rg }),
      })
    } catch (err: unknown) {
      setNovoMsg(err instanceof Error ? err.message : "Erro ao criar cliente.")
    }
  }

  const semSienge = !isLoading && clientes.length === 0

  const filtrados = useMemo(() => {
    if (!busca.trim()) return clientes
    const q = busca.toLowerCase()
    return clientes.filter(c =>
      (c.name ?? "").toLowerCase().includes(q) ||
      (c.cpf ?? "").includes(q) ||
      (c.cnpj ?? "").includes(q)
    )
  }, [clientes, busca])

  const anosDisponiveis = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 - i)

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Users size={22} className="text-blue-500" />
            Clientes
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#0055A5]/10 text-[#0055A5]">Sienge</span>
            Clientes cadastrados — gere informes de rendimentos IR
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-[var(--text-muted)]">Ano IR:</label>
            <select value={ano} onChange={e => setAno(Number(e.target.value))}
              className="px-3 py-1.5 rounded-lg border border-border text-sm bg-white focus:outline-none focus:border-orange-400">
              {anosDisponiveis.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          {!isLoading && clientes.length > 0 && (
            <button onClick={() => setShowNovo(true)} className="btn-orange flex items-center gap-1.5 text-sm">
              <Plus size={15} /> Novo Cliente
            </button>
          )}
        </div>
      </div>

      {semSienge && (
        <div className="bg-white border border-border rounded-xl p-12 text-center">
          <Users size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Sienge não configurado</p>
          <p className="text-xs text-[var(--text-muted)] mb-5">Configure a integração para visualizar os clientes.</p>
          <Link href="/configuracoes/integracoes" className="btn-orange inline-flex gap-2">
            <Settings size={14} /> Configurar Sienge
          </Link>
        </div>
      )}

      {isLoading && <div className="h-64 bg-muted rounded-xl animate-pulse" />}

      {!isLoading && clientes.length > 0 && (
        <>
          <div className="flex items-center gap-2 bg-white border border-border rounded-xl px-3 py-2">
            <Search size={14} className="text-[var(--text-muted)]" />
            <input value={busca} onChange={e => setBusca(e.target.value)}
              className="flex-1 text-sm bg-transparent focus:outline-none"
              placeholder="Buscar por nome, CPF ou CNPJ..." />
          </div>

          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="grid grid-cols-[2fr_1.5fr_1fr_90px_90px] gap-3 px-5 py-2.5 border-b border-border bg-muted text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
              <span>Nome</span><span>CPF / CNPJ</span><span>E-mail</span>
              <span className="text-center">Informe IR</span>
              <span className="text-center">Perfil</span>
            </div>
            <div className="divide-y divide-border">
              {filtrados.map(c => (
                <div key={c.id} className="grid grid-cols-[2fr_1.5fr_1fr_90px_90px] gap-3 px-5 py-3 items-center text-sm hover:bg-muted/30">
                  <p className="font-medium text-[var(--text-primary)] truncate">{c.name ?? "—"}</p>
                  <p className="text-xs text-[var(--text-muted)] font-mono truncate">{formatDoc(c.cpf, c.cnpj)}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{c.email ?? "—"}</p>
                  <div className="flex justify-center">
                    <a
                      href={`/api/sienge/pdf/ir/${c.id}?ano=${ano}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-[10px] font-semibold text-[var(--text-muted)] hover:border-orange-300 hover:text-orange-600 transition-all"
                    >
                      <FileDown size={11} /> {ano}
                    </a>
                  </div>
                  <div className="flex justify-center">
                    <Link
                      href={`/comercial/clientes/${c.id}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-[10px] font-semibold text-[var(--text-muted)] hover:border-blue-300 hover:text-blue-600 transition-all"
                    >
                      Ver perfil
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {filtrados.length === 0 && <p className="text-center text-sm text-[var(--text-muted)] py-8">Nenhum cliente encontrado.</p>}
          <p className="text-xs text-center text-[var(--text-muted)]">{filtrados.length} de {clientes.length} clientes · Dados via Sienge</p>
        </>
      )}

      {/* Modal Novo Cliente */}
      {showNovo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Novo Cliente</h3>
              <button onClick={() => { setShowNovo(false); setNovoMsg("") }} className="p-1.5 rounded-lg hover:bg-muted"><X size={16} /></button>
            </div>
            <form onSubmit={handleCriar} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Nome completo *</label>
                  <input
                    type="text"
                    required
                    value={novoForm.name}
                    onChange={e => setNovoForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                    placeholder="Ex: João da Silva"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">CPF</label>
                  <input
                    type="text"
                    value={novoForm.cpf}
                    onChange={e => setNovoForm(f => ({ ...f, cpf: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                    placeholder="000.000.000-00"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">CNPJ</label>
                  <input
                    type="text"
                    value={novoForm.cnpj}
                    onChange={e => setNovoForm(f => ({ ...f, cnpj: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">E-mail</label>
                  <input
                    type="email"
                    value={novoForm.email}
                    onChange={e => setNovoForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                    placeholder="cliente@email.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Data de Nascimento</label>
                  <input
                    type="date"
                    value={novoForm.birthDate}
                    onChange={e => setNovoForm(f => ({ ...f, birthDate: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">RG</label>
                  <input
                    type="text"
                    value={novoForm.rg}
                    onChange={e => setNovoForm(f => ({ ...f, rg: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm"
                    placeholder="Ex: 1234567"
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
                  className="flex-1 btn-orange"
                >
                  {criarMut.isPending ? "Criando..." : "Criar Cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
