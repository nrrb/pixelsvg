export const DrawMode = {
  Draw: 'draw',
  Select: 'select',
} as const
export type DrawMode = (typeof DrawMode)[keyof typeof DrawMode]

export interface PixelDocument {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  width: number
  height: number
  pixelData: string // Base64-encoded bit-packed Uint8Array
}

export interface ActiveDocument {
  meta: PixelDocument
  pixels: Uint8Array // decoded, mutated in-place
  dirty: boolean
}

export interface Viewport {
  offsetX: number // canvas pixels from left edge to grid origin
  offsetY: number
  scale: number   // grid squares → CSS pixels
}

export interface SelectionRect {
  x: number
  y: number
  width: number
  height: number
}

export interface ClipboardData {
  sourceRect: SelectionRect
  pixels: Uint8Array // bit-packed, same dimensions as sourceRect
}

export interface PasteGhost {
  clipboard: ClipboardData
  cursorGridX: number
  cursorGridY: number
}

export interface DocListEntry {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  width: number
  height: number
}

export interface ThumbnailEntry {
  docId: string
  dataURL: string
  generatedAt: number
}

export interface StorageSchema {
  version: number
  docs: DocListEntry[]
}

export interface StorageError {
  message: string
}
