import { allocatePixels, setPixel } from './bitmap'

export interface SVGImportResult {
  width: number
  height: number
  pixels: Uint8Array
  name: string
}

export interface SVGImportError {
  message: string
}

export function parseSVG(svgText: string, filename: string): SVGImportResult | SVGImportError {
  let doc: Document
  try {
    doc = new DOMParser().parseFromString(svgText, 'image/svg+xml')
  } catch {
    return { message: 'Could not parse SVG file.' }
  }

  const parserError = doc.querySelector('parsererror')
  if (parserError) return { message: 'Invalid SVG file.' }

  const svg = doc.documentElement

  // Determine canvas size from viewBox, falling back to width/height attributes
  let width = 0
  let height = 0
  const viewBox = svg.getAttribute('viewBox')
  if (viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/).map(Number)
    if (parts.length === 4 && parts.every(isFinite)) {
      width = Math.round(parts[2])
      height = Math.round(parts[3])
    }
  }
  if (!width || !height) {
    width = Math.round(parseFloat(svg.getAttribute('width') ?? '0'))
    height = Math.round(parseFloat(svg.getAttribute('height') ?? '0'))
  }
  if (!width || !height || width < 1 || height < 1) {
    return { message: 'Could not determine canvas size from SVG. Ensure the SVG has a viewBox or width/height attributes.' }
  }

  // Collect all 1×1 rects
  const rects = svg.querySelectorAll('rect')
  const pixels = allocatePixels(width, height)
  let importedCount = 0

  for (const rect of rects) {
    const rw = parseFloat(rect.getAttribute('width') ?? '')
    const rh = parseFloat(rect.getAttribute('height') ?? '')
    if (rw !== 1 || rh !== 1) continue

    const x = Math.round(parseFloat(rect.getAttribute('x') ?? ''))
    const y = Math.round(parseFloat(rect.getAttribute('y') ?? ''))
    if (!isFinite(x) || !isFinite(y)) continue
    if (x < 0 || y < 0 || x >= width || y >= height) continue

    setPixel(pixels, x, y, width, true)
    importedCount++
  }

  // Derive a document name from the filename (strip extension)
  const name = filename.replace(/\.svg$/i, '').replace(/[^a-zA-Z0-9_\-. ]/g, '') || 'imported'

  return { width, height, pixels, name }
}
