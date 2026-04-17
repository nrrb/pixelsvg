<script setup lang="ts">
import { useEditorStore } from '../../stores/editorStore'
import { DrawMode } from '../../types'

const editorStore = useEditorStore()
</script>

<template>
  <div class="bottom-bar">
    <button
      class="mode-btn"
      :class="{ active: editorStore.mode === DrawMode.Select }"
      @click="editorStore.setMode(DrawMode.Select)"
    >Select</button>
    <button
      class="mode-btn"
      :class="{ active: editorStore.mode === DrawMode.Draw }"
      @click="editorStore.setMode(DrawMode.Draw)"
    >Draw</button>
  </div>
</template>

<style scoped>
.bottom-bar {
  display: flex;
  height: 40px;
  flex-shrink: 0;
  border-top: 1px solid #e0e0e0;
  background: #fafafa;
}
.mode-btn {
  flex: 1;
  border: none;
  background: none;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  color: #555;
}
.mode-btn:first-child {
  border-right: 1px solid #e0e0e0;
}
.mode-btn:hover { background: #f0f0f0; }
.mode-btn.active {
  background: #111;
  color: white;
  font-weight: 500;
}
</style>
