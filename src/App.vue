<script setup lang="ts">
import { onMounted } from 'vue'
import { useDocumentStore } from './stores/documentStore'

const docStore = useDocumentStore()
onMounted(() => docStore.initStore())
</script>

<template>
  <RouterView />
</template>

<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #app { width: 100%; height: 100%; overflow: hidden; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 13px; }
</style>
