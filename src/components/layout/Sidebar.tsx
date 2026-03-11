"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { trpc } from "@/lib/trpc/client"
import { useSidebar } from "@/contexts/sidebar-context"
import {
  LayoutDashboard, HardHat, ClipboardCheck,
  Package, FileText, MessageSquare, Settings,
  ChevronDown, DollarSign, ArrowLeft,
  ClipboardList, AlertTriangle, Users, Box, MapPin,
  TrendingUp, ListTodo, BarChart3, BarChart2, Tags, CheckSquare, Building2, Warehouse,
} from "lucide-react"
import { cn } from "@/lib/utils"

const SIDEBAR_COLLAPSED_W = 56
const SIDEBAR_FULL_W = "var(--sidebar-width)"

// ── Global nav ──────────────────────────────────────────────
const globalNavItems = [
  { label: "Visão Geral", href: "/painel", icon: LayoutDashboard, exact: true },
  { label: "Obras", href: "/obras", icon: HardHat },
  {
    label: "Suprimentos", href: "/suprimentos", icon: Package,
    children: [
      { label: "Fornecedores", href: "/suprimentos/fornecedores" },
      { label: "Materiais", href: "/suprimentos/materiais" },
      { label: "Equipamentos", href: "/suprimentos/equipamentos" },
      { label: "Solicitações", href: "/suprimentos/solicitacoes" },
      { label: "Pedidos", href: "/suprimentos/pedidos" },
      { label: "Cotações", href: "/suprimentos/cotacoes", icon: Tags },
      { label: "Notas Fiscais", href: "/suprimentos/nfe" },
    ],
  },
  {
    label: "Financeiro", href: "/financeiro", icon: DollarSign,
    children: [
      { label: "Contas a Pagar",   href: "/financeiro/contas-pagar" },
      { label: "Recebimentos",     href: "/financeiro/recebimentos" },
      { label: "Saldos Bancários", href: "/financeiro/caixa" },
      { label: "Balancete",        href: "/financeiro/balancete" },
    ],
  },
  {
    label: "Comercial", href: "/comercial", icon: Building2,
    children: [
      { label: "Mapa Imobiliário",  href: "/comercial/mapa" },
      { label: "Contratos",         href: "/comercial/contratos" },
      { label: "Locações",          href: "/comercial/locacoes" },
      { label: "Comissões",         href: "/comercial/comissoes" },
      { label: "Entrega de Chaves", href: "/comercial/entrega-chaves" },
      { label: "Clientes",          href: "/comercial/clientes" },
    ],
  },
  { label: "Patrimônio", href: "/patrimonio", icon: Warehouse },
  { label: "Painéis", href: "/paineis", icon: BarChart3 },
  { label: "Análises", href: "/analises", icon: TrendingUp },
  { label: "Relatórios", href: "/relatorios", icon: FileText },
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
]

// ── Obra nav ─────────────────────────────────────────────────
function getObraNavItems(obraId: string, hasSienge = false) {
  const base = `/obras/${obraId}`
  return [
    { label: "Visão Geral", href: base, icon: LayoutDashboard, exact: true },
    { label: "RDO", href: `${base}/rdo`, icon: ClipboardList },
    { label: "FVS", href: `${base}/fvs`, icon: ClipboardCheck },
    { label: "FVM", href: `${base}/fvm`, icon: Package },
    { label: "Checklist", href: `${base}/checklist`, icon: CheckSquare },
    { label: "Ocorrências", href: `${base}/ocorrencias`, icon: AlertTriangle },
    { label: "Mapa", href: `${base}/mapa`, icon: MapPin },
    { label: "Equipe", href: `${base}/equipe`, icon: Users },
    { label: "Materiais", href: `${base}/materiais`, icon: Box },
    { label: "Documentos", href: `${base}/documentos`, icon: FileText },
    { label: "Financeiro", href: `${base}/financeiro`, icon: DollarSign },
    { label: "Medição",   href: `${base}/medicao`,   icon: BarChart2 },
    ...(hasSienge ? [
      { label: "Tarefas",      href: `${base}/tarefas`,      icon: ListTodo,  exact: false },
      { label: "Orçamento",    href: `${base}/orcamento`,    icon: BarChart3, exact: false },
      { label: "Almoxarifado", href: `${base}/almoxarifado`, icon: Package,   exact: false },
      { label: "Contratos",    href: `${base}/contratos`,    icon: FileText,  exact: false },
    ] : []),
    { label: "Chat", href: `${base}/chat`, icon: MessageSquare },
    { label: "Configurações", href: `${base}/configuracoes`, icon: Settings },
  ]
}

