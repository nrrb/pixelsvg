import { useDocumentStore } from '../stores/documentStore'
import { getPixel } from '../lib/bitmap'

export function useExport() {
  const docStore = useDocumentStore()

  function exportSVG(): void {
    const doc = docStore.activeDoc
    if (!doc) return

    const { width, height } = doc.meta
    const pixels = doc.pixels
    const rects: string[] = []

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (getPixel(pixels, x, y, width)) {
          rects.push(`  <rect x="${x}" y="${y}" width="1" height="1"/>`)
        }
      }
    }

    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`,
      `<g fill="black">`,
      ...rects,
      `</g>`,
      `</svg>`,
    ].join('\n')

    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.meta.name}-${width}x${height}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  return { exportSVG }
}
