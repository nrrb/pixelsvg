import { createRouter, createWebHashHistory } from 'vue-router'
import BrowserView from '../components/browser/BrowserView.vue'
import EditorView from '../components/editor/EditorView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: BrowserView },
    { path: '/editor/:id', component: EditorView },
  ],
})

export default router
