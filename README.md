# PixelSVG

A minimal pixel drawing app that runs entirely in the browser. Draw on a square grid, save your work locally, and export to SVG.

## Features

- **Grid drawing** — click or click-and-drag to toggle squares between black and white
- **Zoom & pan** — pinch to zoom, two-finger drag to pan (trackpad); scroll wheel also works
- **Select & paste** — marquee-select a region, copy it, and stamp it anywhere with a live ghost cursor preview
- **Auto-save** — changes are saved automatically to browser localStorage
- **Document browser** — create, rename, and delete documents from a list view with thumbnail previews
- **Configurable grid size** — any width and height; resizing crops or expands from the top-left corner
- **SVG export** — exports as a clean SVG where each black square is a `<rect>` element and the white background is transparent

## Usage

### Drawing

| Action | Result |
|--------|--------|
| Click a square | Toggle black/white |
| Click and drag | Paint multiple squares (direction locked to first click) |
| `D` | Switch to Draw mode |
| `S` | Switch to Select mode |

### Select & Paste

1. Press `S` to enter Select mode
2. Click and drag to draw a selection rectangle
3. Press `Cmd+C` (or `Ctrl+C`) to copy the selection
4. Move the cursor — a ghost outline follows it showing where the paste will land
5. Click to stamp the copied region at that position (repeat to paste multiple times)
6. Press `Escape` to clear the clipboard

### Zoom & Pan

| Action | Result |
|--------|--------|
| Pinch (trackpad) | Zoom in/out toward the pinch point |
| Two-finger drag (trackpad) | Pan the canvas |
| Scroll wheel | Pan |
| Scroll wheel + `Ctrl` | Zoom |

### Documents

- Click **+ New Document** on the home screen to create a document; configure width and height before creating
- Click a document name in the editor to rename it inline; press `Enter` or click away to save
- Click **← Documents** in the top bar to return to the document list
- Documents are deleted from the list view using the **Delete** button on each card (requires confirmation)

### Export

Click **Export SVG** in the top bar to download the current document as an `.svg` file. The SVG uses a `viewBox` matching the grid dimensions with one `<rect>` per black square. White squares are omitted, leaving the background transparent.

## Storage

All data is stored in `localStorage` under the `pixelsvg:` key prefix. Browser storage limits apply (typically ~5 MB). A fully-drawn 1024×1024 document uses roughly 175 KB of storage.

## Development

```bash
npm install
npm run dev
```

Built with [Vue 3](https://vuejs.org), [Pinia](https://pinia.vuejs.org), [Vue Router](https://router.vuejs.org), and [Vite](https://vitejs.dev).
