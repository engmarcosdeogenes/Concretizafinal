"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { ArrowLeft, Bell, BellOff, Smartphone, Mail, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type PushStatus = "idle" | "solicitando" | "ativo" | "negado" | "nao-suportado"

function usePushStatus(): [PushStatus, () => Promise<void>] {
  const [status, setStatus] = useState<PushStatus>("idle")

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setStatus("nao-suportado")
      return
    }
    if (Notification.permission === "granted") setStatus("ativo")
    else if (Notification.permission === "denied") setStatus("negado")
    else setStatus("idle")
  }, [])

  async function solicitar() {
    if (!("Notification" in window)) return
    setStatus("solicitando")
    const perm = await Notification.requestPermission()
    if (perm === "granted") {
      setStatus("ativo")
      toast.success("Notificações push ativadas!")
    } else {
      setStatus("negado")
      toast.error("Permissão negada. Habilite manualmente nas configurações do navegador.")
    }
  }

  return [status, solicitar]
}

// ─── Preferências de notificação (estado local, persistir futuramente) ────────
const PREFS_DEFAULT = {
  rdo_novo:         true,
  rdo_aprovado:     true,
  fvs_aprovado:     true,
  fvs_rejeitado:    true,
  ocorrencia_nova:  true,
  solicitacao_nova: true,
  pedido_entregue:  false,
  financeiro:       false,
}

type PrefKey = keyof typeof PREFS_DEFAULT

const PREF_LABELS: Record<PrefKey, { label: string; desc: string; categoria: string }> = {
  rdo_novo:         { label: "Novo RDO criado",           desc: "Quando um RDO é registrado em uma de suas obras", categoria: "Campo" },
  rdo_aprovado:     { label: "RDO aprovado",              desc: "Quando um RDO recebe aprovação",                  categoria: "Campo" },
  fvs_aprovado:     { label: "FVS aprovada",              desc: "Quando uma inspeção de serviço é aprovada",       categoria: "Campo" },
  fvs_rejeitado:    { label: "FVS rejeitada / retrabalho",desc: "Quando uma inspeção é rejeitada ou exige retrabalho", categoria: "Campo" },
  ocorrencia_nova:  { label: "Nova ocorrência aberta",    desc: "Quando uma ocorrência é registrada em obra",      categoria: "Campo" },
  solicitacao_nova: { label: "Nova solicitação de compra",desc: "Quando o campo solicita materiais",               categoria: "Suprimentos" },
  pedido_entregue:  { label: "Pedido entregue",           desc: "Quando um pedido de compra é marcado como entregue", categoria: "Suprimentos" },
  financeiro:       { label: "Alertas financeiros",       desc: "Quando o custo da obra superar o orçamento",     categoria: "Financeiro" },
}

const CATEGORIAS = ["Campo", "Suprimentos", "Financeiro"]

const LS_KEY = "concretiza:notif_prefs"

export default function NotificacoesPage() {
  const [pushStatus, solicitarPush] = usePushStatus()
  const [prefs, setPrefs]  = useState(PREFS_DEFAULT)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) setPrefs({ ...PREFS_DEFAULT, ...JSON.parse(saved) })
    } catch {}
  }, [])

  function toggle(key: PrefKey) {
    setPrefs(p => ({ ...p, [key]: !p[key] }))
  }

  function salvar() {
    setSalvando(true)
    try { localStorage.setItem(LS_KEY, JSON.stringify(prefs)) } catch {}
    setSalvando(false)
    toast.success("Preferências salvas.")
  }

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/configuracoes" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notificações</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Controle como e quando você será notificado.</p>
        </div>
      </div>

      {/* Push notifications */}
      <div className="rounded-2xl border border-border bg-white shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
            <Smartphone size={18} className="text-orange-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm">Notificações Push</h3>
            <p className="text-xs text-muted-foreground">Receba alertas diretamente no seu dispositivo, mesmo com o navegador fechado.</p>
          </div>
          {pushStatus === "ativo" && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold">
              <CheckCircle2 size={10} /> Ativo
            </span>
          )}
          {pushStatus === "negado" && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-semibold">
              <AlertCircle size={10} /> Bloqueado
            </span>
          )}
        </div>

        {pushStatus === "idle" && (
          <button onClick={solicitarPush}
            className="w-full h-10 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors">
            Ativar notificações push
          </button>
        )}
        {pushStatus === "solicitando" && (
          <div className="w-full h-10 rounded-lg bg-orange-100 text-orange-600 text-sm font-medium flex items-center justify-center gap-2">
            <span className="animate-pulse">Aguardando permissão…</span>
          </div>
        )}
        {pushStatus === "ativo" && (
          <p className="text-xs text-muted-foreground italic">
            Seu dispositivo já está registrado para receber notificações.
          </p>
        )}
        {pushStatus === "negado" && (
          <p className="text-xs text-muted-foreground">
            Permissão bloqueada no navegador. Para reativar, vá em <strong>Configurações do navegador → Privacidade → Notificações</strong> e permita este site.
          </p>
        )}
        {pushStatus === "nao-suportado" && (
          <p className="text-xs text-muted-foreground italic">
            Seu navegador não suporta notificações push.
          </p>
        )}
      </div>

      {/* E-mail notifications — em breve */}
      <div className="rounded-2xl border border-border bg-white shadow-sm p-6 opacity-60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Mail size={18} className="text-slate-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm">Notificações por E-mail</h3>
              <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-semibold">Em breve</span>
            </div>
            <p className="text-xs text-muted-foreground">Resumo diário e alertas críticos no seu e-mail.</p>
          </div>
        </div>
      </div>

      {/* Preferências por evento */}
      <div className="rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-bold text-sm">O que notificar</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Configure quais eventos geram uma notificação push.</p>
        </div>

        {CATEGORIAS.map(cat => {
          const items = (Object.entries(PREF_LABELS) as [PrefKey, typeof PREF_LABELS[PrefKey]][])
            .filter(([, v]) => v.categoria === cat)
          return (
            <div key={cat}>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-6 py-2 bg-slate-50 border-b border-border">
                {cat}
              </p>
              <div className="divide-y divide-border">
                {items.map(([key, meta]) => (
                  <div key={key} className="flex items-center gap-4 px-6 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{meta.label}</p>
                      <p className="text-xs text-muted-foreground">{meta.desc}</p>
                    </div>
                    <button
                      onClick={() => toggle(key)}
                      className={cn(
                        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none",
                        prefs[key] ? "bg-orange-500" : "bg-slate-200"
                      )}
                    >
                      <span className={cn(
                        "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                        prefs[key] ? "translate-x-4" : "translate-x-0.5"
                      )} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        <div className="px-6 py-4 border-t border-border bg-slate-50/50 flex justify-end">
          <button onClick={salvar}
            className="h-9 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors disabled:opacity-50">
            {salvando ? "Salvando…" : "Salvar preferências"}
          </button>
        </div>
      </div>

    </div>
  )
}
