import { ipcRenderer } from 'electron'

export function initFile(path: string) {
    ipcRenderer.invoke('initFile', path)
}

export function processFile(formData: FormData) {
    ipcRenderer.invoke('processFile', formData)
}
