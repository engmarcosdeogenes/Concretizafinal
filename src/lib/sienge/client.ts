const BASE = (sub: string) =>
  `https://api.sienge.com.br/${sub}/public/api/v1`

function authHeader(usuario: string, senha: string) {
  return "Basic " + Buffer.from(`${usuario}:${senha}`).toString("base64")
}

// ─── Webhooks ─────────────────────────────────────────────────────────────────

export interface SiengeHook {
  id: number
  url: string
  events: string[]
  active?: boolean
}

export async function registrarWebhookSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  url: string,
  events: string[],
): Promise<{ id: number }> {
  const res = await fetch(`${BASE(subdominio)}/hooks`, {
    method: "POST",
    headers: {
      Authorization: authHeader(usuario, senha),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ url, events }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return res.json() as Promise<{ id: number }>
}

export async function listarWebhooksSienge(
  subdominio: string,
  usuario: string,
  senha: string,
): Promise<SiengeHook[]> {
  try {
    const data = await siengeGet(subdominio, usuario, senha, "/hooks")
    return normalizeList(data) as SiengeHook[]
  } catch {
    return []
  }
}

export async function excluirWebhookSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  hookId: number,
): Promise<void> {
  const res = await fetch(`${BASE(subdominio)}/hooks/${hookId}`, {
    method: "DELETE",
    headers: { Authorization: authHeader(usuario, senha) },
  })
  if (!res.ok && res.status !== 404) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
}

function normalizeList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  const d = data as Record<string, unknown>
  const list = d["results"] ?? d["resultset"] ?? d["data"] ?? []
  return Array.isArray(list) ? list : []
}

export async function siengeGet(subdominio: string, usuario: string, senha: string, path: string) {
  const res = await fetch(`${BASE(subdominio)}${path}`, {
    headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
    cache: "no-store",
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return res.json() as Promise<unknown>
}

// ─── Teste de conexão ─────────────────────────────────────────────────────────

export async function testarConexao(
  subdominio: string,
  usuario: string,
  senha: string,
): Promise<boolean> {
  try {
    await siengeGet(subdominio, usuario, senha, "/enterprises?limit=1")
    return true
  } catch {
    return false
  }
}

// ─── Obras (Enterprises) ─────────────────────────────────────────────────────

export interface SiengeObra {
  id: number
  name?: string
  commercialName?: string
  cnpj?: string
  type?: string
  adress?: string
  companyId?: number
  companyName?: string
  status?: string
}

export async function listarObras(
  subdominio: string,
  usuario: string,
  senha: string,
): Promise<SiengeObra[]> {
  const data = await siengeGet(subdominio, usuario, senha, "/enterprises?limit=200&offset=0")
  return normalizeList(data) as SiengeObra[]
}

// ─── Fornecedores (Creditors) ─────────────────────────────────────────────────

export interface SiengeFornecedor {
  id: number
  name: string
  tradeName?: string
  cpf?: string | null
  cnpj?: string | null
  supplier: string  // "S" = fornecedor, "N" = não
  employee: string
  active: boolean
  address?: {
    cityName?: string
    state?: string
    zipCode?: string
  }
}

export async function listarFornecedoresSienge(
  subdominio: string,
  usuario: string,
  senha: string,
): Promise<SiengeFornecedor[]> {
  // Fetch first 600 creditors (3 pages), filter suppliers
  const all: SiengeFornecedor[] = []
  const limit = 200
  for (let offset = 0; offset < 600; offset += limit) {
    const data = await siengeGet(subdominio, usuario, senha, `/creditors?limit=${limit}&offset=${offset}`)
    const page = normalizeList(data) as SiengeFornecedor[]
    all.push(...page)
    if (page.length < limit) break
  }
  return all.filter((c) => c.supplier === "S" && c.active)
}

// ─── Pedidos de Compra ────────────────────────────────────────────────────────

export interface SiengePedido {
  id: number
  formattedPurchaseOrderId?: string
  status: string
  authorized: boolean
  supplierId: number
  buildingId: number
  date: string
  totalAmount: number
  notes?: string | null
  internalNotes?: string | null
  buyerId?: string
}

export async function listarPedidosSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  buildingId?: number,
): Promise<SiengePedido[]> {
  const qs = buildingId ? `buildingId=${buildingId}&` : ""
  const data = await siengeGet(subdominio, usuario, senha, `/purchase-orders?${qs}limit=50&offset=0`)
  return normalizeList(data) as SiengePedido[]
}

// ─── Tarefas / Planejamento ────────────────────────────────────────────────────

export interface SiengeProjeto {
  id: number
  name: string
  buildingId: number
  percentageExecuted?: number
  startDate?: string
  endDate?: string
}

export interface SiengeTarefa {
  id: number
  wbsCode?: string
  name: string
  percentageExecuted?: number
  percentagePlanned?: number
  startDate?: string
  endDate?: string
  duration?: number
}

export async function listarProjetosSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  siengeId: number,
): Promise<SiengeProjeto[]> {
  const data = await siengeGet(subdominio, usuario, senha, `/building-projects?buildingId=${siengeId}&limit=50`)
  return normalizeList(data) as SiengeProjeto[]
}

export async function listarTarefasSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  projectId: number,
): Promise<SiengeTarefa[]> {
  const data = await siengeGet(subdominio, usuario, senha, `/building-projects/${projectId}/tasks?limit=200`)
  return normalizeList(data) as SiengeTarefa[]
}

// ─── Orçamento ────────────────────────────────────────────────────────────────

export interface SiengeOrcamento {
  id: number
  name: string
  buildingId: number
  totalCost?: number
}

export interface SiengeItemOrcamento {
  id: number
  code?: string
  description: string
  unit?: string
  quantity?: number
  unitPrice?: number
  totalPrice?: number
  group?: string
}

export async function listarOrcamentosSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  siengeId: number,
): Promise<SiengeOrcamento[]> {
  const data = await siengeGet(subdominio, usuario, senha, `/building-cost-estimations?buildingId=${siengeId}&limit=50`)
  return normalizeList(data) as SiengeOrcamento[]
}

export async function listarItensOrcamento(
  subdominio: string,
  usuario: string,
  senha: string,
  estimationId: number,
): Promise<SiengeItemOrcamento[]> {
  const data = await siengeGet(subdominio, usuario, senha, `/building-cost-estimations/${estimationId}/items?limit=200`)
  return normalizeList(data) as SiengeItemOrcamento[]
}

// ─── RDO Bidirecional ─────────────────────────────────────────────────────────

export interface SiengeRdoInput {
  buildingId: number
  date: string
  weather?: string
  minTemperature?: number
  maxTemperature?: number
  rain?: boolean
  observations?: string
  activities?: string[]
  workers?: number
}

export async function criarRdoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  input: SiengeRdoInput,
): Promise<{ id: number }> {
  const res = await fetch(`${BASE(subdominio)}/construction-daily-reports`, {
    method: "POST",
    headers: {
      Authorization: authHeader(usuario, senha),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return res.json() as Promise<{ id: number }>
}

// ─── Cotações ─────────────────────────────────────────────────────────────────

export interface SiengeCotacao {
  id: number
  formattedId?: string
  status?: string
  buildingId?: number
  openDate?: string
  closingDate?: string
  totalAmount?: number
  notes?: string
}

export interface SiengeRespostaCotacao {
  id: number
  supplierId: number
  supplierName?: string
  totalAmount?: number
  status?: string
  deliveryDays?: number
}

export async function listarCotacoesSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  buildingId?: number,
): Promise<SiengeCotacao[]> {
  const qs = buildingId ? `buildingId=${buildingId}&` : ""
  const data = await siengeGet(subdominio, usuario, senha, `/purchase-quotations?${qs}limit=50`)
  return normalizeList(data) as SiengeCotacao[]
}

export async function listarRespostasCotacao(
  subdominio: string,
  usuario: string,
  senha: string,
  quotationId: number,
): Promise<SiengeRespostaCotacao[]> {
  const data = await siengeGet(subdominio, usuario, senha, `/purchase-quotations/${quotationId}/responses`)
  return normalizeList(data) as SiengeRespostaCotacao[]
}

// ─── Pedidos — Autorização ────────────────────────────────────────────────────

export async function autorizarPedidoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  pedidoId: number,
): Promise<void> {
  const res = await fetch(`${BASE(subdominio)}/purchase-orders/${pedidoId}/authorize`, {
    method: "POST",
    headers: {
      Authorization: authHeader(usuario, senha),
      Accept: "application/json",
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
}

// ─── Pedidos — Buscar por ID ──────────────────────────────────────────────────

export async function buscarPedidoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  pedidoId: number,
): Promise<SiengePedido> {
  const data = await siengeGet(subdominio, usuario, senha, `/purchase-orders/${pedidoId}`)
  return data as SiengePedido
}

// ─── Pedidos — Itens ──────────────────────────────────────────────────────────

export interface SiengePedidoItem {
  sequentialNumber: number
  resourceId?: number
  resourceDescription?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  unit?: string
  deliveryDate?: string
}

export async function listarItensPedidoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  pedidoId: number,
): Promise<SiengePedidoItem[]> {
  const data = await siengeGet(subdominio, usuario, senha, `/purchase-orders/${pedidoId}/items`)
  return normalizeList(data) as SiengePedidoItem[]
}

// ─── Pedido — Item específico (GET /purchase-orders/{id}/items/{n}) ───────────

export interface SiengePedidoItemDetalhe {
  sequentialNumber: number
  resourceId?: number
  resourceDescription?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  unit?: string
  deliveryDate?: string
  discount?: number
  addition?: number
  [key: string]: unknown
}

export async function buscarItemPedidoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  pedidoId: number,
  itemSeq: number,
): Promise<SiengePedidoItemDetalhe | null> {
  try {
    const data = await siengeGet(subdominio, usuario, senha, `/purchase-orders/${pedidoId}/items/${itemSeq}`)
    return data as SiengePedidoItemDetalhe
  } catch { return null }
}

// ─── Pedido — Previsões de entrega (GET /purchase-orders/{id}/items/{n}/delivery-schedules) ──

export interface SiengeDeliverySchedule {
  sequentialNumber: number
  quantity: number
  deliveryDate?: string
  [key: string]: unknown
}

export async function listarDeliverySchedulesPedidoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  pedidoId: number,
  itemSeq: number,
): Promise<SiengeDeliverySchedule[]> {
  const data = await siengeGet(subdominio, usuario, senha, `/purchase-orders/${pedidoId}/items/${itemSeq}/delivery-schedules`)
  return normalizeList(data) as SiengeDeliverySchedule[]
}

// ─── Pedido — Apropriações por obra (GET /purchase-orders/{id}/items/{n}/buildings-appropriations) ──

export interface SiengePedidoItemBuildingAppropriation {
  buildingId: number
  buildingName?: string
  percentage?: number
  value?: number
  [key: string]: unknown
}

export async function listarBuildingsAppropriationsPedidoItemSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  pedidoId: number,
  itemSeq: number,
): Promise<SiengePedidoItemBuildingAppropriation[]> {
  const data = await siengeGet(subdominio, usuario, senha, `/purchase-orders/${pedidoId}/items/${itemSeq}/buildings-appropriations`)
  return normalizeList(data) as SiengePedidoItemBuildingAppropriation[]
}

// ─── Pedido — Totalização (GET /purchase-orders/{id}/totalization) ───────────

export interface SiengePedidoTotalizacao {
  totalItems?: number
  totalAdditions?: number
  totalDiscounts?: number
  totalTaxes?: number
  grandTotal?: number
  [key: string]: unknown
}

export async function buscarTotalizacaoPedidoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  pedidoId: number,
): Promise<SiengePedidoTotalizacao | null> {
  try {
    const data = await siengeGet(subdominio, usuario, senha, `/purchase-orders/${pedidoId}/totalization`)
    return data as SiengePedidoTotalizacao
  } catch { return null }
}

// ─── Pedido — Reprovar com observação (PATCH /purchase-orders/{id}/disapprove) ──

