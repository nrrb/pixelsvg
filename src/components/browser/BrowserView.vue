<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDocumentStore } from '../../stores/documentStore'
import { parseSVG } from '../../lib/svgImport'
import DocumentCard from './DocumentCard.vue'
import NewDocumentButton from './NewDocumentButton.vue'

const docStore = useDocumentStore()
const router = useRouter()
const docs = computed(() => docStore.sortedDocList)

const fileInputRef = ref<HTMLInputElement | null>(null)
const importError = ref<string | null>(null)

const sampleSVGs = import.meta.glob('/src/samples/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

function importSamples(): void {
  importError.value = null
  for (const [path, text] of Object.entries(sampleSVGs)) {
    const filename = path.split('/').pop() ?? path
    const result = parseSVG(text, filename)
    if ('message' in result) continue
    docStore.importDocument(result.name, result.width, result.height, result.pixels)
  }
}

function triggerImport(): void {
  importError.value = null
  fileInputRef.value?.click()
}

function onFileSelected(e: Event): void {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  ;(e.target as HTMLInputElement).value = '' // allow re-selecting same file

  const reader = new FileReader()
  reader.onload = (ev) => {
    const text = ev.target?.result as string
    const result = parseSVG(text, file.name)
    if ('message' in result) {
      importError.value = result.message
      return
    }
    const id = docStore.importDocument(result.name, result.width, result.height, result.pixels)
    router.push(`/editor/${id}`)
  }
  reader.readAsText(file)
}
</script>

<template>
  <div class="browser-layout">
    <header class="browser-header">
      <h1>PixelSVG</h1>
      <div class="header-actions">
        <input ref="fileInputRef" type="file" accept=".svg,image/svg+xml" class="file-input" @change="onFileSelected" />
        <button class="import-btn" @click="importSamples">Import Samples</button>
        <button class="import-btn" @click="triggerImport">Import SVG</button>
        <NewDocumentButton />
      </div>
    </header>
    <div v-if="importError" class="import-error" @click="importError = null">
      {{ importError }} ✕
    </div>
    <main class="browser-main">
      <div v-if="docs.length === 0" class="empty">
        No documents yet. Create one to get started.
      </div>
      <div v-else class="doc-list">
        <DocumentCard
          v-for="doc in docs"
          :key="doc.id"
          :doc="doc"
        />
      </div>
    </main>
  </div>
</template>

<style scoped>
.browser-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #f8f8f8;
}
.browser-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
  background: white;
}
h1 { font-size: 18px; font-weight: 600; }
.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.file-input { display: none; }
.import-btn {
  padding: 8px 16px;
  background: white;
  color: #333;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}
.import-btn:hover { background: #f0f0f0; }
.import-error {
  background: #ffebee;
  color: #c62828;
  font-size: 12px;
  padding: 6px 24px;
  cursor: pointer;
  border-bottom: 1px solid #ffcdd2;
}
.browser-main {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}
.doc-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 640px;
}
.empty {
  color: #888;
  font-size: 14px;
  margin-top: 40px;
  text-align: center;
}
</style>
