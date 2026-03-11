import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { db } from "@/server/db"
import { decrypt, isEncrypted } from "@/lib/encrypt"
import { getExtratoClientePdfSienge } from "@/lib/sienge/client"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ contratoId: string }> },
) {
  const { contratoId } = await params

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const usuario = await db.usuario.findUnique({ where: { authId: user.id }, select: { empresaId: true } })
  if (!usuario) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const config = await db.integracaoConfig.findUnique({ where: { empresaId: usuario.empresaId } })
  if (!config) return NextResponse.json({ error: "Sienge não configurado" }, { status: 400 })

  const senha = isEncrypted(config.senha) ? decrypt(config.senha) : config.senha

  const pdf = await getExtratoClientePdfSienge(config.subdominio, config.usuario, senha, Number(contratoId))
  if (!pdf) return NextResponse.json({ error: "PDF não disponível" }, { status: 404 })

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="extrato-contrato-${contratoId}.pdf"`,
    },
  })
}
