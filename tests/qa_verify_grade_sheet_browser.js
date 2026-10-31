// ==============================================================================
// Browser QA Verification: Technion Grade Sheet Transcript & What-If Simulator
// File: tests/qa_verify_grade_sheet_browser.js
// ==============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const assert = require('assert');

const ARTIFACTS_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\aa7d2a33-2de8-4eeb-b8bd-18c8fdd69b14';
const PORT = 9888;
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
    console.log('🚀 Starting Grade Sheet Browser QA Verification...');

    let serverProcess = null;
    const isRunning = await isServerListening(SERVER_PORT);
    if (!isRunning) {
        console.log('[Server] Spawning server.js on port 8080...');
        serverProcess = spawn('node', ['server.js'], {
            cwd: path.join(__dirname, '..'),
            stdio: 'ignore'
        });
        for (let i = 0; i < 20; i++) {
            await delay(300);
            if (await isServerListening(SERVER_PORT)) break;
        }
    }

    const chromePath = findChrome();
    assert(chromePath, 'Chrome executable not found');

    console.log(`[Chrome] Launching on port ${PORT}...`);
    const chromeProc = spawn(chromePath, [
        '--headless=new',
        `--remote-debugging-port=${PORT}`,
        '--no-sandbox',
        '--disable-gpu',
        '--window-size=1440,960',
        '--no-default-browser-check',
        TARGET_URL
    ]);

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

    assert(wsUrl, 'Failed to connect to Chrome DevTools Protocol WebSocket');
    console.log(`✓ Chrome CDP connected successfully`);

    const cdp = new CDPClient(wsUrl);
    await cdp.connect();
    await cdp.send('Runtime.enable');
    await cdp.send('Page.enable');

    try {
        console.log('[App] Waiting for application and GradeSheet initialization...');
        let ready = false;
        for (let i = 0; i < 40; i++) {
            await delay(300);
            try {
                const isReady = await cdp.eval(`Boolean(window.GradeSheet && window.gameState && window.gameState.courses)`);
                if (isReady) {
                    ready = true;
                    break;
                }
            } catch (e) {}
        }
        assert(ready, 'Application or GradeSheet failed to initialize within timeout');
        console.log('✓ Application and GradeSheet fully initialized in browser');

        // 1. Verify HUD Button
        const hudBtn = await cdp.eval(`Boolean(document.getElementById('btn-open-grade-sheet'))`);
        assert(hudBtn, 'HUD Grade Sheet button should be present');
        console.log('✓ HUD button #btn-open-grade-sheet verified');

        // Populate authentic user state for Adir Moshe
        await cdp.eval(`
            window.gameState = JSON.parse(JSON.stringify(window.PRELOADED_USER_STATE));
            window.GradeSheet.studentInfo.name = 'אדיר משה';
            window.GradeSheet.studentInfo.id = '318942516';
        `);

        // 2. Open Grade Sheet Modal
        console.log('Opening Grade Sheet modal...');
        await cdp.eval(`window.openGradeSheetModal()`);
        await delay(600);

        const modalVisible = await cdp.eval(`
            const m = document.getElementById('modal-grade-sheet');
            Boolean(m && m.style.display !== 'none' && m.classList.contains('active'))
        `);
        assert(modalVisible, 'Modal #modal-grade-sheet should be visible and active');
        console.log('✓ Grade Sheet modal opened cleanly');

        // 3. Verify Transcript Values
        const gpa = await cdp.eval(`document.getElementById('gs-kpi-cumulative-gpa')?.innerText`);
        const credits = await cdp.eval(`document.getElementById('gs-kpi-earned-credits')?.innerText`);
        const standing = await cdp.eval(`document.getElementById('grade-sheet-academic-standing')?.innerText`);
        const semCount = await cdp.eval(`document.querySelectorAll('.grade-sheet-sem-block').length`);

        console.log('📊 Rendered Transcript Metrics:');
        console.log(`   Cumulative GPA: ${gpa}`);
        console.log(`   Earned Credits: ${credits}`);
        console.log(`   Standing: ${standing}`);
        console.log(`   Semesters: ${semCount}`);

        assert(gpa === '86.04', `Cumulative GPA should be 86.04, got ${gpa}`);
        assert(credits.includes('38.5'), `Earned credits should contain 38.5, got ${credits}`);

        // Capture QA Screenshot 1
        await cdp.captureScreenshot('qa_grade_sheet_transcript_modal.png');

        // 4. Test What-If Simulator
        console.log('Activating What-If Simulator...');
        await cdp.eval(`window.toggleGradeSheetSimulation(true)`);
        await delay(400);

        const simPanelVisible = await cdp.eval(`
            const p = document.getElementById('grade-sheet-sim-panel');
            Boolean(p && p.style.display !== 'none')
        `);
        assert(simPanelVisible, 'What-If Simulator panel should be visible');

        // Target GPA solver test
        await cdp.eval(`
            const inp = document.getElementById('sim-target-gpa');
            if (inp) {
                inp.value = '88.0';
                window.calcGradeSheetTargetGpa();
            }
        `);
        await delay(300);

        const solverFeedback = await cdp.eval(`document.getElementById('sim-target-feedback')?.innerText`);
        console.log('🎯 Target GPA Feedback:', solverFeedback);
        assert(solverFeedback.includes('88.00'), 'Feedback should mention target GPA 88.00');

        // Apply 90 preset
        console.log('Applying preset 90 to remaining courses...');
        await cdp.eval(`window.applyGradeSheetPreset(90)`);
        await delay(400);

        const projectedGpa = await cdp.eval(`document.getElementById('gs-kpi-cumulative-gpa')?.innerText`);
        console.log(`🔮 Projected Cumulative GPA: ${projectedGpa}`);
        assert(projectedGpa.includes('89') || projectedGpa.includes('90') || projectedGpa.includes('88'), 'Projected GPA should be elevated');

        // Capture QA Screenshot 2
        await cdp.captureScreenshot('qa_grade_sheet_what_if_simulator.png');

        // 5. Test Close Modal
        await cdp.eval(`window.closeGradeSheetModal()`);
        await delay(300);

        const modalClosed = await cdp.eval(`
            (() => {
                const el = document.getElementById('modal-grade-sheet');
                return Boolean(el && (el.style.display === 'none' || !el.classList.contains('active')));
            })()
        `);
        assert(modalClosed, 'Modal should close cleanly');
        console.log('✓ Grade Sheet modal closed cleanly');

        console.log('\n🎉 BROWSER QA VERIFICATION 100% SUCCESSFUL!\n');
    } finally {
        cdp.close();
        chromeProc.kill();
        if (serverProcess) serverProcess.kill();
    }
}

runBrowserQA().catch(err => {
    console.error('❌ Browser QA failed:', err);
    process.exit(1);
});
