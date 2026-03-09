"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Bell, Search, HelpCircle, PanelLeft,
  LogOut, User, Settings, X,
  BookOpen, MessageCircle, Send,
  CheckCircle2, ChevronRight,
} from "lucide-react"
import { useSidebar } from "@/contexts/sidebar-context"
import { trpc } from "@/lib/trpc/client"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

// ─── Popover genérico ────────────────────────────────────────────────────────
function Popover({
  children,
  trigger,
  align = "right",
  width = 280,
}: {
  children: React.ReactNode
  trigger: (open: boolean, toggle: () => void) => React.ReactNode
  align?: "right" | "left"
  width?: number
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      {trigger(open, () => setOpen((v) => !v))}
      {open && (
        <div
          className="absolute top-full mt-2 bg-white border border-border rounded-2xl shadow-xl z-50 overflow-hidden"
          style={{
            width,
            [align === "right" ? "right" : "left"]: 0,
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Dropdown de notificações ─────────────────────────────────────────────────
function NotificacoesDropdown() {
  return (
    <Popover
      width={320}
      trigger={(open, toggle) => (
        <button
          onClick={toggle}
          title="Notificações"
          className={cn(
            "relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors",
            open
              ? "bg-orange-50 text-orange-500"
              : "text-[var(--text-muted)] hover:bg-muted hover:text-[var(--text-primary)]"
          )}
        >
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">Notificações</h3>
        <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">NOVO</span>
      </div>

      {/* Lista (vazia por enquanto — base para futuras push notifications) */}
      <div className="py-8 text-center">
        <CheckCircle2 size={32} className="mx-auto text-green-400 mb-2" />
        <p className="text-sm font-semibold text-[var(--text-primary)]">Tudo em dia!</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Nenhuma notificação pendente</p>
      </div>

      {/* Footer */}
      <div className="border-t border-border">
        <Link
          href="/painel"
          className="flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-orange-500 hover:bg-orange-50 transition-colors no-underline"
        >
          Ver painel geral <ChevronRight size={13} />
        </Link>
      </div>
    </Popover>
  )
}

// ─── Dropdown de ajuda ────────────────────────────────────────────────────────
function AjudaDropdown() {
  const links = [
    {
      icon: BookOpen,
      label: "Documentação",
      desc: "Aprenda a usar o Concretiza",
      href: "https://github.com/anthropics/claude-code/issues",
      external: true,
    },
    {
      icon: MessageCircle,
      label: "Suporte via WhatsApp",
      desc: "Fale com nosso time agora",
      href: "https://wa.me/55",
      external: true,
    },
    {
      icon: Send,
      label: "Enviar Feedback",
      desc: "Nos conte o que pode melhorar",
      href: "mailto:contato@concretiza.app",
      external: true,
    },
  ]

  return (
    <Popover
      width={300}
      trigger={(open, toggle) => (
        <button
          onClick={toggle}
          title="Ajuda"
          className={cn(
            "w-9 h-9 flex items-center justify-center rounded-xl transition-colors",
            open
              ? "bg-blue-50 text-blue-500"
              : "text-[var(--text-muted)] hover:bg-muted hover:text-[var(--text-primary)]"
          )}
        >
          <HelpCircle size={17} />
        </button>
      )}
    >
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-0.5">Central de Ajuda</h3>
        <p className="text-xs text-[var(--text-muted)]">Como podemos ajudar?</p>
      </div>

      <div className="px-2 pb-3 space-y-0.5">
        {links.map(({ icon: Icon, label, desc, href, external }) => (
          <a
            key={label}
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors no-underline"
          >
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon size={15} className="text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
              <p className="text-xs text-[var(--text-muted)] truncate">{desc}</p>
            </div>
          </a>
        ))}
      </div>
    </Popover>
  )
}

// ─── Dropdown do usuário ──────────────────────────────────────────────────────
function UsuarioDropdown() {
  const router = useRouter()
  const { data: session } = trpc.painel.me.useQuery()
  const { data: perfil }  = trpc.configuracoes.buscarPerfil.useQuery()

  const nome    = session?.nome    ?? "Usuário"
  const email   = perfil?.email    ?? ""
  const inicial = nome.charAt(0).toUpperCase()

  async function handleSair() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <Popover
      width={260}
      trigger={(open, toggle) => (
        <button
          onClick={toggle}
          title="Minha conta"
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition-all select-none ring-2",
            open
              ? "bg-[var(--blue)] text-white ring-blue-200"
              : "bg-blue-100 text-blue-700 ring-transparent hover:ring-blue-200"
          )}
        >
          {inicial}
        </button>
      )}
    >
      {/* Perfil */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--blue)] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {inicial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[var(--text-primary)] truncate capitalize">{nome}</p>
            <p className="text-xs text-[var(--text-muted)] truncate">{email}</p>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="px-2 py-2 space-y-0.5">
        <Link
          href="/configuracoes/conta"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted transition-colors no-underline"
        >
          <User size={15} className="text-[var(--text-muted)]" />
          <span className="text-sm text-[var(--text-primary)]">Minha Conta</span>
        </Link>
        <Link
          href="/configuracoes"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted transition-colors no-underline"
        >
          <Settings size={15} className="text-[var(--text-muted)]" />
          <span className="text-sm text-[var(--text-primary)]">Configurações</span>
        </Link>
      </div>

      {/* Sair */}
      <div className="px-2 pb-2 pt-1 border-t border-border mt-1">
        <button
          onClick={handleSair}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors text-sm font-medium"
        >
          <LogOut size={15} />
          Sair da conta
        </button>
      </div>
    </Popover>
  )
}

// ─── Barra de busca ───────────────────────────────────────────────────────────
function BarraBusca() {
  const [query,  setQuery]  = useState("")
  const [active, setActive] = useState(false)
  const router = useRouter()

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && query.trim()) {
      router.push(`/obras?q=${encodeURIComponent(query.trim())}`)
      setQuery("")
      setActive(false)
    }
    if (e.key === "Escape") {
      setQuery("")
      setActive(false)
    }
  }

  return (
    <div className="flex-1 max-w-[480px]">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setActive(true)}
          onBlur={() => setActive(false)}
          onKeyDown={handleKey}
          placeholder="Buscar obras, relatórios, materiais..."
          className={cn(
            "w-full h-9 pl-9 pr-9 text-sm rounded-xl border transition-all outline-none",
            "bg-muted/50 text-[var(--text-primary)] placeholder-[var(--text-muted)]",
            active
              ? "border-[var(--blue)] bg-white shadow-sm"
              : "border-transparent"
          )}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Navbar principal ─────────────────────────────────────────────────────────
export function Navbar() {
  const { toggle, collapsed } = useSidebar()

  return (
    <header className="bg-white border-b border-border flex items-center gap-3 px-4 h-[60px] flex-shrink-0 sticky top-0 z-50">
      {/* Sidebar toggle */}
      <button
        onClick={toggle}
        title={collapsed ? "Expandir menu" : "Recolher menu"}
        className="w-9 h-9 flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-muted hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
      >
        <PanelLeft
          size={17}
          className="transition-transform duration-200"
          style={{ transform: collapsed ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Search */}
      <BarraBusca />

      {/* Actions */}
      <div className="flex items-center gap-1 ml-auto">
        <NotificacoesDropdown />
        <AjudaDropdown />
        <div className="w-px h-5 bg-border mx-1" />
        <UsuarioDropdown />
      </div>
    </header>
  )
}
