"use client"

import { useEffect, useRef } from "react"
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react"

const TIPO_COR: Record<string, string> = {
  SEGURANCA: "#ef4444",
  QUALIDADE: "#8b5cf6",
  PRAZO:     "#f59e0b",
  CUSTO:     "#3b82f6",
  AMBIENTAL: "#10b981",
  OUTRO:     "#64748b",
}

type Ocorrencia = {
  id: string
  titulo: string
  tipo: string
  prioridade: number
  posX: number | null
  posY: number | null
  plantaId: string | null
  status: string
}

type Props = {
  planta: { id: string; nome: string; url: string } | null
  ocorrencias: Ocorrencia[]
  modoSelecao: string | null
  onUpdatePosicao: (ocId: string, x: number, y: number) => void
  onCancelarSelecao: () => void
}

export function MapaCanvas({ planta, ocorrencias, modoSelecao, onUpdatePosicao, onCancelarSelecao }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Stale closure guards
  const modoRef       = useRef(modoSelecao)
  const onUpdateRef   = useRef(onUpdatePosicao)
  const onCancelarRef = useRef(onCancelarSelecao)
  const fabricRef     = useRef<import("fabric").Canvas | null>(null)

  // Toolbar action refs (set after canvas init)
  const zoomInRef    = useRef<() => void>(() => {})
  const zoomOutRef   = useRef<() => void>(() => {})
  const resetViewRef = useRef<() => void>(() => {})

  useEffect(() => { modoRef.current = modoSelecao }, [modoSelecao])
  useEffect(() => { onUpdateRef.current = onUpdatePosicao }, [onUpdatePosicao])
  useEffect(() => { onCancelarRef.current = onCancelarSelecao }, [onCancelarSelecao])

  // ── Atualiza cursor e selecionabilidade dos pinos sem reconstruir canvas ──
  useEffect(() => {
    const fc = fabricRef.current
    if (!fc) return

    const inPlacement = !!modoSelecao

    fc.defaultCursor = inPlacement ? "crosshair" : "default"

    // Habilita/desabilita drag nos pinos conforme modo
    fc.getObjects().forEach((obj) => {
      if (obj.type === "circle") {
        obj.set({
          selectable:  !inPlacement,
          evented:     true, // sempre evented para hover cursor
        })
      }
    })

    fc.discardActiveObject()
    fc.renderAll()
  }, [modoSelecao])

  // ── Reconstrói canvas quando planta ou ocorrências mudam ─────────────────
  useEffect(() => {
    if (!canvasRef.current || !wrapperRef.current) return

    let disposed = false
    const width  = wrapperRef.current.clientWidth || 800
    const height = 520

    async function init() {
      const { Canvas, Circle, Line, FabricImage, Point } = await import("fabric")
      if (disposed) return

      // Dispose anterior
      if (fabricRef.current) {
        fabricRef.current.dispose()
        fabricRef.current = null
      }

      const fc = new Canvas(canvasRef.current!, {
        selection:       false,
        width,
        height,
        backgroundColor: "#0f172a",
      })
      fabricRef.current = fc

      // ── Fundo: imagem da planta ou grid de blueprint ──────────────
      if (planta) {
        try {
          const img = await FabricImage.fromURL(planta.url, { crossOrigin: "anonymous" })
          if (disposed) { fc.dispose(); return }

          const scaleX = width  / (img.width  ?? width)
          const scaleY = height / (img.height ?? height)

          img.set({ scaleX, scaleY, left: 0, top: 0, selectable: false, evented: false, opacity: 0.9 })
          fc.backgroundImage = img
        } catch {
          drawGrid(fc, Line, width, height)
        }
      } else {
        drawGrid(fc, Line, width, height)
      }

      // ── Pinos das ocorrências posicionadas nesta planta ───────────
      const posicionadas = ocorrencias.filter(
        o => o.posX !== null && o.posY !== null && o.plantaId === planta?.id
      )

      const inPlacement = !!modoRef.current
      // Map: FabricObject → ocorrenciaId (sem depender de propriedade custom)
      const pinIds = new Map<object, string>()

      for (const oc of posicionadas) {
        const radius = oc.prioridade === 3 ? 16 : oc.prioridade === 2 ? 12 : 8
        const fill   = TIPO_COR[oc.tipo] ?? TIPO_COR.OUTRO

        const circle = new Circle({
          left:        (oc.posX ?? 0) - radius,
          top:         (oc.posY ?? 0) - radius,
          radius,
          fill,
          stroke:      "white",
          strokeWidth: 2,
          selectable:  !inPlacement,
          evented:     true,
          hasControls: false,
          hasBorders:  false,
          lockScalingX: true,
          lockScalingY: true,
          hoverCursor:  "grab",
          moveCursor:   "grabbing",
          opacity:     oc.status === "RESOLVIDA" || oc.status === "FECHADA" ? 0.4 : 1,
        })

        pinIds.set(circle, oc.id)
        fc.add(circle)
      }

      // ── Drag ended: persiste nova posição ─────────────────────────
      fc.on("object:modified", (opt) => {
        if (modoRef.current) return
        const obj = opt.target as import("fabric").Circle
        if (!obj || obj.type !== "circle") return
        const ocId = pinIds.get(obj)
        if (!ocId) return
        // Centro do círculo = left + radius (coordenadas de cena)
        const x = Math.round((obj.left ?? 0) + (obj.radius ?? 0))
        const y = Math.round((obj.top  ?? 0) + (obj.radius ?? 0))
        onUpdateRef.current(ocId, x, y)
      })

      // ── Zoom com mouse wheel ──────────────────────────────────────
      fc.on("mouse:wheel", (opt) => {
        opt.e.preventDefault()
        opt.e.stopPropagation()
        let zoom = fc.getZoom()
        zoom *= 0.999 ** opt.e.deltaY
        zoom = Math.min(Math.max(zoom, 0.3), 5)
        fc.zoomToPoint(new Point(opt.e.offsetX, opt.e.offsetY), zoom)
      })

      // ── Pan: arrastar o fundo quando sem modo de colocação ────────
      let isPanning = false
      let lastX = 0
      let lastY = 0

      fc.on("mouse:down", (opt) => {
        const ocId = modoRef.current
        if (ocId) {
          // Modo colocação: posiciona o pino onde clicou
          const pointer = fc.getScenePoint(opt.e)
          onUpdateRef.current(ocId, Math.round(pointer.x), Math.round(pointer.y))
          return
        }
        // Pan: só se clicou no fundo (sem objeto alvo)
        if (!opt.target) {
          const me = opt.e as MouseEvent
          isPanning = true
          lastX = me.clientX
          lastY = me.clientY
          fc.defaultCursor = "grabbing"
        }
      })

      fc.on("mouse:move", (opt) => {
        if (!isPanning) return
        const me = opt.e as MouseEvent
        const dx = me.clientX - lastX
        const dy = me.clientY - lastY
        lastX = me.clientX
        lastY = me.clientY
        fc.relativePan(new Point(dx, dy))
      })

      fc.on("mouse:up", () => {
        if (isPanning) {
          isPanning = false
          fc.defaultCursor = modoRef.current ? "crosshair" : "default"
        }
      })

      // ── Toolbar: funções de zoom ──────────────────────────────────
      zoomInRef.current = () => {
        const z = Math.min(fc.getZoom() * 1.25, 5)
        fc.zoomToPoint(new Point(width / 2, height / 2), z)
      }
      zoomOutRef.current = () => {
        const z = Math.max(fc.getZoom() / 1.25, 0.3)
        fc.zoomToPoint(new Point(width / 2, height / 2), z)
      }
      resetViewRef.current = () => {
        fc.setZoom(1)
        fc.absolutePan(new Point(0, 0))
        fc.renderAll()
      }

      fc.defaultCursor = modoRef.current ? "crosshair" : "default"
      fc.renderAll()
    }

    init().catch(console.error)

    return () => {
      disposed = true
      zoomInRef.current    = () => {}
      zoomOutRef.current   = () => {}
      resetViewRef.current = () => {}
      if (fabricRef.current) {
        fabricRef.current.dispose()
        fabricRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planta, ocorrencias])

  return (
    <div ref={wrapperRef} className="relative w-full h-full select-none">
      <canvas ref={canvasRef} />

      {/* Toolbar de zoom/pan — canto superior direito */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 z-10">
        <button
          onClick={() => zoomInRef.current()}
          title="Ampliar (+)"
          className="w-8 h-8 bg-white/90 hover:bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-700 shadow-sm transition-colors"
        >
          <ZoomIn size={14} />
        </button>
        <button
          onClick={() => zoomOutRef.current()}
          title="Reduzir (-)"
          className="w-8 h-8 bg-white/90 hover:bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-700 shadow-sm transition-colors"
        >
          <ZoomOut size={14} />
        </button>
        <button
          onClick={() => resetViewRef.current()}
          title="Resetar visualização"
          className="w-8 h-8 bg-white/90 hover:bg-white border border-gray-200 rounded-lg flex items-center justify-center text-gray-700 shadow-sm transition-colors"
        >
          <Maximize2 size={14} />
        </button>
      </div>
    </div>
  )
}

function drawGrid(
  fc: import("fabric").Canvas,
  Line: typeof import("fabric").Line,
  width: number,
  height: number,
) {
  const step = 40
  const opts = { stroke: "#1e3a5f", strokeWidth: 1, selectable: false, evented: false, opacity: 0.8 }

  for (let x = 0; x <= width; x += step) {
    fc.add(new Line([x, 0, x, height], opts))
  }
  for (let y = 0; y <= height; y += step) {
    fc.add(new Line([0, y, width, y], opts))
  }
}
