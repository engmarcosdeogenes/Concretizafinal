"use client"

import { useState, useRef } from "react"
import { X, FileText, Upload, Download, DollarSign, Building2, Tag, Receipt, Loader2 } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatMoeda } from "@/lib/format"
import { cn } from "@/lib/utils"

function fmtDate(d?: string | null) {
  if (!d) return "—"
  return new Date(d).toLocaleDateString("pt-BR")
}

interface BillDetailDrawerProps {
  billId: number
  onClose: () => void
}

type Tab = "parcelas" | "impostos" | "anexos" | "categorias" | "obras" | "unidades"

export default function BillDetailDrawer({ billId, onClose }: BillDetailDrawerProps) {
  const [tab, setTab] = useState<Tab>("parcelas")
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const utils = trpc.useUtils()

  const { data: bill, isLoading: loadingBill } = trpc.sienge.buscarBill.useQuery({ billId })
  const { data: parcelas = [], isLoading: loadingParcelas } = trpc.sienge.listarParcelasBill.useQuery({ billId }, { enabled: tab === "parcelas" })
  const { data: impostos = [], isLoading: loadingImpostos } = trpc.sienge.listarImpostosBill.useQuery({ billId }, { enabled: tab === "impostos" })
  const { data: anexos = [], isLoading: loadingAnexos } = trpc.sienge.listarAnexosBill.useQuery({ billId }, { enabled: tab === "anexos" })
  const { data: categorias = [], isLoading: loadingCategorias } = trpc.sienge.listarBudgetCategoriesBill.useQuery({ billId }, { enabled: tab === "categorias" })
  const { data: obras = [], isLoading: loadingObras } = trpc.sienge.listarBuildingsCostBill.useQuery({ billId }, { enabled: tab === "obras" })
  const { data: unidades = [], isLoading: loadingUnidades } = trpc.sienge.listarUnitsBill.useQuery({ billId }, { enabled: tab === "unidades" })

  const uploadAnexo = trpc.sienge.uploadAnexoBill.useMutation({
    onSuccess: () => {
      setUploadMsg("Anexo enviado!")
      utils.sienge.listarAnexosBill.invalidate({ billId })
      setTimeout(() => setUploadMsg(""), 2000)
      setUploading(false)
    },
    onError: (e) => {
      setUploadMsg(`Erro: ${e.message}`)
      setUploading(false)
    },
  })

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1]
      uploadAnexo.mutate({ billId, fileBase64: base64, fileName: file.name })
    }
    reader.readAsDataURL(file)
  }

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "parcelas", label: "Parcelas", icon: <DollarSign size={13} /> },
    { key: "impostos", label: "Impostos", icon: <Receipt size={13} /> },
    { key: "anexos", label: "Anexos", icon: <FileText size={13} /> },
    { key: "categorias", label: "Categorias", icon: <Tag size={13} /> },
    { key: "obras", label: "Obras", icon: <Building2 size={13} /> },
    { key: "unidades", label: "Unidades", icon: <Building2 size={13} /> },
  ]

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white shadow-xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">
              Título #{billId}
            </h2>
            {bill && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {(bill as any).creditorName ?? "Credor"} &middot; {formatMoeda((bill as any).amount ?? 0)}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted">
            <X size={16} />
          </button>
        </div>

        {/* Bill summary */}
        {loadingBill && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-orange-500" />
          </div>
        )}
        {bill && !loadingBill && (
          <div className="px-5 py-3 border-b border-border grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[var(--text-muted)] block">Documento</span>
              <span className="font-semibold text-[var(--text-primary)]">{(bill as any).documentNumber ?? "—"}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block">Vencimento</span>
              <span className="font-semibold text-[var(--text-primary)]">{fmtDate((bill as any).dueDate)}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block">Valor</span>
              <span className="font-semibold text-[var(--text-primary)]">{formatMoeda((bill as any).amount ?? 0)}</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block">Status</span>
              <span className="font-semibold text-[var(--text-primary)]">{(bill as any).status ?? "—"}</span>
            </div>
            {(bill as any).description && (
              <div className="col-span-2">
                <span className="text-[var(--text-muted)] block">Descricao</span>
                <span className="font-semibold text-[var(--text-primary)]">{(bill as any).description}</span>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 px-5 py-2 border-b border-border overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors",
                tab === t.key
                  ? "bg-orange-500 text-white"
                  : "text-[var(--text-muted)] hover:bg-muted"
              )}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* Parcelas */}
          {tab === "parcelas" && (
            <>
              {loadingParcelas && <Loader2 size={18} className="animate-spin text-orange-400 mx-auto" />}
              {!loadingParcelas && (Array.isArray(parcelas) ? parcelas : []).length === 0 && (
                <p className="text-xs text-[var(--text-muted)] text-center py-4">Nenhuma parcela encontrada.</p>
              )}
              {(Array.isArray(parcelas) ? parcelas : []).map((p: any, i: number) => (
                <div key={p.id ?? i} className="flex items-center justify-between bg-muted/50 rounded-lg p-3 text-xs">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">Parcela {p.installmentNumber ?? i + 1}</p>
                    <p className="text-[var(--text-muted)]">Vence: {fmtDate(p.dueDate)}</p>
                  </div>
                  <p className="font-bold text-[var(--text-primary)]">{formatMoeda(p.amount ?? 0)}</p>
                </div>
              ))}
            </>
          )}

          {/* Impostos */}
          {tab === "impostos" && (
            <>
              {loadingImpostos && <Loader2 size={18} className="animate-spin text-orange-400 mx-auto" />}
              {!loadingImpostos && (Array.isArray(impostos) ? impostos : []).length === 0 && (
                <p className="text-xs text-[var(--text-muted)] text-center py-4">Nenhum imposto encontrado.</p>
              )}
              {(Array.isArray(impostos) ? impostos : []).map((imp: any, i: number) => (
                <div key={imp.id ?? i} className="flex items-center justify-between bg-muted/50 rounded-lg p-3 text-xs">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{imp.taxName ?? imp.name ?? `Imposto ${i + 1}`}</p>
                    {imp.aliquot != null && <p className="text-[var(--text-muted)]">Aliquota: {imp.aliquot}%</p>}
                  </div>
                  <p className="font-bold text-[var(--text-primary)]">{formatMoeda(imp.amount ?? imp.value ?? 0)}</p>
                </div>
              ))}
            </>
          )}

          {/* Anexos */}
          {tab === "anexos" && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[var(--text-primary)]">Anexos do Titulo</p>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 disabled:opacity-50"
                >
                  {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                  Upload
                </button>
                <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
              </div>
              {uploadMsg && (
                <p className={cn("text-xs font-semibold px-3 py-2 rounded-lg", uploadMsg.startsWith("Erro") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700")}>
                  {uploadMsg}
                </p>
              )}
              {loadingAnexos && <Loader2 size={18} className="animate-spin text-orange-400 mx-auto" />}
              {!loadingAnexos && (Array.isArray(anexos) ? anexos : []).length === 0 && (
                <p className="text-xs text-[var(--text-muted)] text-center py-4">Nenhum anexo encontrado.</p>
              )}
              {(Array.isArray(anexos) ? anexos : []).map((a: any, i: number) => (
                <div key={a.id ?? i} className="flex items-center justify-between bg-muted/50 rounded-lg p-3 text-xs">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-orange-500" />
                    <div>
                      <p className="font-semibold text-[var(--text-primary)]">{a.fileName ?? a.name ?? `Arquivo ${i + 1}`}</p>
                      {a.description && <p className="text-[var(--text-muted)]">{a.description}</p>}
                    </div>
                  </div>
                  <Download size={14} className="text-[var(--text-muted)] cursor-pointer hover:text-orange-500" />
                </div>
              ))}
            </>
          )}

          {/* Categorias */}
          {tab === "categorias" && (
            <>
              {loadingCategorias && <Loader2 size={18} className="animate-spin text-orange-400 mx-auto" />}
              {!loadingCategorias && (Array.isArray(categorias) ? categorias : []).length === 0 && (
                <p className="text-xs text-[var(--text-muted)] text-center py-4">Nenhuma categoria encontrada.</p>
              )}
              {(Array.isArray(categorias) ? categorias : []).map((c: any, i: number) => (
                <div key={c.id ?? i} className="flex items-center justify-between bg-muted/50 rounded-lg p-3 text-xs">
                  <p className="font-semibold text-[var(--text-primary)]">{c.name ?? c.description ?? `Categoria ${i + 1}`}</p>
                  {c.percentage != null && <p className="text-[var(--text-muted)]">{c.percentage}%</p>}
                  {c.value != null && <p className="font-bold text-[var(--text-primary)]">{formatMoeda(c.value)}</p>}
                </div>
              ))}
            </>
          )}

          {/* Obras */}
          {tab === "obras" && (
            <>
              {loadingObras && <Loader2 size={18} className="animate-spin text-orange-400 mx-auto" />}
              {!loadingObras && (Array.isArray(obras) ? obras : []).length === 0 && (
                <p className="text-xs text-[var(--text-muted)] text-center py-4">Nenhuma apropriacao por obra.</p>
              )}
              {(Array.isArray(obras) ? obras : []).map((o: any, i: number) => (
                <div key={o.buildingId ?? i} className="flex items-center justify-between bg-muted/50 rounded-lg p-3 text-xs">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{o.buildingName ?? `Obra ${o.buildingId ?? i + 1}`}</p>
                    {o.percentage != null && <p className="text-[var(--text-muted)]">{o.percentage}%</p>}
                  </div>
                  {o.value != null && <p className="font-bold text-[var(--text-primary)]">{formatMoeda(o.value)}</p>}
                </div>
              ))}
            </>
          )}

          {/* Unidades */}
          {tab === "unidades" && (
            <>
              {loadingUnidades && <Loader2 size={18} className="animate-spin text-orange-400 mx-auto" />}
              {!loadingUnidades && (Array.isArray(unidades) ? unidades : []).length === 0 && (
                <p className="text-xs text-[var(--text-muted)] text-center py-4">Nenhuma unidade associada.</p>
              )}
              {(Array.isArray(unidades) ? unidades : []).map((u: any, i: number) => (
                <div key={u.unitId ?? i} className="flex items-center justify-between bg-muted/50 rounded-lg p-3 text-xs">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{u.unitName ?? `Unidade ${u.unitId ?? i + 1}`}</p>
                    {u.percentage != null && <p className="text-[var(--text-muted)]">{u.percentage}%</p>}
                  </div>
                  {u.value != null && <p className="font-bold text-[var(--text-primary)]">{formatMoeda(u.value)}</p>}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
