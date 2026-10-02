export const MIN_SCALE = 1
export const MAX_SCALE = 5
export const SHARP_SCALE = 1.5
export const ZOOM_STEP = 1.4
export const DOUBLE_TAP_MS = 300
export const TAP_SLOP_PX = 10
export const PANEL_FOCUS_MARGIN = 0.9

export const clampScale = (scale: number): number => Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))

export const fallbackPanelRects = (count: number): IScanRect[] => {
    if (count < 2) {
        return []
    }
    const columns = Math.ceil(Math.sqrt(count))
    const rows = Math.ceil(count / columns)
    return Array.from({ length: count }, (_unused, index) => ({
        x: (index % columns) / columns,
        y: Math.floor(index / columns) / rows,
        width: 1 / columns,
        height: 1 / rows,
    }))
}

export const hitRect = (rects: IScanRect[], x: number, y: number): IScanRect | null => {
    return rects.find(rect => x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) ?? null
}

export interface IViewTransform {
    scale: number
    x: number
    y: number
}

export const focusRect = (rect: IScanRect, stageWidth: number, stageHeight: number): IViewTransform => {
    const scale = clampScale(Math.min(1 / rect.width, 1 / rect.height) * PANEL_FOCUS_MARGIN)
    const centerX = (rect.x + rect.width / 2 - 0.5) * stageWidth
    const centerY = (rect.y + rect.height / 2 - 0.5) * stageHeight
    return { scale, x: -centerX * scale, y: -centerY * scale }
}

export const clampPan = (value: number, scale: number, size: number): number => {
    const limit = (size * (scale - 1)) / 2
    return Math.min(limit, Math.max(-limit, value))
}
