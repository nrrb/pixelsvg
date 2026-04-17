/** Allocate a zeroed (all-white) pixel buffer for a grid of given dimensions. */
export function allocatePixels(width: number, height: number): Uint8Array {
  return new Uint8Array(Math.ceil((width * height) / 8))
}

/** Read one pixel. Returns true = black, false = white. */
export function getPixel(pixels: Uint8Array, x: number, y: number, width: number): boolean {
  const bit = y * width + x
  return (pixels[bit >> 3] & (1 << (bit & 7))) !== 0
}

/** Write one pixel. value=true → black, value=false → white. */
export function setPixel(
  pixels: Uint8Array,
  x: number,
  y: number,
  width: number,
  value: boolean,
): void {
  const bit = y * width + x
  if (value) {
    pixels[bit >> 3] |= 1 << (bit & 7)
  } else {
    pixels[bit >> 3] &= ~(1 << (bit & 7))
  }
}

/** Toggle one pixel and return the new value. */
export function togglePixel(pixels: Uint8Array, x: number, y: number, width: number): boolean {
  const bit = y * width + x
  const byte = bit >> 3
  const mask = 1 << (bit & 7)
  pixels[byte] ^= mask
  return (pixels[byte] & mask) !== 0
}

/** Encode a Uint8Array to Base64 without stack-overflowing on large buffers. */
export function encodePixels(pixels: Uint8Array): string {
  const CHUNK = 8192
  let binary = ''
  for (let i = 0; i < pixels.length; i += CHUNK) {
    binary += String.fromCharCode(...pixels.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

/** Decode a Base64 string back to a Uint8Array. */
export function decodePixels(b64: string): Uint8Array {
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i)
  }
  return out
}

/**
 * Resize a pixel buffer from (oldW × oldH) to (newW × newH).
 * Anchored at top-left: shrinking crops, expanding pads with white.
 */
export function resizePixels(
  oldPixels: Uint8Array,
  oldW: number,
  oldH: number,
  newW: number,
  newH: number,
): Uint8Array {
  const newPixels = allocatePixels(newW, newH)
  const copyW = Math.min(oldW, newW)
  const copyH = Math.min(oldH, newH)

  // Fast path: when both widths are multiples of 8 and equal, copy full rows as bytes
  if (oldW === newW && oldW % 8 === 0) {
    const bytesPerRow = oldW / 8
    const rowsToCopy = copyH
    for (let row = 0; row < rowsToCopy; row++) {
      newPixels.set(oldPixels.subarray(row * bytesPerRow, (row + 1) * bytesPerRow), row * bytesPerRow)
    }
    return newPixels
  }

  // General path: pixel by pixel
  for (let y = 0; y < copyH; y++) {
    for (let x = 0; x < copyW; x++) {
      if (getPixel(oldPixels, x, y, oldW)) {
        setPixel(newPixels, x, y, newW, true)
      }
    }
  }
  return newPixels
}

/**
 * Copy a rectangular region out of a pixel buffer into a new buffer.
 * The new buffer has dimensions rect.width × rect.height.
 */
export function copyRegion(
  pixels: Uint8Array,
  docWidth: number,
  x: number,
  y: number,
  w: number,
  h: number,
): Uint8Array {
  const out = allocatePixels(w, h)
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const srcX = x + col
      const srcY = y + row
      if (srcX >= 0 && srcY >= 0) {
        setPixel(out, col, row, w, getPixel(pixels, srcX, srcY, docWidth))
      }
    }
  }
  return out
}

/**
 * Paste a region buffer into a destination pixel buffer.
 * Destination anchor is (destX, destY). Clips to document bounds.
 */
export function pasteRegion(
  dest: Uint8Array,
  destW: number,
  destH: number,
  src: Uint8Array,
  srcW: number,
  srcH: number,
  destX: number,
  destY: number,
): void {
  for (let row = 0; row < srcH; row++) {
    for (let col = 0; col < srcW; col++) {
      const dx = destX + col
      const dy = destY + row
      if (dx >= 0 && dx < destW && dy >= 0 && dy < destH) {
        setPixel(dest, dx, dy, destW, getPixel(src, col, row, srcW))
      }
    }
  }
}
