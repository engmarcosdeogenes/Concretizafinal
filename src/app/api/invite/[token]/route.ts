import { NextResponse } from "next/server"
import { db } from "@/server/db"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const convite = await db.convite.findUnique({
    where:   { token },
    include: { empresa: { select: { nome: true } } },
  })

  if (!convite)                       return NextResponse.json(null,                      { status: 404 })
  if (convite.usado)                  return NextResponse.json({ error: "usado" },        { status: 400 })
  if (convite.expiresAt < new Date()) return NextResponse.json({ error: "expirado" },     { status: 400 })

  return NextResponse.json({
    email:       convite.email,
    role:        convite.role,
    empresaNome: convite.empresa.nome,
  })
}
