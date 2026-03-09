import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/server/db"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const usuario = await db.usuario.findUnique({ where: { authId: user.id }, select: { id: true } })
  if (!usuario) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })

  const { endpoint, p256dh, auth } = await req.json() as { endpoint: string; p256dh: string; auth: string }

  await db.pushSubscription.upsert({
    where:  { endpoint },
    create: { usuarioId: usuario.id, endpoint, p256dh, auth },
    update: { p256dh, auth },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { endpoint } = await req.json() as { endpoint: string }
  await db.pushSubscription.deleteMany({ where: { endpoint } })
  return NextResponse.json({ ok: true })
}
