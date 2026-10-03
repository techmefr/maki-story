export const useRecordingPreview = () => {
    const isPlaying = ref(false)
    let audio: HTMLAudioElement | null = null
    let url: string | null = null

    const clear = (): void => {
        audio?.pause()
        audio = null
        if (url) {
            URL.revokeObjectURL(url)
            url = null
        }
        isPlaying.value = false
    }

    const load = (blob: Blob): void => {
        clear()
        url = URL.createObjectURL(blob)
        audio = new Audio(url)
        audio.addEventListener('playing', () => {
            isPlaying.value = true
        })
        audio.addEventListener('pause', () => {
            isPlaying.value = false
        })
        audio.addEventListener('ended', () => {
            isPlaying.value = false
        })
    }

    const play = async (): Promise<void> => {
        if (!audio) {
            return
        }
        try {
            audio.currentTime = 0
            await audio.play()
        } catch (error) {
            console.error('Le message enregistré n a pas pu être réécouté', error)
        }
    }

    onBeforeUnmount(clear)

    return { isPlaying, load, play, clear }
}
