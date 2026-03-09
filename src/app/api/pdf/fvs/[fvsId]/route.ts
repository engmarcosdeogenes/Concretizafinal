import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer, DocumentProps } from "@react-pdf/renderer"
import { db } from "@/server/db"
import { FvsPdf } from "@/components/pdf/FvsPdf"
import { createClient } from "@/lib/supabase/server"
import React, { JSXElementConstructor, ReactElement } from "react"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ fvsId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse("Não autorizado", { status: 401 })

  const { fvsId } = await params

  try {
    const fvs = await db.fVS.findFirst({
      where: { id: fvsId, obra: { empresa: { usuarios: { some: { authId: user.id } } } } },
      include: {
        obra:        { select: { nome: true, endereco: true } },
        responsavel: { select: { nome: true } },
        itens:       true,
      },
    })

    if (!fvs) {
      return new NextResponse("FVS não encontrada", { status: 404 })
    }

    const element = React.createElement(FvsPdf, { fvs }) as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>
    const buffer  = await renderToBuffer(element)

    const dataFormatada = new Date(fvs.data)
      .toLocaleDateString("pt-BR")
      .replace(/\//g, "-")

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":        "application/pdf",
        "Content-Disposition": `attachment; filename="FVS-${dataFormatada}.pdf"`,
        "Cache-Control":       "no-store",
      },
    })
  } catch (error) {
    console.error("Erro ao gerar PDF do FVS:", error)
    return new NextResponse("Erro ao gerar PDF", { status: 500 })
  }
}
