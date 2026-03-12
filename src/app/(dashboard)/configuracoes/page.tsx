import Link from "next/link"
import { Settings, Users, Building2, User, CreditCard, Bell, Puzzle, ClipboardCheck, LayoutList, FileText, BookOpen } from "lucide-react"
import { Card, CardTitle, CardDescription } from "@/components/ui/card"

type Item = {
  title: string
  description: string
  href: string | null
  icon: React.ElementType
  iconBg: string
  iconColor: string
  hoverBorder: string
}

const ITEMS: Item[] = [
  {
    title: "Empresa",
    description: "Nome, CNPJ e dados da construtora",
    href: "/configuracoes/empresa",
    icon: Building2,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    hoverBorder: "hover:border-blue-400/60",
  },
  {
    title: "Usuários",
    description: "Convidar membros e gerenciar acessos",
    href: "/configuracoes/usuarios",
    icon: Users,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    hoverBorder: "hover:border-violet-400/60",
  },
  {
    title: "Minha Conta",
    description: "Perfil, senha e preferências",
    href: "/configuracoes/conta",
    icon: User,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    hoverBorder: "hover:border-orange-400/60",
  },
  {
    title: "Plano & Faturamento",
    description: "Assinatura e dados de pagamento",
    href: "/configuracoes/plano",
    icon: CreditCard,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    hoverBorder: "hover:border-emerald-400/60",
  },
  {
    title: "Notificações",
    description: "Alertas por e-mail e push",
    href: "/configuracoes/notificacoes",
    icon: Bell,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    hoverBorder: "hover:border-amber-400/60",
  },
  {
    title: "Integrações",
    description: "Conectar com outros sistemas",
    href: "/configuracoes/integracoes",
    icon: Puzzle,
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
    hoverBorder: "hover:border-pink-400/60",
  },
  {
    title: "Checklists",
    description: "Templates de verificação rápida",
    href: "/configuracoes/checklists",
    icon: ClipboardCheck,
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    hoverBorder: "hover:border-teal-400/60",
  },
  {
    title: "Campos do RDO",
    description: "Campos extras personalizados no diário de obra",
    href: "/configuracoes/campos-rdo",
    icon: LayoutList,
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    hoverBorder: "hover:border-indigo-400/60",
  },
  {
    title: "Modelos de Relatório",
    description: "Customize seções e título do PDF do RDO",
    href: "/configuracoes/modelos-relatorio",
    icon: FileText,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
    hoverBorder: "hover:border-sky-400/60",
  },
  {
    title: "Plano de Contas",
    description: "Códigos contábeis para lançamentos automáticos no Sienge",
    href: "/configuracoes/plano-contas",
    icon: BookOpen,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    hoverBorder: "hover:border-emerald-400/60",
  },
]

export default function ConfiguracoesPage() {
  return (
    <div className="flex-1 space-y-8 p-8 pt-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Settings className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Empresa, usuários e preferências da conta.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {ITEMS.map(({ title, description, href, icon: Icon, iconBg, iconColor, hoverBorder }) =>
          href ? (
            <Link key={title} href={href} className="group outline-none">
              <Card className={`h-full flex items-center gap-4 p-6 hover:shadow-md transition-all cursor-pointer ${hoverBorder}`}>
                <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105`}>
                  <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-base font-bold group-hover:text-foreground transition-colors">{title}</CardTitle>
                  <CardDescription className="text-xs">{description}</CardDescription>
                </div>
              </Card>
            </Link>
          ) : (
            <div key={title} className="opacity-40 cursor-not-allowed">
              <Card className="h-full flex items-center gap-4 p-6">
                <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-base font-bold">{title}</CardTitle>
                  <CardDescription className="text-xs">{description}</CardDescription>
                  <span className="inline-block text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-medium">Em breve</span>
                </div>
              </Card>
            </div>
          )
        )}
      </div>
    </div>
  )
}
