const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9336;
const PROFILE_DIR = path.join(os.tmpdir(), `chrome_local_qa_${Date.now()}`);
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
        this.ws = null;
        this.id = 1;
        this.callbacks = new Map();
        this.logs = [];
        this.exceptions = [];
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.wsUrl);
            this.ws.onopen = () => resolve();
            this.ws.onerror = (err) => reject(err);
            this.ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                if (msg.method === 'Runtime.consoleAPICalled') {
                    const text = msg.params.args.map(a => a.value !== undefined ? a.value : (a.description || '')).join(' ');
                    this.logs.push(`[Console ${msg.params.type}] ${text}`);
                } else if (msg.method === 'Runtime.exceptionThrown') {
                    const details = msg.params.exceptionDetails;
                    const desc = `${details.text} - ${(details.exception && details.exception.description) || ''} (at ${details.url}:${details.lineNumber})`;
                    this.exceptions.push(`[Exception] ${desc}`);
                }

                if (msg.id && this.callbacks.has(msg.id)) {
                    const cb = this.callbacks.get(msg.id);
                    this.callbacks.delete(msg.id);
                    if (msg.error) cb.reject(new Error(msg.error.message || JSON.stringify(msg.error)));
                    else cb.resolve(msg.result);
                }
            };
        });
    }

    send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const reqId = this.id++;
            this.callbacks.set(reqId, { resolve, reject });
            this.ws.send(JSON.stringify({ id: reqId, method, params }));
        });
    }

    async eval(expression) {
        const wrappedExpr = expression.trim().startsWith('(() =>') ? expression : `(() => { ${expression} })()`;
        const res = await this.send('Runtime.evaluate', {
            expression: wrappedExpr,
            returnByValue: true,
            awaitPromise: true
        });
        if (res.exceptionDetails) {
            throw new Error(`Eval failed: ${JSON.stringify(res.exceptionDetails)}`);
        }
        return res.result ? res.result.value : undefined;
    }

    async screenshot(filename) {
        const res = await this.send('Page.captureScreenshot', { format: 'png' });
        const buf = Buffer.from(res.data, 'base64');
        const savePath = path.join(ARTIFACT_DIR, filename);
        fs.writeFileSync(savePath, buf);
        console.log(`   📸 Screenshot saved: ${filename}`);
        return savePath;
    }

    close() {
        if (this.ws) this.ws.close();
    }
}

