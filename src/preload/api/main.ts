import { ipcRenderer } from 'electron'
import { FfprobeData } from 'fluent-ffmpeg'

export function initFile(path: string) {
    return ipcRenderer.invoke('initFile', path) as Promise<FfprobeData>
}

export function processFile(formData: FormData) {
    ipcRenderer.invoke('processFile', formData)
}
