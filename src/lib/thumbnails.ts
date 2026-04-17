import { getPixel, decodePixels } from './bitmap'
import type { PixelDocument } from '../types'

export function generateThumbnail(doc: PixelDocument, size = 128): string {
  const pixels = decodePixels(doc.pixelData)

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!

  // White background
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, size, size)

  // Scale to fit, letterboxed
  const scaleX = size / doc.width
  const scaleY = size / doc.height
  const scale = Math.min(scaleX, scaleY)
  const offsetX = (size - doc.width * scale) / 2
  const offsetY = (size - doc.height * scale) / 2

  ctx.fillStyle = 'black'
  const pixelSize = Math.max(1, scale)

  for (let y = 0; y < doc.height; y++) {
    for (let x = 0; x < doc.width; x++) {
      if (getPixel(pixels, x, y, doc.width)) {
        ctx.fillRect(offsetX + x * scale, offsetY + y * scale, pixelSize, pixelSize)
      }
    }
  }

  return canvas.toDataURL('image/png')
}
