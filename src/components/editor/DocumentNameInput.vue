<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDocumentStore } from '../../stores/documentStore'

const docStore = useDocumentStore()
const editing = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const localName = ref('')

watch(
  () => docStore.activeDoc?.meta.name,
  (name) => { if (name !== undefined && !editing.value) localName.value = name },
  { immediate: true },
)

function startEdit(): void {
  if (!docStore.activeDoc) return
  localName.value = docStore.activeDoc.meta.name
  editing.value = true
  setTimeout(() => inputRef.value?.select(), 0)
}

function commit(): void {
  editing.value = false
  const doc = docStore.activeDoc
  if (!doc) return
  const trimmed = localName.value.trim() || doc.meta.name
  localName.value = trimmed
  if (trimmed !== doc.meta.name) {
    docStore.renameDocument(doc.meta.id, trimmed)
  }
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter') commit()
  if (e.key === 'Escape') {
    editing.value = false
    localName.value = docStore.activeDoc?.meta.name ?? ''
  }
}
</script>

<template>
  <span v-if="!editing" class="doc-name" @click="startEdit">{{ localName }}</span>
  <input
    v-else
    ref="inputRef"
    v-model="localName"
    class="doc-name-input"
    @blur="commit"
    @keydown="onKeydown"
  />
</template>

<style scoped>
.doc-name {
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 240px;
}
.doc-name:hover {
  background: rgba(0,0,0,0.07);
}
.doc-name-input {
  padding: 2px 6px;
  border: 1px solid #aaa;
  border-radius: 3px;
  font-size: inherit;
  font-family: inherit;
  max-width: 240px;
  outline: none;
}
</style>
