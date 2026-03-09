const BASE = (sub: string) =>
  `https://api.sienge.com.br/${sub}/public/api/v1`

function authHeader(usuario: string, senha: string) {
  return "Basic " + Buffer.from(`${usuario}:${senha}`).toString("base64")
}

function normalizeList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  const d = data as Record<string, unknown>
  const list = d["results"] ?? d["resultset"] ?? d["data"] ?? []
  return Array.isArray(list) ? list : []
}

async function siengeGet(subdominio: string, usuario: string, senha: string, path: string) {
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