export async function reprovarPedidoComObsSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  pedidoId: number,
  observation: string,
): Promise<boolean> {
  const res = await fetch(`${BASE(subdominio)}/purchase-orders/${pedidoId}/disapprove`, {
    method: "PATCH",
    headers: {
      Authorization: authHeader(usuario, senha),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ observation }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return true
}

// ─── Pedidos — Reprovação ─────────────────────────────────────────────────────

export async function reprovarPedidoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  pedidoId: number,
): Promise<void> {
  const res = await fetch(`${BASE(subdominio)}/purchase-orders/${pedidoId}/disapprove`, {
    method: "PUT",
    headers: {
      Authorization: authHeader(usuario, senha),
      Accept: "application/json",
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
}

// ─── Solicitação — Buscar por ID ──────────────────────────────────────────────

export interface SiengeSolicitacaoCompra {
  id: number
  buildingId: number
  requestDate: string
  status?: string
  observations?: string
}

export async function buscarSolicitacaoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  solicitacaoId: number,
): Promise<SiengeSolicitacaoCompra> {
  const data = await siengeGet(subdominio, usuario, senha, `/purchase-requests/${solicitacaoId}`)
  return data as SiengeSolicitacaoCompra
}

// ─── Solicitação — Listar Anexos ──────────────────────────────────────────────

export interface SiengeAnexoSolicitacao {
  id: number
  fileName: string
  description?: string
}

export async function listarAnexosSolicitacaoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  solicitacaoId: number,
): Promise<SiengeAnexoSolicitacao[]> {
  const data = await siengeGet(subdominio, usuario, senha, `/purchase-requests/${solicitacaoId}/attachments`)
  return normalizeList(data) as SiengeAnexoSolicitacao[]
}

// ─── Solicitação — Download de Anexo ──────────────────────────────────────────

export async function downloadAnexoSolicitacaoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  solicitacaoId: number,
  attachmentId: number,
): Promise<{ fileBase64: string; contentType: string; fileName: string } | null> {
  try {
    const res = await fetch(
      `${BASE(subdominio)}/purchase-requests/${solicitacaoId}/attachments/${attachmentId}`,
      {
        method: "GET",
        headers: {
          Authorization: authHeader(usuario, senha),
        },
      },
    )
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
    }
    const contentType = res.headers.get("Content-Type") ?? "application/octet-stream"
    const disposition = res.headers.get("Content-Disposition") ?? ""
    const fileNameMatch = disposition.match(/filename[^;=\n]*=["']?([^"';\n]+)/)
    const fileName = fileNameMatch?.[1] ?? `attachment-${attachmentId}`
    const buffer = Buffer.from(await res.arrayBuffer())
    return { fileBase64: buffer.toString("base64"), contentType, fileName }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return null
  }
}

// ─── Solicitação — Criar Itens ────────────────────────────────────────────────

export interface SiengeSolicitacaoItemInput {
  description: string
  quantity: number
  unit?: string
}

export async function criarItensSolicitacaoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  solicitacaoId: number,
  items: SiengeSolicitacaoItemInput[],
): Promise<void> {
  const res = await fetch(`${BASE(subdominio)}/purchase-requests/${solicitacaoId}/items`, {
    method: "POST",
    headers: {
      Authorization: authHeader(usuario, senha),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(items),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
}

// ─── Financeiro ───────────────────────────────────────────────────────────────

export interface SiengeContaPagar {
  id: number
  creditorName?: string
  dueDate?: string
  amount?: number
  status?: string
  documentNumber?: string
}

export interface SiengeContaBancaria {
  id: number
  name: string
  bankName?: string
  accountNumber?: string
}

export async function listarContasPagarSienge(
  subdominio: string,
  usuario: string,
  senha: string,
): Promise<SiengeContaPagar[]> {
  const data = await siengeGet(subdominio, usuario, senha, "/bill-debts?limit=50")
  return normalizeList(data) as SiengeContaPagar[]
}

export async function listarContasBancariasSienge(
  subdominio: string,
  usuario: string,
  senha: string,
): Promise<SiengeContaBancaria[]> {
  const data = await siengeGet(subdominio, usuario, senha, "/checking-accounts?limit=50")
  return normalizeList(data) as SiengeContaBancaria[]
}

export async function listarSaldosSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  date?: string,
): Promise<Array<{ accountId: number; balance: number }>> {
  const d = date ?? new Date().toISOString().split("T")[0]
  const data = await siengeGet(subdominio, usuario, senha, `/accounts-balances?date=${d}&limit=50`)
  return normalizeList(data) as Array<{ accountId: number; balance: number }>
}

// ─── Medição / Progress Log ───────────────────────────────────────────────────

export interface SiengeProgressLog {
  buildingProjectId: number
  date: string
  percentageExecuted: number
  description?: string
}

export async function criarProgressLogSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  input: SiengeProgressLog,
): Promise<{ id: number }> {
  const res = await fetch(`${BASE(subdominio)}/building-projects-progress-logs`, {
    method: "POST",
    headers: {
      Authorization: authHeader(usuario, senha),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return res.json() as Promise<{ id: number }>
}

// ─── Creditor por CPF ─────────────────────────────────────────────────────────

export interface SiengeCreditor {
  id: number
  name: string
  tradeName?: string
  cpf?: string
  cnpj?: string
  supplier?: string
  employee?: string
  active?: boolean
  email?: string
  phone?: string
  address?: {
    street?: string
    number?: string
    complement?: string
    neighborhood?: string
    cityName?: string
    state?: string
    zipCode?: string
  }
}

export async function buscarCreditorPorId(
  subdominio: string,
  usuario: string,
  senha: string,
  creditorId: number,
): Promise<SiengeCreditor | null> {
  const data = await siengeGet(subdominio, usuario, senha, `/creditors/${creditorId}`).catch(() => null)
  if (!data) return null
  return data as SiengeCreditor
}

export async function buscarCreditorPorCpf(
  subdominio: string,
  usuario: string,
  senha: string,
  cpf: string,
): Promise<SiengeCreditor | null> {
  const cpfClean = cpf.replace(/\D/g, "")
  const data = await siengeGet(subdominio, usuario, senha, `/creditors?cpf=${cpfClean}&limit=1`).catch(() => null)
  if (!data) return null
  const list = normalizeList(data) as SiengeCreditor[]
  return list[0] ?? null
}

// ─── Solicitação de Compra ────────────────────────────────────────────────────

export interface SiengePurchaseRequestInput {
  buildingId: number
  requestDate: string
  observations?: string
  items: Array<{
    description: string
    quantity: number
    unit?: string
  }>
}

export async function criarSolicitacaoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  input: SiengePurchaseRequestInput,
): Promise<{ id: number }> {
  const res = await fetch(`${BASE(subdominio)}/purchase-requests`, {
    method: "POST",
    headers: {
      Authorization: authHeader(usuario, senha),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return res.json() as Promise<{ id: number }>
}

// ─── Solicitação — Autorizar todos os itens ──────────────────────────────────

export async function autorizarSolicitacaoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  solicitacaoId: number,
): Promise<boolean> {
  const res = await fetch(`${BASE(subdominio)}/purchase-requests/${solicitacaoId}/authorize`, {
    method: "PATCH",
    headers: {
      Authorization: authHeader(usuario, senha),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return true
}

// ─── Solicitação — Reprovar todos os itens ───────────────────────────────────

export async function reprovarSolicitacaoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  solicitacaoId: number,
): Promise<boolean> {
  const res = await fetch(`${BASE(subdominio)}/purchase-requests/${solicitacaoId}/disapproval`, {
    method: "PATCH",
    headers: {
      Authorization: authHeader(usuario, senha),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return true
}

// ─── Solicitação — Listar todos os itens ─────────────────────────────────────

export interface SiengeSolicitacaoItem {
  id: number
  purchaseRequestId: number
  description: string
  quantity: number
  unit?: string
  status?: string
  buildingId?: number
}

export async function listarTodosItensSolicitacaoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  params?: { buildingId?: number; status?: string },
): Promise<SiengeSolicitacaoItem[]> {
  const qs = new URLSearchParams()
  qs.set("limit", "200")
  qs.set("offset", "0")
  if (params?.buildingId) qs.set("buildingId", String(params.buildingId))
  if (params?.status) qs.set("status", params.status)
  const data = await siengeGet(subdominio, usuario, senha, `/purchase-requests/all/items?${qs.toString()}`)
  return normalizeList(data) as SiengeSolicitacaoItem[]
}

// ─── Solicitação — Apropriações por obra do item ─────────────────────────────

export interface SiengeSolicitacaoItemApropriacao {
  buildingId: number
  buildingName?: string
  percentage?: number
  value?: number
}

export async function listarApropriacoesSolicitacaoItemSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  solicitacaoId: number,
  itemId: number,
): Promise<SiengeSolicitacaoItemApropriacao[]> {
  const data = await siengeGet(
    subdominio, usuario, senha,
    `/purchase-requests/${solicitacaoId}/items/${itemId}/buildings-appropriations`,
  )
  return normalizeList(data) as SiengeSolicitacaoItemApropriacao[]
}

// ─── Solicitação — Requisitos de entrega do item ─────────────────────────────

export interface SiengeSolicitacaoItemDeliveryReq {
  id: number
  description?: string
  requiredDate?: string
  quantity?: number
}

export async function listarRequisitosEntregaSolicitacaoItemSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  solicitacaoId: number,
  itemId: number,
): Promise<SiengeSolicitacaoItemDeliveryReq[]> {
  const data = await siengeGet(
    subdominio, usuario, senha,
    `/purchase-requests/${solicitacaoId}/items/${itemId}/delivery-requirements`,
  )
  return normalizeList(data) as SiengeSolicitacaoItemDeliveryReq[]
}

// ─── Estoque Real ─────────────────────────────────────────────────────────────

export interface SiengeEstoqueItem {
  materialId: number
  materialNome: string
  unidade: string
  saldoAtual: number
  saldoMinimo: number
  localEstoque: string
  centroEstoque?: string
}

export async function listarEstoqueSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  obraId?: number,
): Promise<SiengeEstoqueItem[]> {
  const params = new URLSearchParams({ limit: "200", offset: "0" })
  if (obraId) params.set("buildingId", String(obraId))
  const res = await fetch(`${BASE(subdominio)}/stock-balances?${params}`, {
    headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  const json = await res.json() as { items?: SiengeEstoqueItem[] }
  return json.items ?? []
}

export async function lancarMovimentacaoEstoqueSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  input: {
    materialId: number
    obraId: number
    tipo: "ENTRADA" | "SAIDA"
    quantidade: number
    data: string
    observacao?: string
  },
): Promise<{ id: number }> {
  const res = await fetch(`${BASE(subdominio)}/stock-movements`, {
    method: "POST",
    headers: {
      Authorization: authHeader(usuario, senha),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return res.json() as Promise<{ id: number }>
}

// ─── NFe ──────────────────────────────────────────────────────────────────────

export interface SiengeNFe {
  id: number
  numero: string
  serie: string
  fornecedorNome: string
  fornecedorCnpj: string
  dataEmissao: string
  dataEntrada?: string
  valor: number
  status: string
  chaveAcesso?: string
  itens?: {
    materialId: number
    materialNome: string
    quantidade: number
    valorUnitario: number
    unidade: string
  }[]
}

export async function listarNFeSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  obraId?: number,
  dataInicio?: string,
  dataFim?: string,
): Promise<SiengeNFe[]> {
  const params = new URLSearchParams({ limit: "200", offset: "0" })
  if (obraId)     params.set("buildingId",  String(obraId))
  if (dataInicio) params.set("startDate",   dataInicio)
  if (dataFim)    params.set("endDate",     dataFim)
  const res = await fetch(`${BASE(subdominio)}/invoices?${params}`, {
    headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  const json = await res.json() as { items?: SiengeNFe[] }
  return json.items ?? []
}

// ─── NFe Detalhe Fiscal (tributos por item) ──────────────────────────────────

export interface SiengeNFeItemTributo {
  itemId: number
  materialId: number
  materialNome: string
  ncm?: string
  cfop?: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
  unidade: string
  icms?: {
    baseCalculo: number
    aliquota: number
    valor: number
    cst?: string
    origem?: string
  }
  ipi?: {
    baseCalculo: number
    aliquota: number
    valor: number
    cst?: string
  }
  pis?: {
    baseCalculo: number
    aliquota: number
    valor: number
    cst?: string
  }
  cofins?: {
    baseCalculo: number
    aliquota: number
    valor: number
    cst?: string
  }
  issqn?: {
    baseCalculo: number
    aliquota: number
    valor: number
    codigoServico?: string
  }
}

export interface SiengeNFeDetalhe {
  id: number
  numero: string
  serie: string
  fornecedorNome: string
  fornecedorCnpj: string
  dataEmissao: string
  dataEntrada?: string
  valor: number
  status: string
  chaveAcesso?: string
  naturezaOperacao?: string
  totalBaseIcms: number
  totalIcms: number
  totalIpi: number
  totalPis: number
  totalCofins: number
  totalIssqn: number
  itens: SiengeNFeItemTributo[]
}

export async function buscarNFeDetalheSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  nfeId: number,
): Promise<SiengeNFeDetalhe> {
  // Busca detalhes da NF-e incluindo itens com tributos
  const data = await siengeGet(subdominio, usuario, senha, `/nfes/${nfeId}`) as Record<string, unknown>

  // Busca itens da NF-e com tributos detalhados
  let itensRaw: Record<string, unknown>[] = []
  try {
    const itensData = await siengeGet(subdominio, usuario, senha, `/nfes/${nfeId}/items`)
    itensRaw = normalizeList(itensData) as Record<string, unknown>[]
  } catch {
    itensRaw = []
  }

  const itens: SiengeNFeItemTributo[] = itensRaw.map((item, idx) => {
    const icmsData = item.icms as Record<string, unknown> | undefined
    const ipiData = item.ipi as Record<string, unknown> | undefined
    const pisData = item.pis as Record<string, unknown> | undefined
    const cofinsData = item.cofins as Record<string, unknown> | undefined
    const issqnData = item.issqn as Record<string, unknown> | undefined

    return {
      itemId: (item.id as number) ?? idx + 1,
      materialId: (item.materialId as number) ?? (item.productId as number) ?? 0,
      materialNome: (item.materialName as string) ?? (item.productName as string) ?? (item.description as string) ?? "—",
      ncm: (item.ncm as string) ?? undefined,
      cfop: (item.cfop as string) ?? undefined,
      quantidade: (item.quantity as number) ?? 0,
      valorUnitario: (item.unitPrice as number) ?? (item.unitValue as number) ?? 0,
      valorTotal: (item.totalPrice as number) ?? (item.totalValue as number) ?? 0,
      unidade: (item.unit as string) ?? (item.measureUnit as string) ?? "UN",
      icms: icmsData ? {
        baseCalculo: (icmsData.baseValue as number) ?? (icmsData.calculationBase as number) ?? 0,
        aliquota: (icmsData.rate as number) ?? (icmsData.aliquot as number) ?? 0,
        valor: (icmsData.value as number) ?? (icmsData.amount as number) ?? 0,
        cst: (icmsData.cst as string) ?? undefined,
        origem: (icmsData.origin as string) ?? undefined,
      } : undefined,
      ipi: ipiData ? {
        baseCalculo: (ipiData.baseValue as number) ?? (ipiData.calculationBase as number) ?? 0,
        aliquota: (ipiData.rate as number) ?? (ipiData.aliquot as number) ?? 0,
        valor: (ipiData.value as number) ?? (ipiData.amount as number) ?? 0,
        cst: (ipiData.cst as string) ?? undefined,
      } : undefined,
      pis: pisData ? {
        baseCalculo: (pisData.baseValue as number) ?? (pisData.calculationBase as number) ?? 0,
        aliquota: (pisData.rate as number) ?? (pisData.aliquot as number) ?? 0,
        valor: (pisData.value as number) ?? (pisData.amount as number) ?? 0,
        cst: (pisData.cst as string) ?? undefined,
      } : undefined,
      cofins: cofinsData ? {
        baseCalculo: (cofinsData.baseValue as number) ?? (cofinsData.calculationBase as number) ?? 0,
        aliquota: (cofinsData.rate as number) ?? (cofinsData.aliquot as number) ?? 0,
        valor: (cofinsData.value as number) ?? (cofinsData.amount as number) ?? 0,
        cst: (cofinsData.cst as string) ?? undefined,
      } : undefined,
      issqn: issqnData ? {
        baseCalculo: (issqnData.baseValue as number) ?? (issqnData.calculationBase as number) ?? 0,
        aliquota: (issqnData.rate as number) ?? (issqnData.aliquot as number) ?? 0,
        valor: (issqnData.value as number) ?? (issqnData.amount as number) ?? 0,
        codigoServico: (issqnData.serviceCode as string) ?? undefined,
      } : undefined,
    }
  })

  const totalBaseIcms = itens.reduce((s, i) => s + (i.icms?.baseCalculo ?? 0), 0)
  const totalIcms = itens.reduce((s, i) => s + (i.icms?.valor ?? 0), 0)
  const totalIpi = itens.reduce((s, i) => s + (i.ipi?.valor ?? 0), 0)
  const totalPis = itens.reduce((s, i) => s + (i.pis?.valor ?? 0), 0)
  const totalCofins = itens.reduce((s, i) => s + (i.cofins?.valor ?? 0), 0)
  const totalIssqn = itens.reduce((s, i) => s + (i.issqn?.valor ?? 0), 0)

  return {
    id: (data.id as number) ?? nfeId,
    numero: (data.number as string) ?? (data.numero as string) ?? "",
    serie: (data.series as string) ?? (data.serie as string) ?? "",
    fornecedorNome: (data.supplierName as string) ?? (data.creditorName as string) ?? "",
    fornecedorCnpj: (data.supplierDocument as string) ?? (data.creditorDocument as string) ?? "",
    dataEmissao: (data.issueDate as string) ?? (data.emissionDate as string) ?? "",
    dataEntrada: (data.entryDate as string) ?? undefined,
    valor: (data.totalValue as number) ?? (data.value as number) ?? 0,
    status: (data.status as string) ?? "",
    chaveAcesso: (data.accessKey as string) ?? undefined,
    naturezaOperacao: (data.operationNature as string) ?? undefined,
    totalBaseIcms,
    totalIcms,
    totalIpi,
    totalPis,
    totalCofins,
    totalIssqn,
    itens,
  }
}

// ─── Contas a Receber ─────────────────────────────────────────────────────────

export interface SiengeContaReceber {
  id: number
  titulo: string
  clienteNome: string
  clienteDocumento: string
  valor: number
  dataVencimento: string
  dataPagamento?: string
  status: "ABERTO" | "PAGO" | "VENCIDO" | "CANCELADO"
  obraId?: number
  obraNome?: string
}

export interface SiengeInadimplente {
  clienteNome: string
  clienteDocumento: string
  totalEmAberto: number
  quantidadeTitulos: number
  maiorAtraso: number
  titulos: SiengeContaReceber[]
}

export async function listarContasReceberSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  status?: string,
  dataInicio?: string,
  dataFim?: string,
): Promise<SiengeContaReceber[]> {
  const params = new URLSearchParams({ limit: "200", offset: "0" })
  if (status)     params.set("status",    status)
  if (dataInicio) params.set("startDate", dataInicio)
  if (dataFim)    params.set("endDate",   dataFim)
  const res = await fetch(`${BASE(subdominio)}/receivable-bills?${params}`, {
    headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  const json = await res.json() as { items?: SiengeContaReceber[] }
  return json.items ?? []
}

export async function listarInadimplenteSienge(
  subdominio: string,
  usuario: string,
  senha: string,
): Promise<SiengeInadimplente[]> {
  const params = new URLSearchParams({ limit: "100", offset: "0", status: "VENCIDO" })
  const res = await fetch(`${BASE(subdominio)}/receivable-bills?${params}`, {
    headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  const json = await res.json() as { items?: SiengeContaReceber[] }
  const contas = json.items ?? []

  // Agrupar por cliente
  const map = new Map<string, SiengeInadimplente>()
  for (const c of contas) {
    const key = c.clienteDocumento
    if (!map.has(key)) {
      map.set(key, {
        clienteNome: c.clienteNome,
        clienteDocumento: c.clienteDocumento,
        totalEmAberto: 0,
        quantidadeTitulos: 0,
        maiorAtraso: 0,
        titulos: [],
      })
    }
    const entry = map.get(key)!
    entry.totalEmAberto += c.valor
    entry.quantidadeTitulos++
    entry.titulos.push(c)
    const atraso = Math.floor(
      (Date.now() - new Date(c.dataVencimento).getTime()) / 86400000,
    )
    if (atraso > entry.maiorAtraso) entry.maiorAtraso = atraso
  }
  return [...map.values()].sort((a, b) => b.totalEmAberto - a.totalEmAberto)
}

// ─── Contratos de Suprimentos ─────────────────────────────────────────────────

export interface SiengeContrato {
  id: number
  numero: string
  fornecedorNome: string
  fornecedorId: number
  obraId: number
  obraNome: string
  objeto: string
  dataInicio: string
  dataFim: string
  valorTotal: number
  valorMedido: number
  percentualMedido: number
  status: string
}

export interface SiengeContratoMedicao {
  id: number
  contratoId: number
  numero: number
  dataInicio: string
  dataFim: string
  valor: number
  status: string
}

export async function listarContratosSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  obraId?: number,
): Promise<SiengeContrato[]> {
  const params = new URLSearchParams({ limit: "200", offset: "0" })
  if (obraId) params.set("buildingId", String(obraId))
  const res = await fetch(`${BASE(subdominio)}/contracts?${params}`, {
    headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  const json = await res.json() as { items?: SiengeContrato[] }
  return json.items ?? []
}

export async function listarMedicoesSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  contratoId: number,
): Promise<SiengeContratoMedicao[]> {
  const res = await fetch(`${BASE(subdominio)}/contracts/${contratoId}/measurements`, {
    headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  const json = await res.json() as { items?: SiengeContratoMedicao[] }
  return json.items ?? []
}

// ─── Supply Contracts (Contratos de Suprimentos — endpoint dedicado) ─────────

export interface SiengeSupplyContract {
  id: number
  number: string
  supplierId: number
  supplierName: string
  buildingId: number
  buildingName: string
  object: string
  startDate: string
  endDate: string
  totalValue: number
  measuredValue: number
  measuredPercentage: number
  status: string
}

export async function listarTodosSupplyContractsSienge(
  subdominio: string,
  usuario: string,
  senha: string,
): Promise<SiengeSupplyContract[]> {
  const all: SiengeSupplyContract[] = []
  let offset = 0
  const limit = 200
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    const res = await fetch(`${BASE(subdominio)}/supply-contracts?${params}`, {
      headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    const json = (await res.json()) as { resultSetMetadata?: { count?: number }; results?: SiengeSupplyContract[] }
    const items = json.results ?? []
    all.push(...items)
    const total = json.resultSetMetadata?.count ?? items.length
    if (all.length >= total || items.length < limit) break
    offset += limit
  }
  return all
}

// ─── Supply Contract Items (Itens vinculados ao contrato de suprimentos) ─────

export interface SiengeSupplyContractItem {
  supplyContractId: number
  itemNumber: number
  resourceId: number
  resourceDescription: string
  unitOfMeasurement: string
  contractedQuantity: number
  unitPrice: number
  totalPrice: number
  measuredQuantity: number
  measuredPercentage: number
  balanceQuantity: number
}

export async function listarItensSupplyContractsSienge(
  subdominio: string,
  usuario: string,
  senha: string,
): Promise<SiengeSupplyContractItem[]> {
  const all: SiengeSupplyContractItem[] = []
  let offset = 0
  const limit = 200
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    const res = await fetch(`${BASE(subdominio)}/supply-contracts/items?${params}`, {
      headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    const json = (await res.json()) as { resultSetMetadata?: { count?: number }; results?: SiengeSupplyContractItem[] }
    const items = json.results ?? []
    all.push(...items)
    const total = json.resultSetMetadata?.count ?? items.length
    if (all.length >= total || items.length < limit) break
    offset += limit
  }
  return all
}

// ─── Supply Contract Buildings (Obras associadas ao contrato de suprimentos) ──

export interface SiengeSupplyContractBuilding {
  supplyContractId: number
  buildingId: number
  buildingName: string
}

export async function listarBuildingsSupplyContractsSienge(
  subdominio: string,
  usuario: string,
  senha: string,
): Promise<SiengeSupplyContractBuilding[]> {
  const all: SiengeSupplyContractBuilding[] = []
  let offset = 0
  const limit = 200
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    const res = await fetch(`${BASE(subdominio)}/supply-contracts/buildings?${params}`, {
      headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    const json = (await res.json()) as { resultSetMetadata?: { count?: number }; results?: SiengeSupplyContractBuilding[] }
    const items = json.results ?? []
    all.push(...items)
    const total = json.resultSetMetadata?.count ?? items.length
    if (all.length >= total || items.length < limit) break
    offset += limit
  }
  return all
}

// ─── Supply Contract Measurements (Medições de contratos de suprimentos) ─────

export interface SiengeSupplyContractMeasurement {
  id: number
  supplyContractId: number
  measurementNumber: number
  status: string
  createdAt: string
  updatedAt: string
}

export async function listarTodasMedicoesSupplyContractsSienge(
  subdominio: string,
  usuario: string,
  senha: string,
): Promise<SiengeSupplyContractMeasurement[]> {
  const all: SiengeSupplyContractMeasurement[] = []
  let offset = 0
  const limit = 200
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    const res = await fetch(`${BASE(subdominio)}/supply-contracts/measurements/all?${params}`, {
      headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    const json = (await res.json()) as { resultSetMetadata?: { count?: number }; results?: SiengeSupplyContractMeasurement[] }
    const items = json.results ?? []
    all.push(...items)
    const total = json.resultSetMetadata?.count ?? items.length
    if (all.length >= total || items.length < limit) break
    offset += limit
  }
  return all
}

// ─── Compensação das Medições de Contratos de Suprimentos ───────────────────

export interface SiengeSupplyContractMeasurementClearing {
  supplyContractId: number
  measurementId: number
  clearingDate: string
  clearingValue: number
  retainedValue: number
  netValue: number
  status: string
}

export async function listarCompensacoesMedicoesSupplyContractsSienge(
  subdominio: string,
  usuario: string,
  senha: string,
): Promise<SiengeSupplyContractMeasurementClearing[]> {
  const all: SiengeSupplyContractMeasurementClearing[] = []
  let offset = 0
  const limit = 200
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    const res = await fetch(`${BASE(subdominio)}/supply-contracts/measurements/clearing?${params}`, {
      headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    const json = (await res.json()) as { resultSetMetadata?: { count?: number }; results?: SiengeSupplyContractMeasurementClearing[] }
    const items = json.results ?? []
    all.push(...items)
    const total = json.resultSetMetadata?.count ?? items.length
    if (all.length >= total || items.length < limit) break
    offset += limit
  }
  return all
}

// ─── Criar Medição de Contrato de Suprimento ───────────────────────────────

export interface CriarMedicaoSupplyContractInput {
  supplyContractId: number
}

export async function criarMedicaoSupplyContractSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  data: CriarMedicaoSupplyContractInput,
): Promise<{ id: number } | null> {
  const res = await fetch(`${BASE(subdominio)}/supply-contracts/${data.supplyContractId}/measurements`, {
    method: "POST",
    headers: {
      Authorization: authHeader(usuario, senha),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({}),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
  }
  const locationHeader = res.headers.get("Location")
  if (locationHeader) {
    const match = locationHeader.match(/\/(\d+)$/)
    if (match) return { id: parseInt(match[1]) }
  }
  try {
    return await res.json() as { id: number }
  } catch {
    return null
  }
}

// ─── Itens das Medições de Contratos de Suprimentos ─────────────────────────

export interface SiengeSupplyContractMeasurementItem {
  supplyContractId: number
  measurementId: number
  itemNumber: number
  resourceId: number
  resourceDescription: string
  unitOfMeasurement: string
  measuredQuantity: number
  unitPrice: number
  totalPrice: number
}

export async function listarItensMedicoesSupplyContractsSienge(
  subdominio: string,
  usuario: string,
  senha: string,
): Promise<SiengeSupplyContractMeasurementItem[]> {
  const all: SiengeSupplyContractMeasurementItem[] = []
  let offset = 0
  const limit = 200
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    const res = await fetch(`${BASE(subdominio)}/supply-contracts/measurements/items?${params}`, {
      headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    const json = (await res.json()) as { resultSetMetadata?: { count?: number }; results?: SiengeSupplyContractMeasurementItem[] }
    const items = json.results ?? []
    all.push(...items)
    const total = json.resultSetMetadata?.count ?? items.length
    if (all.length >= total || items.length < limit) break
    offset += limit
  }
  return all
}

// ─── PDF de Análise de Pedido ─────────────────────────────────────────────────

/** Retorna o PDF como ArrayBuffer para repassar ao cliente */
export async function getPdfAnalisePedidoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  pedidoId: number,
): Promise<Buffer> {
  const res = await fetch(`${BASE(subdominio)}/purchase-orders/${pedidoId}/analysis/pdf`, {
    headers: { Authorization: authHeader(usuario, senha), Accept: "application/pdf" },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return Buffer.from(await res.arrayBuffer())
}

// ─── Mapa Comparativo de Cotações PDF ────────────────────────────────────────

export async function getPdfMapaCotacaoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  cotacaoId: number,
): Promise<Buffer> {
  const res = await fetch(`${BASE(subdominio)}/purchase-quotations/${cotacaoId}/comparison-map/pdf`, {
    headers: { Authorization: authHeader(usuario, senha), Accept: "application/pdf" },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return Buffer.from(await res.arrayBuffer())
}

// ─── Dados Bancários e PIX de Fornecedores ────────────────────────────────────

export interface SiengeContaBancaria2 {
  id: number
  bankCode: string
  bankName: string
  agency: string
  account: string
  accountType?: string
  holder?: string
}

export interface SiengePixInfo {
  id: number
  keyType: string   // CPF | CNPJ | EMAIL | PHONE | RANDOM
  keyValue: string
  holder?: string
}

export async function listarContasBancariasFornecedor(
  subdominio: string,
  usuario: string,
  senha: string,
  creditorId: number,
): Promise<SiengeContaBancaria2[]> {
  const res = await fetch(`${BASE(subdominio)}/creditors/${creditorId}/bank-informations`, {
    headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  const json = await res.json() as { items?: SiengeContaBancaria2[] }
  return json.items ?? (Array.isArray(json) ? json as SiengeContaBancaria2[] : [])
}

export async function listarPixFornecedor(
  subdominio: string,
  usuario: string,
  senha: string,
  creditorId: number,
): Promise<SiengePixInfo[]> {
  const res = await fetch(`${BASE(subdominio)}/creditors/${creditorId}/pix-informations`, {
    headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  const json = await res.json() as { items?: SiengePixInfo[] }
  return json.items ?? (Array.isArray(json) ? json as SiengePixInfo[] : [])
}

// ─── Inserir / Atualizar Dados Bancários e PIX de Fornecedores ────────────────

export interface SiengeContaBancariaInput {
  bankCode: string
  agency: string
  account: string
  accountType?: string
  holder?: string
}

export async function inserirContaBancariaFornecedor(
  subdominio: string,
  usuario: string,
  senha: string,
  creditorId: number,
  data: SiengeContaBancariaInput,
): Promise<{ id: number } | null> {
  try {
    const res = await fetch(`${BASE(subdominio)}/creditors/${creditorId}/bank-informations`, {
      method: "POST",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    return await res.json() as { id: number }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return null
  }
}

export async function atualizarContaBancariaFornecedor(
  subdominio: string,
  usuario: string,
  senha: string,
  creditorId: number,
  bankInformationId: number,
  data: Partial<SiengeContaBancariaInput>,
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE(subdominio)}/creditors/${creditorId}/bank-informations/${bankInformationId}`, {
      method: "PATCH",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    return true
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return false
  }
}

// ─── Inserir / Atualizar PIX de Fornecedores ─────────────────────────────────

export interface SiengePixInput {
  keyType: string
  keyValue: string
  holder?: string
}

export async function inserirPixFornecedor(
  subdominio: string,
  usuario: string,
  senha: string,
  creditorId: number,
  data: SiengePixInput,
): Promise<{ id: number } | null> {
  try {
    const res = await fetch(`${BASE(subdominio)}/creditors/${creditorId}/pix-informations`, {
      method: "POST",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    return await res.json() as { id: number }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return null
  }
}

export async function atualizarPixFornecedor(
  subdominio: string,
  usuario: string,
  senha: string,
  creditorId: number,
  pixId: number,
  data: Partial<SiengePixInput>,
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE(subdominio)}/creditors/${creditorId}/pix-informations/${pixId}`, {
      method: "PATCH",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    return true
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return false
  }
}

// ─── Atualizar Telefone de Fornecedor ─────────────────────────────────────────

export interface SiengePhoneInput {
  ddd?: string
  number?: string
  type?: string // COMMERCIAL | RESIDENTIAL | MOBILE | FAX
}

export async function atualizarTelefoneCredor(
  subdominio: string,
  usuario: string,
  senha: string,
  creditorId: number,
  phoneId: number,
  data: Partial<SiengePhoneInput>,
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE(subdominio)}/creditors/${creditorId}/phone/${phoneId}`, {
      method: "PATCH",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    return true
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return false
  }
}

// ─── Contato do Credor ───────────────────────────────────────────────────────

export interface SiengeContactInput {
  name?: string
  email?: string
  phone?: string
  department?: string
  position?: string
}

export async function atualizarContatoCredor(
  subdominio: string,
  usuario: string,
  senha: string,
  creditorId: number,
  contactId: number,
  data: Partial<SiengeContactInput>,
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE(subdominio)}/creditors/${creditorId}/contact/${contactId}`, {
      method: "PATCH",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    return true
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return false
  }
}

// ─── Procurador do Credor ────────────────────────────────────────────────────

export interface SiengeProcuratorInput {
  name?: string
  cpf?: string
  rg?: string
  rgEmitter?: string
  rgState?: string
  nationality?: string
  civilStatus?: string
  profession?: string
  email?: string
  phone?: string
}

export async function atualizarProcuradorCredor(
  subdominio: string,
  usuario: string,
  senha: string,
  creditorId: number,
  procuratorId: number,
  data: Partial<SiengeProcuratorInput>,
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE(subdominio)}/creditors/${creditorId}/procurator/${procuratorId}`, {
      method: "PATCH",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    return true
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return false
  }
}

// ─── Representantes do Credor ─────────────────────────────────────────────────

export interface SiengeAgentInput {
  name: string
  cpf?: string
  email?: string
  phone?: string
}

export async function atualizarRepresentantesCredor(
  subdominio: string,
  usuario: string,
  senha: string,
  creditorId: number,
  agents: SiengeAgentInput[],
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE(subdominio)}/creditors/${creditorId}/agents`, {
      method: "PUT",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(agents),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    return true
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return false
  }
}

// ─── Desoneração de Folha ─────────────────────────────────────────────────────

export interface SiengePayslipDesonerationYearsInput {
  years: number[]
}

export async function atualizarDesoneracaoFolhaCredor(
  subdominio: string,
  usuario: string,
  senha: string,
  creditorId: number,
  data: SiengePayslipDesonerationYearsInput,
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE(subdominio)}/creditors/${creditorId}/payslip-desoneration-years`, {
      method: "PUT",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    return true
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return false
  }
}

// ─── Avaliação de Fornecedores ────────────────────────────────────────────────

export interface SiengeAvaliacaoCriterio {
  id: number
  nome: string
  descricao?: string
  peso: number
}

export interface SiengeAvaliacaoInput {
  criterios: { criterioId: number; nota: number }[]
  observacao?: string
}

export async function listarCriteriosAvaliacaoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  pedidoId: number,
): Promise<SiengeAvaliacaoCriterio[]> {
  const res = await fetch(`${BASE(subdominio)}/purchase-orders/${pedidoId}/supplier-evaluation-criteria`, {
    headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
  })
  if (!res.ok) return [] // retorna vazio se endpoint não disponível
  const json = await res.json() as { items?: SiengeAvaliacaoCriterio[] }
  return json.items ?? (Array.isArray(json) ? json as SiengeAvaliacaoCriterio[] : [])
}

export async function salvarAvaliacaoFornecedor(
  subdominio: string,
  usuario: string,
  senha: string,
  pedidoId: number,
  input: SiengeAvaliacaoInput,
): Promise<void> {
  const res = await fetch(`${BASE(subdominio)}/purchase-orders/${pedidoId}/evaluation`, {
    method: "POST",
    headers: {
      Authorization: authHeader(usuario, senha),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
}

// ─── Comercial — Mapa Imobiliário ─────────────────────────────────────────────

export interface UnidadeSienge {
  id: number
  number?: string
  name?: string
  status?: string
  type?: string
  floor?: string | number
  area?: number
  price?: number
  buildingName?: string
}

export async function listarUnidadesSienge(
  subdominio: string,
  usuario: string,
  senha: string,
): Promise<UnidadeSienge[]> {
  try {
    const res = await fetch(`${BASE(subdominio)}/units`, {
      headers: {
        Authorization: authHeader(usuario, senha),
        Accept: "application/json",
      },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (Array.isArray(data) ? data : (data?.results ?? [])) as UnidadeSienge[]
  } catch {
    return []
  }
}

export async function uploadAnexoUnidadeSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  unitId: number,
  fileBuffer: Buffer,
  fileName: string,
  description?: string,
): Promise<{ id: number } | null> {
  try {
    const blob = new Blob([new Uint8Array(fileBuffer)])
    const formData = new FormData()
    formData.append("file", blob, fileName)
    if (description) formData.append("description", description)

    const res = await fetch(`${BASE(subdominio)}/units/${unitId}/attachments`, {
      method: "POST",
      headers: {
        Authorization: authHeader(usuario, senha),
        Accept: "application/json",
      },
      body: formData,
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
    }
    const location = res.headers.get("Location")
    if (location) {
      const match = location.match(/\/(\d+)$/)
      if (match) return { id: parseInt(match[1]) }
    }
    try {
      const json = await res.json() as Record<string, unknown>
      if (json.id) return { id: Number(json.id) }
    } catch { /* response may be empty on 201 */ }
    return { id: 0 }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return null
  }
}

// ─── Units — CRUD, endereço, filhos, agrupamentos, características, situações

export interface CriarUnidadeInput {
  enterpriseId: number
  name: string
  number?: string
  type?: string
  floor?: string | number
  area?: number
  price?: number
}

export async function criarUnidadeSienge(
  subdominio: string, usuario: string, senha: string,
  data: CriarUnidadeInput,
): Promise<{ id: number } | null> {
  try {
    const res = await fetch(`${BASE(subdominio)}/units`, {
      method: "POST",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    const location = res.headers.get("Location")
    if (location) {
      const match = location.match(/\/(\d+)$/)
      if (match) return { id: parseInt(match[1]) }
    }
    try {
      const json = await res.json() as Record<string, unknown>
      if (json.id) return { id: Number(json.id) }
    } catch { /* 201 sem body */ }
    return { id: 0 }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return null
  }
}

export async function buscarUnidadeSienge(
  subdominio: string, usuario: string, senha: string,
  unitId: number,
): Promise<UnidadeSienge | null> {
  try {
    const data = await siengeGet(subdominio, usuario, senha, `/units/${unitId}`)
    return data as UnidadeSienge
  } catch {
    return null
  }
}

export interface AtualizarUnidadeInput {
  name?: string
  number?: string
  type?: string
  floor?: string | number
  area?: number
  price?: number
  status?: string
}

export async function atualizarUnidadeSienge(
  subdominio: string, usuario: string, senha: string,
  unitId: number,
  data: AtualizarUnidadeInput,
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE(subdominio)}/units/${unitId}`, {
      method: "PATCH",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    return true
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return false
  }
}

export interface ChildUnitInput {
  name: string
  number?: string
  type?: string
  floor?: string | number
  area?: number
  price?: number
}

export async function adicionarUnidadeFilhaSienge(
  subdominio: string, usuario: string, senha: string,
  unitId: number,
  data: ChildUnitInput,
): Promise<{ id: number } | null> {
  try {
    const res = await fetch(`${BASE(subdominio)}/units/${unitId}/child-unit`, {
      method: "POST",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    const location = res.headers.get("Location")
    if (location) {
      const match = location.match(/\/(\d+)$/)
      if (match) return { id: parseInt(match[1]) }
    }
    try {
      const json = await res.json() as Record<string, unknown>
      if (json.id) return { id: Number(json.id) }
    } catch { /* 201 sem body */ }
    return { id: 0 }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return null
  }
}

export interface EnderecoUnidadeInput {
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  zipCode?: string
}

export async function atualizarEnderecoUnidadeSienge(
  subdominio: string, usuario: string, senha: string,
  unitId: number,
  data: EnderecoUnidadeInput,
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE(subdominio)}/units/${unitId}/address`, {
      method: "PUT",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    return true
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return false
  }
}

// ─── Units — Agrupamentos, Características, Situações ────────────────────────

export interface SiengeUnitGrouping {
  id: number
  name?: string
  type?: string
  description?: string
}

export async function buscarAgrupamentosUnidadeSienge(
  subdominio: string, usuario: string, senha: string,
  unitId: number,
): Promise<SiengeUnitGrouping[]> {
  try {
    const data = await siengeGet(subdominio, usuario, senha, `/units/${unitId}/groupings`)
    return normalizeList(data) as SiengeUnitGrouping[]
  } catch { return [] }
}

export interface SiengeUnitCharacteristic {
  id: number
  name?: string
  description?: string
  type?: string
}

export async function listarCaracteristicasUnidadeSienge(
  subdominio: string, usuario: string, senha: string,
): Promise<SiengeUnitCharacteristic[]> {
  try {
    const data = await siengeGet(subdominio, usuario, senha, "/units/characteristics")
    return normalizeList(data) as SiengeUnitCharacteristic[]
  } catch { return [] }
}

export interface CriarCaracteristicaUnidadeInput {
  name: string
  description?: string
  type?: string
}

export async function criarCaracteristicaUnidadeSienge(
  subdominio: string, usuario: string, senha: string,
  data: CriarCaracteristicaUnidadeInput,
): Promise<{ id: number } | null> {
  try {
    const res = await fetch(`${BASE(subdominio)}/units/characteristics`, {
      method: "POST",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    const loc = res.headers.get("Location") ?? ""
    const idMatch = loc.match(/\/(\d+)$/)
    if (idMatch) return { id: Number(idMatch[1]) }
    try {
      const json = await res.json() as Record<string, unknown>
      if (json.id) return { id: Number(json.id) }
    } catch { /* empty */ }
    return { id: 0 }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return null
  }
}

export interface VincularCaracteristicasInput {
  characteristicIds: number[]
}

export async function vincularCaracteristicasUnidadeSienge(
  subdominio: string, usuario: string, senha: string,
  unitId: number,
  data: VincularCaracteristicasInput,
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE(subdominio)}/units/${unitId}/characteristics`, {
      method: "PUT",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    return true
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return false
  }
}

export interface SiengeUnitSituation {
  id: number
  name?: string
  description?: string
}

export async function listarSituacoesUnidadeSienge(
  subdominio: string, usuario: string, senha: string,
): Promise<SiengeUnitSituation[]> {
  try {
    const data = await siengeGet(subdominio, usuario, senha, "/units/situations")
    return normalizeList(data) as SiengeUnitSituation[]
  } catch { return [] }
}

export interface CriarSituacaoUnidadeInput {
  name: string
  description?: string
}

export async function criarSituacaoUnidadeSienge(
  subdominio: string, usuario: string, senha: string,
  data: CriarSituacaoUnidadeInput,
): Promise<{ id: number } | null> {
  try {
    const res = await fetch(`${BASE(subdominio)}/units/situations`, {
      method: "POST",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    const location = res.headers.get("Location")
    if (location) {
      const match = location.match(/\/(\d+)$/)
      if (match) return { id: parseInt(match[1]) }
    }
    try {
      const json = await res.json() as Record<string, unknown>
      if (json.id) return { id: Number(json.id) }
    } catch { /* 201 sem body */ }
    return { id: 0 }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return null
  }
}

// ─── Bills — Consulta / Atualização ──────────────────────────────────────────

export interface SiengeBill {
  id: number
  documentNumber?: string
  creditorId?: number
  creditorName?: string
  companyId?: number
  buildingId?: number
  dueDate?: string
  issueDate?: string
  amount?: number
  balance?: number
  status?: string
  description?: string
  type?: string
  changeDate?: string
}

export async function listarBillsByChangeDateSienge(
  subdominio: string, usuario: string, senha: string,
  params: { startDate: string; endDate: string; offset?: number; limit?: number },
): Promise<SiengeBill[]> {
  try {
    const qs = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
      offset: String(params.offset ?? 0),
      limit: String(params.limit ?? 100),
    })
    const data = await siengeGet(subdominio, usuario, senha, `/bills/by-change-date?${qs}`)
    return normalizeList(data) as SiengeBill[]
  } catch { return [] }
}

export async function buscarBillSienge(
  subdominio: string, usuario: string, senha: string,
  billId: number,
): Promise<SiengeBill | null> {
  try {
    const data = await siengeGet(subdominio, usuario, senha, `/bills/${billId}`)
    return data as SiengeBill
  } catch { return null }
}

export interface AtualizarBillInput {
  documentNumber?: string
  dueDate?: string
  amount?: number
  description?: string
  creditorId?: number
  buildingId?: number
  companyId?: number
}

export async function atualizarBillSienge(
  subdominio: string, usuario: string, senha: string,
  billId: number,
  data: AtualizarBillInput,
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE(subdominio)}/bills/${billId}`, {
      method: "PATCH",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    return true
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return false
  }
}

export interface CriarBillFromNFeInput {
  accessKey: string
  companyId?: number
  buildingId?: number
  creditorId?: number
}

export async function criarBillFromNFeSienge(
  subdominio: string, usuario: string, senha: string,
  data: CriarBillFromNFeInput,
): Promise<{ id: number } | null> {
  try {
    const res = await fetch(`${BASE(subdominio)}/eletronic-invoice-bills`, {
      method: "POST",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    const location = res.headers.get("Location")
    if (location) {
      const match = location.match(/\/(\d+)$/)
      if (match) return { id: parseInt(match[1]) }
    }
    try {
      const json = await res.json() as Record<string, unknown>
      if (json.id) return { id: Number(json.id) }
    } catch { /* 201 sem body */ }
    return { id: 0 }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return null
  }
}

// ─── Bills — Parcelas, Impostos, Apropriações ────────────────────────────────

export interface SiengeBillInstallment {
  id: number
  installmentNumber?: number
  dueDate?: string
  amount?: number
  balance?: number
  status?: string
  [key: string]: unknown
}

export async function listarParcelasBillSienge(
  subdominio: string, usuario: string, senha: string,
  billId: number,
): Promise<SiengeBillInstallment[]> {
  try {
    const data = await siengeGet(subdominio, usuario, senha, `/bills/${billId}/installments`)
    return normalizeList(data) as SiengeBillInstallment[]
  } catch { return [] }
}

export interface AtualizarParcelaBillInput {
  dueDate?: string
  amount?: number
  [key: string]: unknown
}

export async function atualizarParcelaBillSienge(
  subdominio: string, usuario: string, senha: string,
  billId: number, installmentId: number,
  data: AtualizarParcelaBillInput,
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE(subdominio)}/bills/${billId}/installments/${installmentId}`, {
      method: "PATCH",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    return true
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return false
  }
}

export interface SiengeBillTax {
  id?: number
  taxType?: string
  rate?: number
  amount?: number
  [key: string]: unknown
}

export async function listarImpostosBillSienge(
  subdominio: string, usuario: string, senha: string,
  billId: number,
): Promise<SiengeBillTax[]> {
  try {
    const data = await siengeGet(subdominio, usuario, senha, `/bills/${billId}/taxes`)
    return normalizeList(data) as SiengeBillTax[]
  } catch { return [] }
}

export interface SiengeBillBudgetCategory {
  id?: number
  budgetCategoryId?: number
  description?: string
  amount?: number
  percentage?: number
  [key: string]: unknown
}

export async function listarBudgetCategoriesBillSienge(
  subdominio: string, usuario: string, senha: string,
  billId: number,
): Promise<SiengeBillBudgetCategory[]> {
  try {
    const data = await siengeGet(subdominio, usuario, senha, `/bills/${billId}/budget-categories`)
    return normalizeList(data) as SiengeBillBudgetCategory[]
  } catch { return [] }
}

export interface SiengeBillDepartmentCost {
  id?: number
  departmentId?: number
  departmentName?: string
  amount?: number
  percentage?: number
  [key: string]: unknown
}

export async function listarDepartmentsCostBillSienge(
  subdominio: string, usuario: string, senha: string,
  billId: number,
): Promise<SiengeBillDepartmentCost[]> {
  try {
    const data = await siengeGet(subdominio, usuario, senha, `/bills/${billId}/departments-cost`)
    return normalizeList(data) as SiengeBillDepartmentCost[]
  } catch { return [] }
}

// ─── Bills — Apropriações por Obra ──────────────────────────────────────────

export interface SiengeBillBuildingCost {
  buildingId: number
  buildingName?: string
  percentage?: number
  value?: number
}

export async function listarBuildingsCostBillSienge(
  subdominio: string, usuario: string, senha: string,
  billId: number,
): Promise<SiengeBillBuildingCost[]> {
  try {
    const data = await siengeGet(subdominio, usuario, senha, `/bills/${billId}/buildings-cost`)
    return normalizeList(data) as SiengeBillBuildingCost[]
  } catch { return [] }
}

export interface AtualizarBuildingsCostBillInput {
  buildingId: number
  percentage?: number
  value?: number
}

export async function atualizarBuildingsCostBillSienge(
  subdominio: string, usuario: string, senha: string,
  billId: number,
  data: AtualizarBuildingsCostBillInput[],
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE(subdominio)}/bills/${billId}/buildings-cost`, {
      method: "PUT",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    return true
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return false
  }
}

// ─── Bills — Unidades do Título ─────────────────────────────────────────────

export interface SiengeBillUnit {
  unitId: number
  unitName?: string
  buildingId?: number
  buildingName?: string
  percentage?: number
  value?: number
}

export async function listarUnitsBillSienge(
  subdominio: string, usuario: string, senha: string,
  billId: number,
): Promise<SiengeBillUnit[]> {
  try {
    const data = await siengeGet(subdominio, usuario, senha, `/bills/${billId}/units`)
    return normalizeList(data) as SiengeBillUnit[]
  } catch { return [] }
}

export interface AtualizarUnitsBillInput {
  unitId: number
  percentage?: number
  value?: number
}

export async function atualizarUnitsBillSienge(
  subdominio: string, usuario: string, senha: string,
  billId: number,
  data: AtualizarUnitsBillInput[],
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE(subdominio)}/bills/${billId}/units`, {
      method: "PUT",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    return true
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return false
  }
}

// ─── Bills — Informação Fiscal (Tax Information) ────────────────────────────

export interface CriarTaxInformationBillInput {
  serviceCodeId?: number
  cnaeId?: number
  municipalityId?: number
  description?: string
  issRetention?: boolean
  issAliquot?: number
}

export async function criarTaxInformationBillSienge(
  subdominio: string, usuario: string, senha: string,
  billId: number,
  data: CriarTaxInformationBillInput,
): Promise<{ id: number } | null> {
  try {
    const res = await fetch(`${BASE(subdominio)}/bills/${billId}/tax-information`, {
      method: "POST",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    const locationHeader = res.headers.get("Location")
    if (locationHeader) {
      const match = locationHeader.match(/\/(\d+)$/)
      if (match) return { id: parseInt(match[1]) }
    }
    try { return await res.json() as { id: number } } catch { return null }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return null
  }
}

// ─── Comercial — Contratos de Venda ───────────────────────────────────────────

export interface ContratoVendaSienge {
  id: number
  clientName?: string
  unitName?: string
  buildingName?: string
  status?: string
  totalValue?: number
  signatureDate?: string
  cancelDate?: string
}

export async function listarContratosVendaSienge(
  subdominio: string, usuario: string, senha: string,
): Promise<ContratoVendaSienge[]> {
  try {
    const res = await fetch(`${BASE(subdominio)}/sales-contracts`, {
      headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (Array.isArray(data) ? data : (data?.results ?? [])) as ContratoVendaSienge[]
  } catch { return [] }
}

export interface CriarContratoVendaInput {
  enterpriseId: number
  unitId: number
  customerId: number
  signatureDate?: string
  totalValue?: number
  installmentsCount?: number
  firstInstallmentDate?: string
  observations?: string
}

export async function criarContratoVendaSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  data: CriarContratoVendaInput,
): Promise<{ id: number } | null> {
  try {
    const res = await fetch(`${BASE(subdominio)}/sales-contracts`, {
      method: "POST",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
    }
    const locationHeader = res.headers.get("Location")
    if (locationHeader) {
      const match = locationHeader.match(/\/(\d+)$/)
      if (match) return { id: parseInt(match[1]) }
    }
    try {
      return await res.json() as { id: number }
    } catch {
      return null
    }
  } catch (err) {
    throw err
  }
}

export interface ContratoVendaDetalheSienge {
  id: number
  enterpriseId?: number
  unitId?: number
  customerId?: number
  clientName?: string
  unitName?: string
  buildingName?: string
  enterpriseName?: string
  status?: string
  totalValue?: number
  signatureDate?: string
  cancelDate?: string
  installmentsCount?: number
  firstInstallmentDate?: string
  observations?: string
}

export interface AtualizarContratoVendaInput {
  enterpriseId?: number
  unitId?: number
  customerId?: number
  signatureDate?: string
  totalValue?: number
  installmentsCount?: number
  firstInstallmentDate?: string
  observations?: string
}

export async function atualizarContratoVendaSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  id: number,
  data: AtualizarContratoVendaInput,
): Promise<void> {
  const res = await fetch(`${BASE(subdominio)}/sales-contracts/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: authHeader(usuario, senha),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
  }
}

export async function excluirContratoVendaSienge(
  subdominio: string, usuario: string, senha: string, id: number,
): Promise<void> {
  const res = await fetch(`${BASE(subdominio)}/sales-contracts/${id}`, {
    method: "DELETE",
    headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
  }
}

export async function cancelarContratoVendaSienge(
  subdominio: string, usuario: string, senha: string, id: number,
): Promise<void> {
  const res = await fetch(`${BASE(subdominio)}/sales-contracts/${id}/cancellation`, {
    method: "POST",
    headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
  }
}

export async function buscarContratoVendaSienge(
  subdominio: string, usuario: string, senha: string, id: number,
): Promise<ContratoVendaDetalheSienge | null> {
  try {
    const res = await fetch(`${BASE(subdominio)}/sales-contracts/${id}`, {
      headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
    })
    if (!res.ok) return null
    return (await res.json()) as ContratoVendaDetalheSienge
  } catch { return null }
}

// ── Anexos de Contrato de Venda (Sales Contract Attachments) ─────────────────

export interface SiengeContratoVendaAnexo {
  id: number
  fileName?: string
  description?: string
  createdAt?: string
  [key: string]: unknown
}

export async function listarAnexosContratoVendaSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  contratoId: number,
): Promise<SiengeContratoVendaAnexo[]> {
  try {
    const data = await siengeGet(subdominio, usuario, senha, `/sales-contracts/${contratoId}/attachments`)
    return normalizeList(data) as SiengeContratoVendaAnexo[]
  } catch { return [] }
}

export async function uploadAnexoContratoVendaSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  contratoId: number,
  fileBuffer: Buffer,
  fileName: string,
  description?: string,
): Promise<{ id: number } | null> {
  try {
    const blob = new Blob([new Uint8Array(fileBuffer)])
    const formData = new FormData()
    formData.append("file", blob, fileName)
    if (description) formData.append("description", description)

    const res = await fetch(`${BASE(subdominio)}/sales-contracts/${contratoId}/attachments`, {
      method: "POST",
      headers: {
        Authorization: authHeader(usuario, senha),
        Accept: "application/json",
      },
      body: formData,
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
    }
    const location = res.headers.get("Location")
    if (location) {
      const match = location.match(/\/(\d+)$/)
      if (match) return { id: parseInt(match[1]) }
    }
    try {
      const json = await res.json() as Record<string, unknown>
      if (json.id) return { id: Number(json.id) }
    } catch { /* response may be empty on 201 */ }
    return { id: 0 }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return null
  }
}

export async function downloadAnexoContratoVendaSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  contratoId: number,
  anexoId: number,
): Promise<{ data: Buffer; contentType: string; fileName?: string } | null> {
  try {
    const res = await fetch(`${BASE(subdominio)}/sales-contracts/${contratoId}/attachments/${anexoId}`, {
      headers: {
        Authorization: authHeader(usuario, senha),
      },
      cache: "no-store",
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    const contentType = res.headers.get("Content-Type") ?? "application/octet-stream"
    const disposition = res.headers.get("Content-Disposition")
    let fileName: string | undefined
    if (disposition) {
      const match = disposition.match(/filename[^;=\n]*=["']?([^"';\n]+)/)
      if (match) fileName = match[1]
    }
    const arrayBuffer = await res.arrayBuffer()
    return { data: Buffer.from(arrayBuffer), contentType, fileName }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return null
  }
}

// ── Avalistas de Contrato de Venda (Sales Contract Guarantors) ───────────────

export interface SiengeContratoVendaAvalista {
  id: number
  customerId?: number
  name?: string
  cpf?: string
  email?: string
  [key: string]: unknown
}

export interface AdicionarAvalistaInput {
  customerId: number
  [key: string]: unknown
}

export interface AtualizarAvalistaInput {
  customerId?: number
  [key: string]: unknown
}

export interface AvalistaTelefoneInput {
  phones: Array<{
    countryCode?: string
    areaCode?: string
    number: string
    type?: string
  }>
}

export async function listarAvalistasContratoVendaSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  contratoId: number,
): Promise<SiengeContratoVendaAvalista[]> {
  try {
    const data = await siengeGet(subdominio, usuario, senha, `/sales-contracts/${contratoId}/guarantors`)
    return normalizeList(data) as SiengeContratoVendaAvalista[]
  } catch { return [] }
}

export async function adicionarAvalistaContratoVendaSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  contratoId: number,
  data: AdicionarAvalistaInput,
): Promise<{ id: number } | null> {
  try {
    const res = await fetch(`${BASE(subdominio)}/sales-contracts/${contratoId}/guarantors`, {
      method: "POST",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
    }
    const location = res.headers.get("Location")
    if (location) {
      const match = location.match(/(\d+)$/)
      if (match) return { id: Number(match[1]) }
    }
    const json = await res.json().catch(() => null)
    return json as { id: number } | null
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return null
  }
}

export async function buscarAvalistaContratoVendaSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  contratoId: number,
  avalistaId: number,
): Promise<SiengeContratoVendaAvalista | null> {
  try {
    const data = await siengeGet(subdominio, usuario, senha, `/sales-contracts/${contratoId}/guarantors/${avalistaId}`)
    return data as SiengeContratoVendaAvalista
  } catch { return null }
}

export async function atualizarAvalistaContratoVendaSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  contratoId: number,
  avalistaId: number,
  data: AtualizarAvalistaInput,
): Promise<void> {
  const res = await fetch(`${BASE(subdominio)}/sales-contracts/${contratoId}/guarantors/${avalistaId}`, {
    method: "PATCH",
    headers: {
      Authorization: authHeader(usuario, senha),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
  }
}

export async function atualizarTelefonesAvalistaContratoVendaSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  contratoId: number,
  avalistaId: number,
  data: AvalistaTelefoneInput,
): Promise<void> {
  const res = await fetch(`${BASE(subdominio)}/sales-contracts/${contratoId}/guarantors/${avalistaId}/phones`, {
    method: "PUT",
    headers: {
      Authorization: authHeader(usuario, senha),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
  }
}

// ─── Comercial — Locação de Imóveis ───────────────────────────────────────────

export interface LocacaoSienge {
  id: number
  propertyName?: string
  tenantName?: string
  monthlyRent?: number
  startDate?: string
  endDate?: string
  status?: string
}

export async function listarLocacoesSienge(
  subdominio: string, usuario: string, senha: string,
): Promise<LocacaoSienge[]> {
  try {
    const res = await fetch(`${BASE(subdominio)}/property-rentals`, {
      headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (Array.isArray(data) ? data : (data?.results ?? [])) as LocacaoSienge[]
  } catch { return [] }
}

// ─── Comercial — Comissões ────────────────────────────────────────────────────

export interface ComissaoSienge {
  id: number
  sellerName?: string
  buildingName?: string
  unitName?: string
  value?: number
  status?: string
  paymentDate?: string
  contractDate?: string
}

export async function listarComissoesSienge(
  subdominio: string, usuario: string, senha: string,
): Promise<ComissaoSienge[]> {
  try {
    const res = await fetch(`${BASE(subdominio)}/commissions`, {
      headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (Array.isArray(data) ? data : (data?.results ?? [])) as ComissaoSienge[]
  } catch { return [] }
}

export interface CriarComissaoInput {
  salesContractId: number
  installmentNumber: number
  brokerId: number
  commissionValue: number
  dueDate: string
  observations?: string
}

export async function criarComissaoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  data: CriarComissaoInput,
): Promise<{ id: number } | null> {
  try {
    const res = await fetch(`${BASE(subdominio)}/commissions`, {
      method: "POST",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
    }
    const locationHeader = res.headers.get("Location")
    if (locationHeader) {
      const match = locationHeader.match(/\/(\d+)$/)
      if (match) return { id: parseInt(match[1]) }
    }
    try {
      return await res.json() as { id: number }
    } catch {
      return null
    }
  } catch (err) {
    throw err
  }
}

export async function buscarComissaoSienge(
  subdominio: string, usuario: string, senha: string, id: number,
): Promise<ComissaoSienge | null> {
  try {
    const res = await fetch(`${BASE(subdominio)}/commissions/${id}`, {
      headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
    })
    if (!res.ok) return null
    return await res.json() as ComissaoSienge
  } catch { return null }
}

export async function atualizarComissaoSienge(
  subdominio: string, usuario: string, senha: string, id: number,
  data: Partial<Omit<CriarComissaoInput, "salesContractId">>,
): Promise<void> {
  const res = await fetch(`${BASE(subdominio)}/commissions/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: authHeader(usuario, senha),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
  }
}

export async function excluirComissaoSienge(
  subdominio: string, usuario: string, senha: string, id: number,
): Promise<void> {
  const res = await fetch(`${BASE(subdominio)}/commissions/${id}`, {
    method: "DELETE",
    headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
  }
}

export async function autorizarComissoesSienge(
  subdominio: string, usuario: string, senha: string,
  ids: number[],
): Promise<void> {
  const res = await fetch(`${BASE(subdominio)}/commissions/authorize`, {
    method: "PATCH",
    headers: {
      Authorization: authHeader(usuario, senha),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ ids }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
  }
}

export async function cancelarComissoesSienge(
  subdominio: string, usuario: string, senha: string,
  ids: number[],
): Promise<void> {
  const res = await fetch(`${BASE(subdominio)}/commissions/cancel`, {
    method: "PATCH",
    headers: {
      Authorization: authHeader(usuario, senha),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ ids }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
  }
}

export async function liberarComissoesSienge(
  subdominio: string, usuario: string, senha: string,
  ids: number[],
): Promise<void> {
  const res = await fetch(`${BASE(subdominio)}/commissions/release`, {
    method: "POST",
    headers: {
      Authorization: authHeader(usuario, senha),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ ids }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
  }
}

export interface ComissaoCountFilters {
  status: string
  count: number
}

export async function comissoesCountFiltersSienge(
  subdominio: string, usuario: string, senha: string,
): Promise<ComissaoCountFilters[]> {
  try {
    const res = await fetch(`${BASE(subdominio)}/commissions/countFilters`, {
      headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (Array.isArray(data) ? data : (data?.results ?? [])) as ComissaoCountFilters[]
  } catch { return [] }
}

export interface ComissaoCorretorInput {
  brokerId: number
  commissionPercentage?: number
}

export async function adicionarCorretorComissaoSienge(
  subdominio: string, usuario: string, senha: string,
  comissaoId: number, data: ComissaoCorretorInput,
): Promise<void> {
  const res = await fetch(`${BASE(subdominio)}/commissions/${comissaoId}/brokers`, {
    method: "POST",
    headers: {
      Authorization: authHeader(usuario, senha),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
  }
}

export async function removerCorretorComissaoSienge(
  subdominio: string, usuario: string, senha: string,
  comissaoId: number, corretorId: number,
): Promise<void> {
  const res = await fetch(`${BASE(subdominio)}/commissions/${comissaoId}/brokers/${corretorId}`, {
    method: "DELETE",
    headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
  }
}

export interface ConfigCorretorComissao {
  id: number
  brokerId?: number
  brokerName?: string
  commissionPercentage?: number
}

export async function listarConfigCorretoresComissaoSienge(
  subdominio: string, usuario: string, senha: string,
): Promise<ConfigCorretorComissao[]> {
  try {
    const res = await fetch(`${BASE(subdominio)}/commissions/configurations/brokers`, {
      headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (Array.isArray(data) ? data : (data?.results ?? [])) as ConfigCorretorComissao[]
  } catch { return [] }
}

export interface CriarConfigCorretorInput {
  brokerId: number
  commissionPercentage: number
}

export async function criarConfigCorretorComissaoSienge(
  subdominio: string, usuario: string, senha: string,
  data: CriarConfigCorretorInput,
): Promise<{ id: number } | null> {
  try {
    const res = await fetch(`${BASE(subdominio)}/commissions/configurations/brokers`, {
      method: "POST",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
    }
    const locationHeader = res.headers.get("Location")
    if (locationHeader) {
      const match = locationHeader.match(/\/(\d+)$/)
      if (match) return { id: parseInt(match[1]) }
    }
    try {
      return await res.json() as { id: number }
    } catch {
      return null
    }
  } catch (err) {
    throw err
  }
}

export async function atualizarConfigCorretorComissaoSienge(
  subdominio: string, usuario: string, senha: string,
  id: number, data: Partial<CriarConfigCorretorInput>,
): Promise<void> {
  const res = await fetch(`${BASE(subdominio)}/commissions/configurations/brokers/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: authHeader(usuario, senha),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
  }
}

export async function excluirConfigCorretorComissaoSienge(
  subdominio: string, usuario: string, senha: string, id: number,
): Promise<void> {
  const res = await fetch(`${BASE(subdominio)}/commissions/configurations/brokers/${id}`, {
    method: "DELETE",
    headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
  }
}

export interface ConfigEmpreendimentoComissao {
  id: number
  enterpriseId?: number
  enterpriseName?: string
  commissionPercentage?: number
}

export async function buscarConfigEmpreendimentoComissaoSienge(
  subdominio: string, usuario: string, senha: string, enterpriseId: number,
): Promise<ConfigEmpreendimentoComissao | null> {
  try {
    const res = await fetch(`${BASE(subdominio)}/commissions/configurations/enterprises/${enterpriseId}`, {
      headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
    })
    if (!res.ok) return null
    return await res.json() as ConfigEmpreendimentoComissao
  } catch { return null }
}

export interface CriarConfigEmpreendimentoInput {
  enterpriseId: number
  commissionPercentage: number
}

export async function criarConfigEmpreendimentoComissaoSienge(
  subdominio: string, usuario: string, senha: string,
  data: CriarConfigEmpreendimentoInput,
): Promise<{ id: number } | null> {
  try {
    const res = await fetch(`${BASE(subdominio)}/commissions/configurations/enterprises`, {
      method: "POST",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
    }
    const locationHeader = res.headers.get("Location")
    if (locationHeader) {
      const match = locationHeader.match(/\/(\d+)$/)
      if (match) return { id: parseInt(match[1]) }
    }
    try {
      return await res.json() as { id: number }
    } catch {
      return null
    }
  } catch (err) {
    throw err
  }
}

export async function atualizarConfigEmpreendimentoComissaoSienge(
  subdominio: string, usuario: string, senha: string,
  id: number, data: Partial<CriarConfigEmpreendimentoInput>,
): Promise<void> {
  const res = await fetch(`${BASE(subdominio)}/commissions/configurations/enterprises/${id}`, {
    method: "PUT",
    headers: {
      Authorization: authHeader(usuario, senha),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
  }
}

// ─── Patrimônio — Bens Imóveis e Móveis ──────────────────────────────────────

export interface BemImovelSienge {
  id: number
  name?: string
  type?: string
  bookValue?: number
  location?: string
  acquisitionDate?: string
}

export interface BemMovelSienge {
  id: number
  name?: string
  type?: string
  plate?: string
  serialNumber?: string
  bookValue?: number
  status?: string
  acquisitionDate?: string
}

export async function listarBensImoveisSienge(
  subdominio: string, usuario: string, senha: string,
): Promise<BemImovelSienge[]> {
  try {
    const res = await fetch(`${BASE(subdominio)}/fixed-assets`, {
      headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (Array.isArray(data) ? data : (data?.results ?? [])) as BemImovelSienge[]
  } catch { return [] }
}

export async function listarBensMoveisSienge(
  subdominio: string, usuario: string, senha: string,
): Promise<BemMovelSienge[]> {
  try {
    const res = await fetch(`${BASE(subdominio)}/movable-assets`, {
      headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (Array.isArray(data) ? data : (data?.results ?? [])) as BemMovelSienge[]
  } catch { return [] }
}

// ─── Financeiro — Balancete ───────────────────────────────────────────────────

export interface BalanceteContaSienge {
  accountCode?: string
  accountName?: string
  previousDebitBalance?: number
  previousCreditBalance?: number
  currentDebit?: number
  currentCredit?: number
  finalDebitBalance?: number
  finalCreditBalance?: number
}

export async function listarBalanceteSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  competencia: string,
): Promise<BalanceteContaSienge[]> {
  try {
    const qs = new URLSearchParams({ competenceDate: competencia })
    const res = await fetch(`${BASE(subdominio)}/trial-balance?${qs}`, {
      headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (Array.isArray(data) ? data : (data?.results ?? [])) as BalanceteContaSienge[]
  } catch { return [] }
}

// ── Reservas de Estoque ─────────────────────────────────────────────────────

export interface ReservaEstoqueSienge {
  id: number
  materialNome?: string
  quantidade?: number
  quantidadeAtendida?: number
  status?: string
  obraNome?: string
  buildingId?: number
}

export async function listarReservasEstoqueSienge(
  subdominio: string, usuario: string, senha: string, buildingId?: number
): Promise<ReservaEstoqueSienge[]> {
  try {
    const qs = buildingId ? `?buildingId=${buildingId}` : ""
    const res = await fetch(`${BASE(subdominio)}/stock-reservations${qs}`, {
      headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (Array.isArray(data) ? data : (data?.results ?? [])) as ReservaEstoqueSienge[]
  } catch { return [] }
}

export async function atenderReservaSienge(
  subdominio: string, usuario: string, senha: string, reservaId: number, quantidade: number
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE(subdominio)}/stock-reservations/${reservaId}/movements`, {
      method: "POST",
      headers: { Authorization: authHeader(usuario, senha), "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: quantidade }),
    })
    return res.ok
  } catch { return false }
}

// ── Transferência de Estoque ────────────────────────────────────────────────

export async function transferirEstoqueSienge(
  subdominio: string, usuario: string, senha: string,
  data: { fromBuildingId: number; toBuildingId: number; materialId: number; quantidade: number; observacao?: string }
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE(subdominio)}/stock-movements/transfer`, {
      method: "POST",
      headers: { Authorization: authHeader(usuario, senha), "Content-Type": "application/json" },
      body: JSON.stringify({
        fromBuildingId: data.fromBuildingId,
        toBuildingId: data.toBuildingId,
        materialId: data.materialId,
        quantity: data.quantidade,
        ...(data.observacao && { observation: data.observacao }),
      }),
    })
    return res.ok
  } catch { return false }
}

// ── Entrega de Chaves ──────────────────────────────────────────────────────

export interface EntregaChavesSienge {
  id: number
  unitName?: string
  buildingName?: string
  clientName?: string
  deliveryDate?: string
  status?: string
  responsible?: string
}

export async function listarEntregaChavesSienge(
  subdominio: string, usuario: string, senha: string
): Promise<EntregaChavesSienge[]> {
  try {
    const res = await fetch(`${BASE(subdominio)}/keys-handovers`, {
      headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (Array.isArray(data) ? data : (data?.results ?? [])) as EntregaChavesSienge[]
  } catch { return [] }
}

// ── Extrato do Cliente PDF ──────────────────────────────────────────────────

export async function getExtratoClientePdfSienge(
  subdominio: string, usuario: string, senha: string, contractId: number
): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(`${BASE(subdominio)}/sales-contracts/${contractId}/financial-statement/pdf`, {
      headers: { Authorization: authHeader(usuario, senha), Accept: "application/pdf" },
    })
    if (!res.ok) return null
    return await res.arrayBuffer()
  } catch { return null }
}

// ── Clientes (Customers) ────────────────────────────────────────────────────

export interface ClienteSienge {
  id: number
  name?: string
  cpf?: string
  cnpj?: string
  email?: string
}

export async function listarClientesSienge(
  subdominio: string, usuario: string, senha: string
): Promise<ClienteSienge[]> {
  try {
    const res = await fetch(`${BASE(subdominio)}/customers`, {
      headers: { Authorization: authHeader(usuario, senha), Accept: "application/json" },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (Array.isArray(data) ? data : (data?.results ?? [])) as ClienteSienge[]
  } catch { return [] }
}

export interface CriarClienteSiengeInput {
  name: string
  cpf?: string
  cnpj?: string
  email?: string
  birthDate?: string
  gender?: string
  maritalStatus?: string
  nationality?: string
  rg?: string
  rgEmitter?: string
  phones?: Array<{
    typeId: number
    ddd: string
    number: string
  }>
  addresses?: Array<{
    typeId: number
    street: string
    number?: string
    complement?: string
    neighborhood?: string
    city?: string
    state?: string
    zipCode?: string
  }>
}

export async function criarClienteSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  data: CriarClienteSiengeInput,
): Promise<{ id: number } | null> {
  try {
    const res = await fetch(`${BASE(subdominio)}/customers`, {
      method: "POST",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
    }
    // Sienge returns the id in the response or in Location header
    const locationHeader = res.headers.get("Location")
    if (locationHeader) {
      const match = locationHeader.match(/\/(\d+)$/)
      if (match) return { id: parseInt(match[1]) }
    }
    try {
      return await res.json() as { id: number }
    } catch {
      return { id: 0 }
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return null
  }
}

export async function buscarClientePorIdSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  clienteId: number,
): Promise<ClienteSienge | null> {
  try {
    const data = await siengeGet(subdominio, usuario, senha, `/customers/${clienteId}`)
    return data as ClienteSienge
  } catch { return null }
}

export async function atualizarClienteSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  clienteId: number,
  data: Partial<CriarClienteSiengeInput>,
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE(subdominio)}/customers/${clienteId}`, {
      method: "PATCH",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    return res.ok
  } catch { return false }
}

// ── Sobrescrever Telefones de Cliente ─────────────────────────────────────────

export interface SiengeClientePhoneInput {
  typeId: number
  ddd: string
  number: string
}

export async function sobrescreverTelefonesCliente(
  subdominio: string,
  usuario: string,
  senha: string,
  clienteId: number,
  phones: SiengeClientePhoneInput[],
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE(subdominio)}/customers/${clienteId}/phones`, {
      method: "PUT",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(phones),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    return true
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return false
  }
}

// ── Atualizar Cônjuge de Cliente ──────────────────────────────────────────────

export interface SiengeClienteSpouseInput {
  name: string
  cpf?: string
  rg?: string
  rgEmitter?: string
  rgState?: string
  birthDate?: string
  nationality?: string
  profession?: string
  email?: string
  phone?: string
}

export async function atualizarConjugeCliente(
  subdominio: string,
  usuario: string,
  senha: string,
  clienteId: number,
  spouse: SiengeClienteSpouseInput,
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE(subdominio)}/customers/${clienteId}/spouse`, {
      method: "PUT",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(spouse),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    return true
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return false
  }
}

// ── Atualizar Renda Familiar de Cliente ───────────────────────────────────────

export interface SiengeClienteFamilyIncomeInput {
  sourceOfIncome: string
  grossIncome: number
  provenIncome?: number
  deductions?: number
  liquidIncome?: number
}

export async function atualizarRendaFamiliarCliente(
  subdominio: string,
  usuario: string,
  senha: string,
  clienteId: number,
  familyIncomes: SiengeClienteFamilyIncomeInput[],
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE(subdominio)}/customers/${clienteId}/familyIncomes`, {
      method: "PUT",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(familyIncomes),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    return true
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return false
  }
}

// ── Atualizar Endereço de Cliente ─────────────────────────────────────────────

export interface SiengeClienteAddressInput {
  street: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  zipCode?: string
}

export async function atualizarEnderecoCliente(
  subdominio: string,
  usuario: string,
  senha: string,
  clienteId: number,
  addressType: string,
  address: SiengeClienteAddressInput,
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE(subdominio)}/customers/${clienteId}/addresses/${addressType}`, {
      method: "PUT",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(address),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    return true
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return false
  }
}

// ── Anexos de Cliente (Customer Attachments) ─────────────────────────────────

export interface SiengeClienteAnexo {
  id: number
  fileName?: string
  description?: string
  createdAt?: string
  [key: string]: unknown
}

export async function listarAnexosClienteSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  clienteId: number,
): Promise<SiengeClienteAnexo[]> {
  try {
    const data = await siengeGet(subdominio, usuario, senha, `/customers/${clienteId}/attachments`)
    return normalizeList(data) as SiengeClienteAnexo[]
  } catch { return [] }
}

export async function uploadAnexoClienteSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  clienteId: number,
  fileBuffer: Buffer,
  fileName: string,
  description?: string,
): Promise<{ id: number } | null> {
  try {
    const blob = new Blob([new Uint8Array(fileBuffer)])
    const formData = new FormData()
    formData.append("file", blob, fileName)
    if (description) formData.append("description", description)

    const res = await fetch(`${BASE(subdominio)}/customers/${clienteId}/attachments`, {
      method: "POST",
      headers: {
        Authorization: authHeader(usuario, senha),
        Accept: "application/json",
      },
      body: formData,
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
    }
    // Sienge returns the new attachment id in the response body or Location header
    const location = res.headers.get("Location")
    if (location) {
      const match = location.match(/\/(\d+)$/)
      if (match) return { id: parseInt(match[1]) }
    }
    try {
      const json = await res.json() as Record<string, unknown>
      if (json.id) return { id: Number(json.id) }
    } catch { /* response may be empty on 201 */ }
    return { id: 0 }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return null
  }
}

export async function downloadAnexoClienteSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  clienteId: number,
  anexoId: number,
): Promise<{ data: Buffer; contentType: string; fileName?: string } | null> {
  try {
    const res = await fetch(`${BASE(subdominio)}/customers/${clienteId}/attachments/${anexoId}`, {
      headers: {
        Authorization: authHeader(usuario, senha),
      },
      cache: "no-store",
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    const contentType = res.headers.get("Content-Type") ?? "application/octet-stream"
    const disposition = res.headers.get("Content-Disposition")
    let fileName: string | undefined
    if (disposition) {
      const match = disposition.match(/filename[^;=\n]*=["']?([^"';\n]+)/)
      if (match) fileName = match[1]
    }
    const arrayBuffer = await res.arrayBuffer()
    return { data: Buffer.from(arrayBuffer), contentType, fileName }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return null
  }
}

// ── Procurador de Cliente (Customer Procurator) ──────────────────────────────

export interface CriarProcuradorClienteInput {
  name: string
  cpf?: string
  rg?: string
  rgEmitter?: string
  rgState?: string
  nationality?: string
  civilStatus?: string
  profession?: string
  email?: string
  phone?: string
}

export async function criarProcuradorClienteSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  clienteId: number,
  data: CriarProcuradorClienteInput,
): Promise<{ id: number } | null> {
  try {
    const res = await fetch(`${BASE(subdominio)}/customers/${clienteId}/procurator`, {
      method: "POST",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
    }
    const location = res.headers.get("Location")
    if (location) {
      const match = location.match(/\/(\d+)$/)
      if (match) return { id: parseInt(match[1]) }
    }
    try {
      const json = await res.json() as Record<string, unknown>
      if (json.id) return { id: Number(json.id) }
    } catch { /* response may be empty on 201 */ }
    return { id: 0 }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return null
  }
}

// ── RDOs por Obra ─────────────────────────────────────────────────────────────

export interface SiengeRDO {
  id: number
  buildingId?: number
  date?: string
  status?: string
  [key: string]: unknown
}

// ─── RDO — Anexos (Construction Daily Report Attachments) ────────────────────

export async function uploadAnexoRdoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  buildingId: number,
  dailyReportId: number,
  fileBuffer: number[],
  fileName: string,
  description?: string,
): Promise<{ id: number } | null> {
  try {
    const blob = new Blob([new Uint8Array(fileBuffer)])
    const formData = new FormData()
    formData.append("file", blob, fileName)
    if (description) formData.append("description", description)

    const res = await fetch(`${BASE(subdominio)}/construction-daily-report/${buildingId}/${dailyReportId}/attachments`, {
      method: "POST",
      headers: {
        Authorization: authHeader(usuario, senha),
        Accept: "application/json",
      },
      body: formData,
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
    }
    const location = res.headers.get("Location")
    if (location) {
      const match = location.match(/\/(\d+)$/)
      if (match) return { id: parseInt(match[1]) }
    }
    try { return await res.json() as { id: number } } catch { return { id: 0 } }
  } catch (e) {
    console.error("[Sienge] uploadAnexoRdoSienge error:", e)
    return null
  }
}

export interface SiengeRDOAnexo {
  id: number
  fileName?: string
  description?: string
  contentType?: string
  [key: string]: unknown
}

export async function listarAnexosRdoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  buildingId: number,
  dailyReportId: number,
): Promise<SiengeRDOAnexo[]> {
  try {
    const data = await siengeGet(
      subdominio,
      usuario,
      senha,
      `/construction-daily-report/${buildingId}/${dailyReportId}/attachments`,
    )
    return normalizeList(data) as SiengeRDOAnexo[]
  } catch { return [] }
}

export async function listarRdosSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  buildingId?: number,
): Promise<SiengeRDO[]> {
  try {
    const qs = buildingId ? `?buildingId=${buildingId}&limit=50&offset=0` : "?limit=50&offset=0"
    const data = await siengeGet(subdominio, usuario, senha, `/construction-daily-reports${qs}`)
    return normalizeList(data) as SiengeRDO[]
  } catch { return [] }
}

export async function downloadAnexoRdoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  buildingId: number,
  dailyReportId: number,
  attachmentId: number,
): Promise<{ fileBase64: string; contentType: string; fileName: string } | null> {
  try {
    const res = await fetch(
      `${BASE(subdominio)}/construction-daily-report/${buildingId}/${dailyReportId}/attachments/${attachmentId}`,
      {
        method: "GET",
        headers: {
          Authorization: authHeader(usuario, senha),
        },
      },
    )
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
    }
    const contentType = res.headers.get("Content-Type") ?? "application/octet-stream"
    const disposition = res.headers.get("Content-Disposition") ?? ""
    const fileNameMatch = disposition.match(/filename[^;=\n]*=["']?([^"';\n]+)/)
    const fileName = fileNameMatch?.[1] ?? `attachment-${attachmentId}`
    const buffer = Buffer.from(await res.arrayBuffer())
    return { fileBase64: buffer.toString("base64"), contentType, fileName }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return null
  }
}

// ── Solicitações de Compra por Obra ───────────────────────────────────────────

export async function listarSolicitacoesPorObraSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  buildingId: number,
): Promise<unknown[]> {
  try {
    const data = await siengeGet(subdominio, usuario, senha, `/purchase-requests?buildingId=${buildingId}&limit=50&offset=0`)
    return normalizeList(data)
  } catch { return [] }
}

// ── Informe de Rendimentos IR ───────────────────────────────────────────────

export async function getInformeIRPdfSienge(
  subdominio: string, usuario: string, senha: string, clienteId: number, ano: number
): Promise<ArrayBuffer | null> {
  try {
    const qs = new URLSearchParams({ customerId: String(clienteId), year: String(ano) })
    const res = await fetch(`${BASE(subdominio)}/customer-income-tax/report/pdf?${qs}`, {
      headers: { Authorization: authHeader(usuario, senha), Accept: "application/pdf" },
    })
    if (!res.ok) return null
    return await res.arrayBuffer()
  } catch { return null }
}

// ── Write-back de Credores ──────────────────────────────────────────────────

export async function criarCreditorSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  data: { companyName: string; cnpj?: string; email?: string; phone?: string },
): Promise<number | null> {
  try {
    const res = await fetch(`${BASE(subdominio)}/creditors`, {
      method: "POST",
      headers: { Authorization: authHeader(usuario, senha), "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) return null
    const json = await res.json() as { id?: number }
    return json.id ?? null
  } catch { return null }
}

export async function atualizarCreditorSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  creditorId: number,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    await fetch(`${BASE(subdominio)}/creditors/${creditorId}`, {
      method: "PATCH",
      headers: { Authorization: authHeader(usuario, senha), "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    })
  } catch { /* silent */ }
}

export async function ativarCreditorSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  creditorId: number,
): Promise<void> {
  try {
    await fetch(`${BASE(subdominio)}/creditors/${creditorId}/activate`, {
      method: "PUT",
      headers: { Authorization: authHeader(usuario, senha) },
    })
  } catch { /* silent */ }
}

export async function desativarCreditorSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  creditorId: number,
): Promise<void> {
  try {
    await fetch(`${BASE(subdominio)}/creditors/${creditorId}/deactivate`, {
      method: "PUT",
      headers: { Authorization: authHeader(usuario, senha) },
    })
  } catch { /* silent */ }
}

export async function criarContaPagarSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  data: {
    creditorId: number
    documentNumber?: string
    dueDate: string
    amount: number
    description?: string
    buildingId?: number
  },
): Promise<{ id: number } | null> {
  try {
    const res = await fetch(`${BASE(subdominio)}/bill-debts`, {
      method: "POST",
      headers: { Authorization: authHeader(usuario, senha), "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) return null
    return await res.json() as { id: number }
  } catch { return null }
}

// ─── Bills — Attachments ──────────────────────────────────────────────────────

export interface SiengeBillAttachment {
  id: number
  fileName?: string
  description?: string
  createdAt?: string
}

export async function listarAnexosBillSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  billId: number,
): Promise<SiengeBillAttachment[]> {
  const data = await siengeGet(subdominio, usuario, senha, `/bills/${billId}/attachments`)
  return normalizeList(data) as SiengeBillAttachment[]
}

export async function uploadAnexoBillSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  billId: number,
  fileBuffer: Buffer,
  fileName: string,
  description?: string,
): Promise<{ id: number } | null> {
  try {
    const blob = new Blob([new Uint8Array(fileBuffer)])
    const formData = new FormData()
    formData.append("file", blob, fileName)
    if (description) formData.append("description", description)

    const res = await fetch(`${BASE(subdominio)}/bills/${billId}/attachments`, {
      method: "POST",
      headers: {
        Authorization: authHeader(usuario, senha),
        Accept: "application/json",
      },
      body: formData,
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
    }
    const location = res.headers.get("Location")
    if (location) {
      const match = location.match(/\/(\d+)$/)
      if (match) return { id: parseInt(match[1]) }
    }
    try {
      const json = await res.json() as Record<string, unknown>
      if (json.id) return { id: Number(json.id) }
    } catch { /* response may be empty on 201 */ }
    return { id: 0 }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return null
  }
}

export async function downloadAnexoBillSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  billId: number,
  attachmentId: number,
): Promise<{ fileBase64: string; contentType: string; fileName: string } | null> {
  try {
    const res = await fetch(
      `${BASE(subdominio)}/bills/${billId}/attachments/${attachmentId}`,
      {
        method: "GET",
        headers: {
          Authorization: authHeader(usuario, senha),
        },
      },
    )
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
    }
    const contentType = res.headers.get("Content-Type") ?? "application/octet-stream"
    const disposition = res.headers.get("Content-Disposition") ?? ""
    const fileNameMatch = disposition.match(/filename[^;=\n]*=["']?([^"';\n]+)/)
    const fileName = fileNameMatch?.[1] ?? `attachment-${attachmentId}`
    const buffer = Buffer.from(await res.arrayBuffer())
    return { fileBase64: buffer.toString("base64"), contentType, fileName }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return null
  }
}

// ─── Boletos / Segunda Via ─────────────────────────────────────────────────────

export interface SiengeBoleto {
  id?: number
  clientId?: number
  clientName?: string
  contractId?: number
  installmentNumber?: number
  dueDate?: string
  amount?: number
  status?: string
  documentNumber?: string
}

export async function enviarBoleto2ViaSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  data: { customerId: number; email?: string; installmentId?: number },
): Promise<{ sucesso: boolean }> {
  try {
    const res = await fetch(`${BASE(subdominio)}/payment-slip-notification`, {
      method: "POST",
      headers: { Authorization: authHeader(usuario, senha), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return { sucesso: res.ok }
  } catch { return { sucesso: false } }
}

export async function obterSaldoDevedorSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  customerId: number,
): Promise<{ total?: number; vencido?: number; aVencer?: number } | null> {
  try {
    const res = await fetch(`${BASE(subdominio)}/current-debit-balance`, {
      method: "POST",
      headers: { Authorization: authHeader(usuario, senha), "Content-Type": "application/json" },
      body: JSON.stringify({ customerId }),
    })
    if (!res.ok) return null
    return await res.json() as { total?: number; vencido?: number; aVencer?: number }
  } catch { return null }
}

export async function enviarSaldoDevedorEmailSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  data: { customerId: number; email: string },
): Promise<{ sucesso: boolean }> {
  try {
    const res = await fetch(`${BASE(subdominio)}/email-current-debit-balance`, {
      method: "POST",
      headers: { Authorization: authHeader(usuario, senha), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    return { sucesso: res.ok }
  } catch { return { sucesso: false } }
}

// ─── Lançamentos Contábeis ─────────────────────────────────────────────────────

export interface SiengeEntradaContabil {
  accountCode: string
  costCenterCode?: string
  description: string
  value: number
  date: string
  documentNumber?: string
  debitOrCredit?: "D" | "C"
}

export async function criarLoteContabilSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  entries: SiengeEntradaContabil[],
): Promise<{ batchId?: number; sucesso: boolean }> {
  try {
    const res = await fetch(`${BASE(subdominio)}/accountancy/entry-generator/entry-batches`, {
      method: "POST",
      headers: { Authorization: authHeader(usuario, senha), "Content-Type": "application/json" },
      body: JSON.stringify({ entries }),
    })
    if (!res.ok) return { sucesso: false }
    const data = await res.json() as { id?: number }
    return { batchId: data.id, sucesso: true }
  } catch { return { sucesso: false } }
}

// ─── Cotações (criar) ──────────────────────────────────────────────────────────

export async function criarCotacaoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  data: {
    buildingId: number
    description?: string
    items: Array<{ materialId?: number; description?: string; quantity: number; unit: string }>
    suppliers: Array<{ creditorId: number }>
  },
): Promise<{ id?: number; sucesso: boolean }> {
  try {
    const res = await fetch(`${BASE(subdominio)}/purchase-quotations`, {
      method: "POST",
      headers: { Authorization: authHeader(usuario, senha), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) return { sucesso: false }
    const json = await res.json() as { id?: number }
    return { id: json.id, sucesso: true }
  } catch { return { sucesso: false } }
}

// ─── Cotações (criar item a partir de solicitação) ──────────────────────────────

export async function criarItemCotacaoFromSolicitacaoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  cotacaoId: number,
  data: {
    purchaseRequestId: number
    purchaseRequestItemId: number
  },
): Promise<{ sucesso: boolean }> {
  try {
    const res = await fetch(
      `${BASE(subdominio)}/purchase-quotations/${cotacaoId}/items/from-purchase-request`,
      {
        method: "POST",
        headers: { Authorization: authHeader(usuario, senha), "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    )
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    return { sucesso: true }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Sienge")) throw err
    return { sucesso: false }
  }
}

// ─── Multi-empresa ─────────────────────────────────────────────────────────────

export interface SiengeEmpresa {
  id: number
  name: string
  cnpj?: string
  active?: boolean
}

export async function listarEmpresasSienge(
  subdominio: string,
  usuario: string,
  senha: string,
): Promise<SiengeEmpresa[]> {
  try {
    const data = await siengeGet(subdominio, usuario, senha, "/companies")
    return normalizeList(data) as SiengeEmpresa[]
  } catch { return [] }
}

// ─── Notas Fiscais de Compra — Entregas Atendidas ───────────────────────────

export interface SiengeEntregaAtendida {
  purchaseInvoiceId: number
  purchaseInvoiceItemId: number
  purchaseOrderId: number
  purchaseOrderItemId: number
  quantity: number
  unitPrice: number
}

export async function listarEntregasAtendidasNfCompraSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  params?: {
    purchaseInvoiceId?: number
    purchaseOrderId?: number
    offset?: number
    limit?: number
  },
): Promise<SiengeEntregaAtendida[]> {
  const q = new URLSearchParams()
  if (params?.purchaseInvoiceId) q.set("purchaseInvoiceId", String(params.purchaseInvoiceId))
  if (params?.purchaseOrderId) q.set("purchaseOrderId", String(params.purchaseOrderId))
  if (params?.offset) q.set("offset", String(params.offset))
  q.set("limit", String(params?.limit ?? 200))
  const qs = q.toString()
  const data = await siengeGet(subdominio, usuario, senha, `/purchase-invoices/deliveries-attended${qs ? `?${qs}` : ""}`)
  return normalizeList(data) as SiengeEntregaAtendida[]
}

// ─── Notas Fiscais de Compra — Entregas de Pedidos ──────────────────────────

export interface SiengeEntregaPedidoNfInput {
  purchaseOrderId: number
  purchaseOrderItemId: number
  quantity: number
  unitPrice?: number
}

export async function criarEntregasPedidoNfCompraSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  purchaseInvoiceId: number,
  entregas: SiengeEntregaPedidoNfInput[],
): Promise<void> {
  const res = await fetch(
    `${BASE(subdominio)}/purchase-invoices/${purchaseInvoiceId}/items/purchase-orders/delivery-schedules`,
    {
      method: "POST",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(entregas),
    },
  )
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
}

// ─── Purchase Orders — Attachments ───────────────────────────────────────────

export interface SiengePurchaseOrderAttachment {
  id: number
  fileName?: string
  description?: string
  createdAt?: string
}

export async function listarAnexosPedidoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  pedidoId: number,
): Promise<SiengePurchaseOrderAttachment[]> {
  const data = await siengeGet(subdominio, usuario, senha, `/purchase-orders/${pedidoId}/attachments`)
  return normalizeList(data) as SiengePurchaseOrderAttachment[]
}

export async function uploadAnexoPedidoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  pedidoId: number,
  fileBuffer: Buffer,
  fileName: string,
  description?: string,
): Promise<{ id: number } | null> {
  try {
    const blob = new Blob([new Uint8Array(fileBuffer)])
    const formData = new FormData()
    formData.append("file", blob, fileName)
    if (description) formData.append("description", description)

    const res = await fetch(`${BASE(subdominio)}/purchase-orders/${pedidoId}/attachments`, {
      method: "POST",
      headers: {
        Authorization: authHeader(usuario, senha),
        Accept: "application/json",
      },
      body: formData,
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
    }
    const location = res.headers.get("Location")
    if (location) {
      const match = location.match(/\/(\d+)$/)
      if (match) return { id: parseInt(match[1]) }
    }
    try {
      const json = await res.json() as Record<string, unknown>
      if (json.id) return { id: Number(json.id) }
    } catch { /* response may be empty on 201 */ }
    return { id: 0 }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return null
  }
}

export async function downloadAnexoPedidoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  pedidoId: number,
  attachmentId: number,
): Promise<{ fileBase64: string; contentType: string; fileName: string } | null> {
  try {
    const res = await fetch(
      `${BASE(subdominio)}/purchase-orders/${pedidoId}/attachments/${attachmentId}`,
      {
        method: "GET",
        headers: {
          Authorization: authHeader(usuario, senha),
        },
      },
    )
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 300)}`)
    }
    const contentType = res.headers.get("Content-Type") ?? "application/octet-stream"
    const disposition = res.headers.get("Content-Disposition") ?? ""
    const fileNameMatch = disposition.match(/filename[^;=\n]*=["']?([^"';\n]+)/)
    const fileName = fileNameMatch?.[1] ?? `attachment-${attachmentId}`
    const buffer = Buffer.from(await res.arrayBuffer())
    return { fileBase64: buffer.toString("base64"), contentType, fileName }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return null
  }
}

// ─── Bills — Tax Information Items ──────────────────────────────────────────

export interface CriarTaxInformationItemBillInput {
  taxInformationId: number
  budgetCategoryId?: number
  departmentId?: number
  buildingId?: number
  amount?: number
}

export async function criarTaxInformationItemBillSienge(
  subdominio: string, usuario: string, senha: string,
  billId: number,
  data: CriarTaxInformationItemBillInput,
): Promise<{ id: number } | null> {
  try {
    const res = await fetch(`${BASE(subdominio)}/bills/${billId}/tax-information/items`, {
      method: "POST",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const b = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${b.slice(0, 200)}`)
    }
    const locationHeader = res.headers.get("Location")
    if (locationHeader) {
      const match = locationHeader.match(/\/(\d+)$/)
      if (match) return { id: parseInt(match[1]) }
    }
    try { return await res.json() as { id: number } } catch { return null }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return null
  }
}

// ─── Contas a Receber (Accounts Receivable) ─────────────────────────────────

export interface SiengeReceivableBill {
  id: number
  documentNumber?: string
  customerId?: number
  customerName?: string
  amount?: number
  dueDate?: string
  status?: string
  buildingId?: number
  companyId?: number
}

export async function buscarReceivableBillSienge(
  subdominio: string, usuario: string, senha: string,
  billId: number,
): Promise<SiengeReceivableBill | null> {
  try {
    const data = await siengeGet(subdominio, usuario, senha, `/accounts-receivable/receivable-bills/${billId}`)
    return data as SiengeReceivableBill
  } catch { return null }
}

export interface SiengeReceivableBillInstallment {
  installmentId: number
  installmentNumber?: number
  dueDate?: string
  amount?: number
  balance?: number
  status?: string
  carrierName?: string
}

export async function listarParcReceivableBillSienge(
  subdominio: string, usuario: string, senha: string,
  billId: number,
  filtros?: { includedCarriers?: string; excludedCarriers?: string },
): Promise<SiengeReceivableBillInstallment[]> {
  try {
    const params = new URLSearchParams()
    if (filtros?.includedCarriers) params.set("includedCarriers", filtros.includedCarriers)
    if (filtros?.excludedCarriers) params.set("excludedCarriers", filtros.excludedCarriers)
    const qs = params.toString() ? `?${params.toString()}` : ""
    const data = await siengeGet(subdominio, usuario, senha, `/accounts-receivable/receivable-bills/${billId}/installments${qs}`)
    return normalizeList(data) as SiengeReceivableBillInstallment[]
  } catch { return [] }
}

export async function alterarVencimentoReceivableBillSienge(
  subdominio: string, usuario: string, senha: string,
  billId: number,
  installmentId: number,
  newDueDate: string,
): Promise<boolean> {
  try {
    const res = await fetch(
      `${BASE(subdominio)}/accounts-receivable/receivable-bills/${billId}/installments/${installmentId}/change-due-date`,
      {
        method: "PATCH",
        headers: {
          Authorization: authHeader(usuario, senha),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ dueDate: newDueDate }),
      },
    )
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    return true
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return false
  }
}

// ─── Reservas de Unidades (Unit Bookings) ────────────────────────────────────

export interface CriarUnitBookingInput {
  unitId: number
  customerId: number
  brokerId?: number
  observation?: string
}

export async function criarReservaUnidadeSienge(
  subdominio: string, usuario: string, senha: string,
  data: CriarUnitBookingInput,
): Promise<{ id: number } | null> {
  try {
    const res = await fetch(`${BASE(subdominio)}/unit-bookings`, {
      method: "POST",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    const locationHeader = res.headers.get("Location")
    if (locationHeader) {
      const match = locationHeader.match(/\/(\d+)$/)
      if (match) return { id: parseInt(match[1]) }
    }
    try { return await res.json() as { id: number } } catch { return null }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return null
  }
}

// ── Inativar Reserva de Unidade ─────────────────────────────────────────────

export async function inativarReservaUnidadeSienge(
  subdominio: string, usuario: string, senha: string,
  unitId: number,
): Promise<boolean> {
  const res = await fetch(`${BASE(subdominio)}/unit-bookings/units/${unitId}/deactivate`, {
    method: "PATCH",
    headers: {
      Authorization: authHeader(usuario, senha),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return true
}

// ── Criar Contrato de Locação ───────────────────────────────────────────────

export interface CriarLocacaoInput {
  propertyId: number
  tenantId: number
  monthlyRent: number
  startDate: string
  endDate?: string
  observation?: string
}

export async function criarLocacaoSienge(
  subdominio: string, usuario: string, senha: string,
  data: CriarLocacaoInput,
): Promise<{ id: number } | null> {
  try {
    const res = await fetch(`${BASE(subdominio)}/property-rentals`, {
      method: "POST",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
    }
    const locationHeader = res.headers.get("Location")
    if (locationHeader) {
      const match = locationHeader.match(/\/(\d+)$/)
      if (match) return { id: parseInt(match[1]) }
    }
    try { return await res.json() as { id: number } } catch { return null }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Sienge")) throw e
    return null
  }
}

// ── Enviar Informe IR por E-mail ────────────────────────────────────────────

export async function enviarInformeIREmailSienge(
  subdominio: string, usuario: string, senha: string,
  clienteId: number, ano: number, email: string,
): Promise<boolean> {
  const res = await fetch(`${BASE(subdominio)}/customer-income-tax/report`, {
    method: "POST",
    headers: {
      Authorization: authHeader(usuario, senha),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ customerId: clienteId, year: ano, email }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return true
}

// ── Buscar Webhook por UUID ─────────────────────────────────────────────────

export async function buscarWebhookSienge(
  subdominio: string, usuario: string, senha: string,
  hookId: string,
): Promise<SiengeHook | null> {
  try {
    const data = await siengeGet(subdominio, usuario, senha, `/hooks/${hookId}`)
    return data as SiengeHook
  } catch { return null }
}

// ── Faturamento Direto de Pedido ────────────────────────────────────────────

export interface DirectBillingSienge {
  [key: string]: unknown
}

export async function buscarDirectBillingPedidoSienge(
  subdominio: string, usuario: string, senha: string,
  pedidoId: number,
): Promise<DirectBillingSienge | null> {
  try {
    const data = await siengeGet(subdominio, usuario, senha, `/purchase-orders/${pedidoId}/direct-billing`)
    return data as DirectBillingSienge
  } catch { return null }
}

// ── Payment Information (por parcela de título CP) ─────────────────────────

export type PaymentInfoType =
  | "bank-transfer"
  | "boleto-bancario"
  | "boleto-concessionaria"
  | "boleto-tax"
  | "dda"
  | "darf-tax"
  | "darj-tax"
  | "fgts-tax"
  | "gare-tax"
  | "inss-tax"
  | "pix"

export interface SiengePaymentInfo {
  [key: string]: unknown
}

export async function getPaymentInfoSienge(
  subdominio: string, usuario: string, senha: string,
  billId: number, installmentId: number, type: PaymentInfoType,
): Promise<SiengePaymentInfo | null> {
  try {
    const data = await siengeGet(
      subdominio, usuario, senha,
      `/bills/${billId}/installments/${installmentId}/payment-information/${type}`,
    )
    return data as SiengePaymentInfo
  } catch { return null }
}

export async function patchPaymentInfoSienge(
  subdominio: string, usuario: string, senha: string,
  billId: number, installmentId: number, type: PaymentInfoType,
  data: Record<string, unknown>,
): Promise<boolean> {
  const res = await fetch(
    `${BASE(subdominio)}/bills/${billId}/installments/${installmentId}/payment-information/${type}`,
    {
      method: "PATCH",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(data),
    },
  )
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return true
}

// ─── Solicitação — Autorizar itens específicos ────────────────────────────────

export async function autorizarItensSolicitacaoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  solicitacaoId: number,
): Promise<boolean> {
  const res = await fetch(`${BASE(subdominio)}/purchase-requests/${solicitacaoId}/items/authorize`, {
    method: "PATCH",
    headers: {
      Authorization: authHeader(usuario, senha),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return true
}

// ─── Solicitação — Autorizar item específico ──────────────────────────────────

export async function autorizarItemSolicitacaoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  solicitacaoId: number,
  itemId: number,
): Promise<boolean> {
  const res = await fetch(`${BASE(subdominio)}/purchase-requests/${solicitacaoId}/items/${itemId}/authorize`, {
    method: "PATCH",
    headers: {
      Authorization: authHeader(usuario, senha),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return true
}

// ─── Solicitação — Reprovar item específico ───────────────────────────────────

export async function reprovarItemSolicitacaoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  solicitacaoId: number,
  itemId: number,
): Promise<boolean> {
  const res = await fetch(`${BASE(subdominio)}/purchase-requests/${solicitacaoId}/items/${itemId}/disapproval`, {
    method: "PATCH",
    headers: {
      Authorization: authHeader(usuario, senha),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return true
}

// ─── NFe — Emitente e Destinatário ────────────────────────────────────────────

export interface SiengeNFeIssuerRecipient {
  issuer?: {
    name?: string
    cnpj?: string
    ie?: string
    address?: string
    city?: string
    state?: string
  }
  recipient?: {
    name?: string
    cnpj?: string
    ie?: string
    address?: string
    city?: string
    state?: string
  }
}

export async function buscarNFeIssuersRecipientsSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  chaveAcesso: string,
): Promise<SiengeNFeIssuerRecipient> {
  return siengeGet(subdominio, usuario, senha, `/nfes/${chaveAcesso}/issuers-recipients`) as Promise<SiengeNFeIssuerRecipient>
}

// ─── NFe — Formas de Pagamento ────────────────────────────────────────────────

export interface SiengeNFePayment {
  paymentMethod?: string
  value?: number
  dueDate?: string
  description?: string
}

export async function buscarNFePaymentsSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  chaveAcesso: string,
): Promise<SiengeNFePayment[]> {
  const data = await siengeGet(subdominio, usuario, senha, `/nfes/${chaveAcesso}/payments`)
  return normalizeList(data) as SiengeNFePayment[]
}

// ─── NFe — Local de Entrega/Retirada ──────────────────────────────────────────

export interface SiengeNFeDelivery {
  cnpj?: string
  cpf?: string
  name?: string
  address?: string
  number?: string
  complement?: string
  neighborhood?: string
  cityCode?: number
  cityName?: string
  state?: string
  zipCode?: string
}

export async function buscarNFeDeliveriesSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  chaveAcesso: string,
): Promise<SiengeNFeDelivery> {
  return siengeGet(subdominio, usuario, senha, `/nfes/${chaveAcesso}/deliveries`) as Promise<SiengeNFeDelivery>
}

// ─── NFe — Notas Referenciadas ────────────────────────────────────────────────

export interface SiengeNFeLinked {
  accessKey?: string
  model?: string
  series?: string
  number?: string
  issueDate?: string
}

export async function buscarNFeLinkedNfesSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  chaveAcesso: string,
): Promise<SiengeNFeLinked[]> {
  const data = await siengeGet(subdominio, usuario, senha, `/nfes/${chaveAcesso}/linked-nfes`)
  return normalizeList(data) as SiengeNFeLinked[]
}

// ─── NFe — ICMS Total ─────────────────────────────────────────────────────────

export interface SiengeNFeIcmsTotal {
  baseCalculo?: number
  valor?: number
  baseCalculoST?: number
  valorST?: number
  valorDesonerado?: number
  valorFCP?: number
  valorFCPST?: number
  valorFCPSTRetido?: number
}

export async function buscarNFeIcmsSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  chaveAcesso: string,
): Promise<SiengeNFeIcmsTotal> {
  return siengeGet(subdominio, usuario, senha, `/nfes/${chaveAcesso}/icms`) as Promise<SiengeNFeIcmsTotal>
}

// ─── NFe — Informações de Transporte ──────────────────────────────────────────

export interface SiengeNFeCarrier {
  carrierName?: string
  carrierCnpj?: string
  carrierCpf?: string
  carrierIe?: string
  freightType?: string
  vehiclePlate?: string
  vehicleState?: string
  volumes?: number
  grossWeight?: number
  netWeight?: number
}

export async function buscarNFeCarriersSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  chaveAcesso: string,
): Promise<SiengeNFeCarrier> {
  return siengeGet(subdominio, usuario, senha, `/nfes/${chaveAcesso}/carriers`) as Promise<SiengeNFeCarrier>
}

// ─── NFe — ISSQN Total ───────────────────────────────────────────────────────

export interface SiengeNFeIssqnTotal {
  baseCalculo?: number
  valor?: number
  valorPIS?: number
  valorCOFINS?: number
  dataCompetencia?: string
  valorDeducao?: number
  valorOutrasRetencoes?: number
  valorDescontoIncondicionado?: number
  valorDescontoCondicionado?: number
  valorISSRetido?: number
}

export async function buscarNFeIssqnSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  chaveAcesso: string,
): Promise<SiengeNFeIssqnTotal> {
  return siengeGet(subdominio, usuario, senha, `/nfes/${chaveAcesso}/issqn`) as Promise<SiengeNFeIssqnTotal>
}

// ─── NFe — IPI do Item ─────────────────────────────────────────────────────

export interface SiengeNFeItemIpi {
  ipiCst?: string | null
  ipiBaseCalculo?: number | null
  ipiAliquota?: number | null
  ipiValor?: number | null
  ipiQuantidadeTotal?: number | null
  ipiValorUnidade?: number | null
}

export async function buscarNFeItemIpiSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  chaveAcesso: string,
  itemId: number,
): Promise<SiengeNFeItemIpi> {
  return siengeGet(subdominio, usuario, senha, `/nfes/${chaveAcesso}/itens/${itemId}/ipi`) as Promise<SiengeNFeItemIpi>
}

// ─── NFe — PIS-COFINS do Item ──────────────────────────────────────────────

export interface SiengeNFeItemPisCofins {
  pisCst?: string | null
  pisBaseCalculo?: number | null
  pisAliquota?: number | null
  pisValor?: number | null
  cofinsCst?: string | null
  cofinsBaseCalculo?: number | null
  cofinsAliquota?: number | null
  cofinsValor?: number | null
}

export async function buscarNFeItemPisCofinsSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  chaveAcesso: string,
  itemId: number,
): Promise<SiengeNFeItemPisCofins> {
  return siengeGet(subdominio, usuario, senha, `/nfes/${chaveAcesso}/itens/${itemId}/pis-cofins`) as Promise<SiengeNFeItemPisCofins>
}

// ─── NFe — ICMS Simples Nacional do Item ───────────────────────────────────

export interface SiengeNFeItemSimplifiedIcms {
  csosn?: string | null
  origem?: string | null
  baseCalculo?: number | null
  aliquota?: number | null
  valor?: number | null
  baseCalculoSt?: number | null
  aliquotaSt?: number | null
  valorSt?: number | null
}

export async function buscarNFeItemSimplifiedIcmsSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  chaveAcesso: string,
  itemId: number,
): Promise<SiengeNFeItemSimplifiedIcms> {
  return siengeGet(subdominio, usuario, senha, `/nfes/${chaveAcesso}/itens/${itemId}/simplified-icms`) as Promise<SiengeNFeItemSimplifiedIcms>
}

// ─── NFe — ISSQN do Item ───────────────────────────────────────────────────

export interface SiengeNFeItemIssqn {
  baseCalculo?: number | null
  aliquota?: number | null
  valor?: number | null
  codigoServico?: string | null
  codigoMunicipio?: string | null
}

export async function buscarNFeItemIssqnSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  chaveAcesso: string,
  itemId: number,
): Promise<SiengeNFeItemIssqn> {
  return siengeGet(subdominio, usuario, senha, `/nfes/${chaveAcesso}/itens/${itemId}/issqn`) as Promise<SiengeNFeItemIssqn>
}

// ─── NFe — ICMS do Item ────────────────────────────────────────────────────

export interface SiengeNFeItemIcms {
  cst?: string | null
  origem?: string | null
  baseCalculo?: number | null
  aliquota?: number | null
  valor?: number | null
  baseCalculoSt?: number | null
  aliquotaSt?: number | null
  valorSt?: number | null
  valorDesonerado?: number | null
  motivoDesoneracao?: string | null
}

export async function buscarNFeItemIcmsSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  chaveAcesso: string,
  itemId: number,
): Promise<SiengeNFeItemIcms> {
  return siengeGet(subdominio, usuario, senha, `/nfes/${chaveAcesso}/itens/${itemId}/icms`) as Promise<SiengeNFeItemIcms>
}

// ─── Bulk Data — Parcelas Contas a Pagar ────────────────────────────────────

export interface SiengeBulkBillPayableInstallment {
  billId?: number
  installmentId?: number
  companyId?: number
  documentNumber?: string
  creditorId?: number
  creditorName?: string
  dueDate?: string
  originalValue?: number
  correctedValue?: number
  paidValue?: number
  openBalance?: number
  status?: string
  paymentDate?: string
  costCenterId?: number
  costCenterName?: string
  budgetCategoryId?: number
  budgetCategoryName?: string
  buildingId?: number
  buildingName?: string
}

export async function listarBulkBillPayablesInstallmentsSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  filtros?: { companyId?: number; startDate?: string; endDate?: string },
): Promise<SiengeBulkBillPayableInstallment[]> {
  const params = new URLSearchParams()
  if (filtros?.companyId) params.set("companyId", String(filtros.companyId))
  if (filtros?.startDate) params.set("startDate", filtros.startDate)
  if (filtros?.endDate) params.set("endDate", filtros.endDate)
  const qs = params.toString() ? `?${params.toString()}` : ""
  const data = await siengeGet(subdominio, usuario, senha, `/bulk-data/v1/bill-payables-installments${qs}`)
  return normalizeList(data) as SiengeBulkBillPayableInstallment[]
}

// ─── Bulk Data — Parcelas a Receber ─────────────────────────────────────────

export interface SiengeBulkReceivableInstallment {
  receivableId?: number
  installmentId?: number
  companyId?: number
  customerId?: number
  customerName?: string
  documentNumber?: string
  dueDate?: string
  originalValue?: number
  correctedValue?: number
  receivedValue?: number
  openBalance?: number
  status?: string
  receiptDate?: string
  buildingId?: number
  buildingName?: string
  unitId?: number
  contractId?: number
}

export async function listarBulkReceivableInstallmentsSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  filtros?: { companyId?: number; startDate?: string; endDate?: string },
): Promise<SiengeBulkReceivableInstallment[]> {
  const params = new URLSearchParams()
  if (filtros?.companyId) params.set("companyId", String(filtros.companyId))
  if (filtros?.startDate) params.set("startDate", filtros.startDate)
  if (filtros?.endDate) params.set("endDate", filtros.endDate)
  const qs = params.toString() ? `?${params.toString()}` : ""
  const data = await siengeGet(subdominio, usuario, senha, `/bulk-data/v1/receivable-installments${qs}`)
  return normalizeList(data) as SiengeBulkReceivableInstallment[]
}

// ─── Bulk Data — Movimentos de Caixa/Bancos ─────────────────────────────────

export interface SiengeBulkBankMovement {
  movementId?: number
  companyId?: number
  bankAccountId?: number
  bankAccountName?: string
  movementDate?: string
  entryType?: string
  value?: number
  documentNumber?: string
  description?: string
  creditorId?: number
  creditorName?: string
  customerId?: number
  customerName?: string
  costCenterId?: number
  budgetCategoryId?: number
  buildingId?: number
}

export async function listarBulkBankMovementsSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  filtros?: { companyId?: number; startDate?: string; endDate?: string },
): Promise<SiengeBulkBankMovement[]> {
  const params = new URLSearchParams()
  if (filtros?.companyId) params.set("companyId", String(filtros.companyId))
  if (filtros?.startDate) params.set("startDate", filtros.startDate)
  if (filtros?.endDate) params.set("endDate", filtros.endDate)
  const qs = params.toString() ? `?${params.toString()}` : ""
  const data = await siengeGet(subdominio, usuario, senha, `/bulk-data/v1/bank-movements${qs}`)
  return normalizeList(data) as SiengeBulkBankMovement[]
}

// ─── Bulk Data — Contratos de Venda ─────────────────────────────────────────

export interface SiengeBulkSalesContract {
  contractId?: number
  companyId?: number
  buildingId?: number
  buildingName?: string
  unitId?: number
  unitName?: string
  customerId?: number
  customerName?: string
  contractDate?: string
  contractValue?: number
  status?: string
  salesAgentId?: number
  salesAgentName?: string
  cancellationDate?: string
  issuanceDate?: string
}

export async function listarBulkSalesContractsSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  filtros?: { companyId?: number; startDate?: string; endDate?: string },
): Promise<SiengeBulkSalesContract[]> {
  const params = new URLSearchParams()
  if (filtros?.companyId) params.set("companyId", String(filtros.companyId))
  if (filtros?.startDate) params.set("startDate", filtros.startDate)
  if (filtros?.endDate) params.set("endDate", filtros.endDate)
  const qs = params.toString() ? `?${params.toString()}` : ""
  const data = await siengeGet(subdominio, usuario, senha, `/bulk-data/v1/sales-contracts${qs}`)
  return normalizeList(data) as SiengeBulkSalesContract[]
}

// ─── Bulk Data — Histórico de Extrato de Clientes ───────────────────────────

export interface SiengeBulkCustomerExtractHistory {
  customerId?: number
  customerName?: string
  companyId?: number
  buildingId?: number
  buildingName?: string
  unitId?: number
  contractId?: number
  entryDate?: string
  dueDate?: string
  description?: string
  entryType?: string
  value?: number
  balance?: number
  documentNumber?: string
  installmentId?: number
}

export async function listarBulkCustomerExtractHistorySienge(
  subdominio: string,
  usuario: string,
  senha: string,
  filtros?: { companyId?: number; customerId?: number; startDate?: string; endDate?: string },
): Promise<SiengeBulkCustomerExtractHistory[]> {
  const params = new URLSearchParams()
  if (filtros?.companyId) params.set("companyId", String(filtros.companyId))
  if (filtros?.customerId) params.set("customerId", String(filtros.customerId))
  if (filtros?.startDate) params.set("startDate", filtros.startDate)
  if (filtros?.endDate) params.set("endDate", filtros.endDate)
  const qs = params.toString() ? `?${params.toString()}` : ""
  const data = await siengeGet(subdominio, usuario, senha, `/bulk-data/v1/customer-extract-history${qs}`)
  return normalizeList(data) as SiengeBulkCustomerExtractHistory[]
}

// ─── Bulk Data — Cotações de Compra ─────────────────────────────────────────

export interface SiengeBulkPurchaseQuotation {
  quotationId?: number
  companyId?: number
  buildingId?: number
  buildingName?: string
  status?: string
  createdAt?: string
  deadlineDate?: string
  observation?: string
  supplierId?: number
  supplierName?: string
  totalValue?: number
  negotiationId?: number
  negotiationStatus?: string
  [key: string]: unknown
}

export async function listarBulkPurchaseQuotationsSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  filtros?: { companyId?: number; startDate?: string; endDate?: string },
): Promise<SiengeBulkPurchaseQuotation[]> {
  const params = new URLSearchParams()
  if (filtros?.companyId) params.set("companyId", String(filtros.companyId))
  if (filtros?.startDate) params.set("startDate", filtros.startDate)
  if (filtros?.endDate) params.set("endDate", filtros.endDate)
  const qs = params.toString() ? `?${params.toString()}` : ""
  const data = await siengeGet(subdominio, usuario, senha, `/bulk-data/v1/purchase-quotations${qs}`)
  return normalizeList(data) as SiengeBulkPurchaseQuotation[]
}

// ─── Bulk Data — Itens de Notas Fiscais ─────────────────────────────────────

export interface SiengeBulkInvoiceItem {
  invoiceId?: number
  invoiceType?: string
  companyId?: number
  itemId?: number
  productId?: number
  productName?: string
  quantity?: number
  unitValue?: number
  totalValue?: number
  ncm?: string
  cfop?: string
  unitOfMeasure?: string
  creditorId?: number
  customerId?: number
  buildingId?: number
  issueDate?: string
  [key: string]: unknown
}

export async function listarBulkInvoiceItensSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  filtros?: { companyId?: number; startDate?: string; endDate?: string },
): Promise<SiengeBulkInvoiceItem[]> {
  const params = new URLSearchParams()
  if (filtros?.companyId) params.set("companyId", String(filtros.companyId))
  if (filtros?.startDate) params.set("startDate", filtros.startDate)
  if (filtros?.endDate) params.set("endDate", filtros.endDate)
  const qs = params.toString() ? `?${params.toString()}` : ""
  const data = await siengeGet(subdominio, usuario, senha, `/bulk-data/v1/invoice-itens${qs}`)
  return normalizeList(data) as SiengeBulkInvoiceItem[]
}

// ─── Bulk Data — Insumos/Recursos de Obra ───────────────────────────────────

export interface SiengeBulkBuildingResource {
  resourceId?: number
  buildingId?: number
  buildingName?: string
  companyId?: number
  resourceCode?: string
  resourceName?: string
  unitOfMeasure?: string
  resourceType?: string
  groupId?: number
  groupName?: string
  unitCost?: number
  totalCost?: number
  budgetedQuantity?: number
  usedQuantity?: number
  [key: string]: unknown
}

export async function listarBulkBuildingResourcesSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  filtros?: { companyId?: number; buildingId?: number },
): Promise<SiengeBulkBuildingResource[]> {
  const params = new URLSearchParams()
  if (filtros?.companyId) params.set("companyId", String(filtros.companyId))
  if (filtros?.buildingId) params.set("buildingId", String(filtros.buildingId))
  const qs = params.toString() ? `?${params.toString()}` : ""
  const data = await siengeGet(subdominio, usuario, senha, `/bulk-data/v1/building-resources${qs}`)
  return normalizeList(data) as SiengeBulkBuildingResource[]
}

// ─── Bulk Data — Itens de Orçamento ─────────────────────────────────────────

export interface SiengeBulkBudgetItem {
  budgetId?: number
  buildingId?: number
  buildingName?: string
  companyId?: number
  itemId?: number
  itemCode?: string
  itemDescription?: string
  unitOfMeasure?: string
  quantity?: number
  unitCost?: number
  totalCost?: number
  budgetCategoryId?: number
  budgetCategoryName?: string
  taskId?: number
  taskName?: string
  [key: string]: unknown
}

export async function listarBulkBudgetItemsSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  filtros?: { companyId?: number; buildingId?: number },
): Promise<SiengeBulkBudgetItem[]> {
  const params = new URLSearchParams()
  if (filtros?.companyId) params.set("companyId", String(filtros.companyId))
  if (filtros?.buildingId) params.set("buildingId", String(filtros.buildingId))
  const qs = params.toString() ? `?${params.toString()}` : ""
  const data = await siengeGet(subdominio, usuario, senha, `/bulk-data/v1/budget-items${qs}`)
  return normalizeList(data) as SiengeBulkBudgetItem[]
}

// ─── Bulk Data — Inadimplentes ──────────────────────────────────────────────

export interface SiengeBulkDefaulter {
  customerId?: number
  customerName?: string
  customerDocument?: string
  companyId?: number
  buildingId?: number
  buildingName?: string
  unitId?: number
  contractId?: number
  installmentId?: number
  dueDate?: string
  daysOverdue?: number
  originalValue?: number
  correctedValue?: number
  openBalance?: number
  [key: string]: unknown
}

export async function listarBulkDefaultersSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  filtros?: { companyId?: number; buildingId?: number },
): Promise<SiengeBulkDefaulter[]> {
  const params = new URLSearchParams()
  if (filtros?.companyId) params.set("companyId", String(filtros.companyId))
  if (filtros?.buildingId) params.set("buildingId", String(filtros.buildingId))
  const qs = params.toString() ? `?${params.toString()}` : ""
  const data = await siengeGet(subdominio, usuario, senha, `/bulk-data/v1/defaulters${qs}`)
  return normalizeList(data) as SiengeBulkDefaulter[]
}

// ─── Bulk Data — Saldos Contábeis ────────────────────────────────────────────

export interface SiengeBulkAccountBalance {
  accountId?: number
  accountCode?: string
  accountName?: string
  companyId?: number
  costCenterId?: number
  costCenterName?: string
  currentBalance?: number
  previousBalance?: number
  debitTotal?: number
  creditTotal?: number
  referenceDate?: string
  [key: string]: unknown
}

export async function listarBulkAccountBalancesSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  filtros?: { companyId?: number; costCenterId?: number; referenceDate?: string },
): Promise<SiengeBulkAccountBalance[]> {
  const params = new URLSearchParams()
  if (filtros?.companyId) params.set("companyId", String(filtros.companyId))
  if (filtros?.costCenterId) params.set("costCenterId", String(filtros.costCenterId))
  if (filtros?.referenceDate) params.set("referenceDate", filtros.referenceDate)
  const qs = params.toString() ? `?${params.toString()}` : ""
  const data = await siengeGet(subdominio, usuario, senha, `/bulk-data/v1/account-balances${qs}`)
  return normalizeList(data) as SiengeBulkAccountBalance[]
}

// ─── Bulk Data — Orçamentos Empresariais ─────────────────────────────────────

export interface SiengeBulkBusinessBudget {
  budgetId?: number
  companyId?: number
  buildingId?: number
  buildingName?: string
  budgetName?: string
  budgetVersion?: number
  status?: string
  totalValue?: number
  startDate?: string
  endDate?: string
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export async function listarBulkBusinessBudgetsSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  filtros?: { companyId?: number; buildingId?: number },
): Promise<SiengeBulkBusinessBudget[]> {
  const params = new URLSearchParams()
  if (filtros?.companyId) params.set("companyId", String(filtros.companyId))
  if (filtros?.buildingId) params.set("buildingId", String(filtros.buildingId))
  const qs = params.toString() ? `?${params.toString()}` : ""
  const data = await siengeGet(subdominio, usuario, senha, `/bulk-data/v1/business-budgets${qs}`)
  return normalizeList(data) as SiengeBulkBusinessBudget[]
}

// ─── Bulk Data — Async Status & Result ───────────────────────────────────────

export interface SiengeBulkAsyncStatus {
  id?: string
  status?: string
  progress?: number
  totalChunks?: number
  createdAt?: string
  completedAt?: string
  errorMessage?: string
  [key: string]: unknown
}

export interface SiengeBulkAsyncResult {
  chunkIndex?: number
  totalChunks?: number
  data?: unknown[]
  [key: string]: unknown
}

export async function consultarBulkAsyncStatusSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  asyncId: string,
): Promise<SiengeBulkAsyncStatus> {
  const data = await siengeGet(subdominio, usuario, senha, `/bulk-data/v1/async/${asyncId}`)
  return data as SiengeBulkAsyncStatus
}

export async function consultarBulkAsyncResultSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  asyncId: string,
  chunk: number,
): Promise<SiengeBulkAsyncResult> {
  const data = await siengeGet(subdominio, usuario, senha, `/bulk-data/v1/async/${asyncId}/result/${chunk}`)
  return data as SiengeBulkAsyncResult
}

// ─── Cotações — Negociações ──────────────────────────────────────────────────

export interface SiengeNegociacao {
  id?: number
  supplierId?: number
  supplierName?: string
  quotationId?: number
  status?: string
  createdAt?: string
  updatedAt?: string
  totalValue?: number
  observation?: string
  [key: string]: unknown
}

export async function listarNegociacoesCotacaoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
): Promise<SiengeNegociacao[]> {
  const data = await siengeGet(subdominio, usuario, senha, `/purchase-quotations/all/negotiations`)
  return normalizeList(data) as SiengeNegociacao[]
}

// ─── Cotações — Criar item ──────────────────────────────────────────────────

export interface CriarItemCotacaoInput {
  materialId?: number
  description?: string
  quantity: number
  unit: string
}

export async function criarItemCotacaoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  cotacaoId: number,
  data: CriarItemCotacaoInput,
): Promise<{ sucesso: boolean }> {
  const res = await fetch(
    `${BASE(subdominio)}/purchase-quotations/${cotacaoId}/items`,
    {
      method: "POST",
      headers: { Authorization: authHeader(usuario, senha), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  )
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return { sucesso: true }
}

// ─── Cotações — Incluir fornecedor no item ──────────────────────────────────

export async function incluirFornecedorItemCotacaoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  cotacaoId: number,
  itemNumber: number,
  data: { creditorId: number },
): Promise<{ sucesso: boolean }> {
  const res = await fetch(
    `${BASE(subdominio)}/purchase-quotations/${cotacaoId}/items/${itemNumber}/suppliers`,
    {
      method: "POST",
      headers: { Authorization: authHeader(usuario, senha), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  )
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return { sucesso: true }
}

// ─── Cotações — Nova negociação com fornecedor ──────────────────────────────

export async function criarNegociacaoCotacaoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  cotacaoId: number,
  supplierId: number,
  data: { observation?: string; [key: string]: unknown },
): Promise<{ sucesso: boolean }> {
  const res = await fetch(
    `${BASE(subdominio)}/purchase-quotations/${cotacaoId}/suppliers/${supplierId}/negotiations`,
    {
      method: "POST",
      headers: { Authorization: authHeader(usuario, senha), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  )
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return { sucesso: true }
}

// ─── Cotações — Atualizar negociação ────────────────────────────────────────

export async function atualizarNegociacaoCotacaoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  cotacaoId: number,
  supplierId: number,
  negotiationNumber: number,
  data: Record<string, unknown>,
): Promise<{ sucesso: boolean }> {
  const res = await fetch(
    `${BASE(subdominio)}/purchase-quotations/${cotacaoId}/suppliers/${supplierId}/negotiations/${negotiationNumber}`,
    {
      method: "PUT",
      headers: { Authorization: authHeader(usuario, senha), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  )
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return { sucesso: true }
}

// ─── Cotações — Atualizar item de negociação ────────────────────────────────

export async function atualizarItemNegociacaoCotacaoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  cotacaoId: number,
  supplierId: number,
  negotiationNumber: number,
  itemNumber: number,
  data: Record<string, unknown>,
): Promise<{ sucesso: boolean }> {
  const res = await fetch(
    `${BASE(subdominio)}/purchase-quotations/${cotacaoId}/suppliers/${supplierId}/negotiations/${negotiationNumber}/items/${itemNumber}`,
    {
      method: "PUT",
      headers: { Authorization: authHeader(usuario, senha), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
  )
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return { sucesso: true }
}

// ─── Estoque — Apropriações de obra do inventário ───────────────────────────

export interface StockInventoryBuildingAppropriation {
  buildingId?: number
  buildingName?: string
  quantity?: number
  unitCost?: number
  totalCost?: number
  [key: string]: unknown
}

export async function listarApropriacoesInventarioSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  inventoryCountId: number,
  resourceId: number,
): Promise<StockInventoryBuildingAppropriation[]> {
  const data = await siengeGet(
    subdominio, usuario, senha,
    `/stock-inventories/${inventoryCountId}/items/${resourceId}/building-appropriation`,
  )
  return normalizeList(data) as StockInventoryBuildingAppropriation[]
}

// ─── Estoque — Itens da reserva ─────────────────────────────────────────────

export interface ReservaEstoqueItemSienge {
  sequentialNumber?: number
  resourceId?: number
  resourceDescription?: string
  quantity?: number
  attendedQuantity?: number
  unit?: string
  [key: string]: unknown
}

export async function listarItensReservaEstoqueSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  reservaId: number,
): Promise<ReservaEstoqueItemSienge[]> {
  const data = await siengeGet(
    subdominio, usuario, senha,
    `/stock-reservations/${reservaId}/items`,
  )
  return normalizeList(data) as ReservaEstoqueItemSienge[]
}

// ─── Estoque — Movimentações de inventário ──────────────────────────────────

export interface MovimentacaoInventarioSienge {
  id?: number
  type?: string
  date?: string
  resourceId?: number
  resourceDescription?: string
  quantity?: number
  buildingId?: number
  buildingName?: string
  [key: string]: unknown
}

export async function listarMovimentacoesInventarioSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  params?: { startDate?: string; endDate?: string; buildingId?: number },
): Promise<MovimentacaoInventarioSienge[]> {
  const qsParts: string[] = []
  if (params?.startDate) qsParts.push(`startDate=${params.startDate}`)
  if (params?.endDate) qsParts.push(`endDate=${params.endDate}`)
  if (params?.buildingId) qsParts.push(`buildingId=${params.buildingId}`)
  const qs = qsParts.length ? `?${qsParts.join("&")}` : ""
  const data = await siengeGet(subdominio, usuario, senha, `/inventory-movements${qs}`)
  return normalizeList(data) as MovimentacaoInventarioSienge[]
}

// ─── Estoque — Buscar movimentação específica ───────────────────────────────

export async function buscarMovimentacaoInventarioSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  movimentacaoId: number,
): Promise<MovimentacaoInventarioSienge> {
  const data = await siengeGet(subdominio, usuario, senha, `/inventory-movements/${movimentacaoId}`)
  return data as MovimentacaoInventarioSienge
}

// ─── Diário de Obra — Sub-recursos ──────────────────────────────────────────

export interface DiarioObraDetalhe {
  id: number
  buildingId: number
  date: string
  weather?: string
  observations?: string
  [key: string]: unknown
}

export async function buscarDiarioObraSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  buildingId: number,
  dailyReportId: number,
): Promise<DiarioObraDetalhe> {
  const data = await siengeGet(subdominio, usuario, senha, `/construction-daily-report/${buildingId}/${dailyReportId}`)
  return data as DiarioObraDetalhe
}

export async function deletarDiarioObraSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  buildingId: number,
  dailyReportId: number,
): Promise<{ sucesso: boolean }> {
  const res = await fetch(
    `${BASE(subdominio)}/construction-daily-report/${buildingId}/${dailyReportId}`,
    {
      method: "DELETE",
      headers: { Authorization: authHeader(usuario, senha) },
    },
  )
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return { sucesso: true }
}

export interface DiarioObraEvento {
  [key: string]: unknown
}

export async function incluirOcorrenciasDiarioObraSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  buildingId: number,
  dailyReportId: number,
  events: DiarioObraEvento[],
): Promise<{ sucesso: boolean }> {
  const res = await fetch(
    `${BASE(subdominio)}/construction-daily-report/${buildingId}/${dailyReportId}/events`,
    {
      method: "POST",
      headers: { Authorization: authHeader(usuario, senha), "Content-Type": "application/json" },
      body: JSON.stringify(events),
    },
  )
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return { sucesso: true }
}

export async function atualizarOcorrenciasDiarioObraSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  buildingId: number,
  dailyReportId: number,
  events: DiarioObraEvento[],
): Promise<{ sucesso: boolean }> {
  const res = await fetch(
    `${BASE(subdominio)}/construction-daily-report/${buildingId}/${dailyReportId}/events`,
    {
      method: "PUT",
      headers: { Authorization: authHeader(usuario, senha), "Content-Type": "application/json" },
      body: JSON.stringify(events),
    },
  )
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return { sucesso: true }
}

export interface DiarioObraTarefa {
  [key: string]: unknown
}

export async function incluirTarefasDiarioObraSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  buildingId: number,
  dailyReportId: number,
  tasks: DiarioObraTarefa[],
): Promise<{ sucesso: boolean }> {
  const res = await fetch(
    `${BASE(subdominio)}/construction-daily-report/${buildingId}/${dailyReportId}/tasks`,
    {
      method: "POST",
      headers: { Authorization: authHeader(usuario, senha), "Content-Type": "application/json" },
      body: JSON.stringify(tasks),
    },
  )
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return { sucesso: true }
}

// ─── Diário de Obra — Atualizar tarefas ─────────────────────────────────────

export async function atualizarTarefasDiarioObraSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  buildingId: number,
  dailyReportId: number,
  tasks: DiarioObraTarefa[],
): Promise<{ sucesso: boolean }> {
  const res = await fetch(
    `${BASE(subdominio)}/construction-daily-report/${buildingId}/${dailyReportId}/tasks`,
    {
      method: "PUT",
      headers: { Authorization: authHeader(usuario, senha), "Content-Type": "application/json" },
      body: JSON.stringify(tasks),
    },
  )
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return { sucesso: true }
}

// ─── Diário de Obra — Incluir equipes ───────────────────────────────────────

export interface DiarioObraEquipe {
  [key: string]: unknown
}

export async function incluirEquipesDiarioObraSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  buildingId: number,
  dailyReportId: number,
  crews: DiarioObraEquipe[],
): Promise<{ sucesso: boolean }> {
  const res = await fetch(
    `${BASE(subdominio)}/construction-daily-report/${buildingId}/${dailyReportId}/crews`,
    {
      method: "POST",
      headers: { Authorization: authHeader(usuario, senha), "Content-Type": "application/json" },
      body: JSON.stringify(crews),
    },
  )
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return { sucesso: true }
}

// ─── Diário de Obra — Atualizar equipes ─────────────────────────────────────

export async function atualizarEquipesDiarioObraSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  buildingId: number,
  dailyReportId: number,
  crews: DiarioObraEquipe[],
): Promise<{ sucesso: boolean }> {
  const res = await fetch(
    `${BASE(subdominio)}/construction-daily-report/${buildingId}/${dailyReportId}/crews`,
    {
      method: "PUT",
      headers: { Authorization: authHeader(usuario, senha), "Content-Type": "application/json" },
      body: JSON.stringify(crews),
    },
  )
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return { sucesso: true }
}

// ─── Diário de Obra — Incluir equipamentos ──────────────────────────────────

export interface DiarioObraEquipamento {
  [key: string]: unknown
}

export async function incluirEquipamentosDiarioObraSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  buildingId: number,
  dailyReportId: number,
  equipments: DiarioObraEquipamento[],
): Promise<{ sucesso: boolean }> {
  const res = await fetch(
    `${BASE(subdominio)}/construction-daily-report/${buildingId}/${dailyReportId}/equipments`,
    {
      method: "POST",
      headers: { Authorization: authHeader(usuario, senha), "Content-Type": "application/json" },
      body: JSON.stringify(equipments),
    },
  )
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return { sucesso: true }
}

// ─── Diário de Obra — Atualizar equipamentos ────────────────────────────────

export async function atualizarEquipamentosDiarioObraSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  buildingId: number,
  dailyReportId: number,
  equipments: DiarioObraEquipamento[],
): Promise<{ sucesso: boolean }> {
  const res = await fetch(
    `${BASE(subdominio)}/construction-daily-report/${buildingId}/${dailyReportId}/equipments`,
    {
      method: "PUT",
      headers: { Authorization: authHeader(usuario, senha), "Content-Type": "application/json" },
      body: JSON.stringify(equipments),
    },
  )
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return { sucesso: true }
}

// ─── Diário de Obra — Tipos de ocorrência e tipos disponíveis ───────────────

export async function listarTiposOcorrenciaDiarioObraSienge(
  subdominio: string,
  usuario: string,
  senha: string,
): Promise<unknown[]> {
  const data = await siengeGet(subdominio, usuario, senha, `/construction-daily-report/event-type`)
  return normalizeList(data)
}

export async function listarTiposDiarioObraSienge(
  subdominio: string,
  usuario: string,
  senha: string,
): Promise<unknown[]> {
  const data = await siengeGet(subdominio, usuario, senha, `/construction-daily-report/types`)
  return normalizeList(data)
}

// ─── Orçamento de Obra — Insumos (resources) ────────────────────────────────

export async function adicionarInsumoOrcamentoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  estimationId: number,
  payload: Record<string, unknown>,
): Promise<{ id?: number; sucesso: boolean }> {
  const res = await fetch(
    `${BASE(subdominio)}/building-cost-estimations/${estimationId}/resources`,
    {
      method: "POST",
      headers: { Authorization: authHeader(usuario, senha), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  )
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  const json = await res.json().catch(() => ({}))
  return { id: json.id, sucesso: true }
}

export async function buscarInsumoOrcamentoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  estimationId: number,
  resourceId: number,
): Promise<unknown> {
  return siengeGet(subdominio, usuario, senha, `/building-cost-estimations/${estimationId}/resources/${resourceId}`)
}

export async function atualizarInsumoOrcamentoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  estimationId: number,
  resourceId: number,
  payload: Record<string, unknown>,
): Promise<{ sucesso: boolean }> {
  const res = await fetch(
    `${BASE(subdominio)}/building-cost-estimations/${estimationId}/resources/${resourceId}`,
    {
      method: "PATCH",
      headers: { Authorization: authHeader(usuario, senha), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  )
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return { sucesso: true }
}

// ─── Orçamento de Obra — Planilhas da versão atual ──────────────────────────

export async function listarPlanilhasOrcamentoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  estimationId: number,
): Promise<unknown[]> {
  const data = await siengeGet(subdominio, usuario, senha, `/building-cost-estimations/${estimationId}/sheets`)
  return normalizeList(data)
}

// ─── Planejamento de Obra — Inserir tarefas em nova versão ──────────────────

export async function inserirTarefasPlanilhaSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  buildingId: number,
  sheetUid: string,
  tasks: Record<string, unknown>[],
): Promise<{ sucesso: boolean }> {
  const res = await fetch(
    `${BASE(subdominio)}/building-projects/${buildingId}/sheets/${sheetUid}/tasks`,
    {
      method: "PUT",
      headers: { Authorization: authHeader(usuario, senha), "Content-Type": "application/json" },
      body: JSON.stringify(tasks),
    },
  )
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return { sucesso: true }
}

// ─── Cotações — Autorizar negociação ────────────────────────────────────────

export async function autorizarNegociacaoCotacaoSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  cotacaoId: number,
  supplierId: number,
): Promise<{ sucesso: boolean }> {
  const res = await fetch(
    `${BASE(subdominio)}/purchase-quotations/${cotacaoId}/suppliers/${supplierId}/negotiations/latest/authorize`,
    {
      method: "PATCH",
      headers: { Authorization: authHeader(usuario, senha), "Content-Type": "application/json" },
    },
  )
  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${body.slice(0, 200)}`)
  }
  return { sucesso: true }
}

// ─── Notas Fiscais de Compra (Purchase Invoices) ─────────────────────────────

export interface SiengePurchaseInvoiceInput {
  supplierId: number
  companyId: number
  buildingId?: number
  invoiceNumber?: string
  serialNumber?: string
  issueDate?: string
  arrivalDate?: string
  cfop?: string
  [key: string]: unknown
}

export async function cadastrarPurchaseInvoiceSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  body: SiengePurchaseInvoiceInput,
): Promise<{ id: number }> {
  const res = await fetch(
    `${BASE(subdominio)}/purchase-invoices`,
    {
      method: "POST",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    },
  )
  if (!res.ok) {
    const b = await res.text().catch(() => "")
    throw new Error(`Sienge ${res.status}: ${b.slice(0, 200)}`)
  }
  const location = res.headers.get("Location") ?? ""
  const idMatch = location.match(/\/(\d+)$/)
  if (idMatch) return { id: Number(idMatch[1]) }
  const json = await res.json().catch(() => ({})) as Record<string, unknown>
  return { id: (json.id as number) ?? 0 }
}

export interface SiengePurchaseInvoice {
  id: number
  supplierId?: number
  companyId?: number
  buildingId?: number
  invoiceNumber?: string
  serialNumber?: string
  issueDate?: string
  arrivalDate?: string
  cfop?: string
  totalValue?: number
  status?: string
  [key: string]: unknown
}

export async function buscarPurchaseInvoiceSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  invoiceId: number,
): Promise<SiengePurchaseInvoice | null> {
  try {
    const data = await siengeGet(subdominio, usuario, senha, `/purchase-invoices/${invoiceId}`)
    return data as SiengePurchaseInvoice
  } catch { return null }
}

export interface SiengePurchaseInvoiceItem {
  itemNumber: number
  resourceId?: number
  description?: string
  quantity?: number
  unitPrice?: number
  totalPrice?: number
  unitOfMeasure?: string
  [key: string]: unknown
}

export async function listarItensPurchaseInvoiceSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  invoiceId: number,
): Promise<SiengePurchaseInvoiceItem[]> {
  try {
    const data = await siengeGet(subdominio, usuario, senha, `/purchase-invoices/${invoiceId}/items`)
    return normalizeList(data) as SiengePurchaseInvoiceItem[]
  } catch { return [] }
}

export interface SiengePurchaseInvoiceItemBuildingAppropriation {
  buildingId: number
  buildingName?: string
  percentage?: number
  value?: number
  [key: string]: unknown
}

export async function listarBuildingsAppropriationsNfItemSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  invoiceId: number,
  itemNumber: number,
): Promise<SiengePurchaseInvoiceItemBuildingAppropriation[]> {
  try {
    const data = await siengeGet(
      subdominio, usuario, senha,
      `/purchase-invoices/${invoiceId}/items/${itemNumber}/buildings-appropriations`,
    )
    return normalizeList(data) as SiengePurchaseInvoiceItemBuildingAppropriation[]
  } catch { return [] }
}

// ─── Extrato Financeiro de Cliente ───────────────────────────────────────────

export interface SiengeCustomerFinancialStatement {
  id?: number
  customerId: number
  date?: string
  description?: string
  value?: number
  balance?: number
  type?: string
  [key: string]: unknown
}

export async function listarExtratoClienteSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  customerId: number,
  params?: { startDate?: string; endDate?: string; offset?: number; limit?: number },
): Promise<SiengeCustomerFinancialStatement[]> {
  try {
    const qs = new URLSearchParams()
    qs.set("customerId", String(customerId))
    if (params?.startDate) qs.set("startDate", params.startDate)
    if (params?.endDate) qs.set("endDate", params.endDate)
    if (params?.offset) qs.set("offset", String(params.offset))
    if (params?.limit) qs.set("limit", String(params.limit))
    const data = await siengeGet(subdominio, usuario, senha, `/customer-financial-statements?${qs}`)
    return normalizeList(data) as SiengeCustomerFinancialStatement[]
  } catch { return [] }
}

export async function enviarExtratoClienteEmailSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  customerId: number,
  email: string,
  startDate?: string,
  endDate?: string,
): Promise<{ sucesso: boolean }> {
  try {
    const body: Record<string, unknown> = { customerId, email }
    if (startDate) body.startDate = startDate
    if (endDate) body.endDate = endDate
    const res = await fetch(`${BASE(subdominio)}/customer-financial-statements`, {
      method: "POST",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
    return { sucesso: res.ok }
  } catch { return { sucesso: false } }
}

// ─── Lançamentos Contábeis (CRUD) ────────────────────────────────────────────

export interface SiengeLancamentoContabil {
  id?: number
  companyId?: number
  accountCode?: string
  costCenterCode?: string
  description?: string
  value?: number
  date?: string
  documentNumber?: string
  debitOrCredit?: "D" | "C"
  [key: string]: unknown
}

export async function listarLancamentosContabeisSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  companyId: number,
  params?: { startDate?: string; endDate?: string; offset?: number; limit?: number },
): Promise<SiengeLancamentoContabil[]> {
  try {
    const qs = new URLSearchParams()
    qs.set("companyId", String(companyId))
    if (params?.startDate) qs.set("startDate", params.startDate)
    if (params?.endDate) qs.set("endDate", params.endDate)
    if (params?.offset) qs.set("offset", String(params.offset))
    if (params?.limit) qs.set("limit", String(params.limit))
    const data = await siengeGet(subdominio, usuario, senha, `/accountancy/entries?${qs}`)
    return normalizeList(data) as SiengeLancamentoContabil[]
  } catch { return [] }
}

export async function salvarLancamentosContabeisSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  entries: SiengeLancamentoContabil[],
): Promise<{ sucesso: boolean }> {
  try {
    const res = await fetch(`${BASE(subdominio)}/accountancy/entries`, {
      method: "POST",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ entries }),
    })
    return { sucesso: res.ok }
  } catch { return { sucesso: false } }
}

export async function salvarLancamentosContabeisAsyncSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  entries: SiengeLancamentoContabil[],
): Promise<{ asyncId?: string; sucesso: boolean }> {
  try {
    const res = await fetch(`${BASE(subdominio)}/accountancy/entries/async`, {
      method: "POST",
      headers: {
        Authorization: authHeader(usuario, senha),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ entries }),
    })
    if (!res.ok) return { sucesso: false }
    const data = await res.json() as { id?: string }
    return { asyncId: data.id, sucesso: true }
  } catch { return { sucesso: false } }
}

export async function statusLancamentosContabeisAsyncSienge(
  subdominio: string,
  usuario: string,
  senha: string,
): Promise<{ status?: string; progress?: number; [key: string]: unknown }> {
  try {
    const data = await siengeGet(subdominio, usuario, senha, `/accountancy/entries/async/status`)
    return data as { status?: string; progress?: number; [key: string]: unknown }
  } catch { return { status: "unknown" } }
}

// ─── Contas a Receber — Apropriações Financeiras ─────────────────────────────

export interface SiengeReceivableBudgetCategory {
  budgetCategoryId: number
  budgetCategoryName?: string
  percentage?: number
  value?: number
  [key: string]: unknown
}

export async function listarBudgetCategoriesReceivableSienge(
  subdominio: string,
  usuario: string,
  senha: string,
  billId: number,
): Promise<SiengeReceivableBudgetCategory[]> {
  try {
    const data = await siengeGet(
      subdominio, usuario, senha,
      `/accounts-receivable/${billId}/budget-categories`,
    )
    return normalizeList(data) as SiengeReceivableBudgetCategory[]
  } catch { return [] }
}
