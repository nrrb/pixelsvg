import { useDocumentStore } from '../stores/documentStore'
import { useEditorStore } from '../stores/editorStore'
import { DrawMode } from '../types'
import { togglePixel, setPixel } from '../lib/bitmap'

export function useDrawing(
  canvasToGrid: (cx: number, cy: number) => { x: number; y: number },
  requestRedraw: () => void,
  scheduleAutoSave: () => void,
) {
  const docStore = useDocumentStore()
  const editorStore = useEditorStore()

  let isDrawing = false
  let drawValue: boolean | null = null // the value we are painting (true=black, false=white)
  let lastX = -1
  let lastY = -1

  function pixelInBounds(x: number, y: number): boolean {
    const doc = docStore.activeDoc
    if (!doc) return false
    return x >= 0 && y >= 0 && x < doc.meta.width && y < doc.meta.height
  }

  function paintPixel(x: number, y: number): void {
    const doc = docStore.activeDoc
    if (!doc || !pixelInBounds(x, y)) return
    if (drawValue === null) return
    setPixel(doc.pixels, x, y, doc.meta.width, drawValue)
    docStore.markDirty()
    requestRedraw()
    scheduleAutoSave()
  }

  function onPointerDown(e: PointerEvent): void {
    if (editorStore.mode !== DrawMode.Draw) return
    const doc = docStore.activeDoc
    if (!doc) return

    const canvasEl = e.currentTarget as HTMLCanvasElement
    const rect = canvasEl.getBoundingClientRect()
    const { x, y } = canvasToGrid(e.clientX - rect.left, e.clientY - rect.top)

    if (!pixelInBounds(x, y)) return

    isDrawing = true
    // Determine draw direction from first pixel
    drawValue = !((doc.pixels[(y * doc.meta.width + x) >> 3] & (1 << ((y * doc.meta.width + x) & 7))) !== 0)
    // Actually use togglePixel for the first pixel to determine direction
    drawValue = togglePixel(doc.pixels, x, y, doc.meta.width)
    lastX = x
    lastY = y
    docStore.markDirty()
    requestRedraw()
    scheduleAutoSave()
  }

  function onPointerMove(e: PointerEvent): void {
    if (!isDrawing || editorStore.mode !== DrawMode.Draw) return
    const canvasEl = e.currentTarget as HTMLCanvasElement
    const rect = canvasEl.getBoundingClientRect()
    const { x, y } = canvasToGrid(e.clientX - rect.left, e.clientY - rect.top)

    if (x === lastX && y === lastY) return
    lastX = x
    lastY = y
    paintPixel(x, y)
  }

  function onPointerUp(_e: PointerEvent): void {
    isDrawing = false
    drawValue = null
    lastX = -1
    lastY = -1
  }

  return { onPointerDown, onPointerMove, onPointerUp }
}
