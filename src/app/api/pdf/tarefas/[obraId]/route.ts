import { NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"
import { createClient } from "@/lib/supabase/server"

const STATUS_LABEL: Record<string, string> = {
  NAO_INICIADO: "Não iniciado",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO:    "Concluído",
  SUSPENSO:     "Suspenso",
}

function barHTML(pct: number) {
  const filled = Math.min(100, Math.round(pct))
  const color  = filled >= 100 ? "#22c55e" : filled > 0 ? "#3b82f6" : "#e2e8f0"
  return `<div style="height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden;width:100%">
    <div style="height:100%;background:${color};width:${filled}%;border-radius:4px"></div>
  </div>`
}

type TarefaBase2 = {
  id: string; codigo: string | null; nome: string; setor: string | null
  unidade: string; quantidadeTotal: number; quantidadeExecutada: number
  percentual: number; status: string; ordem: number
}
type TarefaRow = TarefaBase2 & { filhos: TarefaBase2[] }

function rowHTML(t: TarefaBase2, level: number): string {
  return `<tr style="border-bottom:1px solid #e5e7eb">
    <td style="padding:7px 10px;font-family:monospace;font-size:11px;color:#6b7280;padding-left:${10 + level * 18}px">${t.codigo ?? "—"}</td>
    <td style="padding:7px 10px;font-size:12px;font-weight:${level === 0 ? 600 : 400}">${t.nome}${t.setor ? `<br><span style="font-size:10px;color:#9ca3af">${t.setor}</span>` : ""}</td>
    <td style="padding:7px 10px;font-size:11px;text-align:right;white-space:nowrap">${t.quantidadeExecutada > 0 ? `${t.quantidadeExecutada}/` : ""}${t.quantidadeTotal} ${t.unidade}</td>
    <td style="padding:7px 14px;min-width:120px">
      <div style="display:flex;align-items:center;gap:8px">
        ${barHTML(t.percentual)}
        <span style="font-size:11px;font-weight:700;width:32px;text-align:right">${Math.round(t.percentual)}%</span>
      </div>
    </td>
    <td style="padding:7px 10px;font-size:10px;text-align:center;white-space:nowrap">${STATUS_LABEL[t.status] ?? t.status}</td>
  </tr>`
}

function renderRows(tarefas: TarefaRow[]): string {
  return tarefas.map(t => rowHTML(t, 0) + t.filhos.map(f => rowHTML(f, 1)).join("")).join("")
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ obraId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse("Não autorizado", { status: 401 })

  const { obraId } = await params

  const obra = await db.obra.findFirst({
    where: { id: obraId, empresa: { usuarios: { some: { authId: user.id } } } },
    select: { nome: true, cidade: true, estado: true },
  })
  if (!obra) return new NextResponse("Obra não encontrada", { status: 404 })

  const tarefas = (await db.tarefaObra.findMany({
    where: { obraId, parentId: null },
    include: { filhos: { orderBy: { ordem: "asc" } } },
    orderBy: { ordem: "asc" },
  })) as unknown as TarefaRow[]

  const flat = tarefas.flatMap(t => [t, ...t.filhos])
  const total = flat.length
  const concluidas = flat.filter(t => t.status === "CONCLUIDO").length
  const avgPct = total > 0 ? Math.round(flat.reduce((s, t) => s + t.percentual, 0) / total) : 0

  const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Lista de Tarefas — ${obra.nome}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, sans-serif; color: #111; background: #fff; padding: 32px; }
    h1 { font-size: 20px; font-weight: 800; }
    h2 { font-size: 13px; font-weight: 500; color: #6b7280; margin-top: 2px; }
    .kpis { display: flex; gap: 16px; margin: 20px 0; }
    .kpi { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px 18px; min-width: 120px; }
    .kpi-v { font-size: 24px; font-weight: 800; }
    .kpi-l { font-size: 11px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    thead th { background: #f3f4f6; padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #6b7280; }
    @media print { @page { size: A4 landscape; margin: 20mm; } body { padding: 0; } }
  </style>
</head>
<body>
  <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:4px">
    <div>
      <h1>Lista de Tarefas (WBS)</h1>
      <h2>${obra.nome}${obra.cidade ? ` · ${obra.cidade}${obra.estado ? `/${obra.estado}` : ""}` : ""}</h2>
    </div>
    <div style="font-size:11px;color:#9ca3af;text-align:right">Gerado em ${hoje}</div>
  </div>

  <div class="kpis">
    <div class="kpi"><div class="kpi-v" style="color:#3b82f6">${total}</div><div class="kpi-l">Total de tarefas</div></div>
    <div class="kpi"><div class="kpi-v" style="color:#22c55e">${concluidas}</div><div class="kpi-l">Concluídas</div></div>
    <div class="kpi"><div class="kpi-v" style="color:#a855f7">${avgPct}%</div><div class="kpi-l">Avanço médio</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:70px">WBS</th>
        <th>Nome / Serviço</th>
        <th style="width:110px;text-align:right">Qtd / Unidade</th>
        <th style="width:160px">Progresso</th>
        <th style="width:100px;text-align:center">Status</th>
      </tr>
    </thead>
    <tbody>
      ${renderRows(tarefas)}
    </tbody>
  </table>
</body>
</html>`

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
