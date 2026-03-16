/**
 * @jest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    sienge: {
      listarBillsByChangeDate: { useQuery: () => ({ data: [], isLoading: false }) },
      buscarBill: { useQuery: () => ({ data: null, isLoading: false }) },
      listarParcelasBill: { useQuery: () => ({ data: [], isLoading: false }) },
      listarImpostosBill: { useQuery: () => ({ data: [], isLoading: false }) },
      listarAnexosBill: { useQuery: () => ({ data: [], isLoading: false }) },
      listarBudgetCategoriesBill: { useQuery: () => ({ data: [], isLoading: false }) },
      listarBuildingsCostBill: { useQuery: () => ({ data: [], isLoading: false }) },
      listarUnitsBill: { useQuery: () => ({ data: [], isLoading: false }) },
      uploadAnexoBill: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    useUtils: () => ({
      sienge: {
        listarAnexosBill: { invalidate: vi.fn() },
      },
    }),
  },
}))

vi.mock("@/lib/format", () => ({
  formatMoeda: (v: number) => `R$ ${v.toFixed(2)}`,
}))

vi.mock("@/lib/utils", () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(" "),
}))

describe("BillsPage", () => {
  it("module exports a default component", async () => {
    const mod = await import("../page")
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toBe("function")
  })
})

describe("BillDetailDrawer", () => {
  it("module exports a default component", async () => {
    const mod = await import("../BillDetailDrawer")
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toBe("function")
  })
})
