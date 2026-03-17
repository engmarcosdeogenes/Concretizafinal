import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"
import { notificarEmpresa } from "@/lib/push"

// Sienge envia eventos como POST com body JSON
// URL: /api/sienge/webhook?empresaId=<id>&secret=<token>

export async function POST(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const empresaId = searchParams.get("empresaId")
  const secret    = searchParams.get("secret")

  if (!empresaId) {
    return NextResponse.json({ error: "empresaId required" }, { status: 400 })
  }

  // Verificar secret (buscar o config da empresa)
  const config = await db.integracaoConfig.findUnique({
    where: { empresaId },
    select: { webhookSecret: true, id: true },
  })

  if (!config || config.webhookSecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const raw = body as Record<string, unknown>

  // Suportar tanto o formato { eventType, resourceId, buildingId, data }
  // quanto o formato legado { event/type, data/payload }
  const eventType = (
    (raw.eventType as string | undefined) ??
    (raw.event     as string | undefined) ??
    (raw.type      as string | undefined) ??
    ""
  )
  const resourceId = (raw.resourceId as number | undefined) ?? undefined
  const buildingId = (raw.buildingId as number | undefined) ?? undefined
  const data       = (raw.data ?? raw.payload ?? raw) as Record<string, unknown>

  try {
    switch (eventType) {
      case "PURCHASE_ORDER_AUTHORIZED": {
        // Atualizar pedido local para CONFIRMADO pelo siengePurchaseOrderId
        // Schema: PedidoCompra.siengePurchaseOrderId Int?
        if (resourceId != null) {
          const updated = await db.pedidoCompra.updateMany({
            where: {
              siengePurchaseOrderId: resourceId,
              fornecedor: { empresaId },
            },
            data: { status: "CONFIRMADO" },
          })
          console.log(
            `[Sienge webhook] PO autorizado: ${resourceId} — ${updated.count} pedido(s) atualizado(s) (empresa: ${empresaId})`
          )
        } else {
          console.log(`[Sienge webhook] PURCHASE_ORDER_AUTHORIZED sem resourceId (empresa: ${empresaId})`)
        }

        await registrarSync(config.id, "WEBHOOK_PEDIDO_AUTORIZADO", JSON.stringify({ resourceId, ...data }))

        void notificarEmpresa(empresaId, {
          title: "Pedido Autorizado no Sienge",
          body:  `Pedido #${resourceId ?? "—"} foi autorizado.`,
          url:   "/suprimentos/pedidos",
        })
        break
      }

      case "PURCHASE_REQUEST_AUTHORIZED": {
        // Atualizar solicitação local para APROVADA pelo siengePurchaseRequestId
        // Schema: SolicitacaoCompra.siengePurchaseRequestId Int?
        if (resourceId != null) {
          const updated = await db.solicitacaoCompra.updateMany({
            where: {
              siengePurchaseRequestId: resourceId,
              obra: { empresaId },
            },
            data: { status: "APROVADA" },
          })
          console.log(
            `[Sienge webhook] Solicitação autorizada: ${resourceId} — ${updated.count} solicitação(ões) atualizada(s) (empresa: ${empresaId})`
          )
        } else {
          console.log(`[Sienge webhook] PURCHASE_REQUEST_AUTHORIZED sem resourceId (empresa: ${empresaId})`)
        }

        await registrarSync(config.id, "WEBHOOK_SOLICITACAO_AUTORIZADA", JSON.stringify({ resourceId, ...data }))

        void notificarEmpresa(empresaId, {
          title: "Solicitação Autorizada no Sienge",
          body:  `Solicitação #${resourceId ?? "—"} foi autorizada.`,
          url:   "/suprimentos/solicitacoes",
        })
        break
      }

      case "BILL_PAID": {
        // Quando uma conta é paga no Sienge, criar lançamento financeiro se houver obra vinculada
        // Schema: Obra.siengeId String?, LancamentoFinanceiro.tipo TipoLancamento (RECEITA | DESPESA)
        if (buildingId != null) {
          const obra = await db.obra.findFirst({
            where: { siengeId: String(buildingId), empresaId },
            select: { id: true },
          })

          if (obra) {
            const valor =
              (data.value  as number | undefined) ??
              (data.amount as number | undefined) ??
              0
            const descricao =
              (data.description  as string | undefined) ??
              (data.creditorName as string | undefined) ??
              (data.supplierName as string | undefined) ??
              "Conta paga via Sienge"

            if (valor > 0) {
              await db.lancamentoFinanceiro.create({
                data: {
                  obraId:    obra.id,
                  tipo:      "DESPESA",
                  categoria: "Sienge",
                  descricao,
                  valor,
                  data: data.paymentDate
                    ? new Date(data.paymentDate as string)
                    : new Date(),
                },
              })
              console.log(
                `[Sienge webhook] BILL_PAID: lançamento criado para obra ${obra.id} — valor ${valor} (empresa: ${empresaId})`
              )
            } else {
              console.log(
                `[Sienge webhook] BILL_PAID: buildingId=${buildingId} ignorado (valor=0 ou ausente)`
              )
            }
          } else {
            console.log(
              `[Sienge webhook] BILL_PAID: nenhuma obra local com siengeId=${buildingId} (empresa: ${empresaId})`
            )
          }
        }

        await registrarSync(config.id, "WEBHOOK_CONTA_PAGA", JSON.stringify({ resourceId, buildingId, ...data }))

        const supplier =
          (data.supplierName  as string | undefined) ??
          (data.creditorName  as string | undefined) ??
          (data.description   as string | undefined)
        void notificarEmpresa(empresaId, {
          title: "Conta Paga no Sienge",
          body:  `Pagamento para ${supplier ?? "fornecedor"} confirmado.`,
          url:   "/financeiro",
        })
        break
      }

      case "PURCHASE_ORDER_CREATED": {
        await registrarSync(config.id, "WEBHOOK_PEDIDO_CRIADO", JSON.stringify({ resourceId, buildingId, ...data }))
        console.log(
          `[Sienge webhook] PURCHASE_ORDER_CREATED: resource=${resourceId} building=${buildingId} (empresa: ${empresaId})`
        )
        void notificarEmpresa(empresaId, {
          title: "Novo Pedido no Sienge",
          body:  "Um novo pedido de compra foi criado.",
          url:   "/suprimentos/pedidos",
        })
        break
      }

      case "CONTRACT_CREATED": {
        await registrarSync(config.id, "WEBHOOK_CONTRATO_CRIADO", JSON.stringify({ resourceId, buildingId, ...data }))
        console.log(
          `[Sienge webhook] CONTRACT_CREATED: resource=${resourceId} building=${buildingId} (empresa: ${empresaId})`
        )
        void notificarEmpresa(empresaId, {
          title: "Novo Contrato no Sienge",
          body:  "Um novo contrato foi registrado.",
          url:   "/financeiro",
        })
        break
      }

      default: {
        console.log(
          `[Sienge webhook] Evento desconhecido: "${eventType}" (empresa: ${empresaId})`
        )
        await registrarSync(config.id, `WEBHOOK_${eventType || "UNKNOWN"}`, JSON.stringify({ resourceId, buildingId, ...data }))
      }
    }
  } catch (err: unknown) {
    console.error(
      "[Sienge webhook] Erro ao processar evento:",
      err instanceof Error ? err.message : String(err)
    )
    // Retornar 200 mesmo em caso de erro para evitar que o Sienge marque o webhook como falho
    return NextResponse.json({ ok: true, warning: "Processing error" })
  }

  return NextResponse.json({ ok: true })
}

// Registra o evento no histórico de syncs da integração
async function registrarSync(integracaoId: string, tipo: string, detalhes: string) {
  await db.integracaoSync.create({
    data: {
      integracaoId,
      tipo,
      status:    "OK",
      detalhes:  detalhes.slice(0, 500),
      registros: 1,
    },
  }).catch((err: unknown) => {
    console.error("[Sienge webhook] Falha ao registrar sync:", err instanceof Error ? err.message : String(err))
  })
}
