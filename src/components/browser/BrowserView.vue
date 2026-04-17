<script setup lang="ts">
import { computed } from 'vue'
import { useDocumentStore } from '../../stores/documentStore'
import DocumentCard from './DocumentCard.vue'
import NewDocumentButton from './NewDocumentButton.vue'

const docStore = useDocumentStore()
const docs = computed(() => docStore.sortedDocList)
</script>

<template>
  <div class="browser-layout">
    <header class="browser-header">
      <h1>PixelSVG</h1>
      <NewDocumentButton />
    </header>
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
