"use client"

import { Bell, Search, Globe, HelpCircle } from "lucide-react"

export function Navbar() {
  return (
    <header
      className="bg-white border-b border-[var(--border)] flex items-center gap-4 px-6 flex-shrink-0"
      style={{ height: "var(--navbar-h)" }}
    >
      {/* Search */}
      <div className="flex-1 max-w-[480px]">
        <label className="flex items-center gap-2 px-3.5 py-[7px] bg-[var(--muted)] border border-[var(--border)] rounded-[var(--radius)] cursor-text">
          <Search size={14} className="text-[var(--text-muted)] flex-shrink-0" />
          <input
            type="search"
            placeholder="Buscar obras, relatórios, materiais..."
            className="flex-1 bg-transparent border-none outline-none text-[13.5px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 ml-auto">
        {[
          { Icon: Globe,      label: "Idioma" },
          { Icon: Bell,       label: "Notificações", dot: true },
          { Icon: HelpCircle, label: "Ajuda" },
        ].map(({ Icon, label, dot }) => (
          <button
            key={label}
            aria-label={label}
            className="relative w-[44px] h-[44px] flex items-center justify-center rounded-[var(--radius)] border-none bg-transparent cursor-pointer transition-colors hover:bg-[var(--muted)]"
          >
            <Icon size={16} className="text-slate-500" />
            {dot && (
              <span className="absolute top-2 right-2 w-[7px] h-[7px] bg-red-500 rounded-full border-2 border-white" />
            )}
          </button>
        ))}

        {/* Avatar */}
        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center ml-1 cursor-pointer text-xs font-bold text-slate-500 select-none">
          M
        </div>
      </div>
    </header>
  )
}
