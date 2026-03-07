import Link from "next/link"
import { Settings, Users, Building2, User, CreditCard, Bell, Puzzle } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"

const ITEMS = [
  { title: "Empresa",            description: "Nome, CNPJ e dados da construtora",    href: "/configuracoes/empresa",     icon: Building2 },
  { title: "Usuários",           description: "Convidar membros e gerenciar acessos",  href: "/configuracoes/usuarios",    icon: Users },
  { title: "Minha Conta",        description: "Perfil, senha e preferências",           href: "/configuracoes/conta",       icon: User },
  { title: "Plano & Faturamento",description: "Assinatura e dados de pagamento",       href: "/configuracoes/plano",       icon: CreditCard },
  { title: "Notificações",       description: "Alertas por e-mail e push",             href: "/configuracoes/notificacoes",icon: Bell },
  { title: "Integrações",        description: "Conectar com outros sistemas",           href: "/configuracoes/integracoes", icon: Puzzle },
]

export default function ConfiguracoesPage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Configurações"
        subtitle="Empresa, usuários e preferências"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {ITEMS.map(({ title, description, href, icon: Icon }) => (
          <Link
            key={title}
            href={href}
            className="bg-white rounded-2xl border border-[var(--border)] shadow-sm p-5 flex items-center gap-4 hover:border-[var(--blue)] hover:shadow transition-all"
          >
            <div className="w-10 h-10 bg-[var(--muted)] rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon size={18} className="text-[var(--text-muted)]" />
            </div>
            <div>
              <p className="text-[var(--text-primary)] font-semibold text-sm">{title}</p>
              <p className="text-[var(--text-muted)] text-xs mt-0.5">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
