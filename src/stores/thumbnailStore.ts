import { defineStore } from 'pinia'
import { reactive } from 'vue'
import type { PixelDocument } from '../types'
import { generateThumbnail } from '../lib/thumbnails'
import { loadThumbnail, saveThumbnail } from '../lib/storage'

// Keyed by docId → data URL. Vue tracks property writes on reactive plain objects,
// so DocumentCard can read this directly as a computed/template expression and
// re-render whenever a thumbnail is generated or updated.
export const useThumbnailStore = defineStore('thumbnail', () => {
  const thumbnails = reactive<Record<string, string>>({})
  // Tracks the updatedAt timestamp used to generate each cached thumbnail
  const generatedAt = reactive<Record<string, number>>({})

  function requestThumbnail(doc: PixelDocument): void {
    if (generatedAt[doc.id] !== undefined && generatedAt[doc.id] >= doc.updatedAt) {
      return // Already up to date
    }

    // Try loading from localStorage first
    const stored = loadThumbnail(doc.id)
    if (stored) {
      thumbnails[doc.id] = stored
      generatedAt[doc.id] = doc.updatedAt
      return
    }

    // Generate fresh (synchronous)
    const dataURL = generateThumbnail(doc)
    thumbnails[doc.id] = dataURL
    generatedAt[doc.id] = doc.updatedAt
    saveThumbnail(doc.id, dataURL)
  }

  function invalidate(docId: string): void {
    delete thumbnails[docId]
    delete generatedAt[docId]
  }

  return { thumbnails, requestThumbnail, invalidate }
})
