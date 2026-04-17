import type { PixelDocument, StorageSchema, DocListEntry } from '../types'

const SCHEMA_KEY = 'pixelsvg:schema'
const CURRENT_VERSION = 1

function docKey(id: string): string {
  return `pixelsvg:doc:${id}`
}

function thumbKey(id: string): string {
  return `pixelsvg:thumb:${id}`
}

function safeSetItem(key: string, value: string): string | null {
  try {
    localStorage.setItem(key, value)
    return null
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      return 'Storage quota exceeded. Delete some documents to free space.'
    }
    return 'Failed to save to storage.'
  }
}

export function loadSchema(): StorageSchema {
  try {
    const raw = localStorage.getItem(SCHEMA_KEY)
    if (!raw) return { version: CURRENT_VERSION, docs: [] }
    const parsed = JSON.parse(raw) as StorageSchema
    // Future migrations would go here based on parsed.version
    return parsed
  } catch {
    return { version: CURRENT_VERSION, docs: [] }
  }
}

export function saveSchema(schema: StorageSchema): string | null {
  return safeSetItem(SCHEMA_KEY, JSON.stringify(schema))
}

export function loadDocument(id: string): PixelDocument | null {
  try {
    const raw = localStorage.getItem(docKey(id))
    if (!raw) return null
    return JSON.parse(raw) as PixelDocument
  } catch {
    return null
  }
}

export function saveDocument(doc: PixelDocument): string | null {
  return safeSetItem(docKey(doc.id), JSON.stringify(doc))
}

export function deleteDocument(id: string): void {
  localStorage.removeItem(docKey(id))
  localStorage.removeItem(thumbKey(id))
}

export function loadThumbnail(id: string): string | null {
  return localStorage.getItem(thumbKey(id))
}

export function saveThumbnail(id: string, dataURL: string): void {
  // Thumbnails are best-effort — ignore quota errors
  try {
    localStorage.setItem(thumbKey(id), dataURL)
  } catch {
    // ignore
  }
}

export function deleteThumbnail(id: string): void {
  localStorage.removeItem(thumbKey(id))
}

export function nextDocumentName(docs: DocListEntry[]): string {
  const base = 'pixelsvg'
  const used = new Set(docs.map((d) => d.name))
  let i = 0
  while (used.has(`${base}${i}`)) i++
  return `${base}${i}`
}