// ── Logo ──────────────────────────────────────────────────────
function Logo({ collapsed }: { collapsed: boolean }) {
  return (
    <div
      className="flex items-center border-b border-[var(--sidebar-border)] flex-shrink-0"
      style={{ height: "var(--navbar-h)" }}
    >
      <Link
        href="/obras"
        title="Ir para Obras"
        className={cn(
          "flex items-center no-underline hover:opacity-90 transition-opacity",
          collapsed
            ? "justify-center w-10 h-10 mx-auto rounded-lg"
            : "gap-0 px-5 h-full w-full"
        )}
      >
        <div className="w-8 h-8 bg-[var(--blue)] rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white font-extrabold text-sm">C</span>
        </div>
        {!collapsed && (
          <span className="text-white font-bold tracking-tight ml-2.5 whitespace-nowrap" style={{ fontSize: 15 }}>
            Concretiza
          </span>
        )}
      </Link>
    </div>
  )
}

// ── UserFooter ────────────────────────────────────────────────
function UserFooter({ collapsed }: { collapsed: boolean }) {
  const { data: session, isLoading } = trpc.painel.me.useQuery()
  const nome = session?.nome ?? ""
  const inicial = nome?.[0]?.toUpperCase() || "C"

  return (
    <div
      className="border-t border-[var(--sidebar-border)] flex-shrink-0 overflow-hidden"
      style={{ padding: collapsed ? "10px 0" : "10px" }}
    >
      <div
        title={collapsed ? (nome || "Usuário") : undefined}
        className={cn(
          "flex items-center rounded-lg cursor-pointer hover:bg-white/5 transition-colors",
          collapsed ? "justify-center p-2" : "gap-2.5 p-2 min-h-[44px]"
        )}
      >
        <div className="w-8 h-8 bg-[var(--blue)] rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm uppercase">
          {inicial}
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-[#e2e8f0] text-[12.5px] font-semibold truncate capitalize">
              {isLoading ? "…" : (nome || "Usuário")}
            </p>
            <p className="text-[var(--sidebar-text)] text-[11.5px] truncate capitalize">
              {isLoading ? "…" : (session?.role ? session.role.toLowerCase() : "—")}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function ObraNome({ obraId }: { obraId: string }) {
  const { data } = trpc.obra.buscarPorId.useQuery({ id: obraId })
  return (
    <p className="text-white text-[13px] font-semibold truncate">
      {data?.nome ?? "—"}
    </p>
  )
}

// ── Shared nav link ───────────────────────────────────────────
function NavLink({
  href, label, icon: Icon, active, collapsed,
}: {
  href: string; label: string; icon: React.ElementType
  active: boolean; collapsed: boolean
}) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      className={cn(
        "flex items-center rounded-lg no-underline transition-all",
        collapsed
          ? "justify-center w-10 h-10 mx-auto"
          : "gap-2.5 px-2.5 py-2.5",
        active
          ? "bg-[var(--sidebar-active-bg)] text-white font-semibold"
          : "text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-hover)] hover:bg-white/5",
        !collapsed && "text-[13.5px] font-medium"
      )}
    >
      <Icon size={collapsed ? 18 : 16} className="flex-shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  )
}

// ── Main component ────────────────────────────────────────────
export function Sidebar() {
  const { collapsed } = useSidebar()
  const pathname = usePathname()

  const obraMatch = pathname.match(/^\/obras\/([^/]+)/)
  const obraId = obraMatch?.[1]
  const isInsideObra = !!(obraId && obraId !== "nova")

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/")

  const asideStyle = {
    width: collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_FULL_W,
    transition: "width 0.22s cubic-bezier(0.4,0,0.2,1)",
    overflow: "hidden",
  }

  const { data: obraData } = trpc.obra.buscarPorId.useQuery(
    { id: obraId ?? "" },
    { enabled: isInsideObra && !!obraId }
  )
  const hasSienge = !!(obraData?.siengeId)

  // ── Obra contextual sidebar ──
  if (isInsideObra && obraId) {
    const obraNavItems = getObraNavItems(obraId, hasSienge)

    return (
      <aside
        className="flex flex-col h-screen sticky top-0 flex-shrink-0 bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]"
        style={asideStyle}
      >
        <Logo collapsed={collapsed} />

        {/* Back + context */}
        {!collapsed && (
          <div className="px-3 pt-3 pb-3 border-b border-[var(--sidebar-border)] flex-shrink-0">
            <Link
              href="/obras"
              className={cn(
                "flex items-center gap-1.5 px-2 py-1.5 rounded-lg mb-3",
                "text-[12px] font-medium no-underline transition-all whitespace-nowrap",
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
              <ObraNome obraId={obraId} />
            </div>
          </div>
        )}

        {collapsed && (
          <div className="flex justify-center py-2 border-b border-[var(--sidebar-border)]">
            <Link
              href="/obras"
              title="Todas as obras"
              className="flex items-center justify-center w-10 h-10 rounded-lg text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-hover)] hover:bg-white/5 transition-all"
            >
              <ArrowLeft size={16} />
            </Link>
          </div>
        )}

        {/* Obra nav */}
        <nav className={cn("flex-1 overflow-y-auto sidebar-scroll space-y-0.5", collapsed ? "py-3 px-1.5" : "py-3 px-2.5")}>
          {obraNavItems.map(({ label, href, icon: Icon, exact }) => (
            <NavLink
              key={href}
              href={href}
              label={label}
              icon={Icon}
              active={isActive(href, exact)}
              collapsed={collapsed}
            />
          ))}
        </nav>

        <UserFooter collapsed={collapsed} />
      </aside>
    )
  }

  // ── Global sidebar ──
  return (
    <aside
      className="flex flex-col h-screen sticky top-0 flex-shrink-0 bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)]"
      style={asideStyle}
    >
      <Logo collapsed={collapsed} />

      <nav className={cn("flex-1 overflow-y-auto sidebar-scroll space-y-0.5", collapsed ? "py-3 px-1.5" : "py-3 px-2.5")}>
        {globalNavItems.map((item) => {
          const active = isActive(item.href, item.exact)
          const groupActive = !!(item.children && pathname.startsWith(item.href))
          const Icon = item.icon

          if (item.children) {
            // Collapsed: show only the parent icon linking to first child
            if (collapsed) {
              return (
                <Link
                  key={item.href}
                  href={item.children[0].href}
                  title={item.label}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 mx-auto rounded-lg no-underline transition-all",
                    groupActive
                      ? "bg-[var(--sidebar-active-bg)] text-white"
                      : "text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-hover)] hover:bg-white/5"
                  )}
                >
                  <Icon size={18} className="flex-shrink-0" />
                </Link>
              )
            }

            // Expanded: full group with children
            return (
              <div key={item.href}>
                <Link href={item.children[0].href} className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg no-underline transition-colors",
                  "text-[13.5px] font-medium whitespace-nowrap",
                  groupActive
                    ? "text-[var(--sidebar-text-hover)] bg-white/5"
                    : "text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-hover)] hover:bg-white/5"
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
                            "block py-1.5 px-2.5 rounded-md text-[12.5px] transition-all no-underline whitespace-nowrap",
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
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={Icon}
              active={active}
              collapsed={collapsed}
            />
          )
        })}
      </nav>

      <UserFooter collapsed={collapsed} />
    </aside>
  )
}
