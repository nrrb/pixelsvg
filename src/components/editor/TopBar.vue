<script setup lang="ts">
import { useDocumentStore } from '../../stores/documentStore'
import { useEditorStore } from '../../stores/editorStore'
import { useExport } from '../../composables/useExport'
import { DrawMode } from '../../types'
import DocumentNameInput from './DocumentNameInput.vue'

const docStore = useDocumentStore()
const editorStore = useEditorStore()
const { exportSVG } = useExport()
</script>

<template>
  <header class="top-bar">
    <RouterLink to="/" class="nav-link">← Documents</RouterLink>
    <div class="center">
      <DocumentNameInput />
      <span v-if="editorStore.mode === DrawMode.Select" class="mode-badge">Select</span>
    </div>
    <div class="right">
      <span v-if="docStore.storageError" class="storage-error" @click="docStore.clearStorageError">
        {{ docStore.storageError }} ✕
      </span>
      <button class="export-btn" :disabled="!docStore.activeDoc" @click="exportSVG">Export SVG</button>
    </div>
  </header>
</template>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 0 12px;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
  flex-shrink: 0;
  user-select: none;
}
.nav-link {
  color: #444;
  text-decoration: none;
  white-space: nowrap;
  font-size: 13px;
}
.nav-link:hover { color: #000; }
.center {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
}
.mode-badge {
  font-size: 11px;
  padding: 1px 6px;
  background: #e8f0fe;
  color: #1a73e8;
  border-radius: 10px;
}
.right {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}
.storage-error {
  font-size: 11px;
  color: #c62828;
  background: #ffebee;
  padding: 2px 8px;
  border-radius: 3px;
  cursor: pointer;
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.export-btn {
  padding: 4px 12px;
  font-size: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}
.export-btn:hover:not(:disabled) { background: #f0f0f0; }
.export-btn:disabled { opacity: 0.4; cursor: default; }
</style>
