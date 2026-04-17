<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useDocumentStore } from '../../stores/documentStore'
import TopBar from './TopBar.vue'
import PixelCanvas from './PixelCanvas.vue'
import BottomBar from './BottomBar.vue'

const route = useRoute()
const router = useRouter()
const docStore = useDocumentStore()

// Load synchronously in setup so activeDoc is set before children mount
const id = route.params.id as string
const ok = docStore.openDocument(id)
if (!ok) router.replace('/')
</script>

<template>
  <div class="editor-layout">
    <TopBar />
    <PixelCanvas />
    <BottomBar />
  </div>
</template>

<style scoped>
.editor-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}
</style>
