export const MAX_IMAGE_SIDE_PX = 1200
export const WEBP_QUALITY = 0.75
export const JPEG_FALLBACK_QUALITY = 0.8

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> => {
    return new Promise(resolve => canvas.toBlob(resolve, type, quality))
}

export const encodeCanvas = async (canvas: HTMLCanvasElement): Promise<Blob> => {
    const webp = await toBlob(canvas, 'image/webp', WEBP_QUALITY)
    if (webp && webp.type === 'image/webp') {
        return webp
    }
    const jpeg = await toBlob(canvas, 'image/jpeg', JPEG_FALLBACK_QUALITY)
    if (!jpeg) {
        throw new Error('Compression impossible')
    }
    return jpeg
}

export const compressImage = async (file: File): Promise<Blob> => {
    const bitmap = await createImageBitmap(file)
    const ratio = Math.min(1, MAX_IMAGE_SIDE_PX / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * ratio)
    canvas.height = Math.round(bitmap.height * ratio)
    const context = canvas.getContext('2d')
    if (!context) {
        throw new Error('Canvas indisponible')
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return encodeCanvas(canvas)
}
