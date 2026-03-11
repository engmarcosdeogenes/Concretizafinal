"use client"

import { use, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Building2, Phone, Mail, MapPin, CreditCard, QrCode, AlertCircle, ExternalLink, PowerOff, Power } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"

const PIX_LABEL: Record<string, string> = {
  CPF:    "CPF",
  CNPJ:   "CNPJ",
  EMAIL:  "E-mail",
  PHONE:  "Telefone",
  RANDOM: "Chave aleatória",
}

export default function FornecedorDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [toggleMsg, setToggleMsg] = useState("")

  const utils = trpc.useUtils()
  const { data: resultado } = trpc.fornecedor.listar.useQuery()
  const fornecedor = resultado?.fornecedores.find(f => f.id === id)

  const { data: dadosBancarios, isLoading: loadingBanco } = trpc.sienge.buscarDadosBancariosPorCnpj.useQuery(
    { cnpj: fornecedor?.cnpj ?? "" },
    { enabled: !!fornecedor?.cnpj },
  )

  const toggleAtivo = trpc.sienge.toggleAtivoCreditor.useMutation({
    onSuccess: () => {
      setToggleMsg("Atualizado no Sienge!")
      utils.fornecedor.listar.invalidate()
      setTimeout(() => setToggleMsg(""), 3000)
    },
    onError: () => setToggleMsg("Erro ao atualizar no Sienge."),
  })

  if (!fornecedor) {
    return (
      <div className="p-6">
        <Link href="/suprimentos/fornecedores" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">
          <ArrowLeft size={16} /> Fornecedores
        </Link>
        <p className="mt-4 text-sm text-[var(--text-muted)]">Fornecedor não encontrado.</p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <Link
        href="/suprimentos/fornecedores"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        <ArrowLeft size={16} /> Fornecedores
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Building2 size={20} className="text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{fornecedor.nome}</h1>
            {fornecedor.siengeCreditorId && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">Sienge #{fornecedor.siengeCreditorId}</span>
            )}
          </div>
          <p className="text-sm text-[var(--text-muted)]">{fornecedor.categoria ?? "Fornecedor"}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            "px-2 py-0.5 rounded-full text-xs font-semibold",
            fornecedor.ativo ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
          )}>
            {fornecedor.ativo ? "Ativo" : "Inativo"}
          </span>
          {fornecedor.siengeCreditorId && (
            <button
              type="button"
              disabled={toggleAtivo.isPending}
              onClick={() => toggleAtivo.mutate({ credorId: fornecedor.siengeCreditorId!, ativo: !fornecedor.ativo })}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-60",
                fornecedor.ativo
                  ? "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                  : "border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
              )}
            >
              {fornecedor.ativo ? <><PowerOff size={12} /> Desativar no Sienge</> : <><Power size={12} /> Ativar no Sienge</>}
            </button>
          )}
        </div>
        {toggleMsg && <p className="w-full text-xs font-semibold text-emerald-600 mt-1">{toggleMsg}</p>}
      </div>

      {/* Informações gerais */}
      <div className="bg-white border border-border rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Informações</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {fornecedor.cnpj && (
            <div>
              <p className="text-xs text-[var(--text-muted)]">CNPJ</p>
              <p className="font-mono font-medium text-[var(--text-primary)]">{fornecedor.cnpj}</p>
            </div>
          )}
          {(fornecedor.cidade || fornecedor.estado) && (
            <div>
              <p className="text-xs text-[var(--text-muted)]">Localização</p>
              <p className="flex items-center gap-1 text-[var(--text-primary)]">
                <MapPin size={12} className="text-[var(--text-muted)]" />
                {[fornecedor.cidade, fornecedor.estado].filter(Boolean).join(" — ")}
              </p>
            </div>
          )}
          {fornecedor.telefone && (
            <div>
              <p className="text-xs text-[var(--text-muted)]">Telefone</p>
              <p className="flex items-center gap-1 text-[var(--text-primary)]">
                <Phone size={12} className="text-[var(--text-muted)]" />{fornecedor.telefone}
              </p>
            </div>
          )}
          {fornecedor.email && (
            <div>
              <p className="text-xs text-[var(--text-muted)]">E-mail</p>
              <p className="flex items-center gap-1 text-[var(--text-primary)]">
                <Mail size={12} className="text-[var(--text-muted)]" />{fornecedor.email}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-[var(--text-muted)]">Pedidos realizados</p>
            <p className="font-semibold text-[var(--text-primary)]">{fornecedor._count.pedidos}</p>
          </div>
        </div>
      </div>

      {/* Dados de Pagamento (Sienge) */}
      <div className="bg-white border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard size={16} className="text-purple-600" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Dados de Pagamento</h2>
          <span className="ml-auto text-xs text-[var(--text-muted)] bg-slate-100 px-2 py-0.5 rounded-full">via Sienge</span>
        </div>

        {!fornecedor.cnpj ? (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
            <AlertCircle size={14} />
            CNPJ não cadastrado — vincule o CNPJ ao fornecedor para buscar os dados bancários no Sienge.
          </div>
        ) : loadingBanco ? (
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : !dadosBancarios?.credorId ? (
          <div className="flex items-center gap-2 p-3 bg-slate-50 border border-border rounded-xl text-[var(--text-muted)] text-sm">
            <AlertCircle size={14} />
            Fornecedor não encontrado no Sienge (CNPJ {fornecedor.cnpj}).
          </div>
        ) : (
          <div className="space-y-4">
            {/* Contas Bancárias */}
            {dadosBancarios.contas.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Contas Bancárias</p>
                <div className="space-y-2">
                  {dadosBancarios.contas.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-border">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <CreditCard size={14} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{c.bankName} ({c.bankCode})</p>
                        <p className="text-xs text-[var(--text-muted)]">
                          Ag. {c.agency} · CC {c.account}
                          {c.accountType ? ` · ${c.accountType}` : ""}
                        </p>
                      </div>
                      {c.holder && <p className="text-xs text-[var(--text-muted)] truncate max-w-[120px]">{c.holder}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chaves PIX */}
            {dadosBancarios.pix.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">Chaves PIX</p>
                <div className="space-y-2">
                  {dadosBancarios.pix.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-border">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <QrCode size={14} className="text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[var(--text-muted)]">{PIX_LABEL[p.keyType] ?? p.keyType}</p>
                        <p className="text-sm font-mono font-semibold text-[var(--text-primary)] truncate">{p.keyValue}</p>
                      </div>
                      {p.holder && <p className="text-xs text-[var(--text-muted)] truncate max-w-[120px]">{p.holder}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dadosBancarios.contas.length === 0 && dadosBancarios.pix.length === 0 && (
              <p className="text-sm text-[var(--text-muted)]">Nenhum dado bancário ou PIX cadastrado para este fornecedor no Sienge.</p>
            )}
          </div>
        )}
      </div>

      <Link
        href="/suprimentos/fornecedores"
        className="inline-flex items-center gap-2 text-sm text-orange-500 hover:text-orange-600 transition-colors"
      >
        <ExternalLink size={14} /> Ver todos os fornecedores
      </Link>
    </div>
  )
}
