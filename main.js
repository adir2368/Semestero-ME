const { app, BrowserWindow, Menu, ipcMain } = require('electron');
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
            webSecurity: false,
            preload: path.join(__dirname, 'preload.js'),
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

// Native IPC Handler for Moodle Feed (bypasses browser CORS completely)
ipcMain.handle('fetch-moodle-feed', async (event, url) => {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/calendar, text/plain, */*'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} - ${response.statusText}`);
        }
        const text = await response.text();
        return { success: true, data: text };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

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
