const MAX_SIDE_PX = 1600
const JPEG_QUALITY = 0.8

export const compressImage = async (file: File): Promise<Blob> => {
    const bitmap = await createImageBitmap(file)
    const ratio = Math.min(1, MAX_SIDE_PX / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * ratio)
    canvas.height = Math.round(bitmap.height * ratio)
    const context = canvas.getContext('2d')
    if (!context) {
        throw new Error('Canvas indisponible')
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            blob => (blob ? resolve(blob) : reject(new Error('Compression impossible'))),
            'image/jpeg',
            JPEG_QUALITY,
        )
    })
}
