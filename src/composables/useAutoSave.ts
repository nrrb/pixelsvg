import { useDocumentStore } from '../stores/documentStore'
import { useThumbnailStore } from '../stores/thumbnailStore'
import { loadDocument } from '../lib/storage'

export function useAutoSave(delayMs = 1000) {
  let timer: ReturnType<typeof setTimeout> | null = null
  const docStore = useDocumentStore()
  const thumbStore = useThumbnailStore()

  function scheduleAutoSave(): void {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      flush()
    }, delayMs)
  }

  function flush(): void {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    const doc = docStore.activeDoc
    if (doc?.dirty) {
      docStore.saveActiveDocument()
      // Regenerate thumbnail after save
      const saved = loadDocument(doc.meta.id)
      if (saved) {
        thumbStore.invalidate(saved.id)
        thumbStore.requestThumbnail(saved)
      }
    }
  }

  return { scheduleAutoSave, flush }
}
