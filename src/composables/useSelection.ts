import { useDocumentStore } from '../stores/documentStore'
import { useEditorStore } from '../stores/editorStore'
import { DrawMode } from '../types'
import { pasteRegion } from '../lib/bitmap'

export function useSelection(
  canvasToGrid: (cx: number, cy: number) => { x: number; y: number },
  requestRedraw: () => void,
  scheduleAutoSave: () => void,
) {
  const docStore = useDocumentStore()
  const editorStore = useEditorStore()

  let isSelecting = false
  let startX = 0
  let startY = 0

  function normalizeRect(x1: number, y1: number, x2: number, y2: number) {
    const doc = docStore.activeDoc
    const maxW = doc?.meta.width ?? Infinity
    const maxH = doc?.meta.height ?? Infinity
    const x = Math.max(0, Math.min(x1, x2))
    const y = Math.max(0, Math.min(y1, y2))
    const x2c = Math.min(maxW, Math.max(x1, x2) + 1)
    const y2c = Math.min(maxH, Math.max(y1, y2) + 1)
    return { x, y, width: x2c - x, height: y2c - y }
  }

  function onPointerDown(e: PointerEvent): void {
    if (editorStore.mode !== DrawMode.Select) return

    // If we have a paste ghost and this is a click (not drag start), commit paste
    if (editorStore.pasteGhost) {
      commitPaste()
      return
    }

    const canvasEl = e.currentTarget as HTMLCanvasElement
    const rect = canvasEl.getBoundingClientRect()
    const { x, y } = canvasToGrid(e.clientX - rect.left, e.clientY - rect.top)

    isSelecting = true
    startX = x
    startY = y
    editorStore.setSelection({ x, y, width: 1, height: 1 })
    requestRedraw()
  }

  function onPointerMove(e: PointerEvent): void {
    if (editorStore.mode !== DrawMode.Select) return

    const canvasEl = e.currentTarget as HTMLCanvasElement
    const rect = canvasEl.getBoundingClientRect()
    const { x, y } = canvasToGrid(e.clientX - rect.left, e.clientY - rect.top)

    if (editorStore.pasteGhost) {
      editorStore.setPasteGhost(x, y)
      requestRedraw()
      return
    }

    if (!isSelecting) return
    editorStore.setSelection(normalizeRect(startX, startY, x, y))
    requestRedraw()
  }

  function onPointerUp(_e: PointerEvent): void {
    isSelecting = false
  }

  function commitPaste(): void {
    const doc = docStore.activeDoc
    const ghost = editorStore.pasteGhost
    if (!doc || !ghost) return

    pasteRegion(
      doc.pixels,
      doc.meta.width,
      doc.meta.height,
      ghost.clipboard.pixels,
      ghost.clipboard.sourceRect.width,
      ghost.clipboard.sourceRect.height,
      ghost.cursorGridX,
      ghost.cursorGridY,
    )
    docStore.markDirty()
    requestRedraw()
    scheduleAutoSave()
    // Stay in HAS_GHOST for repeated paste — ghost remains
  }

  return { onPointerDown, onPointerMove, onPointerUp }
}
