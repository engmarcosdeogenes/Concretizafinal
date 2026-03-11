"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const baseTabs = [
  { label: "Visão Geral",  href: "" },
  { label: "RDO",          href: "/rdo" },
  { label: "FVS",          href: "/fvs" },
  { label: "FVM",          href: "/fvm" },
  { label: "Checklist",    href: "/checklist" },
  { label: "Ocorrências",  href: "/ocorrencias" },
  { label: "Mapa",         href: "/mapa" },
  { label: "Equipe",       href: "/equipe" },
  { label: "Materiais",    href: "/materiais" },
  { label: "Documentos",   href: "/documentos" },
  { label: "Financeiro",   href: "/financeiro" },
  { label: "Medição",      href: "/medicao" },
]

const siengeTabs = [
  { label: "Tarefas",       href: "/tarefas" },
  { label: "Orçamento",     href: "/orcamento" },
  { label: "Almoxarifado",  href: "/almoxarifado" },
  { label: "Contratos",     href: "/contratos" },
]

const afterSiengeTabs = [
  { label: "Chat", href: "/chat" },
]

interface ObraTabsProps {
  baseHref: string
  hasSienge?: boolean
}

export function ObraTabs({ baseHref, hasSienge }: ObraTabsProps) {
  const pathname = usePathname()
  const tabs = hasSienge
    ? [...baseTabs, ...siengeTabs, ...afterSiengeTabs]
    : [...baseTabs, ...afterSiengeTabs]

  return (
    <div className="flex gap-0 overflow-x-auto">
      {tabs.map((tab) => {
        const href = `${baseHref}${tab.href}`
        const isActive =
          tab.href === ""
            ? pathname === baseHref
            : pathname === href || pathname.startsWith(href + "/")

        return (
          <Link
            key={tab.label}
            href={href}
            className={cn(
              "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors no-underline",
              isActive
                ? "border-orange-500 text-orange-500"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
