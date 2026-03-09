"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ClipboardList } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatDataCurta, formatDataLonga } from "@/lib/format"

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
}

const TIPO_LABEL: Record<string, string> = {
  SEGURANCA: "Segurança", QUALIDADE: "Qualidade", PRAZO: "Prazo",
  CUSTO: "Custo", AMBIENTAL: "Ambiental", OUTRO: "Outro",
}
const STATUS_OC: Record<string, string> = {
  ABERTA: "Aberta", EM_ANALISE: "Em Análise", RESOLVIDA: "Resolvida", FECHADA: "Fechada",
}
const STATUS_FVS: Record<string, string> = {
  PENDENTE: "Pendente", EM_INSPECAO: "Em Inspeção",
  APROVADO: "Aprovado", REJEITADO: "Não Conforme", RETRABALHO: "Retrabalho",
}
const STATUS_RDO: Record<string, string> = {
  RASCUNHO: "Rascunho", ENVIADO: "Enviado", APROVADO: "Aprovado", REJEITADO: "Rejeitado",
}
const TITULO: Record<string, string> = {
  rdo: "Relatório Diário de Obra", ocorrencias: "Relatório de Ocorrências",
  fvs: "Relatório de Inspeções FVS", financeiro: "Relatório Financeiro",
}

// ─── tabela genérica ──────────────────────────────────────────────────────────

function Table({ heads, rows }: { heads: string[]; rows: (string | number)[][] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
      <thead>
        <tr style={{ background: "#1e293b" }}>
          {heads.map(h => (
            <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: "#fff", fontWeight: 700, fontSize: 11 }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={{ background: i % 2 === 1 ? "#f8fafc" : "#fff", borderBottom: "1px solid #e2e8f0" }}>
            {row.map((cell, j) => (
              <td key={j} style={{ padding: "6px 10px", fontSize: 11, color: "#374151" }}>{cell}</td>
            ))}
          </tr>
        ))}
        {rows.length === 0 && (
          <tr><td colSpan={heads.length} style={{ padding: "24px 10px", textAlign: "center", color: "#94a3b8", fontStyle: "italic", fontSize: 11 }}>
            Nenhum registro encontrado.
          </td></tr>
        )}
      </tbody>
    </table>
  )
}

// ─── seções por tipo ──────────────────────────────────────────────────────────

function RelRdo({ obraId }: { obraId: string }) {
  const { data: rdos = [], isLoading } = trpc.rdo.listar.useQuery({ obraId })
  if (isLoading) return <p style={{ color: "#64748b" }}>Carregando RDOs...</p>

  const rows = rdos.map(r => [
    formatDataLonga(r.data),
    r.responsavel.nome,
    STATUS_RDO[r.status] ?? r.status,
    r.atividades.length,
    r.equipe.reduce((s, e) => s + e.quantidade, 0),
  ] as (string | number)[])

  return (
    <>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total RDOs", value: rdos.length },
          { label: "Aprovados",  value: rdos.filter(r => r.status === "APROVADO").length },
          { label: "Rascunhos",  value: rdos.filter(r => r.status === "RASCUNHO").length },
        ].map(k => (
          <div key={k.label} style={{ flex: 1, border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px" }}>
            <p style={{ margin: 0, fontSize: 10, color: "#64748b" }}>{k.label}</p>
            <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{k.value}</p>
          </div>
        ))}
      </div>
      <Table heads={["Data", "Responsável", "Status", "Atividades", "Trabalhadores"]} rows={rows} />
    </>
  )
}

function RelOcorrencias({ obraId }: { obraId: string }) {
  const { data: ocs = [], isLoading } = trpc.ocorrencia.listar.useQuery({ obraId })
  if (isLoading) return <p style={{ color: "#64748b" }}>Carregando ocorrências...</p>

  const rows = ocs.map(o => [
    formatDataCurta(o.data),
    TIPO_LABEL[o.tipo] ?? o.tipo,
    o.titulo,
    STATUS_OC[o.status] ?? o.status,
    o.responsavel?.nome ?? "—",
  ] as string[])

  return <Table heads={["Data", "Tipo", "Título", "Status", "Responsável"]} rows={rows} />
}

function RelFvs({ obraId }: { obraId: string }) {
  const { data: fvss = [], isLoading } = trpc.fvs.listar.useQuery({ obraId })
  if (isLoading) return <p style={{ color: "#64748b" }}>Carregando FVS...</p>

  const rows = fvss.map(f => {
    const conformes = f.itens.filter(i => i.aprovado === true).length
    return [
      formatDataCurta(f.data),
      f.servico,
      f.codigo ?? "—",
      STATUS_FVS[f.status] ?? f.status,
      `${conformes}/${f.itens.length}`,
    ] as string[]
  })

  return <Table heads={["Data", "Serviço", "Código", "Status", "Conformes/Total"]} rows={rows} />
}

