const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(async () => {
    try {
        const win = new BrowserWindow({
            width: 1280,
            height: 800,
            show: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            }
        });

        const indexPath = path.join(__dirname, '..', '..', 'index.html');
        await win.loadFile(indexPath);
        await new Promise(r => setTimeout(r, 1500));

        const result = await win.webContents.executeJavaScript(`
            (async () => {
                const plannerBtn = document.getElementById('tab-planner');
                if (plannerBtn) plannerBtn.click();
                if (window.DegreePlanner && window.DegreePlanner.renderDegreePlanner) {
                    window.DegreePlanner.renderDegreePlanner();
                }
                await new Promise(r => setTimeout(r, 600));

                const trackSelect = document.getElementById('planner-track-select');
                const options = Array.from(trackSelect ? trackSelect.options : []).map(o => ({ value: o.value, text: o.text }));
                const cols = document.querySelectorAll('.planner-semester-col');
                const badges = Array.from(document.querySelectorAll('.semester-workload-badge')).map(b => b.innerText.trim());
                const workloadBtns = document.querySelectorAll('.btn-course-workload');
                return {
                    optionsCount: options.length,
                    options: options,
                    semesterColumnsCount: cols.length,
                    sampleBadges: badges.slice(0, 4),
                    workloadBtnsCount: workloadBtns.length,
                    degreePlannerLoaded: !!window.DegreePlanner,
                    catalogLoaded: !!window.PLANNER_CATALOG
                };
            })()
        `);

        console.log('Verification result:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('Error during test:', e);
    } finally {
        app.quit();
    }
});
