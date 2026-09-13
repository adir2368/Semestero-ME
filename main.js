const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// Explicit Windows AppUserModelID to ensure Taskbar icon displays properly
if (process.platform === 'win32') {
    app.setAppUserModelId('technion.me.academic.skill.tree');
}

let mainWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        backgroundColor: '#0b0f19',
        icon: path.join(__dirname, 'icon.ico'),
        title: "לוח תכנון ומעקב אקדמי - הנדסת מכונות הטכניון",
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false
        }
    });

    // Remove default menu for a clean gaming interface
    Menu.setApplicationMenu(null);

    // Load local HTML directly from disk (no server required)
    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// App lifecycle listeners
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
