import { useEditorStore } from '../stores/editorStore'

interface GestureState {
  pointers: Map<number, PointerEvent>
  lastMidX: number
  lastMidY: number
  lastDist: number
  middleButtonDown: boolean
  lastMiddleX: number
  lastMiddleY: number
  pinchOccurred: boolean
  pendingDownTimer: ReturnType<typeof setTimeout> | null
  pendingDownEvent: PointerEvent | null
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
    pinchOccurred: false,
    pendingDownTimer: null,
    pendingDownEvent: null,
  }

  function flushPendingDown(): void {
    if (state.pendingDownTimer !== null) {
      clearTimeout(state.pendingDownTimer)
      state.pendingDownTimer = null
    }
    if (state.pendingDownEvent) {
      onSinglePointerDown(state.pendingDownEvent)
      state.pendingDownEvent = null
    }
  }

  function cancelPendingDown(): void {
    if (state.pendingDownTimer !== null) {
      clearTimeout(state.pendingDownTimer)
      state.pendingDownTimer = null
    }
    state.pendingDownEvent = null
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
      if (!state.pinchOccurred) {
        if (e.pointerType === 'touch') {
          // Defer touch so a fast second finger can cancel before drawing begins
          state.pendingDownEvent = e
          state.pendingDownTimer = setTimeout(() => {
            if (state.pendingDownEvent) {
              onSinglePointerDown(state.pendingDownEvent)
              state.pendingDownEvent = null
            }
          }, 50)
        } else {
          onSinglePointerDown(e)
        }
      }
    } else if (state.pointers.size === 2) {
      // Second finger arrived — cancel any pending draw start and begin pinch
      cancelPendingDown()
      state.pinchOccurred = true
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
      if (!state.pinchOccurred) {
        // Flush deferred touch down immediately on drag so there's no latency
        if (state.pendingDownEvent) flushPendingDown()
        onSinglePointerMove(e)
      }
    } else if (state.pointers.size === 2) {
      const [a, b] = Array.from(state.pointers.values())
      const mid = midpoint(a, b)
      const dist = distance(a, b)

      const dx = mid.x - state.lastMidX
      const dy = mid.y - state.lastMidY
      const zoomFactor = dist / (state.lastDist || dist)

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
      if (!state.pinchOccurred) {
        // Flush any deferred touch down before firing up (handles quick taps)
        if (state.pendingDownEvent) flushPendingDown()
        onSinglePointerUp(e)
      } else {
        cancelPendingDown()
      }
      // Last finger lifted — reset pinch guard so next touch draws normally
      state.pinchOccurred = false
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
      const factor = Math.exp(-e.deltaY * 0.01)
      editorStore.zoomViewport(factor, x, y)
    } else if (e.shiftKey) {
      editorStore.panViewport(-(e.deltaY || e.deltaX), 0)
    } else {
      editorStore.panViewport(-e.deltaX, -e.deltaY)
    }
  }

  return { onPointerDown, onPointerMove, onPointerUp, onWheel }
}
