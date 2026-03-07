import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/server/db"

export async function POST(request: Request) {
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
