import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"

// Vercel Cron Job — chamado 1x ao dia às 06:00 BRT
// Configurar em vercel.json:
// { "crons": [{ "path": "/api/cron/recorrencia", "schedule": "0 9 * * *" }] }
//
// Segurança: validar CRON_SECRET no header Authorization

export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const amanha = new Date(hoje)
  amanha.setDate(amanha.getDate() + 1)

  try {
    // Busca lançamentos recorrentes que já têm filhos com data futura gerada
    // (os filhos já foram criados no momento da criação do raiz — ver financeiro.criar)
    // Este cron é um safety net: verifica se faltam lançamentos para hoje
    // e cria caso não existam (ex: se o lançamento foi criado antes deste recurso)

    // Lançamentos raiz com recorrência ativa e sem fim (ou fim >= hoje)
    const raizes = await db.lancamentoFinanceiro.findMany({
      where: {
        recorrencia:        { not: "NENHUMA" },
        recorrenciaOrigemId: null, // é um raiz
        OR: [
          { recorrenciaFim: null },
          { recorrenciaFim: { gte: hoje } },
        ],
      },
      include: {
        recorrencias: {
          where: { data: { gte: hoje, lt: amanha } },
        },
      },
    })

    let criados = 0

    for (const raiz of raizes) {
      // Se já existe um filho para hoje, pula
      if (raiz.recorrencias.length > 0) continue

      // Verifica se hoje é um dia válido para a recorrência
      const dataRaiz = new Date(raiz.data)
      const diffDias = Math.floor((hoje.getTime() - dataRaiz.getTime()) / (1000 * 60 * 60 * 24))

      const deveGerar =
        (raiz.recorrencia === "DIARIA"  && diffDias >= 1) ||
        (raiz.recorrencia === "SEMANAL" && diffDias > 0 && diffDias % 7 === 0) ||
        (raiz.recorrencia === "MENSAL"  && diffDias > 0 &&
          hoje.getDate() === dataRaiz.getDate() &&
          hoje.getMonth() !== dataRaiz.getMonth())

      if (deveGerar) {
        await db.lancamentoFinanceiro.create({
          data: {
            obraId:              raiz.obraId,
            tipo:                raiz.tipo,
            categoria:           raiz.categoria,
            descricao:           raiz.descricao,
            valor:               raiz.valor,
            data:                hoje,
            recorrencia:         raiz.recorrencia,
            recorrenciaOrigemId: raiz.id,
          },
        })
        criados++
      }
    }

    return NextResponse.json({
      ok:      true,
      criados,
      raizes:  raizes.length,
      data:    hoje.toISOString(),
    })
  } catch (err) {
    console.error("Cron recorrência error:", err)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
