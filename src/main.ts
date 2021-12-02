import {app, BrowserWindow, ipcMain} from 'electron';
import * as path from 'path';
import * as fs from 'fs';
const AppName = require('../package.json').name;


//const { autoUpdater } = require("electron-updater");
/*autoUpdater.logger = require("electron-log");
autoUpdater.logger.transports.file.level = "info";
autoUpdater.allowPrerelease = true;
autoUpdater.setFeedURL({
    provider: "generic",
    url: "https://gitlab.com/_example_repo_/-/jobs/artifacts/master/raw/dist?job=build"
});*/

var IsLoaded = false,
    dataRequested = false,
    mainWindow: BrowserWindow|null = null;

ipcMain.on('exit', (event, arg) => {
    console.error(arg);
    process.exit(1);
});

ipcMain.on('devtools', event => { //is there a way to do this without ipc?
    event.sender.openDevTools({
        mode: 'detach'
    });
});

function checkLoad() {
    if (IsLoaded && dataRequested && mainWindow)
        mainWindow.webContents.send('data', getAppDataPath());
}

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

if (!fs.existsSync(getAppDataPath()))
    fs.mkdirSync(getAppDataPath());

//https://electron.atom.io/docs/tutorial/quick-start/
function downloadFfmpeg() {
    
    return new Promise((complete, error) => {
    
        if (!fs.existsSync(path.join(getAppDataPath(), 'ffmpeg-binaries', 'ffmpeg')) || !fs.existsSync(path.join(getAppDataPath(), 'ffmpeg-binaries', 'ffprobe')))
            require('ffbinaries').downloadBinaries({
                destination: path.join(getAppDataPath(), 'ffmpeg-binaries'),
                components: ['ffmpeg', 'ffprobe']
            }, complete);
        else
            complete(null);
        
    });
    
}
function createWindow(): void {

    /*let autoupdatePath = path.join(getAppDataPath(), 'storage', 'autoupdate.json');
    if (fs.existsSync(autoupdatePath) && JSON.parse(fs.readFileSync(autoupdatePath).toString()))
        autoUpdater.checkForUpdatesAndNotify();*/
    
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
    
    mainWindow.loadURL('file://' + path.join(__dirname, 'index.html'));

    //mainWindow.webContents.openDevTools();

    mainWindow.on('closed', function () {
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