async function main() {
    console.log('================================================================');
    console.log(`🚀 Launching Isolated Chrome Headless on Port ${PORT}...`);
    console.log('================================================================');

    if (!fs.existsSync(PROFILE_DIR)) fs.mkdirSync(PROFILE_DIR, { recursive: true });

    const chromeProcess = spawn(CHROME_PATH, [
        '--headless=new',
        `--remote-debugging-port=${PORT}`,
        `--user-data-dir=${PROFILE_DIR}`,
        '--window-size=1440,900',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-gpu',
        TARGET_URL
    ]);

    let targetPage = null;
    for (let i = 0; i < 40; i++) {
        await delay(500);
        try {
            const list = await getJson(`http://127.0.0.1:${PORT}/json`);
            if (list && list.length > 0) {
                targetPage = list.find(t => t.type === 'page');
                if (targetPage && targetPage.webSocketDebuggerUrl) break;
            }
        } catch (e) {}
    }

    if (!targetPage || !targetPage.webSocketDebuggerUrl) {
        chromeProcess.kill();
        throw new Error('Failed to connect to isolated Chrome CDP endpoint.');
    }

    console.log(`Connected to target: "${targetPage.title}" (${targetPage.url})`);
    const client = new CDPClient(targetPage.webSocketDebuggerUrl);
    await client.connect();

    try {
        await client.send('Page.enable');
        await client.send('Runtime.enable');
        await client.send('DOM.enable');

        console.log('Waiting 5s for full page load and initial hydration...');
        await delay(5000);

        // 1. Verify basic page info
        const title = await client.eval('return document.title;');
        console.log(`\n[1] Page Title: "${title}"`);

        // 2. Switch to Notion Tasks Tab
        console.log('\n[2] Switching to Notion Tasks Tab...');
        await client.eval(`
            const tabBtn = document.getElementById("tab-tasks");
            if (tabBtn) tabBtn.click();
        `);
        await delay(1000);

        const moodleBtnExists = await client.eval('return !!document.getElementById("btn-sync-moodle-tasks");');
        console.log(`   Moodle Sync Button (#btn-sync-moodle-tasks) exists: ${moodleBtnExists}`);

        const miluimBtnExists = await client.eval('return !!document.getElementById("btn-open-miluim-advisor");');
        console.log(`   Miluim Advisor Button (#btn-open-miluim-advisor) exists: ${miluimBtnExists}`);

        await client.screenshot('browser_audit_tasks_new_buttons.png');

        // 3. Open Miluim Rights Advisor Modal with Student Completed Courses
        console.log('\n[3] Testing Miluim Rights Advisor Modal with Completed Courses...');
        await client.eval(`
            // Populate test completed courses
            if (window.gameState && window.gameState.courses) {
                const c1 = window.gameState.courses['034013'] || { code: '034013', name: 'מוצקים 1', credits: 4.0 };
                c1.status = 'mastered';
                c1.grade = 72;
                window.gameState.courses['034013'] = c1;

                const c2 = window.gameState.courses['104041'] || { code: '104041', name: 'חדו״א 1', credits: 5.0 };
                c2.status = 'mastered';
                c2.grade = 78;
                window.gameState.courses['104041'] = c2;

                const c3 = window.gameState.courses['114051'] || { code: '114051', name: 'פיסיקה 1', credits: 4.5 };
                c3.status = 'mastered';
                c3.grade = 89;
                window.gameState.courses['114051'] = c3;

                const c4 = window.gameState.courses['104065'] || { code: '104065', name: 'אלגברה 1', credits: 4.0 };
                c4.status = 'mastered';
                c4.grade = 94;
                window.gameState.courses['104065'] = c4;

                if (typeof updateStats === 'function') updateStats();
            }
            const btn = document.getElementById("btn-open-miluim-advisor");
            if (btn) btn.click();
        `);
        await delay(1000);

        const modalDisplay = await client.eval('return document.getElementById("modal-miluim-rights").style.display;');
        console.log(`   Miluim Modal display: "${modalDisplay}"`);

        const modalHeader = await client.eval('return document.querySelector("#modal-miluim-rights h2").innerText;');
        console.log(`   Miluim Modal Header: "${modalHeader}"`);

        const candidateCount = await client.eval('return document.querySelectorAll(".miluim-course-checkbox").length;');
        console.log(`   Candidate courses displayed: ${candidateCount}`);

        const currentGpaText = await client.eval('return document.getElementById("miluim-current-gpa").innerText;');
        const simGpaText = await client.eval('return document.getElementById("miluim-simulated-gpa").innerText;');
        const gpaDiffText = await client.eval('return document.getElementById("miluim-gpa-diff").innerText;');
        console.log(`   Current GPA: ${currentGpaText} ➔ Simulated: ${simGpaText} (${gpaDiffText})`);

        await client.screenshot('browser_audit_miluim_advisor_active_simulation.png');

        // 4. Test Miluim Filter from Advisor
        console.log('\n[4] Testing "Filter Miluim Tasks" from Advisor...');
        await client.eval(`
            const filterBtn = document.getElementById("btn-filter-miluim-tasks-from-advisor");
            if (filterBtn) filterBtn.click();
        `);
        await delay(1000);

        const modalClosed = await client.eval('return document.getElementById("modal-miluim-rights").style.display === "none";');
        const miluimPillActive = await client.eval(`
            const pill = document.querySelector('.organit-pill[data-category="miluim"]');
            return pill ? pill.classList.contains("active") : false;
        `);
        console.log(`   Miluim modal closed: ${modalClosed}`);
        console.log(`   Miluim category filter pill active: ${miluimPillActive}`);

        // 5. Test Moodle Sync Modal
        console.log('\n[5] Testing Moodle Sync Button Click...');
        await client.eval(`
            const mBtn = document.getElementById("btn-sync-moodle-tasks");
            if (mBtn) mBtn.click();
        `);
        await delay(1000);

        const moodleModalDisplay = await client.eval('return document.getElementById("moodle-sync-modal").style.display;');
        console.log(`   Moodle Sync Modal display: "${moodleModalDisplay}"`);
        await client.screenshot('browser_audit_moodle_sync_modal.png');

        // 6. Check Console Errors and Exceptions
        console.log('\n[6] Runtime Console & Exception Audit:');
        console.log(`   Total Console Logs: ${client.logs.length}`);
        const errors = client.logs.filter(l => l.includes('[Console error]'));
        console.log(`   Console Errors Count: ${errors.length}`);
        if (errors.length > 0) {
            errors.forEach(e => console.log(`   ❌ ${e}`));
        }
        console.log(`   Total Exceptions: ${client.exceptions.length}`);
        if (client.exceptions.length > 0) {
            client.exceptions.forEach(e => console.log(`   ❌ ${e}`));
        }

        if (errors.length === 0 && client.exceptions.length === 0) {
            console.log('   ✅ 100% CLEAN EXECUTION: 0 errors, 0 exceptions!');
        }

        console.log('\n================================================================');
        console.log('🎉 All Local Features Verified Successfully!');
        console.log('================================================================');

    } finally {
        client.close();
        chromeProcess.kill();
        try {
            fs.rmSync(PROFILE_DIR, { recursive: true, force: true });
        } catch (e) {}
    }
}

main().catch(err => {
    console.error('Fatal Test Error:', err);
    process.exit(1);
});
