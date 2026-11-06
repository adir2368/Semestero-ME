import sys
sys.stdout.reconfigure(encoding='utf-8')

main_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\main.js"
with open(main_path, "r", encoding="utf-8") as f:
    text = f.read()

# Add shell import if missing
old_require = "const { app, BrowserWindow, Menu, ipcMain } = require('electron');"
new_require = "const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');"

assert old_require in text, "old_require not found in main.js"
text = text.replace(old_require, new_require, 1)

# In createWindow, add setWindowOpenHandler
old_cw = """    mainWindow.on('closed', () => {
        mainWindow = null;
    });"""

new_cw = """    // Open all external URLs (Moodle, Faculty Drive, Pangea, Panopto, etc.) in the user's default system browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url && (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('mailto:'))) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });"""

assert old_cw in text, "old_cw not found in main.js"
text = text.replace(old_cw, new_cw, 1)

# Add IPC handler for open-external
ipc_handler = """// Native IPC Handler for opening links in default system browser
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
"""

text += "\n" + ipc_handler

with open(main_path, "w", encoding="utf-8") as f:
    f.write(text)

print("Updated main.js with setWindowOpenHandler and open-external IPC successfully!")
