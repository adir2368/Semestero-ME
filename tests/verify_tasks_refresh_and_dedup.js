const { spawn } = require('child_process');
const http = require('http');
const assert = require('assert');
const path = require('path');
const os = require('os');
const fs = require('fs');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9500 + Math.floor(Math.random() * 400);
const PROFILE_DIR = path.join(os.tmpdir(), `chrome_qa_dedup_${Date.now()}`);
const TARGET_URL = `http://localhost:8080/?qa=${Date.now()}`;
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
            throw new Error(`Eval exception: ${JSON.stringify(res.exceptionDetails)}`);
        }
        return res.result ? res.result.value : undefined;
    }
}

function isServerListening(port) {
    return new Promise(resolve => {
        const req = http.get(`http://127.0.0.1:${port}/`, () => {
            resolve(true);
        });
        req.on('error', () => resolve(false));
        req.setTimeout(1000, () => {
            req.abort();
            resolve(false);
        });
    });
}

async function runTest() {
    console.log('================================================================');
    console.log('🛡️ QA SUITE: TASKS REFRESH, DEDUPLICATION & STALE DATA UPDATE');
    console.log('================================================================\n');

    let serverProcess = null;
    const serverRunning = await isServerListening(8080);
    if (!serverRunning) {
        console.log('[Server] Starting server.js on port 8080...');
        serverProcess = spawn('node', ['server.js'], {
            cwd: path.join(__dirname, '..'),
            stdio: 'ignore'
        });
        await delay(1500);
    }

    // Launch Chrome with remote debugging
    console.log(`[Test 1] Launching Chrome on dynamic port ${PORT}...`);
    const chrome = spawn(CHROME_PATH, [
        `--remote-debugging-port=${PORT}`,
        `--user-data-dir=${PROFILE_DIR}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--headless=new',
        '--disable-gpu',
        '--window-size=1440,900',
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

    assert(wsUrl, 'Failed to acquire Chrome DevTools Protocol WebSocket URL');
    console.log(`✓ Chrome CDP connected: ${wsUrl}`);

    const cdp = new CDPClient(wsUrl);
    await cdp.connect();
    await delay(2500);

    // Initialize session and navigate to Tasks Tab
    console.log('\n[Test 2] Navigating to Notion Tasks Tab...');
    await cdp.eval(`
        (() => {
            sessionStorage.setItem('sw_last_controller_reload', String(Date.now()));
            localStorage.setItem('ast_onboarding_shown', 'true');
            const obModal = document.getElementById('onboarding-wizard-modal');
            if (obModal) obModal.classList.remove('active');

            if (window.switchTab) window.switchTab('tasks');
            else if (document.getElementById('tab-tasks')) document.getElementById('tab-tasks').click();

            if (typeof renderNotionTasksTable === 'function') renderNotionTasksTable();
        })()
    `);
    await delay(1200);

    const isTasksVisible = await cdp.eval(`
        document.getElementById('notion-tasks-workspace').style.display === 'flex'
    `);
    assert.strictEqual(isTasksVisible, true, 'Tasks workspace should be visible');
    console.log('✓ Tasks workspace is active.');

    // Verify Refresh Tasks button exists in UI
    console.log('\n[Test 3] Verifying Refresh Tasks Button in UI...');
    const refreshBtnInfo = await cdp.eval(`
        (() => {
            const btn = document.getElementById('btn-refresh-tasks');
            return {
                exists: !!btn,
                visible: btn ? (btn.offsetWidth > 0 || btn.offsetHeight > 0 || getComputedStyle(btn).display !== 'none') : false,
                text: btn ? btn.innerText.trim() : ''
            };
        })()
    `);
    console.log('   Refresh button info:', refreshBtnInfo);
    assert.strictEqual(refreshBtnInfo.exists, true, 'btn-refresh-tasks must exist in DOM');
    assert(refreshBtnInfo.text.includes('רענן משימות'), 'Button text must include רענן משימות');
    console.log('✓ PASS: Refresh Tasks button is properly rendered.');

    // Inject intentional duplicate tasks and old dates into a test course to verify deduplication
    console.log('\n[Test 4] Injecting Duplicate Tasks & Stale Dates into Course 034056...');
    const setupResult = await cdp.eval(`
        (() => {
            if (!window.gameState) window.gameState = { courses: {} };
            if (!window.gameState.courses) window.gameState.courses = {};
            if (!window.gameState.courses['034056']) {
                window.gameState.courses['034056'] = {
                    code: '034056',
                    name: 'חישוב מדעי והנדסי',
                    status: 'active',
                    tasks: []
                };
            }
            const course = window.gameState.courses['034056'];
            if (!Array.isArray(course.tasks)) course.tasks = [];

            // Add intentional duplicates with different IDs and older dates
            course.tasks.push({
                id: 'dup_matlab_old',
                title: 'לומדת MATLAB',
                dueDate: '2026-11-05',
                completed: false,
                status: 'not_started'
            });
            course.tasks.push({
                id: 'dup_matlab_new',
                title: 'לומדת MATLAB (בונוס 2 נקודות לציון)',
                dueDate: '2026-11-19',
                moodleEventId: '43952',
                completed: true,
                status: 'done'
            });
            course.tasks.push({
                id: 'dup_moed_a_old',
                title: "מועד א'",
                dueDate: '2027-02-05',
                type: 'exam'
            });
            course.tasks.push({
                id: 'dup_moed_a_new',
                title: "חישוב מדעי והנדסי - מועד א'",
                dueDate: '2027-02-11',
                type: 'exam'
            });
            // Also add an explicit user copy that should NOT be deduplicated
            course.tasks.push({
                id: 'user_copy_1',
                title: 'מטלת תכנות אישית (העתק)',
                dueDate: '2026-12-01',
                completed: false
            });

            return { initialCount: course.tasks.length };
        })()
    `);
    console.log('   Injected tasks count:', setupResult.initialCount);

    // Trigger window.refreshTasks()
    console.log('\n[Test 5] Triggering window.refreshTasks()...');
    const dedupReport = await cdp.eval(`
        (() => {
            const beforeCount = window.gameState.courses['034056'].tasks.length;
            window.refreshTasks({ isSilent: true });
            const afterTasks = window.gameState.courses['034056'].tasks;
            
            // Inspect MATLAB task
            const matlabTasks = afterTasks.filter(t => t.title.includes('MATLAB') || t.title.includes('מטלאב'));
            // Inspect Moed A exam tasks
            const moedATasks = afterTasks.filter(t => t.type === 'exam' && t.title.includes('מועד א'));
            // Inspect user copy
            const userCopies = afterTasks.filter(t => t.title.includes('(העתק)'));

            return {
                beforeCount,
                afterCount: afterTasks.length,
                matlabCount: matlabTasks.length,
                matlabTask: matlabTasks[0],
                moedACount: moedATasks.length,
                moedATask: moedATasks[0],
                userCopiesCount: userCopies.length
            };
        })()
    `);
    console.log('   Deduplication & Refresh Report:', dedupReport);

    assert.strictEqual(dedupReport.matlabCount, 1, 'MATLAB duplicates must be consolidated into exactly 1 task!');
    assert.strictEqual(dedupReport.matlabTask.dueDate, '2026-11-19', 'MATLAB task must have the updated, postponed due date!');
    assert.strictEqual(dedupReport.matlabTask.completed, true, 'User completion must be preserved during merge!');

    assert.strictEqual(dedupReport.moedACount, 1, 'Moed A exam duplicates must be consolidated into exactly 1 task!');
    assert.strictEqual(dedupReport.moedATask.dueDate, '2027-02-11', 'Moed A must have the updated authentic date!');

    assert.strictEqual(dedupReport.userCopiesCount, 1, 'Explicit user copy with (העתק) must NOT be removed!');
    console.log('✓ PASS: In-course duplicates eliminated, postponed dates updated, completion preserved!');

    // Test Moodle ICS Sync Update & Stale Information Overwrite
    console.log('\n[Test 6] Testing Moodle ICS Sync Stale Info Overwrite...');
    const moodleSyncResult = await cdp.eval(`
        (() => {
            const course = window.gameState.courses['034056'];
            const targetTask = course.tasks.find(t => t.title.includes('MATLAB'));
            
            // Simulate Moodle update with postponed date and modified title
            const updatedIcs = \`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Moodle//NONSGML//EN
BEGIN:VEVENT
UID:43952@moodle26.technion.ac.il
SUMMARY:לומדת MATLAB - הארכת מועד הגשה סופית
CATEGORIES:00340056.201
DTSTART:20261125T215900Z
DTEND:20261125T215900Z
DESCRIPTION:הגשה במודל עד שעה 23:59
URL:https://moodle26.technion.ac.il/mod/assign/view.php?id=43952
END:VEVENT
END:VCALENDAR\`;

            const parseRes = window.MoodleSync.parseAndApplyIcs(updatedIcs);
            const updatedMatlab = course.tasks.find(t => t.moodleEventId === '43952' || t.title.includes('MATLAB'));

            return {
                parseRes,
                updatedTitle: updatedMatlab ? updatedMatlab.title : '',
                updatedDueDate: updatedMatlab ? updatedMatlab.dueDate : '',
                updatedMoodleUrl: updatedMatlab ? updatedMatlab.moodleUrl : ''
            };
        })()
    `);
    console.log('   Moodle Sync Overwrite Result:', moodleSyncResult);

    assert(moodleSyncResult.updatedTitle.includes('הארכת מועד הגשה סופית'), 'Title should be updated from Moodle feed!');
    assert(moodleSyncResult.updatedDueDate.startsWith('2026-11-25'), 'Due date should be updated to postponed date 2026-11-25!');
    console.log('✓ PASS: Stale task information successfully overwritten by updated Moodle sync data!');

    // Take screenshot of the clean Notion Tasks Table
    const scrRes = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const scrPath = path.join(ARTIFACT_DIR, 'qa_tasks_refresh_and_dedup_verified.png');
    fs.writeFileSync(scrPath, Buffer.from(scrRes.data, 'base64'));
    console.log(`\n📸 Screenshot saved: ${scrPath}`);

    // Teardown
    chrome.kill();
    if (serverProcess) serverProcess.kill();
    console.log('\n================================================================');
    console.log('🎉 ALL TASKS REFRESH & DEDUPLICATION TESTS PASSED 100%!');
    console.log('================================================================\n');
}

runTest().catch(err => {
    console.error('\n❌ TEST SUITE FAILED:', err);
    process.exit(1);
});
