import { describe, it, expect } from "vitest"

/**
 * Testes básicos de estrutura para o hook useEstoque.
 * Testes de integração com tRPC dependem de mock do provider.
 */
describe("useEstoque module", () => {
  it("exports all expected hooks", async () => {
    const mod = await import("@/hooks/useEstoque")
    expect(mod.useEstoque).toBeDefined()
    expect(typeof mod.useEstoque).toBe("function")
    expect(mod.useSaldoPorMaterial).toBeDefined()
    expect(typeof mod.useSaldoPorMaterial).toBe("function")
    expect(mod.useMovimentacoesInventario).toBeDefined()
    expect(typeof mod.useMovimentacoesInventario).toBe("function")
    expect(mod.useBuscarMovimentacaoInventario).toBeDefined()
    expect(typeof mod.useBuscarMovimentacaoInventario).toBe("function")
    expect(mod.useApropriacoesInventario).toBeDefined()
    expect(typeof mod.useApropriacoesInventario).toBe("function")
    expect(mod.useTransferirEstoque).toBeDefined()
    expect(typeof mod.useTransferirEstoque).toBe("function")
    expect(mod.useLancarMovimentacao).toBeDefined()
    expect(typeof mod.useLancarMovimentacao).toBe("function")
  })
})
