import {app, BrowserWindow, ipcMain} from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { name as AppName } from '../package.json';
import { downloadBinaries } from 'ffbinaries';

var IsLoaded = false,
    dataRequested = false,
    mainWindow: BrowserWindow|null = null;

// if window is loaded, send the appdatapath
function checkLoad() {
    if (IsLoaded && dataRequested && mainWindow)
        mainWindow.webContents.send('data', getAppDataPath());
}

// events
ipcMain.on('exit', (_event, arg) => {
    console.error(arg);
    process.exit(1);
});

ipcMain.on('devtools', event => {
    event.sender.openDevTools({
        mode: 'detach'
    });
});

ipcMain.on('getData', () => {
    dataRequested = true;
    checkLoad();
});

function getAppDataPath() {
     switch (process.platform) {
        case 'darwin':
            if (process.env.HOME)
                return path.join(process.env.HOME, 'Library', 'Application Support', AppName);
            else
                throw 'Missing Environmental Variable $HOME'
         case 'win32':
            if (process.env.APPDATA)
                return path.join(process.env.APPDATA, AppName);
            else
                throw 'Missing Environmental Variable $APPDTA`'
         case 'linux':
            if (process.env.HOME)
                return path.join(process.env.HOME, '.'+AppName);
            else
                throw 'Missing Environmental Variable $HOME'
         default:
            throw `Unsupported platform ${process.platform}`;
     }
}

//create appdata if not there
if (!fs.existsSync(getAppDataPath()))
    fs.mkdirSync(getAppDataPath());

//https://electron.atom.io/docs/tutorial/quick-start/
function downloadFfmpeg() {
    
    return new Promise((complete, _error) => {
    
        if (!fs.existsSync(path.join(getAppDataPath(), 'ffmpeg-binaries', 'ffmpeg')) || !fs.existsSync(path.join(getAppDataPath(), 'ffmpeg-binaries', 'ffprobe')))
            downloadBinaries(['ffmpeg', 'ffprobe'], {
                destination: path.join(getAppDataPath(), 'ffmpeg-binaries')
            }, complete);
        else
            complete(null);
        
    });
    
}

function createWindow(): void {
    
    mainWindow = new BrowserWindow({
        width: 530, height: 560,
        minWidth: 200, minHeight: 200,
        autoHideMenuBar: true,
        backgroundColor: '#434442',
        darkTheme: true,
        titleBarStyle: 'default',
        webPreferences: {
            nodeIntegration: true,
            worldSafeExecuteJavaScript: true,
            contextIsolation: false,
            enableRemoteModule: true
        }
    });
    
    mainWindow.loadURL('file://' + path.join(__dirname, 'App.html'));

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
    
    downloadFfmpeg().then(() => {
        IsLoaded = true;
        checkLoad();
    });
    
}

//on ready
if (app.isReady())
    createWindow();
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    app.quit();
});
