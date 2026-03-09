"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { useParams } from "next/navigation"
import { Send, MessageSquare } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatDataCurta } from "@/lib/format"
import { createClient } from "@/lib/supabase/client"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function ChatObraPage() {
  const { id: obraId } = useParams<{ id: string }>()
  const [texto, setTexto] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: mensagens = [], refetch } = trpc.chat.listar.useQuery(
    { obraId },
    { enabled: !!obraId, refetchInterval: 5000, refetchOnWindowFocus: true },
  )

  const stableRefetch = useCallback(() => { refetch() }, [refetch])

  // Realtime via Supabase
  useEffect(() => {
    if (!obraId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`chat-obra-${obraId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "MensagemChat", filter: `obraId=eq.${obraId}` },
        () => stableRefetch(),
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [obraId, stableRefetch])

  const enviar = trpc.chat.enviar.useMutation({
    onMutate: () => setTexto(""),
    onSuccess: () => refetch(),
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensagens])

  function handleEnviar(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim()) return
    enviar.mutate({ obraId, conteudo: texto.trim() })
  }

  function iniciais(nome: string) {
    return nome.split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase()
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] p-6 pt-4">
      <div className="flex flex-col flex-1 bg-white rounded-2xl border border-border shadow-sm overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border flex-shrink-0">
          <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center">
            <MessageSquare size={15} className="text-orange-500" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Chat da Obra</h2>
            <p className="text-xs text-[var(--text-muted)]">Comunicação em tempo real da equipe</p>
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {mensagens.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full py-10 text-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                <MessageSquare className="text-muted-foreground opacity-40 h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-[var(--text-muted)]">Nenhuma mensagem ainda</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Seja o primeiro a enviar uma mensagem</p>
            </div>
          )}

          {mensagens.map((msg, i) => {
            const showAvatar = i === 0 || mensagens[i - 1]?.usuarioId !== msg.usuarioId
            return (
              <div key={msg.id} className="flex items-end gap-2.5">
                <div className="w-7 flex-shrink-0">
                  {showAvatar && (
                    <Avatar className="w-7 h-7">
                      <AvatarFallback className="bg-[var(--blue)] text-white text-[10px] font-bold">
                        {iniciais(msg.usuario.nome)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {showAvatar && (
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-[var(--text-primary)]">{msg.usuario.nome}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{formatDataCurta(msg.createdAt)}</span>
                    </div>
                  )}
                  <div className="bg-muted/60 rounded-2xl rounded-bl-sm px-3.5 py-2.5 inline-block max-w-[80%]">
                    <p className="text-sm text-[var(--text-primary)] break-words">{msg.conteudo}</p>
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-border bg-muted/20">
          <form onSubmit={handleEnviar} className="flex items-center gap-3">
            <input
              type="text"
              value={texto}
              onChange={e => setTexto(e.target.value)}
              placeholder="Digite uma mensagem..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-white text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
            />
            <button
              type="submit"
              disabled={!texto.trim() || enviar.isPending}
              className="w-10 h-10 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
            >
              <Send size={15} className="text-white" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
