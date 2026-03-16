const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"

interface ClaudeMessage {
  role: "user" | "assistant"
  content: string
}

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>
}

const SYSTEM_PROMPT = `Você é o assistente de IA do Concretiza, um SaaS de gestão de obra e diário de obra (RDO) integrado ao ERP Sienge para construtoras brasileiras.

Seu papel:
- Analisar dados reais das obras (Concretiza + Sienge) e responder em linguagem natural.
- Identificar desvios de orçamento, riscos de atraso, e anomalias em pedidos de compra.
- Dar resumos de obras, situação financeira, estoque crítico e inadimplência.
- Responder perguntas sobre gestão de obras, engenharia civil, normas técnicas (NBR), segurança do trabalho (NR), e boas práticas de canteiro.
- Ajudar a interpretar dados de RDOs, FVS, FVM, medições, orçamentos e relatórios.
- Sugerir soluções para problemas comuns em obras (atrasos, desvios, não-conformidades).
- Auxiliar com cálculos de engenharia simples (áreas, volumes, quantitativos).

Contexto de dados:
- Cada mensagem do usuário pode vir acompanhada de dados atualizados do Concretiza e do Sienge (entre colchetes).
- Os dados CONCRETIZA incluem: obras ativas, RDOs, FVS, medições, ocorrências abertas por tipo, progresso e desvio de orçamento por obra.
- Os dados SIENGE incluem: obras do ERP, pedidos de compra, contas a pagar (com vencidas), saldos bancários, inadimplência.
- Use esses dados para dar respostas precisas e contextualizadas. Cite números quando disponíveis.
- Se os dados Sienge não estiverem presentes, a integração pode não estar configurada — informe que os dados do ERP não estão disponíveis.

Regras:
- Sempre responda em português brasileiro.
- Seja conciso e direto, como um engenheiro falaria no canteiro.
- Quando relevante, cite normas (NBR, NR) ou boas práticas.
- Se não souber algo com certeza, diga claramente.
- Use unidades do SI (metros, m², m³, kg, etc.).
- Formate respostas com markdown quando útil (listas, tabelas, negrito).
- Quando analisar dados financeiros, use R$ e formatação brasileira (1.000,00).`

export async function enviarMensagemClaude(
  mensagens: ClaudeMessage[],
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY não configurada. Configure em .env")
  }

  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: mensagens.map((m) => ({ role: m.role, content: m.content })),
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API error (${res.status}): ${err}`)
  }

  const data = (await res.json()) as ClaudeResponse
  return data.content[0]?.text ?? "Sem resposta."
}
