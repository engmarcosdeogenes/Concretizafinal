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
  cpf?: string
  cnpj?: string
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

// ── RDOs por Obra ─────────────────────────────────────────────────────────────

export interface SiengeRDO {
  id: number
  buildingId?: number
  date?: string
  status?: string
  [key: string]: unknown
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
