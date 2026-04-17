import { watch } from 'vue'
import { useDocumentStore } from '../stores/documentStore'
import { useEditorStore } from '../stores/editorStore'
import { getPixel } from '../lib/bitmap'


export function useCanvasRenderer(getCanvas: () => HTMLCanvasElement | null) {
  const docStore = useDocumentStore()
  const editorStore = useEditorStore()

  let pendingFrame = false

  function requestRedraw(): void {
    if (pendingFrame) return
    pendingFrame = true
    requestAnimationFrame(render)
  }

  function canvasToGrid(cx: number, cy: number): { x: number; y: number } {
    const vp = editorStore.viewport
    return {
      x: Math.floor((cx - vp.offsetX) / vp.scale),
      y: Math.floor((cy - vp.offsetY) / vp.scale),
    }
  }

  function render(): void {
    pendingFrame = false
    const canvas = getCanvas()
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const cssW = canvas.clientWidth
    const cssH = canvas.clientHeight

    // Resize canvas physical pixels if needed
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr)
      canvas.height = Math.round(cssH * dpr)
    }

    const W = canvas.width
    const H = canvas.height

    ctx.save()
    ctx.clearRect(0, 0, W, H)

    // White background
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, W, H)

    const doc = docStore.activeDoc
    if (!doc) {
      ctx.restore()
      return
    }

    const { offsetX, offsetY, scale } = editorStore.viewport
    // Account for device pixel ratio in transform
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, offsetX * dpr, offsetY * dpr)

    // --- Pixel layer ---
    const docW = doc.meta.width
    const docH = doc.meta.height
    const pixels = doc.pixels

    // Visible region in grid coords
    const visLeft = Math.max(0, Math.floor(-offsetX / scale))
    const visTop = Math.max(0, Math.floor(-offsetY / scale))
    const visRight = Math.min(docW, Math.ceil((cssW - offsetX) / scale))
    const visBottom = Math.min(docH, Math.ceil((cssH - offsetY) / scale))

    const visibleW = visRight - visLeft
    const visibleH = visBottom - visTop
    const visibleCount = visibleW * visibleH

    if (visibleCount > 0) {
      if (visibleCount > 100_000) {
        // ImageData strategy for large zoomed-out views
        drawPixelLayerImageData(ctx, pixels, docW, docH, scale, dpr, offsetX, offsetY, cssW, cssH)
      } else {
        // Path2D strategy for high-zoom views
        drawPixelLayerPath2D(ctx, pixels, docW, visLeft, visTop, visRight, visBottom)
      }
    }

    // --- Document border ---
    ctx.strokeStyle = '#ccc'
    ctx.lineWidth = 1 / scale
    ctx.strokeRect(0, 0, docW, docH)

    // --- Grid lines (only when each square is large enough to make lines meaningful) ---
    if (scale > 16) {
      drawGridLines(ctx, scale, visLeft, visTop, visRight, visBottom)
    }

    // --- Selection rect ---
    const sel = editorStore.selection
    if (sel) {
      ctx.strokeStyle = '#0066ff'
      ctx.lineWidth = 1.5 / scale
      ctx.setLineDash([4 / scale, 4 / scale])
      ctx.strokeRect(sel.x, sel.y, sel.width, sel.height)
      ctx.setLineDash([])
    }

    // --- Paste ghost ---
    const ghost = editorStore.pasteGhost
    if (ghost) {
      const { clipboard, cursorGridX, cursorGridY } = ghost
      const { pixels: gPixels, sourceRect } = clipboard
      const { width: gW, height: gH } = sourceRect

      ctx.save()
      ctx.globalAlpha = 0.5
      const ghostPath = new Path2D()
      for (let gy = 0; gy < gH; gy++) {
        for (let gx = 0; gx < gW; gx++) {
          if (getPixel(gPixels, gx, gy, gW)) {
            ghostPath.rect(cursorGridX + gx, cursorGridY + gy, 1, 1)
          }
        }
      }
      ctx.fillStyle = 'black'
      ctx.fill(ghostPath)

      // Ghost outline
      ctx.globalAlpha = 1
      ctx.strokeStyle = '#0066ff'
      ctx.lineWidth = 1.5 / scale
      ctx.setLineDash([4 / scale, 4 / scale])
      ctx.strokeRect(cursorGridX, cursorGridY, gW, gH)
      ctx.setLineDash([])
      ctx.restore()
    }

    ctx.restore()
  }

  function drawPixelLayerPath2D(
    ctx: CanvasRenderingContext2D,
    pixels: Uint8Array,
    docW: number,
    visLeft: number,
    visTop: number,
    visRight: number,
    visBottom: number,
  ): void {
    const path = new Path2D()
    for (let y = visTop; y < visBottom; y++) {
      for (let x = visLeft; x < visRight; x++) {
        if (getPixel(pixels, x, y, docW)) {
          path.rect(x, y, 1, 1)
        }
      }
    }
    ctx.fillStyle = 'black'
    ctx.fill(path)
  }

  function drawPixelLayerImageData(
    ctx: CanvasRenderingContext2D,
    pixels: Uint8Array,
    docW: number,
    docH: number,
    scale: number,
    dpr: number,
    offsetX: number,
    offsetY: number,
    cssW: number,
    cssH: number,
  ): void {
    // Reset transform to screen space for ImageData
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    const screenLeft = Math.max(0, Math.floor(offsetX * dpr))
    const screenTop = Math.max(0, Math.floor(offsetY * dpr))
    const screenRight = Math.min(cssW * dpr, Math.ceil((offsetX + docW * scale) * dpr))
    const screenBottom = Math.min(cssH * dpr, Math.ceil((offsetY + docH * scale) * dpr))
    const imgW = screenRight - screenLeft
    const imgH = screenBottom - screenTop

    if (imgW <= 0 || imgH <= 0) {
      ctx.restore()
      return
    }

    const imageData = ctx.createImageData(imgW, imgH)
    const data = imageData.data
    // Pre-fill with opaque white — createImageData defaults to transparent black
    data.fill(255)

    const scalePx = scale * dpr
    for (let sy = 0; sy < imgH; sy++) {
      for (let sx = 0; sx < imgW; sx++) {
        // Subtract offset to get grid coordinate correctly
        const gx = Math.floor((screenLeft + sx - offsetX * dpr) / scalePx)
        const gy = Math.floor((screenTop + sy - offsetY * dpr) / scalePx)
        if (gx >= 0 && gx < docW && gy >= 0 && gy < docH) {
          if (getPixel(pixels, gx, gy, docW)) {
            const idx = (sy * imgW + sx) * 4
            data[idx] = 0
            data[idx + 1] = 0
            data[idx + 2] = 0
            // alpha is already 255 from fill
          }
        }
      }
    }

    ctx.putImageData(imageData, screenLeft, screenTop)
    ctx.restore()
  }

  function drawGridLines(
    ctx: CanvasRenderingContext2D,
    _scale: number,
    visLeft: number,
    visTop: number,
    visRight: number,
    visBottom: number,
  ): void {
    const path = new Path2D()
    for (let x = visLeft; x <= visRight; x++) {
      path.moveTo(x, visTop)
      path.lineTo(x, visBottom)
    }
    for (let y = visTop; y <= visBottom; y++) {
      path.moveTo(visLeft, y)
      path.lineTo(visRight, y)
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.1)'
    ctx.lineWidth = 0.05
    ctx.stroke(path)
  }

  // Watch store changes that require a redraw
  watch(() => editorStore.viewport, requestRedraw, { deep: true })
  watch(() => editorStore.selection, requestRedraw, { deep: true })
  watch(() => editorStore.pasteGhost, requestRedraw, { deep: true })
  watch(() => docStore.activeDoc, requestRedraw)
  watch(() => docStore.activeDoc?.meta.width, requestRedraw)
  watch(() => docStore.activeDoc?.meta.height, requestRedraw)

  return { requestRedraw, canvasToGrid }
}
