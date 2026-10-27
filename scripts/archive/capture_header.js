const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.disableHardwareAcceleration();

app.whenReady().then(async () => {
    const win = new BrowserWindow({
        width: 1366,
        height: 768,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    const filePath = path.join(__dirname, '..', '..', 'index.html');
    await win.loadFile(filePath);

    // Wait 1.5 seconds for scripts to populate HUD
    await new Promise(r => setTimeout(r, 1500));

    // Capture header area
    const image1366 = await win.capturePage({ x: 0, y: 0, width: 1366, height: 120 });
    const out1366 = path.join(__dirname, '..', '..', 'header_verified_1366.png');
    fs.writeFileSync(out1366, image1366.toPNG());
    console.log('Saved 1366 header:', out1366);

    // Resize to 1024x768
    win.setSize(1024, 768);
    await new Promise(r => setTimeout(r, 500));
    const image1024 = await win.capturePage({ x: 0, y: 0, width: 1024, height: 120 });
    const out1024 = path.join(__dirname, '..', '..', 'header_verified_1024.png');
    fs.writeFileSync(out1024, image1024.toPNG());
    console.log('Saved 1024 header:', out1024);

    app.quit();
});
