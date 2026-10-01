const OFF_AXIS_WEIGHT = 2

export const pickSpatialTarget = (rects: ISpatialRect[], currentIndex: number, direction: SpatialDirection): number => {
    const current = rects[currentIndex]
    if (!current) {
        return rects.length > 0 ? 0 : -1
    }
    const cx = current.x + current.width / 2
    const cy = current.y + current.height / 2
    let best = -1
    let bestCost = Number.POSITIVE_INFINITY
    rects.forEach((rect, index) => {
        if (index === currentIndex) {
            return
        }
        const dx = rect.x + rect.width / 2 - cx
        const dy = rect.y + rect.height / 2 - cy
        const along = direction === 'left' ? -dx : direction === 'right' ? dx : direction === 'up' ? -dy : dy
        const across = direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx)
        if (along <= 1) {
            return
        }
        const cost = along + across * OFF_AXIS_WEIGHT
        if (cost < bestCost) {
            bestCost = cost
            best = index
        }
    })
    return best
}
