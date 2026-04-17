import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PixelDocument, ActiveDocument, DocListEntry, StorageSchema } from '../types'
import {
  allocatePixels,
  encodePixels,
  decodePixels,
  resizePixels,
} from '../lib/bitmap'
import {
  loadSchema,
  saveSchema,
  loadDocument,
  saveDocument,
  deleteDocument as storageDeleteDoc,
  nextDocumentName,
} from '../lib/storage'

export const useDocumentStore = defineStore('document', () => {
  const docList = ref<DocListEntry[]>([])
  const activeDoc = ref<ActiveDocument | null>(null)
  const storageError = ref<string | null>(null)

  const sortedDocList = computed(() =>
    [...docList.value].sort((a, b) => b.updatedAt - a.updatedAt),
  )

  function initStore(): void {
    const schema = loadSchema()
    docList.value = schema.docs
  }

  function persistSchema(): void {
    const schema: StorageSchema = {
      version: 1,
      docs: docList.value,
    }
    const err = saveSchema(schema)
    if (err) storageError.value = err
  }

  function createDocument(width = 1024, height = 1024, name?: string): string {
    const id = crypto.randomUUID()
    const now = Date.now()
    const docName = name ?? nextDocumentName(docList.value)
    const pixels = allocatePixels(width, height)

    const doc: PixelDocument = {
      id,
      name: docName,
      createdAt: now,
      updatedAt: now,
      width,
      height,
      pixelData: encodePixels(pixels),
    }

    const entry: DocListEntry = { id, name: docName, createdAt: now, updatedAt: now, width, height }
    docList.value.push(entry)
    persistSchema()

    const err = saveDocument(doc)
    if (err) storageError.value = err

    return id
  }

  function importDocument(name: string, width: number, height: number, pixels: Uint8Array): string {
    const id = crypto.randomUUID()
    const now = Date.now()
    const doc: PixelDocument = {
      id, name, createdAt: now, updatedAt: now, width, height,
      pixelData: encodePixels(pixels),
    }
    const entry: DocListEntry = { id, name, createdAt: now, updatedAt: now, width, height }
    docList.value.push(entry)
    persistSchema()
    const err = saveDocument(doc)
    if (err) storageError.value = err
    return id
  }

  function openDocument(id: string): boolean {
    const doc = loadDocument(id)
    if (!doc) return false
    activeDoc.value = {
      meta: { ...doc },
      pixels: decodePixels(doc.pixelData),
      dirty: false,
    }
    return true
  }

  function saveActiveDocument(): void {
    const doc = activeDoc.value
    if (!doc) return
    doc.meta.updatedAt = Date.now()
    doc.meta.pixelData = encodePixels(doc.pixels)
    doc.dirty = false

    const err = saveDocument(doc.meta)
    if (err) {
      storageError.value = err
      return
    }
    storageError.value = null

    // Update the index entry
    const entry = docList.value.find((d) => d.id === doc.meta.id)
    if (entry) {
      entry.name = doc.meta.name
      entry.updatedAt = doc.meta.updatedAt
    }
    persistSchema()
  }

  function deleteDocument(id: string): void {
    storageDeleteDoc(id)
    docList.value = docList.value.filter((d) => d.id !== id)
    if (activeDoc.value?.meta.id === id) {
      activeDoc.value = null
    }
    persistSchema()
  }

  function renameDocument(id: string, name: string): void {
    const entry = docList.value.find((d) => d.id === id)
    if (entry) entry.name = name

    if (activeDoc.value?.meta.id === id) {
      activeDoc.value.meta.name = name
      activeDoc.value.dirty = true
    }

    // Immediately persist the full document with the new name
    const doc = loadDocument(id)
    if (doc) {
      doc.name = name
      saveDocument(doc)
    }
    persistSchema()
  }

  function resizeDocument(id: string, newWidth: number, newHeight: number): void {
    const doc = activeDoc.value
    if (!doc || doc.meta.id !== id) return

    const newPixels = resizePixels(doc.pixels, doc.meta.width, doc.meta.height, newWidth, newHeight)
    doc.pixels = newPixels
    doc.meta.width = newWidth
    doc.meta.height = newHeight
    doc.dirty = true

    const entry = docList.value.find((d) => d.id === id)
    if (entry) {
      entry.width = newWidth
      entry.height = newHeight
    }
  }

  function markDirty(): void {
    if (activeDoc.value) activeDoc.value.dirty = true
  }

  function clearStorageError(): void {
    storageError.value = null
  }

  return {
    docList,
    activeDoc,
    storageError,
    sortedDocList,
    initStore,
    createDocument,
    importDocument,
    openDocument,
    saveActiveDocument,
    deleteDocument,
    renameDocument,
    resizeDocument,
    markDirty,
    clearStorageError,
  }
})
