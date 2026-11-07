const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const os = require('os');
const fs = require('fs');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9780 + Math.floor(Math.random() * 200);
const PROFILE_DIR = path.join(os.tmpdir(), `chrome_qa_ws_isolation_${Date.now()}`);
const TARGET_URL = `http://localhost:8080/?ws_isolation=${Date.now()}`;
const ARTIFACT_DIR = "C:/Users/user/.gemini/antigravity/brain/aa7d2a33-2de8-4eeb-b8bd-18c8fdd69b14";

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function getJson(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
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
            this.ws.onerror = (e) => reject(e);
            this.ws.onmessage = (e) => {
                const msg = JSON.parse(e.data);
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
        const res = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
        if (res.exceptionDetails) throw new Error(JSON.stringify(res.exceptionDetails));
        return res.result.value;
    }
}

async function run() {
    console.log('========================================================================');
    console.log('🛡️ VERIFYING STRICT WORKSPACE TAB ISOLATION (ZERO BLEEDTHROUGH)');
    console.log('========================================================================\n');

    let serverProcess = null;
    try {
        await getJson('http://localhost:8080');
    } catch(e) {
        serverProcess = spawn('node', ['server.js'], { stdio: 'ignore', detached: true });
        await delay(1200);
    }

    const chrome = spawn(CHROME_PATH, [
        `--remote-debugging-port=${PORT}`,
        `--user-data-dir=${PROFILE_DIR}`,
        '--headless=new',
        '--disable-gpu',
        '--window-size=390,844',
        TARGET_URL
    ]);

    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
        await delay(500);
        try {
            const list = await getJson(`http://127.0.0.1:${PORT}/json`);
            const page = list.find(t => t.type === 'page');
            if (page && page.webSocketDebuggerUrl) { wsUrl = page.webSocketDebuggerUrl; break; }
        } catch(e) {}
    }

    const cdp = new CDPClient(wsUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    for (let i = 0; i < 20; i++) {
        await delay(500);
        const ready = await cdp.eval(`!!(window.gameState && document.getElementById('tab-tasks'))`);
        if (ready) break;
    }

    // [Test 1] Navigate to Tasks Tab (#tab-tasks) and verify Planner is 100% hidden
    console.log('[Test 1] Clicking Tasks Tab (#tab-tasks)...');
    const tasksAudit = await cdp.eval(`
        (() => {
            const tabTasks = document.getElementById('tab-tasks');
            if (tabTasks) tabTasks.click();

            const pw = document.getElementById('planner-workspace');
            const tw = document.getElementById('notion-tasks-workspace');
            const cw = document.getElementById('curriculum-tree-workspace');

            return {
                plannerComputedDisplay: pw ? getComputedStyle(pw).display : null,
                plannerInlineDisplay: pw ? pw.style.display : null,
                tasksComputedDisplay: tw ? getComputedStyle(tw).display : null,
                curriculumComputedDisplay: cw ? getComputedStyle(cw).display : null,
            };
        })()
    `);
    console.log('   Tasks Tab Workspace Audit:', tasksAudit);

    if (tasksAudit.plannerComputedDisplay !== 'none') {
        throw new Error(`CRITICAL BUG: Planner workspace is STILL visible on Tasks tab! display=${tasksAudit.plannerComputedDisplay}`);
    }
    console.log('   ✓ PASS: Planner workspace is strictly "none" when on Tasks tab!\n');

    // Screenshot of Tasks tab showing clean view without planner bleedthrough
    const scrTasksClean = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'qa_tasks_tab_clean_no_bleedthrough.png'), Buffer.from(scrTasksClean.data, 'base64'));
    console.log('   📸 Screenshot saved: qa_tasks_tab_clean_no_bleedthrough.png\n');

    // [Test 2] Navigate to Planner Tab (#tab-planner) and verify Planner shows & Tasks is hidden
    console.log('[Test 2] Clicking Planner Tab (#tab-planner)...');
    const plannerAudit = await cdp.eval(`
        (() => {
            const tabPlanner = document.getElementById('tab-planner');
            if (tabPlanner) tabPlanner.click();

            const pw = document.getElementById('planner-workspace');
            const tw = document.getElementById('notion-tasks-workspace');

            return {
                plannerComputedDisplay: pw ? getComputedStyle(pw).display : null,
                tasksComputedDisplay: tw ? getComputedStyle(tw).display : null
            };
        })()
    `);
    console.log('   Planner Tab Workspace Audit:', plannerAudit);

    if (plannerAudit.plannerComputedDisplay === 'none') {
        throw new Error('Planner workspace failed to display when clicking Planner tab!');
    }
    if (plannerAudit.tasksComputedDisplay !== 'none') {
        throw new Error('Tasks workspace leaked into Planner tab!');
    }
    console.log('   ✓ PASS: Planner workspace displays and Tasks workspace is strictly "none"!\n');

    // [Test 3] Switch between all tabs in sequence
    console.log('[Test 3] Testing sequential tab switching across all tabs...');
    const allTabsAudit = await cdp.eval(`
        (() => {
            const tabs = ['tab-curriculum', 'tab-timetable', 'tab-tasks', 'tab-settings', 'tab-planner'];
            const results = {};

            tabs.forEach(tabId => {
                const btn = document.getElementById(tabId);
                if (btn) btn.click();
                const pw = document.getElementById('planner-workspace');
                results[tabId] = {
                    plannerDisplay: pw ? getComputedStyle(pw).display : null
                };
            });

            return results;
        })()
    `);
    console.log('   All Tabs Audit:', allTabsAudit);

    if (allTabsAudit['tab-curriculum'].plannerDisplay !== 'none' ||
        allTabsAudit['tab-timetable'].plannerDisplay !== 'none' ||
        allTabsAudit['tab-tasks'].plannerDisplay !== 'none' ||
        allTabsAudit['tab-settings'].plannerDisplay !== 'none' ||
        allTabsAudit['tab-planner'].plannerDisplay === 'none') {
        throw new Error('Workspace isolation test failed for one or more tabs!');
    }
    console.log('   ✓ PASS: Sequential tab switching maintains 100% strict isolation across all 5 tabs!\n');

    console.log('========================================================================');
    console.log('🎉 ALL WORKSPACE ISOLATION TESTS PASSED 100%!');
    console.log('========================================================================');

    chrome.kill();
    if (serverProcess) serverProcess.kill();
}

run().catch(err => {
    console.error('❌ Isolation Test Error:', err);
    process.exit(1);
});
