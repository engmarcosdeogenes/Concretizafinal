"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { trpc } from "@/lib/trpc/client"
import {
  LayoutDashboard, HardHat, ClipboardCheck,
  Package, FileText, MessageSquare, Settings,
  ChevronDown, BarChart3, DollarSign, ArrowLeft,
  ClipboardList, AlertTriangle, Users, Box, MapPin,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ── Global nav ──────────────────────────────────────────────
const globalNavItems = [
  { label: "Painel", href: "/painel", icon: LayoutDashboard, exact: true },
  { label: "Obras", href: "/obras", icon: HardHat },
  {
    label: "Suprimentos", href: "/suprimentos", icon: Package,
    children: [
      { label: "Fornecedores", href: "/suprimentos/fornecedores" },
      { label: "Materiais", href: "/suprimentos/materiais" },
      { label: "Equipamentos", href: "/suprimentos/equipamentos" },
      { label: "Solicitações", href: "/suprimentos/solicitacoes" },
      { label: "Pedidos", href: "/suprimentos/pedidos" },
    ],
  },
  { label: "Relatórios", href: "/relatorios", icon: FileText },
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
]

// ── Obra nav ─────────────────────────────────────────────────
function getObraNavItems(obraId: string) {
  const base = `/obras/${obraId}`
  return [
    { label: "Visão Geral", href: base, icon: LayoutDashboard, exact: true },
    { label: "RDO", href: `${base}/rdo`, icon: ClipboardList },
    { label: "FVS", href: `${base}/fvs`, icon: ClipboardCheck },
    { label: "FVM", href: `${base}/fvm`, icon: Package },
    { label: "Ocorrências", href: `${base}/ocorrencias`, icon: AlertTriangle },
    { label: "Mapa", href: `${base}/mapa`, icon: MapPin },
    { label: "Equipe", href: `${base}/equipe`, icon: Users },
    { label: "Materiais", href: `${base}/materiais`, icon: Box },
    { label: "Documentos", href: `${base}/documentos`, icon: FileText },
    { label: "Financeiro", href: `${base}/financeiro`, icon: DollarSign },
  ]
}

// ── Shared pieces ─────────────────────────────────────────────
function Logo() {
  return (
    <div
      className="flex items-center gap-2.5 px-5 border-b border-[var(--sidebar-border)] flex-shrink-0"
      style={{ height: "var(--navbar-h)" }}
    >
      <div className="w-8 h-8 bg-[var(--blue)] rounded-lg flex items-center justify-center flex-shrink-0">
        <span className="text-white font-extrabold text-sm">C</span>
      </div>
      <span className="text-white font-bold tracking-tight" style={{ fontSize: 15 }}>
        Concretiza
      </span>
    </div>
  )
}

function UserFooter() {
  const { data: session } = trpc.painel.me.useQuery()

  return (
    <div className="p-2.5 border-t border-[var(--sidebar-border)] flex-shrink-0">
      <div className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors min-h-[44px]">
        <div className="w-8 h-8 bg-[var(--blue)] rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm uppercase">
          {session?.nome?.[0] || "C"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[#e2e8f0] text-[12.5px] font-semibold truncate capitalize">
            {session?.nome || "Carregando..."}
          </p>
          <p className="text-[var(--sidebar-text)] text-[11.5px] truncate capitalize">
            {session?.role ? session.role.toLowerCase() : "Conectando..."}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export function Sidebar() {
  const pathname = usePathname()

  // Detect /obras/[id] — but NOT /obras or /obras/nova
  const obraMatch = pathname.match(/^\/obras\/([^/]+)/)
  const obraId = obraMatch?.[1]
  const isInsideObra = !!(obraId && obraId !== "nova")

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/")

  // ── Obra contextual sidebar ──
  if (isInsideObra && obraId) {
    const obraNavItems = getObraNavItems(obraId)

    return (
      <aside
        className="flex flex-col h-screen sticky top-0 flex-shrink-0 bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]"
        style={{ width: "var(--sidebar-width)" }}
      >
        <Logo />

        {/* Back + context */}
        <div className="px-3 pt-3 pb-3 border-b border-[var(--sidebar-border)] flex-shrink-0">
          <Link
            href="/obras"
            className={cn(
              "flex items-center gap-1.5 px-2 py-1.5 rounded-lg mb-3",
              "text-[12px] font-medium no-underline transition-all",
              "text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-hover)] hover:bg-white/5"
            )}
          >
            <ArrowLeft size={13} />
            Todas as obras
          </Link>
          <div className="px-2">
            <p className="text-[10.5px] text-[var(--sidebar-text)] uppercase tracking-wider font-semibold mb-0.5">
              Obra selecionada
            </p>
            <p className="text-white text-[13px] font-semibold truncate">
              Carregando...
            </p>
          </div>
        </div>

        {/* Obra nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
          {obraNavItems.map(({ label, href, icon: Icon, exact }) => {
            const active = isActive(href, exact)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg",
                  "text-[13.5px] font-medium no-underline transition-all",
                  active
                    ? "bg-[var(--sidebar-active-bg)] text-white font-semibold"
                    : "text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-hover)] hover:bg-white/5"
                )}
              >
                <Icon size={16} className="flex-shrink-0" />
                <span>{label}</span>
              </Link>
            )
          })}
        </nav>

        <UserFooter />
      </aside>
    )
  }

  // ── Global sidebar ──
  return (
    <aside
      className="flex flex-col h-screen sticky top-0 flex-shrink-0 bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]"
      style={{ width: "var(--sidebar-width)" }}
    >
      <Logo />

      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-0.5">
        {globalNavItems.map((item) => {
          const active = isActive(item.href, item.exact)
          const groupActive = !!(item.children && pathname.startsWith(item.href))
          const Icon = item.icon

          if (item.children) {
            return (
              <div key={item.href}>
                <Link href={item.children[0].href} className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg no-underline transition-colors",
                  "text-[13.5px] font-medium",
                  groupActive ? "text-[var(--sidebar-text-hover)] bg-white/5" : "text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-hover)] hover:bg-white/5"
                )}>
                  <Icon size={16} className="flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  <ChevronDown
                    size={13}
                    className="transition-transform duration-200"
                    style={{ transform: groupActive ? "rotate(0deg)" : "rotate(-90deg)" }}
                  />
                </Link>

                {groupActive && (
                  <div className="ml-[26px] mt-0.5 border-l border-[var(--sidebar-border)] pl-2.5 space-y-0.5">
                    {item.children.map((child) => {
                      const childActive = pathname === child.href
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "block py-1.5 px-2.5 rounded-md text-[12.5px] transition-all no-underline",
                            childActive
                              ? "font-semibold text-sky-300 bg-blue-900/20"
                              : "font-normal text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-hover)]"
                          )}
                        >
                          {child.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg",
                "text-[13.5px] font-medium no-underline transition-all",
                active
                  ? "bg-[var(--sidebar-active-bg)] text-white font-semibold"
                  : "text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-hover)] hover:bg-white/5"
              )}
            >
              <Icon size={16} className="flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <UserFooter />
    </aside>
  )
}
