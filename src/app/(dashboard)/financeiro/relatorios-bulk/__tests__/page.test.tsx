import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"

/* ─── Mock tRPC ──────────────────────────────────────────────── */
const mockUseQuery = vi.fn()
vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    sienge: {
      listarBulkAccountBalances: { useQuery: (...args: unknown[]) => mockUseQuery("listarBulkAccountBalances", ...args) },
      listarBulkBankMovements: { useQuery: (...args: unknown[]) => mockUseQuery("listarBulkBankMovements", ...args) },
      listarBulkBillPayablesInstallments: { useQuery: (...args: unknown[]) => mockUseQuery("listarBulkBillPayablesInstallments", ...args) },
      listarBulkReceivableInstallments: { useQuery: (...args: unknown[]) => mockUseQuery("listarBulkReceivableInstallments", ...args) },
      listarBulkCustomerExtractHistory: { useQuery: (...args: unknown[]) => mockUseQuery("listarBulkCustomerExtractHistory", ...args) },
      listarBulkInvoiceItens: { useQuery: (...args: unknown[]) => mockUseQuery("listarBulkInvoiceItens", ...args) },
    },
  },
}))

vi.mock("@/lib/format", () => ({
  formatMoeda: (v: number) => `R$ ${v.toFixed(2)}`,
}))

vi.mock("@/lib/utils", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}))

import RelatoriosBulkPage from "../page"

function clickTabByText(text: string) {
  const allButtons = screen.getAllByRole("button")
  const tab = allButtons.find(btn => btn.textContent?.includes(text))
  if (!tab) throw new Error(`Tab with text "${text}" not found`)
  fireEvent.click(tab)
}

describe("RelatoriosBulkPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, isError: false })
  })

  it("renders the page title and all 6 tabs", () => {
    render(<RelatoriosBulkPage />)
    expect(screen.getByText("Relatórios Financeiros Bulk")).toBeTruthy()
    expect(screen.getByText("Saldos Contábeis")).toBeTruthy()
    expect(screen.getByText("Movimentos Bancários")).toBeTruthy()
    expect(screen.getByText("Parcelas a Pagar")).toBeTruthy()
    expect(screen.getByText("Parcelas a Receber")).toBeTruthy()
    expect(screen.getByText("Itens de NF")).toBeTruthy()
  })

  it("shows Consultar button on default tab", () => {
    render(<RelatoriosBulkPage />)
    const buttons = screen.getAllByRole("button")
    const consultar = buttons.filter(b => b.textContent?.includes("Consultar"))
    expect(consultar.length).toBeGreaterThanOrEqual(1)
  })

  it("switches tabs when clicking a tab button", () => {
    render(<RelatoriosBulkPage />)
    clickTabByText("Movimentos Bancários")
    expect(screen.getByText("Movimentações de caixa e bancos")).toBeTruthy()
  })

  it("shows loading spinner when query is loading", () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true, isError: false })
    render(<RelatoriosBulkPage />)
    expect(screen.getByText(/Carregando saldos contábeis/)).toBeTruthy()
  })

  it("shows table with data from bulk account balances", () => {
    mockUseQuery.mockReturnValue({
      data: [
        { conta: "1.1.01", descricao: "Caixa Geral", saldo: 15000 },
        { conta: "1.1.02", descricao: "Banco Itaú", saldo: 42000 },
      ],
      isLoading: false,
      isError: false,
    })
    render(<RelatoriosBulkPage />)
    // Click Consultar to enable the display
    const buttons = screen.getAllByRole("button")
    const consultar = buttons.find(b => b.textContent?.includes("Consultar"))
    if (consultar) fireEvent.click(consultar)
    expect(screen.getAllByText("Caixa Geral").length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText("R$ 42000.00").length).toBeGreaterThanOrEqual(1)
  })

  it("shows Customer ID field on Extrato de Clientes tab", () => {
    render(<RelatoriosBulkPage />)
    clickTabByText("Extrato de Clientes")
    expect(screen.getByText("Cliente")).toBeTruthy()
  })
})
