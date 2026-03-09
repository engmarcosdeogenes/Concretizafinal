import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/server/db"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(request: Request) {
  // Rate limit: 5 req / 15 min por IP
  const rl = rateLimit(`onboard:${getClientIp(request)}`, 5, 15 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente mais tarde." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  // Verifica se já tem Usuario no banco
  const existing = await db.usuario.findUnique({ where: { authId: user.id } })
  if (existing) {
    return NextResponse.json({ ok: true })
  }

  const body = await request.json() as { nome: string; nomeEmpresa: string }

  // Cria Empresa + Usuario em transação
  await db.$transaction(async (tx) => {
    const empresa = await tx.empresa.create({
      data: { nome: body.nomeEmpresa },
    })

    await tx.usuario.create({
      data: {
        authId:    user.id,
        email:     user.email!,
        nome:      body.nome,
        role:      "DONO",
        empresaId: empresa.id,
      },
    })
  })

  return NextResponse.json({ ok: true })
}
