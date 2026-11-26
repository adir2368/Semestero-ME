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
        if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:'))) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        if (url === 'about:blank') {
            return { action: 'allow' };
        }
        return { action: 'deny' };
    });

    // Guard top-level navigation to local app bundle only; route external HTTP(S)/mailto to default browser
    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (!url) {
            event.preventDefault();
            return;
        }
        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:')) {
            event.preventDefault();
            shell.openExternal(url);
            return;
        }
        if (url.startsWith('file://')) {
            try {
                const { fileURLToPath } = require('url');
                const targetPath = path.resolve(fileURLToPath(url));
                const rootPath = path.resolve(__dirname);
                if (targetPath === rootPath || targetPath.startsWith(rootPath + path.sep)) {
                    return;
                }
            } catch (_) {}
        }
        event.preventDefault();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Native IPC Handler for Moodle Feed (bypasses browser CORS completely)
ipcMain.handle('fetch-moodle-feed', async (event, url) => {
    const targetUrl = String(url || '').trim();
    if (!targetUrl || !/^https:\/\/moodle\d*\.technion\.ac\.il\/calendar\/export_execute\.php/i.test(targetUrl)) {
        return { success: false, error: 'Only Technion Moodle ICS URLs are allowed' };
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
        const response = await fetch(targetUrl, {
            signal: controller.signal,
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
    } finally {
        clearTimeout(timer);
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
