import { defineStore } from 'pinia'
import { ref } from 'vue'
import { DrawMode } from '../types'
import type { Viewport, SelectionRect, ClipboardData, PasteGhost } from '../types'
import { copyRegion } from '../lib/bitmap'
import { useDocumentStore } from './documentStore'

export const useEditorStore = defineStore('editor', () => {
  const mode = ref<DrawMode>(DrawMode.Draw)
  const viewport = ref<Viewport>({ offsetX: 0, offsetY: 0, scale: 1 })
  const selection = ref<SelectionRect | null>(null)
  const clipboard = ref<ClipboardData | null>(null)
  const pasteGhost = ref<PasteGhost | null>(null)

  function setMode(m: DrawMode): void {
    mode.value = m
    if (m === DrawMode.Draw) {
      clearClipboard()
    }
    if (m !== DrawMode.Select) {
      selection.value = null
    }
  }

  function setViewport(vp: Viewport): void {
    viewport.value = vp
  }

  function panViewport(dx: number, dy: number): void {
    viewport.value = {
      ...viewport.value,
      offsetX: viewport.value.offsetX + dx,
      offsetY: viewport.value.offsetY + dy,
    }
  }

  function zoomViewport(factor: number, pivotX: number, pivotY: number): void {
    const { offsetX, offsetY, scale } = viewport.value
    const newScale = scale * factor
    viewport.value = {
      scale: newScale,
      offsetX: pivotX - (pivotX - offsetX) * factor,
      offsetY: pivotY - (pivotY - offsetY) * factor,
    }
  }

  function setSelection(rect: SelectionRect | null): void {
    selection.value = rect
  }

  function copySelection(): void {
    const docStore = useDocumentStore()
    const doc = docStore.activeDoc
    if (!doc || !selection.value) return

    const { x, y, width, height } = selection.value
    const pixels = copyRegion(doc.pixels, doc.meta.width, x, y, width, height)
    clipboard.value = { sourceRect: { ...selection.value }, pixels }
    pasteGhost.value = { clipboard: clipboard.value, cursorGridX: x, cursorGridY: y }
  }

  function setPasteGhost(gridX: number, gridY: number): void {
    if (!clipboard.value) return
    pasteGhost.value = { clipboard: clipboard.value, cursorGridX: gridX, cursorGridY: gridY }
  }

  function commitPaste(): void {
    // Actual pixel writing is done by useSelection composable;
    // this just keeps the ghost active for another paste
    // (ghost stays, cursor can be moved for next placement)
  }

  function clearClipboard(): void {
    clipboard.value = null
    pasteGhost.value = null
  }

  function initForDocument(docWidth: number, docHeight: number, canvasWidth: number, canvasHeight: number): void {
    // Center the document in the canvas with some padding
    const padding = 40
    const scaleX = (canvasWidth - padding * 2) / docWidth
    const scaleY = (canvasHeight - padding * 2) / docHeight
    const scale = Math.min(scaleX, scaleY)
    const offsetX = (canvasWidth - docWidth * scale) / 2
    const offsetY = (canvasHeight - docHeight * scale) / 2
    viewport.value = { scale, offsetX, offsetY }
    selection.value = null
    clipboard.value = null
    pasteGhost.value = null
    mode.value = DrawMode.Draw
  }

  return {
    mode,
    viewport,
    selection,
    clipboard,
    pasteGhost,
    setMode,
    setViewport,
    panViewport,
    zoomViewport,
    setSelection,
    copySelection,
    setPasteGhost,
    commitPaste,
    clearClipboard,
    initForDocument,
  }
})
