"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { MessageSquare, Send, HardHat } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatDataCurta } from "@/lib/format"
import { createClient } from "@/lib/supabase/client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function ChatPage() {
  const [obraId, setObraId] = useState<string | null>(null)
  const [texto, setTexto] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data: obras = [] } = trpc.chat.listarObras.useQuery()

  const { data: mensagens = [], refetch } = trpc.chat.listar.useQuery(
    { obraId: obraId! },
    { enabled: !!obraId, refetchInterval: 5000, refetchOnWindowFocus: true },
  )

  const stableRefetch = useCallback(() => { refetch() }, [refetch])

  // Supabase Realtime — escuta novos INSERTs na tabela MensagemChat
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

  const obraSelecionada = obras.find(o => o.id === obraId)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensagens])

  function handleEnviar(e: React.FormEvent) {
    e.preventDefault()
    if (!obraId || !texto.trim()) return
    enviar.mutate({ obraId, conteudo: texto.trim() })
  }

  return (
    <div className="flex h-[calc(100vh-64px)] w-full">

      {/* Sidebar obras */}
      <div className="w-80 flex-shrink-0 border-r bg-card flex flex-col z-10">
        <div className="px-6 py-5 border-b">
          <h1 className="text-lg font-bold">Chat das Obras</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Comunicação em tempo real</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {obras.length === 0 && (
            <div className="py-10 text-center px-4">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                <HardHat className="text-muted-foreground opacity-50 h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Nenhuma obra ativa</p>
            </div>
          )}

          {obras.map(obra => {
            const isSelected = obraId === obra.id
            return (
              <button key={obra.id} onClick={() => setObraId(obra.id)}
                className={`w-full flex items-start gap-4 px-6 py-4 border-b text-left transition-colors cursor-pointer outline-none relative ${isSelected ? "bg-primary/5" : "hover:bg-muted/50"
                  }`}>

                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                )}

                <Avatar className={`h-10 w-10 border shadow-sm transition-colors ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <AvatarFallback className={isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}>
                    <HardHat size={18} />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold truncate transition-colors ${isSelected ? "text-primary" : "text-foreground"}`}>
                    {obra.nome}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 truncate font-medium">
                    {obra._count.mensagens} mensagens
                    {obra.mensagens[0] && ` · ${formatDataCurta(obra.mensagens[0].createdAt)}`}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Área do chat */}
      <div className="flex-1 flex flex-col bg-slate-50 relative">
        {!obraId ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="bg-white p-6 rounded-2xl shadow-sm border text-center max-w-sm">
              <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={32} className="text-primary" />
              </div>
              <h2 className="text-lg font-bold mb-2">Selecione uma obra</h2>
              <p className="text-sm text-muted-foreground">Escolha uma obra na lista ao lado para visualizar e enviar mensagens para a equipe.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-4 px-6 py-4 bg-white border-b shadow-sm z-10 flex-shrink-0">
              <Avatar className="h-10 w-10 border shadow-sm">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <HardHat size={18} />
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-base font-bold">{obraSelecionada?.nome}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-xs font-semibold text-muted-foreground">Tempo real</p>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {mensagens.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center pointer-events-none opacity-50">
                  <MessageSquare size={48} className="text-muted-foreground mb-4" />
                  <p className="text-base font-medium">Nenhuma mensagem ainda</p>
                  <p className="text-sm">Seja o primeiro a enviar uma mensagem na obra!</p>
                </div>
              )}

              {mensagens.map(m => (
                <div key={m.id} className="flex items-start gap-4">
                  <Avatar className="w-9 h-9 border shadow-sm shrink-0">
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs font-bold">
                      {m.usuario.nome.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 max-w-2xl">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-bold text-foreground">{m.usuario.nome}</span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {new Date(m.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm border inline-block max-w-full">
                      <p className="text-[15px] text-foreground whitespace-pre-wrap break-words leading-relaxed">{m.conteudo}</p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleEnviar} className="flex items-end gap-3 px-6 py-5 bg-white border-t z-10">
              <div className="flex-1 relative">
                <Input
                  type="text"
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  placeholder="Escreva uma mensagem..."
                  className="pr-12 bg-muted/50 border-transparent focus-visible:bg-transparent h-12 rounded-xl text-[15px]"
                />
              </div>
              <Button
                type="submit"
                size="icon"
                disabled={!texto.trim() || enviar.isPending}
                className="h-12 w-12 rounded-xl shrink-0 shadow-sm transition-transform active:scale-95"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
