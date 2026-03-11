import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"

// Sienge envia eventos como POST com body JSON
// URL: /api/sienge/webhook?empresaId=<id>&secret=<token>

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const empresaId = searchParams.get("empresaId")
    const secret    = searchParams.get("secret")

    if (!empresaId || !secret) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 })
    }

    // Verificar secret
    const config = await db.integracaoConfig.findUnique({
      where: { empresaId },
      select: { webhookSecret: true, empresaId: true },
    })

    if (!config || config.webhookSecret !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ ok: true })

    const event = (body.event ?? body.type ?? body.eventType ?? "") as string
    const data  = body.data ?? body.payload ?? body

    // Processar evento
    await processarEventoSienge(empresaId, event, data)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[sienge/webhook]", err)
    return NextResponse.json({ ok: true }) // sempre 200 para o Sienge não re-enviar
  }
}

async function processarEventoSienge(empresaId: string, event: string, data: Record<string, unknown>) {
  switch (event) {
    case "PURCHASE_ORDER_AUTHORIZED": {
      // Registrar evento — pedido autorizado no Sienge
      await registrarSync(empresaId, "WEBHOOK_PEDIDO_AUTORIZADO", JSON.stringify(data))
      break
    }

    case "PURCHASE_ORDER_CREATED": {
      await registrarSync(empresaId, "WEBHOOK_PEDIDO_CRIADO", JSON.stringify(data))
      break
    }

    case "BILL_PAID": {
      await registrarSync(empresaId, "WEBHOOK_CONTA_PAGA", JSON.stringify(data))
      break
    }

    case "CONTRACT_CREATED": {
      await registrarSync(empresaId, "WEBHOOK_CONTRATO_CRIADO", JSON.stringify(data))
      break
    }

    default:
      await registrarSync(empresaId, `WEBHOOK_${event}`, JSON.stringify(data))
  }
}

async function registrarSync(empresaId: string, tipo: string, detalhes: string) {
  const config = await db.integracaoConfig.findUnique({ where: { empresaId } })
  if (!config) return
  await db.integracaoSync.create({
    data: {
      integracaoId: config.id,
      tipo,
      status: "OK",
      detalhes: detalhes.slice(0, 500),
      registros: 1,
    },
  }).catch(() => {})
}
