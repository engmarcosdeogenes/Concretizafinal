import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

/* ─── Mock tRPC ──────────────────────────────────────────────── */
const mockUseQuery = vi.fn()
vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    sienge: {
      listarSaldos: { useQuery: (...args: unknown[]) => mockUseQuery("listarSaldos", ...args) },
      listarInadimplentes: { useQuery: (...args: unknown[]) => mockUseQuery("listarInadimplentes", ...args) },
      listarBulkDefaulters: { useQuery: (...args: unknown[]) => mockUseQuery("listarBulkDefaulters", ...args) },
    },
  },
}))

vi.mock("@/lib/format", () => ({
  formatMoeda: (v: number) => `R$ ${v.toFixed(2)}`,
}))

vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}))

import InadimplenciaPage from "../page"

describe("InadimplenciaPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseQuery.mockImplementation((name: string) => {
      if (name === "listarSaldos") {
        return {
          data: [
            { id: 1, name: "Conta Principal", bankName: "Banco X", saldo: 50000 },
            { id: 2, name: "Conta Poupança", bankName: "Banco Y", saldo: 12000 },
          ],
          isLoading: false,
          isError: false,
        }
      }
      if (name === "listarInadimplentes") {
        return {
          data: [
            {
              clienteNome: "João Silva",
              clienteDocumento: "12345678901",
              totalEmAberto: 5000,
              quantidadeTitulos: 3,
              maiorAtraso: 45,
              titulos: [],
            },
          ],
          isLoading: false,
          isError: false,
        }
      }
      if (name === "listarBulkDefaulters") {
        return { data: [], isLoading: false, isError: false }
      }
      return { data: undefined, isLoading: false, isError: false }
    })
  })

  it("renders page title", () => {
    render(<InadimplenciaPage />)
    expect(screen.getByText("Inadimplência & Saldos")).toBeDefined()
  })

  it("shows three tabs", () => {
    render(<InadimplenciaPage />)
    expect(screen.getByText("Resumo & Saldos")).toBeDefined()
    expect(screen.getByText("Inadimplentes")).toBeDefined()
    expect(screen.getByText("Detalhamento Bulk")).toBeDefined()
  })

  it("displays KPI cards on resumo tab", () => {
    render(<InadimplenciaPage />)
    expect(screen.getByText("R$ 62000.00")).toBeDefined() // total saldos
    expect(screen.getByText("R$ 5000.00")).toBeDefined() // total inadimplencia
    expect(screen.getByText("3")).toBeDefined() // titulos
    expect(screen.getByText("45")).toBeDefined() // maior atraso
  })

  it("shows bank accounts table", () => {
    render(<InadimplenciaPage />)
    expect(screen.getByText("Conta Principal")).toBeDefined()
    expect(screen.getByText("Banco X")).toBeDefined()
  })

  it("switches to inadimplentes tab", () => {
    render(<InadimplenciaPage />)
    fireEvent.click(screen.getByText("Inadimplentes"))
    expect(screen.getByText("João Silva")).toBeDefined()
    expect(screen.getByText("Doc: 12345678901")).toBeDefined()
  })

  it("switches to bulk tab", () => {
    render(<InadimplenciaPage />)
    fireEvent.click(screen.getByText("Detalhamento Bulk"))
    expect(screen.getByText("Buscar Inadimplentes")).toBeDefined()
  })

  it("shows loading state", () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    render(<InadimplenciaPage />)
    expect(screen.getByText("Carregando resumo...")).toBeDefined()
  })
})
