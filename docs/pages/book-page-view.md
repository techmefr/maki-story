# Book page view (shared by creation, recording and review)

Components: `BookPageView.vue` (page card), `PageScanViewer.vue` (zoomable scan), `app/utils/pageView.ts` (view model), `app/utils/scanZoom.ts` (zoom maths).

## 1. What the page must do

### Content, in this order
1. Scanned page with the zoom viewer. Pinch, double tap, pan (drag or arrow keys), mouse wheel, `+` / `-` / `0` / `R` keys, zoom in/out buttons, rotate (90 degrees steps), reset, full screen (overlay, `Escape` closes). Comic pages: a tap on a panel zooms on that panel (panel rectangles fall back to an even grid built from the panel count, because no bounding box is stored yet; the tap-to-panel only works while the scan is not rotated).
2. Collapsible page description (closed by default except when creating).
3. Number of characters on the page.
4. One block per character: name, voice color (the narrator is a role of its own: a "Narrateur" badge and no color), reader (avatar, first name, recording language), character description, lines in reading order with their tone. When a translation exists in the recording language the original text stays reachable under a disclosure.

### Behavior per role and mode
- Creation (`mode=create`, parent): page description and character descriptions are editable inline. The line list stays in the existing line composer (`BookLineRow`), the view hides its own list there.
- Recording (`mode=record`, parent or relative recording): read-only. Own lines are highlighted, other voices dimmed, a "My lines" chip filters to own lines only, a "Larger text" chip enlarges the text, each own line has a record button (selects the line in the teleprompter) and a listen button. The assist TTS toggle stays in the studio toolbar.
- Review (`mode=review`, parent): per line state badge, listen, validate, request a redo with a comment. Switch between "Line by line" (historical list) and "Page by page".
- Child: the scan and the page view are never rendered (`canSeeScan`); the server enforces the access rule (see the scan access issue), this lot does not touch it. Scans are not part of share payloads.

### States
- Loading scan: "Loading" status text in the viewer. Scan failure: message "The page could not be loaded." No scan for the page: "No scan for this page." Empty page: "No lines on this page."
- Offline: scans of a downloaded book are saved with the book for parents and relatives (not for the child profile) and read from IndexedDB first; the page view itself only uses the book already in memory.
- Sharper version: the viewer loads `GET /api/files/:id?size=full` once the zoom passes 1.5x, with the same permission check as the default file. Today the full variant is the stored 1200px WebP (the original is not kept); the parameter is the contract for a higher resolution later.

### Interactions and animations
- Pan and zoom follow the finger with no transition while the pointer is down, 0.2 s ease otherwise. Chevron of the description rotates. Both are disabled under `prefers-reduced-motion`.

### Responsive
- Scan viewport max height 60vh, whole viewport in full screen. Layout is a single column from 320 px to desktop, no fixed width, wrapping and `overflow-wrap: anywhere` on every text.

## 2. Design audit checklist
- [x] One main action: the page card has no primary action of its own; the record button in the studio and validate in review stay the single highlighted action of their screen.
- [x] Secondary buttons visible with an icon (zoom, rotate, reset, full screen, record line, listen, validate, redo).
- [x] Big childlike icons from the shared icon set (lucide through `AppIcon`), 22 px in 48 px targets.
- [x] Micro-animations on zoom and chevron.
- [x] No overflow at any text size: rem sizes, wrapping text, `max-width: 100%` images.
- [x] Keyboard: viewport focusable with visible 4 px focus ring, all controls reachable, keyboard shortcuts documented above. Remote (D-pad): buttons are native and focusable.
- [x] `prefers-reduced-motion` respected.
- [x] Fredoka for titles and buttons, Nunito for text, hard shadow `3px 3px 0 #1F1B3A` on the viewport and cards.

## Security (scans)
- Scans are visible to parents and to relatives with lines in the book only; never to the child (page fileId is null in the child payload, files endpoint returns 403) nor to other families.
