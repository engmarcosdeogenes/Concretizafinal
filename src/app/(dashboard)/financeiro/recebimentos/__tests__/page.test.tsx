/**
 * @jest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    sienge: {
      listarContasReceber: { useQuery: () => ({ data: [], isLoading: false }) },
      listarInadimplentes: { useQuery: () => ({ data: [], isLoading: false }) },
      buscarReceivableBill: { useQuery: () => ({ data: null, isLoading: false }) },
      listarParcReceivableBill: { useQuery: () => ({ data: [], isLoading: false }) },
      listarBudgetCategoriesReceivable: { useQuery: () => ({ data: [], isLoading: false }) },
      alterarVencimentoReceivableBill: { useMutation: () => ({ mutate: vi.fn(), isLoading: false }) },
    },
    useUtils: () => ({
      sienge: {
        listarParcReceivableBill: { invalidate: vi.fn() },
      },
    }),
  },
}))

vi.mock("@/lib/format", () => ({
  formatMoeda: (v: number) => `R$ ${v.toFixed(2)}`,
  formatDataCurta: (d: string) => d,
}))

vi.mock("@/lib/utils", () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(" "),
}))

describe("RecebimentosPage", () => {
  it("module exports a default component", async () => {
    const mod = await import("../page")
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toBe("function")
  })
})

describe("ReceivableDetailDrawer", () => {
  it("module exports a default component", async () => {
    const mod = await import("../ReceivableDetailDrawer")
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toBe("function")
  })
})
