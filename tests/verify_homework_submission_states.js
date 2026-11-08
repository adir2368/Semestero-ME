const { spawn } = require('child_process');
const http = require('http');
const assert = require('assert');
const path = require('path');
const os = require('os');
const fs = require('fs');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9560 + Math.floor(Math.random() * 400);
const PROFILE_DIR = path.join(os.tmpdir(), `chrome_qa_hw_states_${Date.now()}`);
const TARGET_URL = `http://localhost:8080/?qa_hw_states=${Date.now()}`;
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
    console.log('🎯 VERIFYING USER-DEFINED COLOR CODING & THERMODYNAMICS 1 LOCKED AUDIT');
    console.log('   🔴 Red: Not Started | 🟡 Yellow: In Progress | 🔵 Blue: Submitted | 🟢 Green: Finished');
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

    // Test 1: Verify Renamed Strip Header & Color Scheme Legend
    console.log('\n[Test 1] Verifying Renamed Strip Header: מעקב הגשת שיעורי בית & Color Legend...');
    const headerRes = await cdp.eval(`
        (() => {
            const tabBtn = document.getElementById('tab-tasks');
            if (tabBtn) tabBtn.click();
            if (typeof renderNotionTasksTable === 'function') renderNotionTasksTable();
            if (typeof renderNotionHomeworkPolicyStrip === 'function') renderNotionHomeworkPolicyStrip();

            const strip = document.getElementById('notion-hw-policy-strip');
            const titleEl = strip ? strip.querySelector('.hw-strip-title') : null;
            const text = titleEl ? titleEl.innerText : '';
            const hint = strip ? strip.querySelector('.hw-strip-hint').innerText : '';
            return {
                hasStrip: !!strip,
                titleText: text,
                isRenamed: text.includes('מעקב הגשת שיעורי בית'),
                hintText: hint
            };
        })()
    `);
    console.log('   Header Audit:', headerRes);
    assert(headerRes.isRenamed, 'Strip header must be renamed to "מעקב הגשת שיעורי בית"');
    console.log('✓ PASS: Header title properly reflects "מעקב הגשת שיעורי בית"!');

    // Test 2: In-Progress State (Yellow / צהוב)
    console.log('\n[Test 2] Setting Sheet 1 to "in_progress" & Verifying Yellow Color & Badge...');
    const inProgRes = await cdp.eval(`
        (() => {
            if (typeof openCourseHomeworkDetail === 'function') {
                openCourseHomeworkDetail('034053');
            }

            window.setHomeworkComponentLifecycle('034053', 1, 'digital', 'in_progress');

            const hwStatus = window.getCourseHomeworkStatus('034053');
            const s1 = hwStatus.sheets[0];

            const hwSection = document.getElementById('modal-hw-policy-section');
            const sheet1Card = hwSection ? hwSection.querySelector('.hw-sheet-card') : null;
            const cardClass = sheet1Card ? sheet1Card.className : '';
            const statusBadge = sheet1Card ? sheet1Card.querySelector('.hw-sheet-status-badge') : null;

            const strip = document.getElementById('notion-hw-policy-strip');
            const inProgDots = strip ? strip.querySelectorAll('.hw-dot.in_progress') : [];
            const dotComputed = inProgDots[0] ? window.getComputedStyle(inProgDots[0]).backgroundColor : '';

            return {
                s1Status: s1.status,
                inProgressCount: hwStatus.inProgressCount,
                cardHasInProgClass: cardClass.includes('is-in-progress'),
                badgeText: statusBadge ? statusBadge.innerText : '',
                inProgDotsCount: inProgDots.length,
                dotColor: dotComputed
            };
        })()
    `);
    console.log('   In Progress (Yellow) Audit:', inProgRes);
    assert.strictEqual(inProgRes.s1Status, 'in_progress', 'Sheet 1 status must be "in_progress"');
    assert(inProgRes.cardHasInProgClass, 'Sheet 1 card must have .is-in-progress CSS class');
    assert(inProgRes.badgeText.includes('בתהליך'), 'Badge text must show "בתהליך"');
    assert(inProgRes.inProgDotsCount >= 1, 'Should have at least 1 .hw-dot.in_progress in macro strip');
    console.log('✓ PASS: "In Progress" homework task verified with YELLOW styling & badge!');

    // Capture screenshot of In Progress State
    const inProgScr = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'qa_hw_in_progress_state_verified.png'), Buffer.from(inProgScr.data, 'base64'));
    console.log('📸 In Progress State Screenshot saved: qa_hw_in_progress_state_verified.png');

    // Test 3: Open / Not Started State (Red / אדום)
    console.log('\n[Test 3] Setting Sheet 1 to "open" (Not started yet) & Verifying Red Color & Badge...');
    const openRes = await cdp.eval(`
        (() => {
            window.setHomeworkComponentLifecycle('034053', 1, 'digital', 'open');

            const hwStatus = window.getCourseHomeworkStatus('034053');
            const s1 = hwStatus.sheets[0];

            const hwSection = document.getElementById('modal-hw-policy-section');
            const sheet1Card = hwSection ? hwSection.querySelector('.hw-sheet-card') : null;
            const cardClass = sheet1Card ? sheet1Card.className : '';
            const statusBadge = sheet1Card ? sheet1Card.querySelector('.hw-sheet-status-badge') : null;

            const strip = document.getElementById('notion-hw-policy-strip');
            const openDots = strip ? strip.querySelectorAll('.hw-dot.open') : [];
            const dotComputed = openDots[0] ? window.getComputedStyle(openDots[0]).backgroundColor : '';

            return {
                s1Status: s1.status,
                openCount: hwStatus.openCount,
                cardHasOpenClass: cardClass.includes('is-open'),
                badgeText: statusBadge ? statusBadge.innerText : '',
                openDotsCount: openDots.length,
                dotColor: dotComputed
            };
        })()
    `);
    console.log('   Open (Red) State Audit:', openRes);
    assert.strictEqual(openRes.s1Status, 'open', 'Sheet 1 status must be "open"');
    assert(openRes.cardHasOpenClass, 'Sheet 1 card must have .is-open CSS class');
    assert(openRes.badgeText.includes('לא התחיל'), 'Badge text must show "לא התחיל"');
    assert(openRes.openDotsCount >= 1, 'Should have at least 1 .hw-dot.open in macro strip');
    console.log('✓ PASS: "Not Started" homework task verified with RED styling & badge!');

    // Test 4: Thermodynamics 1 (034035) Audit - Verify 0 open tasks & 10 locked sheets
    console.log('\n[Test 4] Verifying Thermodynamics 1 (034035): No homework open yet, all 10 sheets locked...');
    const thermoRes = await cdp.eval(`
        (() => {
            const c = (window.gameState && window.gameState.courses) ? (window.gameState.courses['034035'] || window.gameState.courses['34035']) : null;
            const hwStatus = window.getCourseHomeworkStatus('034035');
            const strip = document.getElementById('notion-hw-policy-strip');
            const capsules = strip ? strip.querySelectorAll('.course-hw-capsule') : [];
            const thermoCapsule = Array.from(capsules).find(c => c.textContent.includes('תרמודינמיקה 1') || c.textContent.includes('034035'));

            // Open Thermo Modal
            if (typeof openCourseHomeworkDetail === 'function') {
                openCourseHomeworkDetail('034035');
            }
            const hwSection = document.getElementById('modal-hw-policy-section');
            const cards = hwSection ? hwSection.querySelectorAll('.hw-sheet-card') : [];
            const allLockedCards = Array.from(cards).every(c => c.classList.contains('is-locked'));

            return {
                exists: !!hwStatus,
                courseTasks: c ? c.tasks : [],
                s1: hwStatus ? hwStatus.sheets[0] : null,
                totalSheets: hwStatus ? hwStatus.totalSheets : 0,
                openCount: hwStatus ? hwStatus.openCount : -1,
                inProgressCount: hwStatus ? hwStatus.inProgressCount : -1,
                completedCount: hwStatus ? hwStatus.completedCount : -1,
                lockedCount: hwStatus ? hwStatus.lockedCount : -1,
                capsuleText: thermoCapsule ? thermoCapsule.innerText : '',
                allCardsLocked: allLockedCards,
                cardsCount: cards.length
            };
        })()
    `);
    console.log('   Thermodynamics 1 Audit:', thermoRes);
    assert(thermoRes.exists, 'Thermo 1 status must exist');
    assert.strictEqual(thermoRes.totalSheets, 10, 'Thermo 1 must have 10 total sheets');
    assert.strictEqual(thermoRes.openCount, 0, 'Thermo 1 must have 0 open sheets since faculty has not published homework yet');
    assert.strictEqual(thermoRes.lockedCount, 10, 'All 10 Thermo sheets must be locked');
    assert(thermoRes.capsuleText.includes('טרם נפתחו תרגילים'), 'Capsule metadata must state "טרם נפתחו תרגילים"');
    assert(thermoRes.allCardsLocked, 'All cards in modal must have .is-locked class');
    console.log('✓ PASS: Thermodynamics 1 properly confirmed as having NO open homework sheets yet!');

    // Capture screenshot of Thermo 1 Modal
    const thermoScr = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'qa_hw_thermo_locked_verified.png'), Buffer.from(thermoScr.data, 'base64'));
    console.log('📸 Thermo 1 Locked State Screenshot saved: qa_hw_thermo_locked_verified.png');

    // Teardown
    chrome.kill();
    if (serverProcess) serverProcess.kill();
    console.log('\n========================================================================');
    console.log('🎉 ALL COLOR CODING & THERMO AUDIT TESTS PASSED 100%!');
    console.log('========================================================================\n');
}

runTest().catch(err => {
    console.error('\n❌ TEST SUITE FAILED:', err);
    process.exit(1);
});
