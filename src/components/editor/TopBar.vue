<script setup lang="ts">
import { ref } from 'vue'
import { useDocumentStore } from '../../stores/documentStore'
import { useEditorStore } from '../../stores/editorStore'
import { useExport } from '../../composables/useExport'
import { DrawMode } from '../../types'
import DocumentNameInput from './DocumentNameInput.vue'

const docStore = useDocumentStore()
const editorStore = useEditorStore()
const { exportSVG } = useExport()

type EditingField = 'width' | 'height' | null
const editingField = ref<EditingField>(null)
const localValue = ref(0)
const inputRef = ref<HTMLInputElement | null>(null)

function startEdit(field: EditingField): void {
  const doc = docStore.activeDoc
  if (!doc || !field) return
  editingField.value = field
  localValue.value = field === 'width' ? doc.meta.width : doc.meta.height
  setTimeout(() => inputRef.value?.select(), 0)
}

function commit(): void {
  const field = editingField.value
  const doc = docStore.activeDoc
  editingField.value = null
  if (!doc || !field) return
  const val = Math.max(1, Math.round(localValue.value) || 1)
  const newW = field === 'width' ? val : doc.meta.width
  const newH = field === 'height' ? val : doc.meta.height
  if (newW !== doc.meta.width || newH !== doc.meta.height) {
    docStore.resizeDocument(doc.meta.id, newW, newH)
  }
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter') commit()
  if (e.key === 'Escape') {
    editingField.value = null
  }
}
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
      <div v-if="docStore.activeDoc" class="dims">
        <input
          v-if="editingField === 'width'"
          ref="inputRef"
          v-model.number="localValue"
          class="dim-input"
          type="number"
          min="1"
          @blur="commit"
          @keydown="onKeydown"
        />
        <span v-else class="dim-value" @click="startEdit('width')">
          {{ docStore.activeDoc.meta.width }}
        </span>
        <span class="dims-sep">×</span>
        <input
          v-if="editingField === 'height'"
          ref="inputRef"
          v-model.number="localValue"
          class="dim-input"
          type="number"
          min="1"
          @blur="commit"
          @keydown="onKeydown"
        />
        <span v-else class="dim-value" @click="startEdit('height')">
          {{ docStore.activeDoc.meta.height }}
        </span>
      </div>
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
  min-width: 0;
  padding: 0 12px;
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
.dims {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  color: #555;
}
.dim-value {
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 3px;
  font-variant-numeric: tabular-nums;
}
.dim-value:hover { background: rgba(0,0,0,0.07); }
.dim-input {
  width: 52px;
  padding: 2px 4px;
  border: 1px solid #aaa;
  border-radius: 3px;
  font-size: 12px;
  font-family: inherit;
  text-align: center;
  outline: none;
}
.dims-sep { color: #888; }
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
