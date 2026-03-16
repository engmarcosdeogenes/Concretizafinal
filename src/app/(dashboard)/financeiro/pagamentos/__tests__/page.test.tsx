import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

// Mock tRPC
vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    sienge: {
      buscarPaymentInfo: {
        useQuery: vi.fn().mockReturnValue({ data: null, isLoading: false, refetch: vi.fn() }),
      },
      atualizarPaymentInfo: {
        useMutation: vi.fn().mockReturnValue({ mutate: vi.fn(), isLoading: false }),
      },
    },
  },
}))

vi.mock("@/lib/utils", () => ({ cn: (...args: unknown[]) => args.filter(Boolean).join(" ") }))

import PagamentosPage from "../page"

describe("PagamentosPage", () => {
  it("renders header and search form", () => {
    render(<PagamentosPage />)
    expect(screen.getByText("Pagamentos e Info Bancaria")).toBeDefined()
    expect(screen.getByText("Consultar")).toBeDefined()
    expect(screen.getByText("Buscar Parcela")).toBeDefined()
  })

  it("disables search button when inputs are empty", () => {
    render(<PagamentosPage />)
    const btn = screen.getByText("Consultar")
    expect(btn.closest("button")?.disabled).toBe(true)
  })

  it("shows all payment type options", () => {
    render(<PagamentosPage />)
    expect(screen.getByText("PIX")).toBeDefined()
    expect(screen.getByText("Transferencia Bancaria")).toBeDefined()
    expect(screen.getByText("Boleto Bancario")).toBeDefined()
    expect(screen.getByText("DARF")).toBeDefined()
  })

  it("enables search button when billId and installmentId are provided", () => {
    render(<PagamentosPage />)
    const inputs = screen.getAllByRole("spinbutton")
    fireEvent.change(inputs[0], { target: { value: "100" } })
    fireEvent.change(inputs[1], { target: { value: "1" } })
    const btn = screen.getByText("Consultar")
    expect(btn.closest("button")?.disabled).toBe(false)
  })
})
