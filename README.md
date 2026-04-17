# PixelSVG

A minimal pixel drawing app that runs entirely in the browser. Draw on a grid, save your work locally, and export to SVG.

## Features

- **Grid drawing** — click or click-and-drag to toggle squares between black and white
- **Zoom & pan** — trackpad pinch/scroll and mouse scroll wheel with middle-click drag
- **Select & paste** — marquee-select a region, copy it, and stamp it anywhere with a live ghost cursor preview
- **Auto-save** — changes are saved automatically to browser localStorage
- **Document browser** — create, rename, delete, and import documents from a list view with thumbnail previews
- **Configurable grid size** — any width and height, editable at any time from the top bar; resizing crops or expands from the top-left corner
- **SVG export** — exports as a clean SVG where each black square is a `<rect>` element and the white background is transparent; filename includes the canvas dimensions
- **SVG import** — import any SVG exported by PixelSVG; canvas size is detected automatically from the `viewBox`
- **Sample documents** — load bundled sample pixel art with one click

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
| Scroll wheel | Pan vertically |
| `Shift` + scroll wheel | Pan horizontally |
| `Ctrl` / `Cmd` + scroll wheel | Zoom toward the cursor |
| Middle-click drag | Pan in any direction |

### Documents

- Click **+ New Document** on the home screen to create a document; configure width and height before creating
- Click **Import SVG** on the home screen to import an SVG file as a new document
- Click the width or height value in the top bar to edit that dimension inline; clicking away applies the change immediately
- Click a document name in the editor to rename it inline; press `Enter` or click away to save
- Click **← Documents** in the top bar to return to the document list
- Documents are deleted from the list view using the **Delete** button on each card (requires confirmation)

### Export

Click **Export SVG** in the top bar to download the current document as an `.svg` file. The filename uses the pattern `{name}-{width}x{height}.svg`. The SVG uses a `viewBox` matching the grid dimensions with one `<rect>` per black square. White squares are omitted, leaving the background transparent.

### Import

Click **Import SVG** on the documents screen and select an SVG file. The canvas size is read from the SVG's `viewBox` attribute. Only `<rect>` elements with `width="1"` and `height="1"` are imported as black pixels — any other shapes are ignored. The document name defaults to the filename.

### Samples

Click **Import Samples** on the documents screen to load all bundled sample documents at once. Each sample is added as a new document.

## Storage

All data is stored in `localStorage` under the `pixelsvg:` key prefix. Browser storage limits apply (typically ~5 MB). A fully-drawn 1024×1024 document uses roughly 175 KB of storage.

## Development

```bash
npm install
npm run dev
```

Built with [Vue 3](https://vuejs.org), [Pinia](https://pinia.vuejs.org), [Vue Router](https://router.vuejs.org), and [Vite](https://vitejs.dev).
