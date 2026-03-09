import { NextRequest, NextResponse } from "next/server"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

// Parser de NF-e XML (padrão SEFAZ brasileiro)
// Extrai dados sem dependências externas

function getTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, "i")
  return xml.match(re)?.[1]?.trim() ?? ""
}

function getAllTags(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\/${tag}>`, "gi")
  return xml.match(re) ?? []
}

export async function POST(req: NextRequest) {
  // Rate limit: 10 req / 1 min por IP (NF-e parse é pesado)
  const rl = rateLimit(`nfe:${getClientIp(req)}`, 10, 60 * 1000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Muitas requisições. Aguarde um momento." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    )
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 })
    }

    const ext = file.name.split(".").pop()?.toLowerCase()
    if (ext !== "xml") {
      return NextResponse.json({ error: "Apenas arquivos XML são suportados" }, { status: 400 })
    }

    const xml = await file.text()

    // Verificar se é NF-e
    if (!xml.includes("nfeProc") && !xml.includes("NFe") && !xml.includes("infNFe")) {
      return NextResponse.json({ error: "Arquivo XML não parece ser uma NF-e válida" }, { status: 422 })
    }

    // Dados do emitente
    const emit = getAllTags(xml, "emit")[0] ?? ""
    const emitCnpj = getTag(emit, "CNPJ")
    const emitNome = getTag(emit, "xNome")
    const emitFone = getTag(emit, "fone")

    // Dados da nota
    const ide     = getAllTags(xml, "ide")[0] ?? ""
    const nNF     = getTag(ide, "nNF")
    const dhEmi   = getTag(xml, "dhEmi") || getTag(ide, "dEmi")
    const natOp   = getTag(ide, "natOp")

    // Valor total
    const vNF     = getTag(xml, "vNF")
    const vProd   = getTag(xml, "vProd")

    // Itens da nota
    const detTags = getAllTags(xml, "det")
    const itens = detTags.map((det) => {
      const prod    = getAllTags(det, "prod")[0] ?? ""
      const xProd   = getTag(prod, "xProd")
      const qCom    = getTag(prod, "qCom")
      const uCom    = getTag(prod, "uCom")
      const vUnCom  = getTag(prod, "vUnCom")
      const vProdIt = getTag(prod, "vProd")
      const cProd   = getTag(prod, "cProd")
      return {
        codigo:       cProd,
        descricao:    xProd,
        quantidade:   parseFloat(qCom) || 0,
        unidade:      uCom,
        valorUnitario: parseFloat(vUnCom) || 0,
        valorTotal:   parseFloat(vProdIt) || 0,
      }
    })

    const data = {
      numero:       nNF,
      dataEmissao:  dhEmi ? new Date(dhEmi).toISOString() : null,
      natureza:     natOp,
      valorTotal:   parseFloat(vNF) || parseFloat(vProd) || 0,
      emitente: {
        cnpj:       emitCnpj,
        nome:       emitNome,
        telefone:   emitFone,
      },
      itens,
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("Erro ao parsear NF-e:", err)
    return NextResponse.json({ error: "Erro ao processar o arquivo XML" }, { status: 500 })
  }
}
