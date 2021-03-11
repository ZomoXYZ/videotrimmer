const {app, BrowserWindow, ipcMain, Tray, nativeImage} = require('electron'),
      path = require('path'),
      fs = require('fs');

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
            return path.join(process.env.HOME, 'Library', 'Application Support', 'Ashley-VideoTrimmer');
         case 'win32':
             return path.join(process.env.APPDATA, 'Ashley-VideoTrimmer');
         case 'linux':
             return path.join(process.env.HOME, '.Ashley-VideoTrimmer');
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
    
    mainWindow = new BrowserWindow({
        width: 530, height: 560,
        minWidth: 200, minHeight: 200,
        autoHideMenuBar: true,
        backgroundColor: '#434442',
        darkTheme: true,
        titleBarStyle: 'default',
        webPreferences: {
            nodeIntegration: true,
            worldSafeExecuteJavaScript: true
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
