<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useEditorStore } from '../../stores/editorStore'
import { useDocumentStore } from '../../stores/documentStore'
import { DrawMode } from '../../types'
import { useCanvasRenderer } from '../../composables/useCanvasRenderer'
import { useGestures } from '../../composables/useGestures'
import { useDrawing } from '../../composables/useDrawing'
import { useSelection } from '../../composables/useSelection'
import { useAutoSave } from '../../composables/useAutoSave'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
const editorStore = useEditorStore()
const docStore = useDocumentStore()

const { requestRedraw, canvasToGrid } = useCanvasRenderer(() => canvasRef.value)
const { scheduleAutoSave, flush } = useAutoSave()

// Drawing composable
const drawing = useDrawing(canvasToGrid, requestRedraw, scheduleAutoSave)

// Selection composable
const selection = useSelection(canvasToGrid, requestRedraw, scheduleAutoSave)

// Unified pointer handlers that delegate to the right composable based on mode
function handlePointerDown(e: PointerEvent): void {
  if (editorStore.mode === DrawMode.Draw) {
    drawing.onPointerDown(e)
  } else {
    selection.onPointerDown(e)
  }
}

function handlePointerMove(e: PointerEvent): void {
  if (editorStore.mode === DrawMode.Draw) {
    drawing.onPointerMove(e)
  } else {
    selection.onPointerMove(e)
  }
}

function handlePointerUp(e: PointerEvent): void {
  drawing.onPointerUp(e)
  selection.onPointerUp(e)
}

const gestures = useGestures(
  () => canvasRef.value,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
)

// Keyboard shortcuts
function onKeydown(e: KeyboardEvent): void {
  // Don't intercept if an input is focused
  const target = e.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

  if (e.key === 'd' || e.key === 'D') {
    editorStore.setMode(DrawMode.Draw)
  } else if (e.key === 's' || e.key === 'S') {
    editorStore.setMode(DrawMode.Select)
  } else if (e.key === 'Escape') {
    editorStore.clearClipboard()
  } else if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
    if (editorStore.mode === DrawMode.Select && editorStore.selection) {
      e.preventDefault()
      editorStore.copySelection()
    }
  }
}

// ResizeObserver to keep canvas crisp when container resizes
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  const canvas = canvasRef.value
  const container = containerRef.value
  if (!canvas || !container) return

  // Initialize viewport once canvas dimensions are known
  const rect = container.getBoundingClientRect()
  if (docStore.activeDoc) {
    const { width, height } = docStore.activeDoc.meta
    editorStore.initForDocument(width, height, rect.width, rect.height)
  }

  requestRedraw()

  resizeObserver = new ResizeObserver(() => requestRedraw())
  resizeObserver.observe(container)

  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('keydown', onKeydown)
  flush()
})
</script>

<template>
  <div ref="containerRef" class="canvas-container">
    <canvas
      ref="canvasRef"
      class="pixel-canvas"
      @pointerdown="gestures.onPointerDown"
      @pointermove="gestures.onPointerMove"
      @pointerup="gestures.onPointerUp"
      @pointercancel="gestures.onPointerUp"
      @mousedown.middle.prevent
      @wheel.passive="false"
      @wheel="gestures.onWheel"
    />
  </div>
</template>

<style scoped>
.canvas-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}
.pixel-canvas {
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
  cursor: crosshair;
}
</style>
