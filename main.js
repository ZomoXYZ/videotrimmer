const {app, BrowserWindow, ipcMain, Tray, nativeImage} = require('electron'),
      path = require('path'),
      url = require('url'),
      fs = require('fs');

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

function getAppDataPath() {
     switch (process.platform) {
        case 'darwin': {
            return path.join(process.env.HOME, 'Library', 'Application Support', 'Ashley-VideoTrimmer');
        }
         case 'win32': {
             return path.join(process.env.APPDATA, 'Ashley-VideoTrimmer');
         }
         case 'linux': {
             return path.join(process.env.HOME, '.Ashley-VideoTrimmer');
         }
         default: {
             console.log('Unsupported platform!');
             process.exit(1);
         }
     }
}

if (!fs.existsSync(getAppDataPath()))
    fs.mkdirSync(getAppDataPath());

//https://electron.atom.io/docs/tutorial/quick-start/
function createWindow() {
        
    require('ffbinaries').downloadBinaries({
        destination: path.join(getAppDataPath(), 'ffmpeg-binaries'),
        components: ['ffmpeg', 'ffprobe']
    }, () => {
        
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

        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'index.html'),
            protocol: 'file:',
            slashes: true
        }));

        //mainWindow.webContents.openDevTools();

        mainWindow.on('closed', function () {
            mainWindow = null;
        });

    });
}

if (app.isReady())
    createWindow();
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    
    //no reason to leave it open for mac either though
    //if (process.platform !== 'darwin')
        app.quit();
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null)
        createWindow();
});
