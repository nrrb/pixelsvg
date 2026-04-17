import { useEditorStore } from '../stores/editorStore'

interface GestureState {
  pointers: Map<number, PointerEvent>
  lastMidX: number
  lastMidY: number
  lastDist: number
  middleButtonDown: boolean
  lastMiddleX: number
  lastMiddleY: number
}

function midpoint(a: PointerEvent, b: PointerEvent) {
  return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 }
}

function distance(a: PointerEvent, b: PointerEvent) {
  const dx = a.clientX - b.clientX
  const dy = a.clientY - b.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

export function useGestures(
  getCanvas: () => HTMLCanvasElement | null,
  onSinglePointerDown: (e: PointerEvent) => void,
  onSinglePointerMove: (e: PointerEvent) => void,
  onSinglePointerUp: (e: PointerEvent) => void,
) {
  const editorStore = useEditorStore()
  const state: GestureState = {
    pointers: new Map(),
    lastMidX: 0,
    lastMidY: 0,
    lastDist: 0,
    middleButtonDown: false,
    lastMiddleX: 0,
    lastMiddleY: 0,
  }

  function onPointerDown(e: PointerEvent): void {
    const canvas = getCanvas()
    if (!canvas) return

    // Middle button pan
    if (e.button === 1) {
      e.preventDefault()
      state.middleButtonDown = true
      state.lastMiddleX = e.clientX
      state.lastMiddleY = e.clientY
      canvas.setPointerCapture(e.pointerId)
      return
    }

    canvas.setPointerCapture(e.pointerId)
    state.pointers.set(e.pointerId, e)

    if (state.pointers.size === 1) {
      onSinglePointerDown(e)
    } else if (state.pointers.size === 2) {
      // Starting a two-finger gesture — cancel single-pointer drawing
      onSinglePointerUp(e)
      const [a, b] = Array.from(state.pointers.values())
      const mid = midpoint(a, b)
      state.lastMidX = mid.x
      state.lastMidY = mid.y
      state.lastDist = distance(a, b)
    }
  }

  function onPointerMove(e: PointerEvent): void {
    // Middle button pan
    if (state.middleButtonDown) {
      editorStore.panViewport(e.clientX - state.lastMiddleX, e.clientY - state.lastMiddleY)
      state.lastMiddleX = e.clientX
      state.lastMiddleY = e.clientY
      return
    }

    state.pointers.set(e.pointerId, e)

    if (state.pointers.size === 1) {
      onSinglePointerMove(e)
    } else if (state.pointers.size === 2) {
      const [a, b] = Array.from(state.pointers.values())
      const mid = midpoint(a, b)
      const dist = distance(a, b)

      const dx = mid.x - state.lastMidX
      const dy = mid.y - state.lastMidY
      const zoomFactor = dist / (state.lastDist || dist)

      // Apply pan first, then zoom toward new midpoint
      editorStore.panViewport(dx, dy)
      if (Math.abs(zoomFactor - 1) > 0.001) {
        editorStore.zoomViewport(zoomFactor, mid.x, mid.y)
      }

      state.lastMidX = mid.x
      state.lastMidY = mid.y
      state.lastDist = dist
    }
  }

  function onPointerUp(e: PointerEvent): void {
    if (e.button === 1) {
      state.middleButtonDown = false
      return
    }
    if (state.pointers.size === 1) {
      onSinglePointerUp(e)
    }
    state.pointers.delete(e.pointerId)
  }

  function onWheel(e: WheelEvent): void {
    e.preventDefault()
    const canvas = getCanvas()
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (e.ctrlKey || e.metaKey) {
      // Trackpad pinch or Ctrl/Cmd+scroll → zoom toward cursor
      const factor = Math.exp(-e.deltaY * 0.01)
      editorStore.zoomViewport(factor, x, y)
    } else if (e.shiftKey) {
      // Shift+scroll → pan horizontally (scroll wheel sends deltaY; treat it as X)
      editorStore.panViewport(-(e.deltaY || e.deltaX), 0)
    } else {
      // Plain scroll or trackpad two-finger pan → pan both axes
      editorStore.panViewport(-e.deltaX, -e.deltaY)
    }
  }

  return { onPointerDown, onPointerMove, onPointerUp, onWheel }
}
