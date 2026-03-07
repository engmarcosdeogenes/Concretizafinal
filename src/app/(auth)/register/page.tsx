"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Building2, Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const form      = new FormData(e.currentTarget)
    const nome      = form.get("nome") as string
    const empresa   = form.get("empresa") as string
    const email     = form.get("email") as string
    const password  = form.get("password") as string

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.")
      setLoading(false)
      return
    }

    const supabase = createClient()

    // 1. Criar usuário no Supabase Auth
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? "Erro ao criar conta.")
      setLoading(false)
      return
    }

    // 2. Criar Empresa + Usuario no banco
    const res = await fetch("/api/auth/onboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, nomeEmpresa: empresa }),
    })

    if (!res.ok) {
      setError("Conta criada, mas houve erro ao configurar. Tente entrar.")
      setLoading(false)
      return
    }

    router.push("/obras")
    router.refresh()
  }

  return (
    <div className="w-full max-w-md mx-auto px-4">
      <div className="bg-[#1e293b] rounded-2xl p-8 shadow-2xl border border-[#334155]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Criar conta</h1>
          <p className="text-slate-400 text-sm mt-1">Comece a gerenciar suas obras</p>
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
              placeholder="Marcos Victor"
              className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-xl text-white placeholder-slate-500 outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="empresa" className="block text-sm font-medium text-slate-300 mb-1.5">
              Nome da construtora / empresa
            </label>
            <input
              id="empresa"
              name="empresa"
              type="text"
              required
              placeholder="SLN Construtora"
              className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-xl text-white placeholder-slate-500 outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="seu@email.com"
              className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-xl text-white placeholder-slate-500 outline-none focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
              Senha
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
            {loading ? "Criando conta..." : "Criar conta grátis"}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-6">
          Já tem conta?{" "}
          <Link href="/login" className="text-orange-400 hover:text-orange-300 font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
