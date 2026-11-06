const { spawn } = require('child_process');
const http = require('http');
const assert = require('assert');
const path = require('path');
const os = require('os');
const fs = require('fs');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9500 + Math.floor(Math.random() * 400);
const PROFILE_DIR = path.join(os.tmpdir(), `chrome_qa_hw_${Date.now()}`);
const TARGET_URL = `http://localhost:8080/?qa_hw=${Date.now()}`;
const ARTIFACT_DIR = "C:/Users/user/.gemini/antigravity/brain/aa7d2a33-2de8-4eeb-b8bd-18c8fdd69b14";

function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
}

function getJson(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
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

    async eval(expr) {
        const res = await this.send('Runtime.evaluate', {
            expression: expr,
            returnByValue: true,
            awaitPromise: true
        });
        if (res.exceptionDetails) {
            throw new Error(`Eval failed: ${JSON.stringify(res.exceptionDetails)}`);
        }
        return res.result.value;
    }
}

async function runTest() {
    console.log('========================================================================');
    console.log('🎯 VERIFYING HOMEWORK POLICY TRACKER (MACRO STRIP & MICRO MODAL GRID)');
    console.log('========================================================================\n');

    let serverProcess = null;
    try {
        await getJson('http://localhost:8080');
        console.log('[Server] Local server already active on port 8080.');
    } catch (e) {
        console.log('[Server] Starting server.js on port 8080...');
        serverProcess = spawn('node', ['server.js'], { stdio: 'ignore', detached: true });
        await delay(1200);
    }

    console.log(`[Chrome] Launching headless Chrome on port ${PORT}...`);
    const chrome = spawn(CHROME_PATH, [
        `--remote-debugging-port=${PORT}`,
        `--user-data-dir=${PROFILE_DIR}`,
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--window-size=1400,900',
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
    const cdp = new CDPClient(wsUrl);
    await cdp.connect();
    console.log('✓ Chrome CDP connected successfully');

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    await delay(2000);

    // Switch to Notion Tasks Tab
    console.log('\n[Test 1] Navigating to Notion Tasks Tab & Verifying Macro View Strip...');
    const switchRes = await cdp.eval(`
        (() => {
            const tabBtn = document.getElementById('tab-tasks');
            if (tabBtn) tabBtn.click();
            if (typeof renderNotionTasksTable === 'function') renderNotionTasksTable();
            if (typeof renderNotionHomeworkPolicyStrip === 'function') renderNotionHomeworkPolicyStrip();

            const strip = document.getElementById('notion-hw-policy-strip');
            const capsules = strip ? strip.querySelectorAll('.course-hw-capsule') : [];
            const solidsCapsule = Array.from(capsules).find(c => c.textContent.includes('מוצקים 2') || c.textContent.includes('034053'));

            return {
                stripExists: !!strip,
                stripVisible: strip && strip.style.display !== 'none',
                capsulesCount: capsules.length,
                hasSolids: !!solidsCapsule,
                solidsText: solidsCapsule ? solidsCapsule.innerText : ''
            };
        })()
    `);
    console.log('   Macro Strip Audit:', switchRes);
    assert(switchRes.stripExists, 'Macro strip container #notion-hw-policy-strip must exist');
    assert(switchRes.stripVisible, 'Macro strip should be visible');
    assert(switchRes.capsulesCount >= 1, 'Should have at least 1 active course capsule');
    assert(switchRes.hasSolids, 'Should have Solid Mechanics 2 (034053) capsule');
    console.log('✓ PASS: Macro View Strip rendered active course capsules with dot tracks!');

    // Capture Macro View Screenshot
    const macroScr = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'qa_hw_macro_strip_verified.png'), Buffer.from(macroScr.data, 'base64'));
    console.log('📸 Macro Strip Screenshot saved: qa_hw_macro_strip_verified.png');

    // Test 2: Clicking Solid Mechanics capsule opens Micro View in Course Modal
    console.log('\n[Test 2] Clicking Solid Mechanics 2 Capsule & Verifying Course Modal Micro Grid...');
    const modalRes = await cdp.eval(`
        (() => {
            if (typeof openCourseHomeworkDetail === 'function') {
                openCourseHomeworkDetail('034053');
            }
            const modal = document.getElementById('course-modal');
            const hwSection = document.getElementById('modal-hw-policy-section');
            const sheetCards = hwSection ? hwSection.querySelectorAll('.hw-sheet-card') : [];
            const dualRows = hwSection ? hwSection.querySelectorAll('.hw-component-row') : [];

            return {
                modalActive: modal && modal.classList.contains('active'),
                hwSectionVisible: hwSection && hwSection.style.display !== 'none',
                sheetCardsCount: sheetCards.length,
                dualRowsCount: dualRows.length
            };
        })()
    `);
    console.log('   Micro Grid Audit:', modalRes);
    assert(modalRes.modalActive, 'Course Modal should be active');
    assert(modalRes.hwSectionVisible, 'Homework policy section should be visible in modal');
    assert.strictEqual(modalRes.sheetCardsCount, 12, 'Solid Mechanics 2 should render exactly 12 sheet cards');
    assert(modalRes.dualRowsCount >= 24, 'Each of the 12 sheets should have dual components (digital + written)');
    console.log('✓ PASS: Course Modal opened with full 12-sheet dual-component grid!');

    // Test 3: Interactive Toggles (Digital Quiz & Written Solution)
    console.log('\n[Test 3] Testing Interactive Dual-Component Toggles & Status Progression...');
    const toggleRes = await cdp.eval(`
        (() => {
            // Initially sheet 1 status
            const initialStatus = window.getCourseHomeworkStatus('034053');
            const initialS1 = initialStatus.sheets[0];

            // 1. Toggle digital quiz of sheet 1
            window.toggleHomeworkSheetComponent('034053', 1, 'digital');
            const step1Status = window.getCourseHomeworkStatus('034053');
            const step1S1 = step1Status.sheets[0];

            // 2. Toggle written solution of sheet 1
            window.toggleHomeworkSheetComponent('034053', 1, 'written');
            const step2Status = window.getCourseHomeworkStatus('034053');
            const step2S1 = step2Status.sheets[0];

            return {
                initialStatus: initialS1.status,
                step1Status: step1S1.status, // should be 'submitted'
                step1SubmittedCount: step1Status.submittedCount,
                step2Status: step2S1.status, // should be 'done'
                step2CompletedCount: step2Status.completedCount
            };
        })()
    `);
    console.log('   Toggle Audit:', toggleRes);
    assert.strictEqual(toggleRes.step1Status, 'submitted', 'After submitting digital quiz only, sheet status must be "submitted"');
    assert.strictEqual(toggleRes.step2Status, 'done', 'After submitting both digital & written parts, sheet status must become "done"');
    assert(toggleRes.step2CompletedCount >= 1, 'Completed count should increase to at least 1');
    console.log('✓ PASS: Dual component progression verified (Todo -> Submitted -> Done)!');

    // Capture Micro View Screenshot
    const microScr = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'qa_hw_micro_modal_verified.png'), Buffer.from(microScr.data, 'base64'));
    console.log('📸 Micro Grid Screenshot saved: qa_hw_micro_modal_verified.png');

    // Teardown
    chrome.kill();
    if (serverProcess) serverProcess.kill();
    console.log('\n========================================================================');
    console.log('🎉 ALL HOMEWORK POLICY TRACKER TESTS PASSED 100%!');
    console.log('========================================================================\n');
}

runTest().catch(err => {
    console.error('\n❌ TEST SUITE FAILED:', err);
    process.exit(1);
});
