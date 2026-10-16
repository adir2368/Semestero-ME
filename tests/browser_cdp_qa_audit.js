/**
 * Semestero ME - Automated Browser CDP QA & Visual Audit Script (Isolated Instance)
 * Uses Chrome Headless on custom port 9333 with isolated profile to inspect live production
 */

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9333;
const PROFILE_DIR = path.join(os.tmpdir(), `chrome_isolated_qa_${Date.now()}`);
const TARGET_URL = `https://adir2368.github.io/Semestero-ME/?qa=${Date.now()}`;
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
                    const desc = msg.params.exceptionDetails.text || (msg.params.exceptionDetails.exception && msg.params.exceptionDetails.exception.description);
                    this.exceptions.push(`[Exception] ${desc}`);
                } else if (msg.id && this.callbacks.has(msg.id)) {
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
    ], { stdio: 'ignore' });

    console.log(`Chrome spawned. Polling http://127.0.0.1:${PORT}/json...`);

    let targetPage = null;
    for (let i = 0; i < 40; i++) {
        await delay(500);
        try {
            const list = await getJson(`http://127.0.0.1:${PORT}/json`);
            if (list && list.length > 0) {
                targetPage = list.find(t => t.type === 'page' && (t.url.includes('Semestero-ME') || t.url.includes('adir2368'))) || list.find(t => t.type === 'page');
                if (targetPage && targetPage.webSocketDebuggerUrl) break;
            }
        } catch (e) {
            // waiting for chrome
        }
    }

    if (!targetPage || !targetPage.webSocketDebuggerUrl) {
        chromeProcess.kill();
        throw new Error('Failed to connect to isolated Chrome CDP endpoint.');
    }

    console.log(`Connected to target: "${targetPage.title}" (${targetPage.url})`);
    const client = new CDPClient(targetPage.webSocketDebuggerUrl);
    await client.connect();

    await client.send('Page.enable');
    await client.send('Runtime.enable');
    await client.send('DOM.enable');

    console.log('Waiting 6s for full page load and initial hydration...');
    await delay(6000);

    // 1. Verify App Version & Title
    const version = await client.eval('return window.APP_VERSION;');
    const title = await client.eval('return document.title;');
    const displayVer = await client.eval('const el = document.getElementById("display-system-version"); return el ? el.innerText : null;');
    console.log(`\n[1] Application Core Info:`);
    console.log(`   Title: "${title}"`);
    console.log(`   window.APP_VERSION: "${version}"`);
    console.log(`   display-system-version DOM: "${displayVer}"`);

    await client.screenshot('browser_audit_main_landing.png');

    // 2. Test Tab: Tasks & Runway Exam Clash Detector
    console.log(`\n[2] Testing Tasks Tab & Runway Clash Detector...`);
    await client.eval(`
        const tab = document.getElementById("tab-tasks");
        if (tab) tab.click();
    `);
    await delay(1500);
    const hasTrack = await client.eval('return Boolean(document.getElementById("exam-gap-runway-track"));');
    console.log(`   Exam gap runway track present: ${hasTrack}`);
    await client.screenshot('browser_audit_tasks_and_runway.png');

    // 3. Test Feature 3: Panopto Lecture Debt Tracker Modal (on Tasks Tab)
    console.log(`\n[3] Testing Tasks Tab & Panopto Lecture Debt Tracker...`);
    await client.eval(`
        if (window.PanoptoTracker && typeof window.PanoptoTracker.openModal === 'function') {
            window.PanoptoTracker.openModal();
        } else {
            const pBtn = document.getElementById("btn-open-panopto-tracker");
            if (pBtn) pBtn.click();
        }
    `);
    await delay(1500);
    const panoptoModalOpen = await client.eval('return Boolean(document.getElementById("modal-panopto-tracker"));');
    console.log(`   Panopto Tracker Modal Open: ${panoptoModalOpen}`);
    if (panoptoModalOpen) {
        const panoptoSummary = await client.eval(`
            const modalEl = document.getElementById("modal-panopto-tracker");
            return modalEl ? modalEl.innerText.substring(0, 300).replace(/\\n+/g, ' ') : '';
        `);
        console.log(`   Panopto Content Sample: ${panoptoSummary}`);
        await client.screenshot('browser_audit_panopto_modal.png');
        await client.eval(`
            const modalEl = document.getElementById("modal-panopto-tracker");
            if (modalEl) modalEl.remove();
        `);
    }

    // 4. Test Tab: Degree Planner & Graduation Clearance Audit Modal
    console.log(`\n[4] Testing Degree Planner & Graduation Clearance Modal...`);
    await client.eval(`
        const tab = document.getElementById("tab-planner");
        if (tab) tab.click();
    `);
    await delay(1500);
    await client.eval(`
        if (window.DegreePlanner && window.DegreePlanner.openGraduationClearanceModal) {
            window.DegreePlanner.openGraduationClearanceModal();
        } else {
            const btn = document.getElementById("btn-open-graduation-clearance");
            if (btn) btn.click();
        }
    `);
    await delay(1500);
    const gradModalOpen = await client.eval('return Boolean(document.getElementById("planner-graduation-clearance-modal"));');
    console.log(`   Graduation Clearance Modal Open: ${gradModalOpen}`);
    if (gradModalOpen) {
        const auditSummary = await client.eval(`
            const modal = document.getElementById("planner-graduation-clearance-modal");
            return modal ? modal.innerText.substring(0, 300).replace(/\\n+/g, ' ') : '';
        `);
        console.log(`   Modal Content Sample: ${auditSummary}`);
        await client.screenshot('browser_audit_graduation_clearance.png');
        await client.eval(`
            const modal = document.getElementById("planner-graduation-clearance-modal");
            if (modal) modal.remove();
        `);
    }

    // 5. Test Analytics Center & Honors Forecaster Card
    console.log(`\n[5] Testing Analytics Center & Honors Forecaster...`);
    await client.eval(`
        const analyticsBtn = document.getElementById("btn-open-analytics");
        if (analyticsBtn) analyticsBtn.click();
    `);
    await delay(1500);
    const honorsCardPresent = await client.eval('return Boolean(document.getElementById("analytics-honors-card"));');
    console.log(`   Analytics Honors Card Present: ${honorsCardPresent}`);
    if (honorsCardPresent) {
        const honorsText = await client.eval(`
            const c = document.getElementById("analytics-honors-card");
            return c ? c.innerText.replace(/\\n+/g, " ") : "";
        `);
        console.log(`   Honors Text: ${honorsText}`);
        await client.screenshot('browser_audit_honors_card.png');
    }
    await client.eval(`
        const analyticsCloseBtn = document.getElementById("analytics-modal-close");
        if (analyticsCloseBtn) analyticsCloseBtn.click();
        const aModal = document.getElementById("analytics-modal");
        if (aModal) { aModal.classList.remove("active"); aModal.style.display = "none"; }
    `);

    // 6. Test Universal Calendar Sync Modal
    console.log(`\n[6] Testing Universal Webcal / Calendar Sync Modal...`);
    await client.eval(`
        if (window.openCalendarSyncModal) {
            window.openCalendarSyncModal();
        } else {
            const btn = document.getElementById("btn-export-google-tasks");
            if (btn) btn.click();
        }
    `);
    await delay(1500);
    const calSyncOpen = await client.eval(`
        const modal = document.getElementById("calendar-sync-modal");
        return modal && modal.style.display !== 'none';
    `);
    console.log(`   Calendar Sync Modal Open: ${calSyncOpen}`);
    if (calSyncOpen) {
        await client.screenshot('browser_audit_calendar_sync.png');
        await client.eval(`
            const modal = document.getElementById("calendar-sync-modal");
            if (modal) modal.style.display = "none";
        `);
    }

    // 7. Test Course Modal & UW Flow Peer Consensus Card
    console.log(`\n[7] Testing Course Detail Modal & UW Flow Peer Consensus Card...`);
    await client.eval(`
        const cCodes = Object.keys(window.gameState && window.gameState.courses || {});
        const targetCode = cCodes.find(c => c.includes("034010") || c.includes("104041")) || cCodes[0];
        if (targetCode && typeof window.openCourseDetails === 'function') {
            window.openCourseDetails(targetCode);
        }
    `);
    await delay(1500);
    const courseModalOpen = await client.eval(`
        const m = document.getElementById("course-modal");
        return Boolean(m && (m.classList.contains("active") || m.style.display === "flex"));
    `);
    console.log(`   Course Details Modal Open: ${courseModalOpen}`);
    if (courseModalOpen) {
        const peerHtml = await client.eval(`
            const c = document.getElementById("modal-peer-consensus-container");
            return c ? c.innerText.replace(/\\n+/g, " ") : "";
        `);
        console.log(`   Peer Consensus Content: ${peerHtml}`);
        await client.screenshot('browser_audit_course_peer_consensus.png');
    }

    // 8. Console Error & Exception Audit
    console.log(`\n[8] Runtime Console & Exception Audit:`);
    console.log(`   Total Console Logs: ${client.logs.length}`);
    const severeErrors = client.logs.filter(l => l.includes('[Console error]'));
    console.log(`   Console Errors Count: ${severeErrors.length}`);
    if (severeErrors.length > 0) {
        console.log('   Errors:', severeErrors.slice(0, 5));
    }
    console.log(`   Total Exceptions: ${client.exceptions.length}`);
    if (client.exceptions.length > 0) {
        console.error('   ❌ Exceptions:', client.exceptions);
    } else {
        console.log('   ✅ Clean execution: 0 uncaught exceptions!');
    }

    client.close();
    chromeProcess.kill();
    try {
        fs.rmSync(PROFILE_DIR, { recursive: true, force: true });
    } catch (e) {}

    console.log('\n================================================================');
    console.log('🎉 Browser CDP Audit Completed Successfully!');
    console.log('================================================================');
}

main().catch(err => {
    console.error('Fatal error in CDP script:', err);
    process.exit(1);
});
