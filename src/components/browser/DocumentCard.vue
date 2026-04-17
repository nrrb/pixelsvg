<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDocumentStore } from '../../stores/documentStore'
import { useThumbnailStore } from '../../stores/thumbnailStore'
import { loadDocument } from '../../lib/storage'
import type { DocListEntry } from '../../types'

const props = defineProps<{ doc: DocListEntry }>()
const emit = defineEmits<{ (e: 'delete', id: string): void }>()

const router = useRouter()
const docStore = useDocumentStore()
const thumbStore = useThumbnailStore()

const confirmDelete = ref(false)

// Reactive: re-evaluates whenever thumbnailStore.thumbnails[id] is written
const thumbnail = computed(() => thumbStore.thumbnails[props.doc.id] ?? null)

const formattedDate = computed(() => {
  return new Date(props.doc.updatedAt).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  })
})

onMounted(() => {
  const fullDoc = loadDocument(props.doc.id)
  if (fullDoc) thumbStore.requestThumbnail(fullDoc)
})

function open(): void {
  router.push(`/editor/${props.doc.id}`)
}

function tryDelete(e: MouseEvent): void {
  e.stopPropagation()
  if (confirmDelete.value) {
    docStore.deleteDocument(props.doc.id)
    emit('delete', props.doc.id)
  } else {
    confirmDelete.value = true
  }
}

function cancelDelete(e: MouseEvent): void {
  e.stopPropagation()
  confirmDelete.value = false
}
</script>

<template>
  <div class="doc-card" @click="open">
    <div class="thumbnail">
      <img v-if="thumbnail" :src="thumbnail" alt="preview" />
      <div v-else class="thumb-placeholder">{{ doc.width }}×{{ doc.height }}</div>
    </div>
    <div class="info">
      <div class="doc-name">{{ doc.name }}</div>
      <div class="doc-date">{{ formattedDate }} · {{ doc.width }}×{{ doc.height }}</div>
    </div>
    <div class="actions" @click.stop>
      <button v-if="!confirmDelete" class="delete-btn" @click="tryDelete">Delete</button>
      <template v-else>
        <button class="confirm-btn" @click="tryDelete">Confirm</button>
        <button class="cancel-btn" @click="cancelDelete">Cancel</button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.doc-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  background: white;
  transition: box-shadow 0.1s;
}
.doc-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.thumbnail {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border: 1px solid #eee;
  border-radius: 3px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
}
.thumbnail img { width: 100%; height: 100%; object-fit: contain; }
.thumb-placeholder { font-size: 10px; color: #aaa; text-align: center; }
.info { flex: 1; min-width: 0; }
.doc-name { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.doc-date { font-size: 11px; color: #888; margin-top: 2px; }
.actions { display: flex; gap: 6px; }
.delete-btn, .confirm-btn, .cancel-btn {
  padding: 3px 10px;
  font-size: 12px;
  border-radius: 3px;
  border: 1px solid #ccc;
  cursor: pointer;
  background: white;
}
.delete-btn:hover { border-color: #c62828; color: #c62828; }
.confirm-btn { background: #c62828; color: white; border-color: #c62828; }
.cancel-btn:hover { background: #f5f5f5; }
</style>
