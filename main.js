const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');

app.setName('Semestero ME');

// Explicit Windows AppUserModelID to ensure Taskbar icon displays properly
if (process.platform === 'win32') {
    app.setAppUserModelId('adir.semestero.me');
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
        title: "Semestero ME",
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

    // Open all external URLs (Moodle, Faculty Drive, Pangea, Panopto, etc.) in the user's default system browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url && (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('mailto:'))) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

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

// Native IPC Handler for opening links in default system browser
ipcMain.handle('open-external', async (event, url) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:'))) {
        try {
            await shell.openExternal(url);
            return { success: true };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }
    return { success: false, error: 'Invalid URL scheme' };
});
