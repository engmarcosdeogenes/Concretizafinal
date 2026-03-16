import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    sienge: {
      listarExtratoCliente: {
        useQuery: vi.fn().mockReturnValue({ data: [], isLoading: false }),
      },
      getExtratoPdfUrl: {
        useQuery: vi.fn().mockReturnValue({ data: null, isLoading: false }),
      },
      enviarExtratoClienteEmail: {
        useMutation: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
      },
      getInformeIRPdfUrl: {
        useQuery: vi.fn().mockReturnValue({ data: null, isLoading: false }),
      },
      enviarInformeIREmail: {
        useMutation: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
      },
      obterSaldoDevedor: {
        useQuery: vi.fn().mockReturnValue({ data: null, isLoading: false }),
      },
      enviarSaldoDevedorEmail: {
        useMutation: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
      },
    },
  },
}))

vi.mock("@/lib/format", () => ({
  formatMoeda: (v: number) => `R$ ${v.toFixed(2)}`,
}))

vi.mock("@/lib/utils", () => ({ cn: (...args: unknown[]) => args.filter(Boolean).join(" ") }))

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

import DocumentosFinanceirosPage from "../page"

describe("DocumentosFinanceirosPage", () => {
  it("renders page title and tabs", () => {
    render(<DocumentosFinanceirosPage />)
    expect(screen.getByText("Documentos Financeiros")).toBeDefined()
    expect(screen.getByText("Extrato do Cliente")).toBeDefined()
    expect(screen.getByText("Informe de IR")).toBeDefined()
    expect(screen.getByText("Saldo Devedor")).toBeDefined()
  })

  it("shows extrato tab by default with consultar button", () => {
    render(<DocumentosFinanceirosPage />)
    expect(screen.getByText("Consultar")).toBeDefined()
    expect(screen.getByPlaceholderText("Ex: 1234")).toBeDefined()
  })

  it("disables consultar when customerId is empty", () => {
    render(<DocumentosFinanceirosPage />)
    const btn = screen.getByText("Consultar")
    expect(btn.closest("button")?.disabled).toBe(true)
  })

  it("enables consultar when customerId is provided", () => {
    render(<DocumentosFinanceirosPage />)
    const input = screen.getByPlaceholderText("Ex: 1234")
    fireEvent.change(input, { target: { value: "100" } })
    const btn = screen.getByText("Consultar")
    expect(btn.closest("button")?.disabled).toBe(false)
  })

  it("switches to Informe de IR tab", () => {
    render(<DocumentosFinanceirosPage />)
    fireEvent.click(screen.getByText("Informe de IR"))
    expect(screen.getByText("Gerar Informe")).toBeDefined()
  })

  it("switches to Saldo Devedor tab", () => {
    render(<DocumentosFinanceirosPage />)
    fireEvent.click(screen.getByText("Saldo Devedor"))
    // Should show a consultar button in saldo tab
    expect(screen.getAllByPlaceholderText("Ex: 1234").length).toBeGreaterThan(0)
  })

  it("shows link to boletos page", () => {
    render(<DocumentosFinanceirosPage />)
    expect(screen.getByText("Envio de 2ª Via de Boletos")).toBeDefined()
  })
})
