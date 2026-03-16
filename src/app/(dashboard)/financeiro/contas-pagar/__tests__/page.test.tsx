/**
 * @jest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest"

// Stub tRPC hooks
vi.mock("@/lib/trpc/client", () => ({
  trpc: {
    sienge: {
      listarContasPagar: { useQuery: () => ({ data: [], isLoading: false }) },
      lancarDespesa: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      lancarDespesaNf: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    fornecedor: { listar: { useQuery: () => ({ data: { fornecedores: [] } }) } },
    obra: { listar: { useQuery: () => ({ data: [] }) } },
    useUtils: () => ({ sienge: { listarContasPagar: { invalidate: vi.fn() } } }),
  },
}))

vi.mock("@/lib/format", () => ({
  formatMoeda: (v: number) => `R$ ${v.toFixed(2)}`,
}))

vi.mock("@/lib/utils", () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(" "),
}))

describe("ContasPagarPage", () => {
  it("module exports a default component", async () => {
    const mod = await import("../page")
    expect(mod.default).toBeDefined()
    expect(typeof mod.default).toBe("function")
  })
})