function RelFinanceiro({ obraId }: { obraId: string }) {
  const { data: lancamentos = [], isLoading } = trpc.financeiro.listar.useQuery({ obraId })
  if (isLoading) return <p style={{ color: "#64748b" }}>Carregando lançamentos...</p>

  const receitas = lancamentos.filter(l => l.tipo === "RECEITA").reduce((s, l) => s + l.valor, 0)
  const despesas = lancamentos.filter(l => l.tipo === "DESPESA").reduce((s, l) => s + l.valor, 0)
  const saldo    = receitas - despesas

  const rows = lancamentos.map(l => [
    formatDataCurta(l.data),
    l.descricao,
    l.tipo === "RECEITA" ? "Receita" : "Despesa",
    l.categoria ?? "—",
    formatBRL(l.valor),
  ] as string[])

  return (
    <>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Receitas", value: formatBRL(receitas), color: "#166534" },
          { label: "Total Despesas", value: formatBRL(despesas), color: "#991b1b" },
          { label: "Saldo",          value: formatBRL(saldo),    color: saldo >= 0 ? "#166534" : "#991b1b" },
        ].map(k => (
          <div key={k.label} style={{ flex: 1, border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px" }}>
            <p style={{ margin: 0, fontSize: 10, color: "#64748b" }}>{k.label}</p>
            <p style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 800, color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>
      <Table heads={["Data", "Descrição", "Tipo", "Categoria", "Valor"]} rows={rows} />
    </>
  )
}

// ─── "tipo=rdo" sem obraId específico — instrução especial ───────────────────

function RdoSemObra({ obraId }: { obraId: string }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 0", color: "#64748b" }}>
      <ClipboardList size={40} style={{ color: "#f97316", margin: "0 auto 16px" }} />
      <p style={{ fontWeight: 700, color: "#0f172a", fontSize: 15 }}>Relatório de RDO</p>
      <p style={{ fontSize: 13, marginTop: 8, lineHeight: 1.6 }}>
        Para baixar o PDF de um RDO individual, acesse o detalhe do RDO e clique em{" "}
        <strong>"Baixar PDF"</strong>.
      </p>
      {obraId && (
        <a href={`/obras/${obraId}/rdo`} style={{ display: "inline-block", marginTop: 16, padding: "8px 18px", backgroundColor: "#f97316", color: "#fff", borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
          Ver RDOs desta obra
        </a>
      )}
    </div>
  )
}

// ─── conteúdo principal ───────────────────────────────────────────────────────

function PreviewContent() {
  const params = useSearchParams()
  const tipo   = params.get("tipo") ?? ""
  const obraId = params.get("obraId") ?? ""

  const { data: obras = [] } = trpc.obra.listar.useQuery()
  const obra = obras.find(o => o.id === obraId)

  return (
    <>
      {/* Toolbar — oculta na impressão */}
      <div className="no-print" style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 24px", borderBottom: "1px solid #e2e8f0",
        background: "#fff", position: "sticky", top: 0, zIndex: 10,
      }}>
        <Link href="/relatorios" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748b", textDecoration: "none" }}>
          <ArrowLeft size={14} />
          Relatórios
        </Link>
        <span style={{ color: "#cbd5e1" }}>·</span>
        <span style={{ fontSize: 13, color: "#0f172a", fontWeight: 600 }}>{TITULO[tipo] ?? "Relatório"}</span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => window.print()}
          className="btn-download px-5 py-2"
        >
          🖨️ Imprimir / PDF
        </button>
        <button
          onClick={() => window.close()}
          className="btn-ghost px-4 py-2"
        >
          Fechar
        </button>
      </div>

      {/* Documento imprimível */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 32px 64px" }}>

        {/* Header */}
        <div style={{ borderBottom: "3px solid #f97316", paddingBottom: 16, marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: -0.5 }}>
                CONCRETIZA
              </h1>
              <h2 style={{ fontSize: 14, color: "#f97316", fontWeight: 700, margin: "4px 0 0" }}>
                {TITULO[tipo] ?? "Relatório"}
              </h2>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>
                Gerado em: {new Date().toLocaleString("pt-BR")}
              </p>
            </div>
          </div>

          {obra && (
            <div style={{ marginTop: 12, background: "#f8fafc", padding: "8px 12px", borderRadius: 6 }}>
              <p style={{ margin: 0, fontWeight: 700, color: "#0f172a", fontSize: 13 }}>{obra.nome}</p>
            </div>
          )}
          {!obraId && (
            <p style={{ marginTop: 8, color: "#64748b", fontSize: 11 }}>Todas as obras</p>
          )}
        </div>

        {/* Conteúdo */}
        {!tipo && (
          <p style={{ color: "#94a3b8", fontStyle: "italic" }}>Tipo de relatório não especificado.</p>
        )}
        {tipo === "rdo" && !obraId && <RdoSemObra obraId={obraId} />}
        {tipo === "rdo" && obraId && <RelRdo obraId={obraId} />}
        {tipo === "ocorrencias" && obraId && <RelOcorrencias obraId={obraId} />}
        {tipo === "fvs" && obraId && <RelFvs obraId={obraId} />}
        {tipo === "financeiro" && obraId && <RelFinanceiro obraId={obraId} />}
        {["ocorrencias", "fvs", "financeiro"].includes(tipo) && !obraId && (
          <p style={{ color: "#94a3b8", fontStyle: "italic" }}>
            Selecione uma obra na página de relatórios para visualizar os dados.
          </p>
        )}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
    </>
  )
}

export default function RelatorioPreviewPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#64748b" }}>Carregando...</p>
      </div>
    }>
      <PreviewContent />
    </Suspense>
  )
}
