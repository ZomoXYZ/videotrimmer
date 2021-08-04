const {app, BrowserWindow, ipcMain, Tray, nativeImage} = require('electron'),
    path = require('path'),
    fs = require('fs'),
    { autoUpdater } = require("electron-updater"),
    AppName = require('./package.json').name;

autoUpdater.logger = require("electron-log");
autoUpdater.logger.transports.file.level = "info";
autoUpdater.allowPrerelease = true;
autoUpdater.setFeedURL({
    provider: "generic",
    url: "https://gitlab.com/_example_repo_/-/jobs/artifacts/master/raw/dist?job=build"
});

var IsLoaded = false;

let mainWindow;

ipcMain.on('exit', (event, arg) => {
    console.error(arg);
    process.exit(1);
});

ipcMain.on('devtools', event => { //is there a way to do this without ipc?
    event.sender.openDevTools({
        mode: 'detach'
    });
});

ipcMain.on('isLoaded', (event, arg) => {
    if (IsLoaded)
        mainWindow.webContents.send('loaded', getAppDataPath());
});

function getAppDataPath() {
     switch (process.platform) {
        case 'darwin':
            return path.join(process.env.HOME, 'Library', 'Application Support', AppName);
         case 'win32':
             return path.join(process.env.APPDATA, AppName);
         case 'linux':
             return path.join(process.env.HOME, '.'+AppName);
         default:
             console.log('Unsupported platform!');
             process.exit(1);
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
            complete();
        
    });
    
}
function createWindow() {

    let autoupdatePath = path.join(getAppDataPath(), 'storage', 'autoupdate.json');
    if (fs.existsSync(autoupdatePath) && JSON.parse(fs.readFileSync(autoupdatePath).toString()))
        autoUpdater.checkForUpdatesAndNotify();
    
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
        console.log(getAppDataPath())
        mainWindow.webContents.send('loaded', getAppDataPath());
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
