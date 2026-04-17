<script setup lang="ts">
import { useEditorStore } from '../../stores/editorStore'
import { DrawMode } from '../../types'

const editorStore = useEditorStore()
const isSelect = () => editorStore.mode === DrawMode.Select
</script>

<template>
  <div class="bottom-bar">
    <button
      class="mode-btn"
      :class="{ active: editorStore.mode === DrawMode.Select, narrow: isSelect() }"
      @click="editorStore.setMode(DrawMode.Select)"
    >Select</button>
    <template v-if="isSelect()">
      <button
        class="mode-btn copy-btn"
        :class="{ narrower: editorStore.clipboard !== null }"
        @click="editorStore.copySelection"
      >Copy</button>
      <button
        v-if="editorStore.clipboard !== null"
        class="mode-btn cancel-btn"
        @click="editorStore.clearClipboard"
      >Cancel</button>
    </template>
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
  flex: 2;
  border: none;
  border-right: 1px solid #e0e0e0;
  background: none;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  color: #555;
}
.mode-btn:last-child { border-right: none; }
.mode-btn.narrow { flex: 1; }
.copy-btn { flex: 1; background: #2e7d32; color: white; }
.copy-btn.narrower { flex: 0.5; }
.copy-btn:hover { background: #256427; }
.cancel-btn { flex: 0.5; background: #ba181b; color: white; }
.cancel-btn:hover { background: #a01518; }
.mode-btn:not(.copy-btn):not(.cancel-btn):hover { background: #f0f0f0; }
.mode-btn.active { background: #111; color: white; font-weight: 500; }
</style>
