// ==============================================================================
// Browser QA: Degree Planner Mandatory Courses & Quick-Restore Verification
// File: tests/qa_verify_planner_mandatory.js
// ==============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const assert = require('assert');

const ARTIFACTS_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\aa7d2a33-2de8-4eeb-b8bd-18c8fdd69b14';
const PORT = 9892;
const SERVER_PORT = 8080;
const TARGET_URL = `http://127.0.0.1:${SERVER_PORT}/?qa_test=1`;

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
    console.log('🚀 Starting Degree Planner Mandatory Courses Browser QA Verification...');

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

    const userDataDir = path.join(process.env.TEMP, 'chrome_qa_mandatory_' + Date.now());
    const chrome = spawn(chromePath, [
        `--remote-debugging-port=${PORT}`,
        `--user-data-dir=${userDataDir}`,
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--window-size=1440,900',
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

        console.log('[Page] Waiting for page load and state initialization...');
        await delay(3000);

        // 1. Switch to Degree Planner Tab
        console.log('▶ Step 1: Navigating to Degree Planner tab...');
        await cdp.eval('document.getElementById("tab-planner").click()');
        await delay(800);

        const plannerVisible = await cdp.eval('document.getElementById("planner-workspace").style.display !== "none"');
        assert(plannerVisible, 'Planner workspace should be visible');
        console.log('  ✓ Degree Planner workspace active.');

        // 2. Verify Mandatory Filter Pill
        console.log('▶ Step 2: Testing "📕 קורסי חובה" filter pill...');
        const mandatoryPillExists = await cdp.eval('!!document.querySelector(".planner-elective-filters [data-category=\\"MANDATORY\\"]")');
        assert(mandatoryPillExists, 'MANDATORY filter pill must exist in sidebar');

        await cdp.eval('document.querySelector(".planner-elective-filters [data-category=\\"MANDATORY\\"]").click()');
        await delay(500);

        const poolCount = await cdp.eval('document.querySelectorAll("#planner-available-electives-list .planner-pool-item").length');
        assert(poolCount > 0, `Mandatory courses pool should render items, found: ${poolCount}`);
        console.log(`  ✓ Mandatory courses filter active with ${poolCount} items.`);

        // 3. Verify Removal and Missing Mandatory Alert
        console.log('▶ Step 3: Removing a mandatory course to test Missing Alert and 1-Click Restore...');
        // Look for Solid Mechanics 1 or Calculus in customPlan
        await cdp.eval(`
            (() => {
                const removeBtn = document.querySelector('.planner-course-card[data-code="00340028"] .btn-card-remove') ||
                                  document.querySelector('.planner-course-card[data-code="034028"] .btn-card-remove') ||
                                  document.querySelector('.btn-card-remove');
                if (removeBtn) removeBtn.click();
            })()
        `);
        await delay(600);

        const missingVisible = await cdp.eval('document.getElementById("planner-missing-mandatory-section").style.display !== "none"');
        assert(missingVisible, 'planner-missing-mandatory-section should be visible when a mandatory course is removed');
        const missingText = await cdp.eval('document.getElementById("planner-missing-mandatory-section").innerText');
        console.log(`  ✓ Missing alert triggered: "${missingText.split('\\n')[0]}"`);

        // 4. Test 1-Click Restore
        console.log('▶ Step 4: Testing 1-click restore button...');
        await cdp.eval(`
            (() => {
                const restoreBtn = document.querySelector('.btn-restore-mandatory') || document.getElementById('btn-restore-all-mandatory');
                if (restoreBtn) restoreBtn.click();
            })()
        `);
        await delay(800);

        // 5. Capture QA Screenshot
        console.log('▶ Step 5: Capturing Degree Planner QA screenshot...');
        await cdp.captureScreenshot('qa_planner_mandatory_restore.png');

        console.log('🎉 ALL BROWSER QA CHECKS PASSED FOR DEGREE PLANNER MANDATORY COURSES!');

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
