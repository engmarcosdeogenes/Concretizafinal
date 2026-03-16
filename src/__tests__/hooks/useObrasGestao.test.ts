import { describe, it, expect } from "vitest"

/**
 * Testes básicos de estrutura para o hook useObrasGestao.
 * Testes de integração com tRPC dependem de mock do provider.
 */
describe("useObrasGestao module", () => {
  it("exports all expected hooks", async () => {
    const mod = await import("@/hooks/useObrasGestao")
    expect(mod.useObrasListar).toBeDefined()
    expect(typeof mod.useObrasListar).toBe("function")
    expect(mod.useImportarObras).toBeDefined()
    expect(typeof mod.useImportarObras).toBe("function")
    expect(mod.useHistoricoObra).toBeDefined()
    expect(typeof mod.useHistoricoObra).toBe("function")
  })
})
