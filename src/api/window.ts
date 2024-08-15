import { BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import ffprobe from './ffprobe'

export enum ScreenState {
    Blank,
    Downloading,
    Main,
    Editor,
    Processing,
}

export function createWindow() {
    // TODO allow multiple windows or no
    // if (BrowserWindow.getAllWindows().length > 0) {
    //     return
    // }

    const mainWindow = new BrowserWindow({
        width: 530,
        height: 560,
        minWidth: 200,
        minHeight: 200,
        autoHideMenuBar: true,
        backgroundColor: '#434442',
        darkTheme: true,
        titleBarStyle: 'default',
        webPreferences: {
            preload: path.join(__dirname, './preload.js'),
        },
    })

    if (MAIN_WINDOW_VITE_DEV_SERVER_URL != '') {
        mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
    } else {
        mainWindow.loadFile(
            path.join(
                __dirname,
                `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`
            )
        )
    }
}

// should correlate with preload.ts
export function initIpcHandlers() {
    ipcMain.handle('initFile', (_: Electron.IpcMainInvokeEvent, path: string) =>
        ffprobe(path)
    )
    ipcMain.handle(
        'processFile',
        (_: Electron.IpcMainInvokeEvent, formData: FormData) => {
            // TODO run ffmpeg
            // TODO return job ID
            return null
        }
    )
}
