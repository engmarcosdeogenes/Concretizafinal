"use client"

import { useState, useRef, useEffect } from "react"
import { MessageSquare, Send, HardHat, User } from "lucide-react"
import { trpc } from "@/lib/trpc/client"
import { formatDataCurta } from "@/lib/format"

export default function ChatPage() {
  const [obraId, setObraId]   = useState<string | null>(null)
  const [texto, setTexto]     = useState("")
  const bottomRef             = useRef<HTMLDivElement>(null)

  const { data: obras = [] }  = trpc.chat.listarObras.useQuery()

  const { data: mensagens = [], refetch } = trpc.chat.listar.useQuery(
    { obraId: obraId! },
    { enabled: !!obraId, refetchInterval: 3000 },
  )

  const enviar = trpc.chat.enviar.useMutation({
    onSuccess: () => { refetch(); setTexto("") },
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
    <div className="flex h-[calc(100vh-64px)]">

      {/* Sidebar obras */}
      <div className="w-72 flex-shrink-0 border-r border-[var(--border)] bg-white flex flex-col">
        <div className="px-4 py-4 border-b border-[var(--border)]">
          <h1 className="text-sm font-bold text-[var(--text-primary)]">Chat</h1>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Comunicação por obra</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {obras.length === 0 && (
            <div className="py-10 text-center px-4">
              <HardHat size={28} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
              <p className="text-xs text-[var(--text-muted)]">Nenhuma obra ativa</p>
            </div>
          )}

          {obras.map(obra => (
            <button key={obra.id} onClick={() => setObraId(obra.id)}
              className={`w-full flex items-start gap-3 px-4 py-3.5 border-b border-[var(--border)] text-left transition-colors cursor-pointer ${
                obraId === obra.id ? "bg-orange-50 border-l-2 border-l-orange-500" : "hover:bg-[var(--muted)]"
              }`}>
              <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <HardHat size={15} className="text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{obra.nome}</p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {obra._count.mensagens} mensagens
                  {obra.mensagens[0] && ` · ${formatDataCurta(obra.mensagens[0].createdAt)}`}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Área do chat */}
      {!obraId ? (
        <div className="flex-1 flex items-center justify-center bg-[var(--muted)]">
          <div className="text-center">
            <MessageSquare size={40} className="mx-auto mb-4 text-[var(--text-muted)] opacity-30" />
            <p className="text-sm font-medium text-[var(--text-primary)]">Selecione uma obra para conversar</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Mensagens atualizam automaticamente a cada 3 segundos</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 bg-white border-b border-[var(--border)]">
            <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
              <HardHat size={14} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">{obraSelecionada?.nome}</p>
              <p className="text-[11px] text-[var(--text-muted)]">Atualiza a cada 3s</p>
            </div>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--muted)]">
            {mensagens.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare size={28} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
                <p className="text-sm text-[var(--text-muted)]">Nenhuma mensagem ainda</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Seja o primeiro a enviar uma mensagem!</p>
              </div>
            )}

            {mensagens.map(m => (
              <div key={m.id} className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User size={12} className="text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{m.usuario.nome}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {new Date(m.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="bg-white rounded-xl rounded-tl-none px-3 py-2 shadow-sm border border-[var(--border)] inline-block max-w-full">
                    <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap break-words">{m.conteudo}</p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleEnviar} className="flex items-center gap-3 px-4 py-4 bg-white border-t border-[var(--border)]">
            <input
              type="text"
              value={texto}
              onChange={e => setTexto(e.target.value)}
              placeholder="Digite uma mensagem..."
              className="flex-1 px-3.5 py-2.5 border border-[var(--border)] rounded-[var(--radius)] text-sm text-[var(--text-primary)] bg-white placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--blue)] focus:ring-2 focus:ring-blue-100 transition-all"
            />
            <button type="submit" disabled={!texto.trim() || enviar.isPending}
              className="w-10 h-10 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors cursor-pointer flex-shrink-0">
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
