"use client"

import { useState, useRef, useEffect } from "react"
import { Bot, Send, Trash2, Sparkles, Loader2 } from "lucide-react"
import { trpc } from "@/lib/trpc/client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const SUGESTOES = [
  "Qual o resumo financeiro das minhas obras?",
  "Quais obras estão com maior desvio de orçamento?",
  "Tenho contas a pagar vencidas?",
  "Quais ocorrências abertas precisam de atenção?",
  "Qual o avanço físico das obras em andamento?",
  "Há clientes inadimplentes no momento?",
]

export default function AssistentePage() {
  const [texto, setTexto] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const { data: mensagens = [], refetch } = trpc.assistente.listar.useQuery()

  const enviar = trpc.assistente.enviar.useMutation({
    onSuccess: () => refetch(),
  })

  const limpar = trpc.assistente.limpar.useMutation({
    onSuccess: () => refetch(),
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensagens, enviar.isPending])

  function handleEnviar(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim() || enviar.isPending) return
    const msg = texto.trim()
    setTexto("")
    enviar.mutate({ mensagem: msg })
  }

  function handleSugestao(s: string) {
    if (enviar.isPending) return
    enviar.mutate({ mensagem: s })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleEnviar(e)
    }
  }

  const temHistorico = mensagens.length > 0

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full bg-slate-50">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b shadow-sm z-10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold">Assistente IA</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Sparkles size={12} className="text-violet-500" />
              <p className="text-xs font-semibold text-muted-foreground">Powered by Claude</p>
            </div>
          </div>
        </div>

        {temHistorico && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => limpar.mutate()}
            disabled={limpar.isPending}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 size={16} className="mr-1.5" />
            Limpar
          </Button>
        )}
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Estado vazio / sugestões */}
          {!temHistorico && !enviar.isPending && (
            <div className="flex flex-col items-center justify-center pt-16">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg">
                <Bot size={40} className="text-white" />
              </div>
              <h2 className="text-xl font-bold mb-2">Assistente de Obra</h2>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-8">
                Analise dados reais das suas obras (Concretiza + Sienge), tire dúvidas técnicas e receba insights financeiros e de avanço físico.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                {SUGESTOES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSugestao(s)}
                    className="text-left px-4 py-3 rounded-xl border bg-white hover:bg-violet-50 hover:border-violet-200 transition-colors text-sm text-foreground shadow-sm"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Histórico */}
          {mensagens.map((m) => (
            <div key={m.id} className={`flex items-start gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <Avatar className="w-8 h-8 shrink-0 shadow-sm">
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs">
                    <Bot size={16} />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[85%] sm:max-w-2xl rounded-2xl px-4 py-3 shadow-sm ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : "bg-white border rounded-tl-sm"
                }`}
              >
                {m.role === "assistant" ? (
                  <div
                    className="text-[15px] leading-relaxed prose prose-sm max-w-none prose-p:my-1 prose-li:my-0.5 prose-headings:mt-3 prose-headings:mb-1"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(m.conteudo) }}
                  />
                ) : (
                  <p className="text-[15px] whitespace-pre-wrap break-words leading-relaxed">{m.conteudo}</p>
                )}
                <p className={`text-[11px] mt-1.5 ${m.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {new Date(m.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}

          {/* Loading */}
          {enviar.isPending && (
            <div className="flex items-start gap-3">
              <Avatar className="w-8 h-8 shrink-0 shadow-sm">
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-xs">
                  <Bot size={16} />
                </AvatarFallback>
              </Avatar>
              <div className="bg-white border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Pensando...</span>
                </div>
              </div>
            </div>
          )}

          {/* Erro */}
          {enviar.isError && (
            <div className="flex items-start gap-3">
              <Avatar className="w-8 h-8 shrink-0 shadow-sm">
                <AvatarFallback className="bg-destructive/10 text-destructive text-xs">!</AvatarFallback>
              </Avatar>
              <div className="bg-destructive/5 border border-destructive/20 rounded-2xl rounded-tl-sm px-4 py-3">
                <p className="text-sm text-destructive">{enviar.error.message}</p>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t px-4 sm:px-6 py-4 z-10">
        <form onSubmit={handleEnviar} className="max-w-3xl mx-auto flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte sobre suas obras, finanças, estoque, ocorrências..."
              rows={1}
              className="w-full resize-none bg-muted/50 border-transparent focus:bg-transparent rounded-xl px-4 py-3 text-[15px] outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 border transition-colors"
              style={{ minHeight: "48px", maxHeight: "120px" }}
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={!texto.trim() || enviar.isPending}
            className="h-12 w-12 rounded-xl shrink-0 shadow-sm transition-transform active:scale-95 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  )
}

/** Renderiza markdown básico para HTML (negrito, itálico, listas, código) */
function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-muted rounded-lg p-3 my-2 overflow-x-auto"><code>$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="font-bold text-base">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-bold text-lg">$1</h2>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    // Line breaks
    .replace(/\n\n/g, "<br/><br/>")
    .replace(/\n/g, "<br/>")
}
