"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Building2, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/permissions"
import type { RoleEmpresa } from "@prisma/client"

interface ConviteInfo {
  email:       string
  role:        RoleEmpresa
  empresaNome: string
}

export default function AcceptInvitePage() {
  const params  = useParams<{ token: string }>()
  const router  = useRouter()

  const [convite,      setConvite]      = useState<ConviteInfo | null>(null)
  const [status,       setStatus]       = useState<"loading" | "valid" | "usado" | "expirado" | "invalido">("loading")
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState("")

  useEffect(() => {
    fetch(`/api/invite/${params.token}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data)              { setStatus("invalido"); return }
        if (data.error === "usado")    { setStatus("usado"); return }
        if (data.error === "expirado") { setStatus("expirado"); return }
        setConvite(data)
        setStatus("valid")
      })
      .catch(() => setStatus("invalido"))
  }, [params.token])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const form     = new FormData(e.currentTarget)
    const nome     = form.get("nome")     as string
    const password = form.get("password") as string

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.")
      setLoading(false)
      return
    }

    const supabase = createClient()

    // 1. Criar auth user com o email do convite
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: convite!.email,
      password,
    })

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? "Erro ao criar conta.")
      setLoading(false)
      return
    }

    // 2. Registrar no banco com o token do convite
    const res = await fetch("/api/auth/accept-invite", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ nome, token: params.token }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "Erro ao aceitar convite.")
      setLoading(false)
      return
    }

    router.push("/obras")
    router.refresh()
  }

  // Estados de tela
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    )
  }

  if (status === "usado" || status === "expirado" || status === "invalido") {
    const messages = {
      usado:    { title: "Convite já utilizado",  desc: "Este convite já foi aceito. Tente fazer login." },
      expirado: { title: "Convite expirado",      desc: "Este convite não é mais válido. Peça um novo." },
      invalido: { title: "Convite inválido",      desc: "Este link de convite não existe." },
    }
    const msg = messages[status]
    return (
      <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center p-4">
        <div className="bg-[#1e293b] rounded-2xl p-8 shadow-2xl border border-[#334155] max-w-sm w-full text-center">
          <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          <h2 className="text-white font-bold text-lg mb-2">{msg.title}</h2>
          <p className="text-slate-400 text-sm mb-6">{msg.desc}</p>
          <a href="/login" className="btn-orange w-full justify-center">Ir para o login</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0e27] flex items-center justify-center p-4">
      <div className="bg-[#1e293b] rounded-2xl p-8 shadow-2xl border border-[#334155] w-full max-w-md">

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Você foi convidado!</h1>
          <p className="text-slate-400 text-sm mt-1 text-center">
            Para entrar em <span className="text-white font-semibold">{convite?.empresaNome}</span>
          </p>
        </div>

        {/* Role badge */}
        <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-[#0f172a] rounded-xl border border-[#334155]">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
          <span className="text-slate-300 text-sm">Seu acesso será como:</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[convite!.role]}`}>
            {ROLE_LABELS[convite!.role]}
          </span>
        </div>

        {/* Email pré-preenchido */}
        <div className="mb-4 p-3 bg-[#0f172a] rounded-xl border border-[#334155]">
          <p className="text-slate-400 text-xs mb-0.5">E-mail do convite</p>
          <p className="text-white text-sm font-medium">{convite?.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-slate-300 mb-1.5">
              Seu nome
            </label>
            <input
              id="nome"
              name="nome"
              type="text"
              required
              placeholder="Seu nome completo"
              className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-xl text-white placeholder-slate-500 outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
              Crie uma senha
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-xl text-white placeholder-slate-500 outline-none focus:border-orange-500 transition-colors pr-12"
              />
              <button
                type="button"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 p-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors min-h-[44px]"
          >
            {loading ? "Criando sua conta..." : "Aceitar convite e entrar"}
          </button>
        </form>
      </div>
    </div>
  )
}
