import { app, ipcMain } from 'electron'
import * as fs from 'fs'
import isElectronSquirrelStartup from 'electron-squirrel-startup'
import { createWindow, initIpcHandlers } from './api/window'
import { getAppDataPath } from './api/util'
import { ffmpegPath, ffprobePath } from 'ffmpeg-ffprobe-static'

// handle creating/removing shortcuts on Windows when installing/uninstalling.
if (isElectronSquirrelStartup) {
    app.quit()
}

// set environment variables for fluent-ffmpeg
process.env.FFMPEG_PATH = ffmpegPath ?? undefined
process.env.FFPROBE_PATH = ffprobePath ?? undefined

// create appdata if not there
if (!fs.existsSync(getAppDataPath())) fs.mkdirSync(getAppDataPath())

// events
ipcMain.on('exit', (_event, arg) => {
    console.error(arg)
    process.exit(1)
})

// TODO dev only
ipcMain.on('devtools', (event) => {
    event.sender.openDevTools({
        mode: 'detach',
    })
})

// on ready
app.on('ready', createWindow)
app.on('activate', createWindow)

// quit when all windows are closed
app.on('window-all-closed', () => {
    app.quit()
})

initIpcHandlers()
