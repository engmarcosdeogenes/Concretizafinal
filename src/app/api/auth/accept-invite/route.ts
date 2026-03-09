import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/server/db"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

export async function POST(request: Request) {
  // Rate limit: 10 req / 15 min por IP (protege contra brute force de tokens)
  const rl = rateLimit(`accept-invite:${getClientIp(request)}`, 10, 15 * 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente mais tarde." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    )
  }

  const body = await request.json() as { nome: string; token: string }

  // Busca o convite
  const convite = await db.convite.findUnique({
    where: { token: body.token },
  })

  if (!convite)                       return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 })
  if (convite.usado)                  return NextResponse.json({ error: "Convite já utilizado" },   { status: 400 })
  if (convite.expiresAt < new Date()) return NextResponse.json({ error: "Convite expirado" },       { status: 400 })

  // Pega o usuário autenticado do Supabase
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  // Cria o Usuario e marca o convite como usado
  await db.$transaction(async (tx) => {
    await tx.usuario.create({
      data: {
        authId:    user.id,
        email:     convite.email,
        nome:      body.nome,
        role:      convite.role,
        empresaId: convite.empresaId,
      },
    })

    await tx.convite.update({
      where: { id: convite.id },
      data:  { usado: true },
    })
  })

  return NextResponse.json({ ok: true })
}
