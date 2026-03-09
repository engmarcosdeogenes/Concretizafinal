import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer"
import { db } from "@/server/db"
import { SemanaPdf } from "@/components/pdf/SemanaPdf"
import { createClient } from "@/lib/supabase/server"
import React, { JSXElementConstructor, ReactElement } from "react"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse("Não autorizado", { status: 401 })

  const { searchParams } = req.nextUrl
  const obraId     = searchParams.get("obraId")
  const dataInicio = searchParams.get("dataInicio")

  if (!obraId || !dataInicio) {
    return new NextResponse("Parâmetros obraId e dataInicio são obrigatórios", { status: 400 })
  }

  try {
    const obra = await db.obra.findFirst({
      where: { id: obraId, empresa: { usuarios: { some: { authId: user.id } } } },
      select: { nome: true, endereco: true },
    })

    if (!obra) {
      return new NextResponse("Obra não encontrada", { status: 404 })
    }

    const inicio = new Date(dataInicio)
    const fim    = new Date(inicio)
    fim.setDate(fim.getDate() + 6)
    fim.setHours(23, 59, 59, 999)

    const rdos = await db.rDO.findMany({
      where: {
        obraId,
        data: { gte: inicio, lte: fim },
      },
      include: {
        atividades:  true,
        equipe:      true,
        responsavel: { select: { nome: true } },
      },
      orderBy: { data: "asc" },
    })

    const element = React.createElement(SemanaPdf, {
      data: { obra, rdos, dataInicio: inicio, dataFim: fim },
    }) as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>

    const buffer = await renderToBuffer(element)

    const dataStr = inicio.toLocaleDateString("pt-BR").replace(/\//g, "-")

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="Semana-${dataStr}.pdf"`,
        "Cache-Control":       "no-store",
      },
    })
  } catch (error) {
    console.error("Erro ao gerar PDF semanal:", error)
    return new NextResponse("Erro ao gerar PDF", { status: 500 })
  }
}
