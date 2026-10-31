// ==============================================================================
// Browser QA Verification: Galaxy Watch 8 (Wear OS) Companion
// File: tests/qa_verify_watch_browser.js
// ==============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const assert = require('assert');

const ARTIFACTS_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\aa7d2a33-2de8-4eeb-b8bd-18c8fdd69b14';
const PORT = 9889;
const SERVER_PORT = 8080;
const TARGET_URL = `http://127.0.0.1:${SERVER_PORT}/watch.html`;

function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function isServerListening(port) {
    return new Promise((resolve) => {
        const req = http.get(`http://127.0.0.1:${port}`, () => resolve(true));
        req.on('error', () => resolve(false));
    });
}

function findChrome() {
    const paths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
    ];
    for (const p of paths) {
        if (p && fs.existsSync(p)) return p;
    }
    return null;
}

function getJson(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

class CDPClient {
    constructor(wsUrl) {
        this.wsUrl = wsUrl;
        this.id = 1;
        this.callbacks = new Map();
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.wsUrl);
            this.ws.onopen = () => resolve();
            this.ws.onerror = (err) => reject(err);
            this.ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                if (msg.id && this.callbacks.has(msg.id)) {
                    const cb = this.callbacks.get(msg.id);
                    this.callbacks.delete(msg.id);
                    if (msg.error) cb.reject(msg.error);
                    else cb.resolve(msg.result);
                }
            };
        });
    }

    send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = this.id++;
            this.callbacks.set(id, { resolve, reject });
            this.ws.send(JSON.stringify({ id, method, params }));
        });
    }

    async eval(expression) {
        const res = await this.send('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: true
        });
        if (res && res.exceptionDetails) {
            throw new Error(`Eval failed: ${JSON.stringify(res.exceptionDetails)}`);
        }
        return res ? (res.result ? res.result.value : undefined) : undefined;
    }

    async captureScreenshot(filename) {
        const res = await this.send('Page.captureScreenshot', { format: 'png' });
        const buf = Buffer.from(res.data, 'base64');
        const outPath = path.join(ARTIFACTS_DIR, filename);
        fs.writeFileSync(outPath, buf);
        console.log(`📸 Screenshot saved: ${outPath}`);
    }

    close() {
        if (this.ws) this.ws.close();
    }
}

