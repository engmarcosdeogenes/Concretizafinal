"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Pen, Trash2, Upload, Check } from "lucide-react"

interface AssinaturaCanvasProps {
  label: string
  imagemUrl?: string | null
  onSave: (dataUrl: string | null) => void
  disabled?: boolean
}

export function AssinaturaCanvas({ label, imagemUrl, onSave, disabled }: AssinaturaCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(!imagemUrl)
  const [mode, setMode] = useState<"view" | "draw" | "upload">("view")
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    ctx.strokeStyle = "#111111"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    return ctx
  }, [])

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ("touches" in e) {
      const touch = e.touches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (mode !== "draw" || disabled) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    setIsDrawing(true)
    setIsEmpty(false)
    lastPos.current = getPos(e, canvas)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || mode !== "draw" || disabled) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = getCtx()
    if (!ctx) return
    const pos = getPos(e, canvas)
    if (lastPos.current) {
      ctx.beginPath()
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    }
    lastPos.current = pos
  }

  const endDraw = () => {
    setIsDrawing(false)
    lastPos.current = null
  }

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = getCtx()
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
    onSave(null)
  }

  const save = () => {
    const canvas = canvasRef.current
    if (!canvas || isEmpty) return
    const dataUrl = canvas.toDataURL("image/png")
    onSave(dataUrl)
    setMode("view")
  }

  // Load existing image into canvas
  useEffect(() => {
    if (!imagemUrl || mode !== "view") return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      setIsEmpty(false)
    }
    img.src = imagemUrl
  }, [imagemUrl, mode])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as string
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      const img = new Image()
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        setIsEmpty(false)
        onSave(canvas.toDataURL("image/png"))
      }
      img.src = result
    }
    reader.readAsDataURL(file)
    setMode("view")
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted border-b border-border">
        <span className="text-xs font-semibold text-[var(--text-primary)]">{label}</span>
        {!disabled && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMode(mode === "draw" ? "view" : "draw")}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                mode === "draw" ? "bg-orange-100 text-orange-600" : "hover:bg-border text-[var(--text-muted)]"
              }`}
              title="Desenhar assinatura"
            >
              <Pen size={13} />
            </button>
            <label
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-border text-[var(--text-muted)] transition-colors cursor-pointer"
              title="Upload de imagem"
            >
              <Upload size={13} />
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
            {!isEmpty && (
              <button
                type="button"
                onClick={clear}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400 transition-colors cursor-pointer"
                title="Limpar assinatura"
              >
                <Trash2 size={13} />
              </button>
            )}
            {mode === "draw" && !isEmpty && (
              <button
                type="button"
                onClick={save}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-green-100 text-green-600 transition-colors cursor-pointer"
                title="Confirmar assinatura"
              >
                <Check size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className={`relative ${mode === "draw" ? "cursor-crosshair" : "cursor-default"}`}>
        <canvas
          ref={canvasRef}
          width={400}
          height={120}
          className="w-full touch-none"
          style={{ background: mode === "draw" ? "#fafaf9" : "white" }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[11px] text-[var(--text-muted)]">
              {mode === "draw" ? "Desenhe a assinatura" : "Sem assinatura"}
            </span>
          </div>
        )}
      </div>

      {/* Bottom line (assinatura visual) */}
      <div className="px-3 pb-2 pt-0">
        <div className="h-px bg-border" />
        <p className="text-[10px] text-[var(--text-muted)] mt-1">{label}</p>
      </div>
    </div>
  )
}
