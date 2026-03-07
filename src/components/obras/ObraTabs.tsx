"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const tabs = [
  { label: "Visão Geral",  href: "" },
  { label: "RDO",          href: "/rdo" },
  { label: "FVS",          href: "/fvs" },
  { label: "FVM",          href: "/fvm" },
  { label: "Ocorrências",  href: "/ocorrencias" },
  { label: "Mapa",         href: "/mapa" },
  { label: "Equipe",       href: "/equipe" },
  { label: "Materiais",    href: "/materiais" },
  { label: "Documentos",   href: "/documentos" },
  { label: "Financeiro",   href: "/financeiro" },
]

interface ObraTabsProps {
  baseHref: string
}

export function ObraTabs({ baseHref }: ObraTabsProps) {
  const pathname = usePathname()

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
