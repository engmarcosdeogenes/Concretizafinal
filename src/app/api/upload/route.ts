import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/rate-limit"

const BUCKET = "concretiza"

export async function POST(req: NextRequest) {
  // Verificar autenticação
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  // Rate limit: 30 req / 1 min por usuário
  const rl = rateLimit(`upload:${user.id}`, 30, 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Limite de uploads atingido. Aguarde um momento." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    )
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const path = formData.get("path") as string | null

    if (!file || !path) {
      return NextResponse.json({ error: "Arquivo e path são obrigatórios" }, { status: 400 })
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "Arquivo muito grande (máximo 20MB)" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Garantir que o bucket existe
    await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {})

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path)

    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    console.error("Erro no upload:", err)
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 })
  }
}
