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
html, body, #app { width: 100%; height: 100%; overflow: hidden; }
</style>
