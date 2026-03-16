import { describe, it, expect } from "vitest"

/**
 * Testes básicos de estrutura para o hook useOrcamento.
 * Testes de integração com tRPC dependem de mock do provider.
 */
describe("useOrcamento module", () => {
  it("exports all expected hooks", async () => {
    const mod = await import("@/hooks/useOrcamento")
    expect(mod.useOrcamento).toBeDefined()
    expect(typeof mod.useOrcamento).toBe("function")
    expect(mod.useOrcamentoPlanilhas).toBeDefined()
    expect(typeof mod.useOrcamentoPlanilhas).toBe("function")
    expect(mod.useInsumoOrcamento).toBeDefined()
    expect(typeof mod.useInsumoOrcamento).toBe("function")
    expect(mod.useAdicionarInsumo).toBeDefined()
    expect(typeof mod.useAdicionarInsumo).toBe("function")
    expect(mod.useAtualizarInsumo).toBeDefined()
    expect(typeof mod.useAtualizarInsumo).toBe("function")
    expect(mod.useBulkBudgetItems).toBeDefined()
    expect(typeof mod.useBulkBudgetItems).toBe("function")
    expect(mod.useBulkBusinessBudgets).toBeDefined()
    expect(typeof mod.useBulkBusinessBudgets).toBe("function")
    expect(mod.useBulkBuildingResources).toBeDefined()
    expect(typeof mod.useBulkBuildingResources).toBe("function")
  })
})
