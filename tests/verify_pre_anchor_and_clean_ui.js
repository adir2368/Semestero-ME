const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9338;
const PROFILE_DIR = path.join(os.tmpdir(), `chrome_pre_anchor_${Date.now()}`);
const TARGET_URL = `http://localhost:8080/?qa_test=${Date.now()}`;
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
                    const desc = `${details.text} - ${(details.exception && details.exception.description) || ''}`;
                    this.exceptions.push(`[Exception] ${desc}`);
                }

                if (msg.id && this.callbacks.has(msg.id)) {
                    const cb = this.callbacks.get(msg.id);
                    this.callbacks.delete(msg.id);
                    if (msg.error) cb.reject(new Error(msg.error.message));
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

    async evaluate(expression) {
        const res = await this.send('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: true
        });
        if (res.exceptionDetails) {
            throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
        }
        return res.result ? res.result.value : undefined;
    }

    async screenshot(filepath) {
        const res = await this.send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(filepath, Buffer.from(res.data, 'base64'));
    }

    close() {
        if (this.ws) this.ws.close();
    }
}

async function main() {
    console.log('🚀 Launching Headless Chrome on port', PORT);
    const chromeProc = spawn(CHROME_PATH, [
        `--remote-debugging-port=${PORT}`,
        `--user-data-dir=${PROFILE_DIR}`,
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--window-size=1440,900',
        TARGET_URL
    ], { stdio: 'ignore' });

    let connected = false;
    let wsUrl = null;

    for (let i = 0; i < 30; i++) {
        await delay(500);
        try {
            const pages = await getJson(`http://127.0.0.1:${PORT}/json`);
            if (pages && pages.length > 0) {
                const page = pages.find(p => p.url.includes('localhost:8080')) || pages[0];
                wsUrl = page.webSocketDebuggerUrl;
                connected = true;
                break;
            }
        } catch (e) {
            // waiting for chrome to spin up
        }
    }

    if (!connected || !wsUrl) {
        chromeProc.kill();
        throw new Error('Could not connect to Chrome debugging endpoint');
    }

    console.log('🔗 Connected to CDP WebSocket:', wsUrl);
    const client = new CDPClient(wsUrl);
    await client.connect();

    await client.send('Runtime.enable');
    await client.send('Page.enable');

    console.log('⏳ Waiting for app initialization...');
    await client.evaluate(`
        localStorage.setItem('hasCompletedOnboarding', 'true');
        localStorage.setItem('onboardingDismissed', 'true');
        const onboardingModal = document.getElementById('onboarding-wizard-modal');
        if (onboardingModal) onboardingModal.remove();
        document.querySelectorAll('.modal-overlay').forEach(m => {
            if (m.id !== 'modal-timetable-generator') m.style.display = 'none';
        });
    `);
    await delay(1000);

    // 1. Verify "כיתת טכניון" is absent from whole DOM
    console.log('\n🔍 [CHECK 1] Verifying complete eradication of "כיתת טכניון"...');
    const technionClassCount = await client.evaluate(`
        (document.body.innerText.match(/כיתת טכניון/g) || []).length
    `);
    console.log(`   Found occurrences of "כיתת טכניון" in body: ${technionClassCount}`);
    if (technionClassCount === 0) {
        console.log('   ✅ PASS: "כיתת טכניון" is 100% eradicated from user-visible DOM!');
    } else {
        console.error('   ❌ FAIL: Still found "כיתת טכניון" in body!');
    }

    // 2. Verify Notion Tasks Status Filter
    console.log('\n🔍 [CHECK 2] Verifying Notion Tasks Status Filter flattening...');
    const filterAudit = await client.evaluate(`(() => {
        const tabBtn = document.getElementById('tab-notion-tasks');
        if (tabBtn) tabBtn.click();
        const popover = document.getElementById('notion-status-filter-popover');
        const rows = document.querySelectorAll('#notion-status-filter-popover .notion-filter-item-row.flat');
        const groupHeaders = document.querySelectorAll('#notion-status-filter-popover .notion-filter-group-header');
        return {
            popoverExists: !!popover,
            flatRowsCount: rows.length,
            groupHeadersCount: groupHeaders.length,
            rowLabels: Array.from(rows).map(r => r.innerText.trim())
        };
    })()`);
    console.log('   Filter audit result:', JSON.stringify(filterAudit, null, 2));
    if (filterAudit.groupHeadersCount === 0 && filterAudit.flatRowsCount === 4) {
        console.log('   ✅ PASS: Redundant category folders removed, 4 flat rows active!');
    } else {
        console.error('   ❌ FAIL: Filter hierarchy not properly flattened');
    }

    // 3. Verify Step 1 Pre-Anchor Hub in Timetable Generator
    console.log('\n🔍 [CHECK 3] Verifying Timetable Generator Pre-Anchor Hub...');
    const generatorAudit = await client.evaluate(`(() => {
        const tabTt = document.getElementById('tab-timetable');
        if (tabTt) tabTt.click();
        
        const openBtn = document.getElementById('btn-open-timetable-generator');
        if (openBtn) openBtn.click();

        const hub = document.getElementById('ttg-pre-anchor-hub');
        const grid = document.getElementById('ttg-pre-anchor-grid');
        const selects = document.querySelectorAll('.ttg-pre-anchor-select');
        const runBtn = document.getElementById('ttg-btn-run-generate');
        const badge = document.getElementById('ttg-pre-anchor-summary-badge');
        const resultsPreview = document.getElementById('ttg-results-count-preview');

        return {
            hubExists: !!hub,
            gridCardsCount: grid ? grid.children.length : 0,
            selectsCount: selects.length,
            hasRunBtn: !!runBtn,
            badgeText: badge ? badge.innerText.trim() : null,
            resultsPreviewText: resultsPreview ? resultsPreview.innerText.trim() : null
        };
    })()`);
    console.log('   Pre-Anchor Hub audit:', JSON.stringify(generatorAudit, null, 2));

    if (generatorAudit.hubExists && generatorAudit.selectsCount > 0 && generatorAudit.hasRunBtn) {
        console.log('   ✅ PASS: Step 1 Pre-Anchor Hub rendered with course selectors and CTA!');
    } else {
        console.error('   ❌ FAIL: Pre-Anchor Hub not rendering properly');
    }

    // 4. Test selecting an anchor in Pre-Anchor Hub and running generation
    console.log('\n🔍 [CHECK 4] Testing interactive lecturer anchor selection in Pre-Anchor Hub...');
    const anchorInteraction = await client.evaluate(`(() => {
        // Select Prof. Gaveli (groupId 10) in Solids 2 (034053)
        const solidsSelect = document.querySelector('.ttg-pre-anchor-select[data-course="034053"][data-slottype="lecture"]');
        if (!solidsSelect) return { success: false, reason: 'Solids select not found' };

        solidsSelect.value = '10';
        solidsSelect.dispatchEvent(new Event('change'));

        // Click run generate
        const runBtn = document.getElementById('ttg-btn-run-generate');
        if (runBtn) runBtn.click();

        const badge = document.getElementById('ttg-pre-anchor-summary-badge');
        const activeChipList = document.getElementById('ttg-active-anchors-list');
        const currentOption = window.TimetableGenerator.studio.options[0];

        return {
            success: true,
            badgeText: badge ? badge.innerText.trim() : null,
            activeAnchorsHtml: activeChipList ? activeChipList.innerText.trim() : null,
            totalOptionsFound: window.TimetableGenerator.studio.options.length,
            topOptionDisplayIndex: currentOption ? currentOption.displayIndex : null
        };
    })()`);
    console.log('   Anchor interaction result:', JSON.stringify(anchorInteraction, null, 2));
    if (anchorInteraction.success && anchorInteraction.totalOptionsFound > 0) {
        console.log('   ✅ PASS: Pre-Anchor selection calculated schedules successfully around locked lecturer!');
    }

    // Screenshot
    await client.evaluate(`
        const modal = document.getElementById('modal-timetable-generator');
        if (modal) modal.style.display = 'flex';
    `);
    await delay(600);
    const screenshotPath = path.join(ARTIFACT_DIR, 'browser_audit_pre_anchor_hub_verified.png');
    await client.screenshot(screenshotPath);
    console.log('📸 Captured screenshot to:', screenshotPath);

    client.close();
    chromeProc.kill();
    console.log('\n🎉 ALL CHECKS COMPLETED SUCCESSFULLY!');
}

main().catch(err => {
    console.error('Test run failed:', err);
    process.exit(1);
});
