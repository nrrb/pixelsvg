<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDocumentStore } from '../../stores/documentStore'

const router = useRouter()
const docStore = useDocumentStore()
const showForm = ref(false)
const width = ref(1024)
const height = ref(1024)

function create(): void {
  const id = docStore.createDocument(width.value, height.value)
  router.push(`/editor/${id}`)
}
</script>

<template>
  <div class="new-doc">
    <button v-if="!showForm" class="new-btn" @click="showForm = true">+ New Document</button>
    <form v-else class="new-form" @submit.prevent="create">
      <label>Width <input v-model.number="width" type="number" min="1" max="8192" /></label>
      <label>Height <input v-model.number="height" type="number" min="1" max="8192" /></label>
      <button type="submit">Create</button>
      <button type="button" @click="showForm = false">Cancel</button>
    </form>
  </div>
</template>

<style scoped>
.new-btn {
  padding: 8px 16px;
  background: #1a73e8;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}
.new-btn:hover { background: #1558b0; }
.new-form {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.new-form label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}
.new-form input {
  width: 80px;
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-size: 13px;
}
.new-form button {
  padding: 5px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  background: white;
}
.new-form button[type=submit] { background: #1a73e8; color: white; border-color: #1a73e8; }
.new-form button[type=submit]:hover { background: #1558b0; }
</style>
