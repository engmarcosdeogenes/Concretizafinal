import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer"
import { db } from "@/server/db"
import { RdoPdf } from "@/components/pdf/RdoPdf"
import { createClient } from "@/lib/supabase/server"
import React, { JSXElementConstructor, ReactElement } from "react"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ rdoId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse("Não autorizado", { status: 401 })

  const { rdoId } = await params

  try {
    const rdo = await db.rDO.findFirst({
      where: { id: rdoId, obra: { empresa: { usuarios: { some: { authId: user.id } } } } },
      include: {
        obra: { select: { nome: true, endereco: true, numContrato: true, prazoContratualDias: true, dataInicio: true } },
        responsavel: { select: { nome: true } },
        atividades: true,
        equipe: true,
        assinaturas: { orderBy: { ordem: "asc" } },
        materiaisRecebidos: true,
        materiaisUtilizados: true,
      },
    })

    if (!rdo) {
      return new NextResponse("RDO não encontrado", { status: 404 })
    }

    const element = React.createElement(RdoPdf, { rdo }) as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>
    const buffer = await renderToBuffer(element)

    const dataFormatada = new Date(rdo.data)
      .toLocaleDateString("pt-BR")
      .replace(/\//g, "-")

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="RDO-${dataFormatada}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Erro ao gerar PDF do RDO:", error)
    return new NextResponse("Erro ao gerar PDF", { status: 500 })
  }
}
