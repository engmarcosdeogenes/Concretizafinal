"use client"

import Link from "next/link"
import { ArrowLeft, CheckCircle2, Zap, Building2, Crown, MessageCircle } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { cn } from "@/lib/utils"

const PLANOS = [
  {
    id: "BASICO",
    nome: "Básico",
    preco: "R$ 197",
    periodo: "/mês",
    icon: Building2,
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
    recursos: [
      "Até 3 obras ativas",
      "RDO, FVS, FVM ilimitados",
      "Ocorrências + mapa visual",
      "Equipe e materiais",
      "Relatórios PDF",
      "1 usuário ADMIN",
      "Até 5 usuários por obra",
    ],
  },
  {
    id: "PRO",
    nome: "Pro",
    preco: "R$ 397",
    periodo: "/mês",
    icon: Zap,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-300",
    destaque: true,
    recursos: [
      "Obras ilimitadas",
      "RDO, FVS, FVM ilimitados",
      "Ocorrências + mapa visual",
      "Suprimentos e financeiro",
      "Análises e indicadores",
      "Integração Sienge",
      "Usuários ilimitados",
      "Relatórios PDF + Excel",
      "Suporte prioritário",
    ],
  },
  {
    id: "ENTERPRISE",
    nome: "Enterprise",
    preco: "Sob consulta",
    periodo: "",
    icon: Crown,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    recursos: [
      "Tudo do Pro",
      "SLA garantido",
      "Onboarding dedicado",
      "Integrações customizadas",
      "Treinamento presencial",
      "Gestor de conta exclusivo",
    ],
  },
]

export default function PlanoPage() {
  const { data: empresa } = trpc.configuracoes.buscarEmpresa.useQuery()
  const planoAtual = empresa?.plano ?? "BASICO"

  return (
    <div className="flex-1 space-y-8 p-8 pt-6 max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/configuracoes" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Plano & Faturamento</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Plano atual: <span className="font-semibold text-foreground capitalize">{planoAtual.toLowerCase()}</span>
          </p>
        </div>
      </div>

      {/* Plano atual em destaque */}
      <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
          <Zap size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">
            Você está no plano <span className="text-orange-600 capitalize">{planoAtual.toLowerCase()}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Para fazer upgrade ou gerenciar sua assinatura, entre em contato com nossa equipe.
          </p>
        </div>
        <a
          href="mailto:comercial@concretiza.app?subject=Upgrade de Plano"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
        >
          <MessageCircle size={14} />
          Falar com a gente
        </a>
      </div>

      {/* Cards de planos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {PLANOS.map(plano => {
          const Icon = plano.icon
          const ativo = planoAtual === plano.id
          return (
            <div key={plano.id} className={cn(
              "rounded-2xl border p-6 flex flex-col",
              plano.destaque ? "border-orange-300 shadow-md shadow-orange-100" : "border-border shadow-sm",
              ativo && "ring-2 ring-orange-400"
            )}>
              {/* Header do plano */}
              <div className="flex items-center gap-3 mb-5">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", plano.bg)}>
                  <Icon size={18} className={plano.color} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-base">{plano.nome}</h3>
                    {ativo && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded-full font-semibold">
                        Atual
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-0.5 mt-0.5">
                    <span className="text-lg font-bold">{plano.preco}</span>
                    <span className="text-xs text-muted-foreground">{plano.periodo}</span>
                  </div>
                </div>
              </div>

              {/* Recursos */}
              <ul className="space-y-2 flex-1">
                {plano.recursos.map(r => (
                  <li key={r} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <div className="mt-5">
                {ativo ? (
                  <div className="w-full h-9 rounded-lg bg-slate-100 text-slate-500 text-sm font-medium flex items-center justify-center">
                    Plano atual
                  </div>
                ) : plano.id === "ENTERPRISE" ? (
                  <a href="mailto:comercial@concretiza.app?subject=Plano Enterprise"
                    className="block w-full h-9 rounded-lg border border-border hover:bg-slate-50 text-sm font-medium flex items-center justify-center transition-colors">
                    Falar com comercial
                  </a>
                ) : (
                  <a href="mailto:comercial@concretiza.app?subject=Upgrade para Plano Pro"
                    className="block w-full h-9 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium flex items-center justify-center transition-colors">
                    Fazer upgrade
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center pb-4">
        Faturamento via boleto ou PIX. Contratos anuais com desconto de 20%.{" "}
        <a href="mailto:comercial@concretiza.app" className="text-orange-500 hover:underline">comercial@concretiza.app</a>
      </p>
    </div>
  )
}