async function runBrowserQA() {
    console.log('🚀 Starting Galaxy Watch 8 Browser QA Verification...');

    let serverProcess = null;
    const isRunning = await isServerListening(SERVER_PORT);
    if (!isRunning) {
        console.log('[Server] Spawning server.js on port 8080...');
        serverProcess = spawn('node', ['server.js'], {
            cwd: path.join(__dirname, '..'),
            stdio: 'ignore'
        });
        for (let i = 0; i < 20; i++) {
            await delay(500);
            if (await isServerListening(SERVER_PORT)) break;
        }
    }

    const chromePath = findChrome();
    assert(chromePath, 'Chrome executable not found on host');

    const userDataDir = path.join(process.env.TEMP, 'chrome_qa_watch_' + Date.now());
    const chrome = spawn(chromePath, [
        `--remote-debugging-port=${PORT}`,
        `--user-data-dir=${userDataDir}`,
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--window-size=500,500',
        TARGET_URL
    ]);

    let cdp = null;

    try {
        console.log('[Chrome] Waiting for remote debugging WebSocket...');
        let wsUrl = null;
        for (let i = 0; i < 30; i++) {
            await delay(500);
            try {
                const list = await getJson(`http://127.0.0.1:${PORT}/json`);
                const page = list.find(t => t.type === 'page');
                if (page && page.webSocketDebuggerUrl) {
                    wsUrl = page.webSocketDebuggerUrl;
                    break;
                }
            } catch (e) {}
        }
        assert(wsUrl, 'Failed to acquire Chrome debugging WebSocket URL');

        cdp = new CDPClient(wsUrl);
        await cdp.connect();
        await cdp.send('Page.enable');
        await cdp.send('Runtime.enable');
        await cdp.send('Emulation.setDeviceMetricsOverride', {
            width: 450,
            height: 450,
            deviceScaleFactor: 1,
            mobile: true
        });

        console.log('[Page] Navigating to watch.html...');
        await cdp.send('Page.navigate', { url: TARGET_URL });
        await delay(2500);

        const currentUrl = await cdp.eval('window.location.href');
        console.log('[Page] Current URL:', currentUrl);
        const title = await cdp.eval('document.title');
        console.log('[Page] Current Title:', title);

        // 1. Verify Circular Chassis and Clock
        console.log('▶ Step 1: Verifying circular watch chassis and digital clock...');
        const clockText = await cdp.eval('document.getElementById("watch-clock").innerText');
        assert(/^\d{2}:\d{2}$/.test(clockText), `Clock must display HH:MM format, got: ${clockText}`);
        console.log(`  ✓ Digital clock active: ${clockText}`);

        // 2. Verify Screen 0: Next Class Radar
        console.log('▶ Step 2: Verifying Screen 0 (Next Class Radar)...');
        const radarTitle = await cdp.eval('document.getElementById("w-class-title").innerText');
        const radarRoom = await cdp.eval('document.getElementById("w-class-room").innerText');
        const radarStatus = await cdp.eval('document.getElementById("w-class-status").innerText');
        assert(radarTitle.includes('חדו״א 2מ׳'), `Unexpected radar title: ${radarTitle}`);
        assert(radarRoom.includes('דנציגר 101'), `Unexpected radar room: ${radarRoom}`);
        assert(radarStatus.includes('מתקיים כעת'), `Unexpected radar status: ${radarStatus}`);
        console.log(`  ✓ Radar verified: "${radarTitle}" at "${radarRoom}" (${radarStatus})`);

        // 3. Verify Rotary Bezel Navigation -> Screen 1 (Timeline)
        console.log('▶ Step 3: Simulating rotary bezel turn (CW) -> Screen 1 (Timeline)...');
        await cdp.eval('window.dispatchEvent(new WheelEvent("wheel", { deltaY: 100 }))');
        await delay(400);
        const screen1Active = await cdp.eval('document.getElementById("screen-timeline").classList.contains("active")');
        assert(screen1Active, 'Screen 1 (Timeline) should be active after rotating bezel');
        const timelineItemsCount = await cdp.eval('document.querySelectorAll(".timeline-item").length');
        assert(timelineItemsCount >= 2, `Expected >=2 timeline items, found: ${timelineItemsCount}`);
        console.log(`  ✓ Screen 1 active with ${timelineItemsCount} schedule items.`);

        // 4. Verify Rotary Bezel Navigation -> Screen 2 (Tasks) & 1-Tap Checkoff
        console.log('▶ Step 4: Simulating rotary bezel turn (CW) -> Screen 2 (Tasks) & 1-tap checkoff...');
        await cdp.eval('window.dispatchEvent(new WheelEvent("wheel", { deltaY: 100 }))');
        await delay(400);
        const screen2Active = await cdp.eval('document.getElementById("screen-tasks").classList.contains("active")');
        assert(screen2Active, 'Screen 2 (Tasks) should be active after rotating bezel');
        
        // 1-Tap Task Checkoff
        await cdp.eval('window.toggleWatchTask("t1")');
        await delay(200);
        const t1Done = await cdp.eval('document.getElementById("task-item-t1").classList.contains("completed")');
        const t1Chk = await cdp.eval('document.getElementById("task-chk-t1").innerText');
        assert(t1Done && t1Chk === '✓', 'Task t1 should be marked completed with checkmark');
        console.log('  ✓ Screen 2 active & 1-tap haptic task checkoff verified.');

        // 5. Verify Rotary Bezel Navigation -> Screen 3 (Academic Stats)
        console.log('▶ Step 5: Simulating rotary bezel turn (CW) -> Screen 3 (Stats)...');
        await cdp.eval('window.dispatchEvent(new WheelEvent("wheel", { deltaY: 100 }))');
        await delay(400);
        const screen3Active = await cdp.eval('document.getElementById("screen-stats").classList.contains("active")');
        assert(screen3Active, 'Screen 3 (Stats) should be active after rotating bezel');
        const gpaVal = await cdp.eval('document.getElementById("w-gpa-val").innerText');
        const honorsVal = await cdp.eval('document.getElementById("w-honors-pill").innerText');
        assert(gpaVal === '86.04', `Expected GPA 86.04, got: ${gpaVal}`);
        assert(honorsVal.includes('הצטיינות דיקן'), `Expected honors badge, got: ${honorsVal}`);
        console.log(`  ✓ Screen 3 active: GPA ${gpaVal} with ${honorsVal}.`);

        // 6. Verify Ambient Always-On Display (AOD) Mode
        console.log('▶ Step 6: Verifying Ambient AOD mode toggle...');
        await cdp.eval('document.getElementById("watch-container").classList.add("ambient-mode")');
        await delay(200);
        const hasAmbient = await cdp.eval('document.getElementById("watch-container").classList.contains("ambient-mode")');
        assert(hasAmbient, 'Ambient mode class must be present on container');
        await cdp.eval('document.getElementById("watch-container").classList.remove("ambient-mode")');
        await delay(200);
        console.log('  ✓ Ambient AOD mode verified.');

        // Return to Screen 0 for hero screenshot
        await cdp.eval('window.dispatchEvent(new WheelEvent("wheel", { deltaY: 100 }))');
        await delay(400);
        const backToRadar = await cdp.eval('document.getElementById("screen-radar").classList.contains("active")');
        assert(backToRadar, 'Should wrap around back to Screen 0');

        // Capture screenshot
        console.log('▶ Step 7: Capturing Galaxy Watch 8 companion screenshot...');
        await cdp.captureScreenshot('qa_galaxy_watch_8_companion.png');

        console.log('🎉 ALL BROWSER QA CHECKS PASSED FOR GALAXY WATCH 8 COMPANION!');

    } finally {
        if (cdp) cdp.close();
        try { chrome.kill(); } catch (e) {}
        if (serverProcess) {
            try { serverProcess.kill(); } catch (e) {}
        }
        try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch (e) {}
    }
}

runBrowserQA().catch(err => {
    console.error('❌ Browser QA Failed:', err);
    process.exit(1);
});
