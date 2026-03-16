import { describe, it, expect } from "vitest"

/**
 * Testes básicos de estrutura para o hook usePlanejamento.
 * Testes de integração com tRPC dependem de mock do provider.
 */
describe("usePlanejamento module", () => {
  it("exports all expected hooks", async () => {
    const mod = await import("@/hooks/usePlanejamento")
    expect(mod.useTarefasSienge).toBeDefined()
    expect(typeof mod.useTarefasSienge).toBe("function")
    expect(mod.useInserirTarefasPlanilha).toBeDefined()
    expect(typeof mod.useInserirTarefasPlanilha).toBe("function")
    expect(mod.useSalvarMateriaisRdo).toBeDefined()
    expect(typeof mod.useSalvarMateriaisRdo).toBe("function")
    expect(mod.useTarefasObra).toBeDefined()
    expect(typeof mod.useTarefasObra).toBe("function")
  })
})
