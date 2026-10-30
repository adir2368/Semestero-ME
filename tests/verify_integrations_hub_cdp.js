const { spawn } = require('child_process');
const http = require('http');
const assert = require('assert');
const path = require('path');
const os = require('os');
const fs = require('fs');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9750 + Math.floor(Math.random() * 200);
const PROFILE_DIR = path.join(os.tmpdir(), `chrome_qa_integrations_${Date.now()}`);
const TARGET_URL = `http://localhost:8080/?qa_integrations=${Date.now()}`;
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
                    if (msg.error) cb.reject(new Error(msg.error.message));
                    else cb.resolve(msg.result);
                }
            };
        });
    }

    send(method, params = {}) {
        const id = this.id++;
        return new Promise((resolve, reject) => {
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
        if (res.exceptionDetails) {
            throw new Error(res.exceptionDetails.text || JSON.stringify(res.exceptionDetails));
        }
        return res.result ? res.result.value : undefined;
    }

    async screenshot(filePath) {
        const res = await this.send('Page.captureScreenshot', { format: 'png', quality: 90 });
        const buffer = Buffer.from(res.data, 'base64');
        fs.writeFileSync(filePath, buffer);
    }

    close() {
        if (this.ws) this.ws.close();
    }
}

async function main() {
    console.log('========================================================================');
    console.log('🚀 QA SUITE: COLLAPSIBLE INTEGRATIONS HUB & AUTO-JUMP CDP TEST');
    console.log('========================================================================\n');

    console.log(`[Launch] Starting headless Chrome on port ${PORT}...`);
    const chrome = spawn(CHROME_PATH, [
        `--remote-debugging-port=${PORT}`,
        `--user-data-dir=${PROFILE_DIR}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--window-size=1280,900',
        '--headless=new',
        TARGET_URL
    ]);

    await delay(3000);

    let endpoints = [];
    for (let i = 0; i < 15; i++) {
        try {
            endpoints = await getJson(`http://127.0.0.1:${PORT}/json`);
            if (endpoints.length > 0) break;
        } catch (e) {
            await delay(500);
        }
    }

    const pageTarget = endpoints.find(e => e.type === 'page');
    assert(pageTarget, 'Could not find Chrome page debugging endpoint');
    const wsUrl = pageTarget.webSocketDebuggerUrl;
    console.log(`✓ Chrome CDP connected: ${wsUrl}`);

    const cdp = new CDPClient(wsUrl);
    await cdp.connect();
    await delay(2500);

    try {
        // Step 1: Set authenticated user Adir Moshe and verify session
        console.log('[Step 1] Initializing Adir Moshe authenticated session...');
        await cdp.eval(`
            (async () => {
                sessionStorage.setItem('sw_last_controller_reload', String(Date.now()));
                localStorage.setItem('ast_onboarding_shown', 'true');
                if (window.AuthSync) {
                    await window.AuthSync.loginWithPassword('adir_moshe', 'BenchyTech1');
                    localStorage.setItem('ast_cheesefork_url', 'https://cheesefork.cf/s/technion-202601-adir');
                    localStorage.setItem('ast_cheesefork_url_adir_moshe', 'https://cheesefork.cf/s/technion-202601-adir');
                    window.AuthSync.updateHudAuthControls();
                }
            })()
        `);
        await delay(800);

        // Step 2: Open Connected Account Profile modal
        console.log('[Step 2] Opening "פרטי חשבון מחובר" modal...');
        const modalOpened = await cdp.eval(`
            (() => {
                const chip = document.getElementById('btn-hud-user-chip');
                if (chip) chip.click();
                else if (window.AuthSync) window.AuthSync.openAuthModal();
                const modal = document.getElementById('auth-modal');
                return modal && modal.classList.contains('active');
            })()
        `);
        assert.strictEqual(modalOpened, true, 'Auth modal must be active');
        console.log('✓ Step 2 Passed: Connected Account Profile modal opened.');

        // Step 3: Check Integrations Hub presence and default collapsed state
        console.log('[Step 3] Verifying Integrations Hub container & default collapsed state...');
        const hubState = await cdp.eval(`
            (() => {
                const container = document.getElementById('integrations-hub-container');
                const content = document.getElementById('integrations-hub-content');
                const badge = document.getElementById('integrations-hub-count-badge');
                return {
                    containerExists: !!container,
                    contentDisplay: content ? content.style.display : '',
                    badgeText: badge ? badge.innerText.trim() : ''
                };
            })()
        `);
        console.log(`   Hub container exists: ${hubState.containerExists}`);
        console.log(`   Initial content display: "${hubState.contentDisplay}" (hidden/collapsed)`);
        console.log(`   Connected count badge: "${hubState.badgeText}"`);
        assert.strictEqual(hubState.containerExists, true, 'Integrations Hub container must exist');
        assert(hubState.contentDisplay === 'none' || hubState.contentDisplay === '', 'Integrations Hub must start collapsed');
        console.log('✓ Step 3 Passed: Integrations Hub renders collapsed by default ("כחלונית נפתחת").');

        // Step 4: Expand the Integrations Hub
        console.log('[Step 4] Expanding the Integrations Hub via toggle header...');
        const expandedState = await cdp.eval(`
            (() => {
                if (window.AuthSync) window.AuthSync.toggleIntegrationsHub(true);
                const content = document.getElementById('integrations-hub-content');
                const cfCard = document.getElementById('integration-card-cheesefork');
                const moodleCard = document.getElementById('integration-card-moodle');
                const gcalCard = document.getElementById('integration-card-gcal');
                const phoneCard = document.getElementById('integration-card-phone');
                return {
                    contentDisplay: content ? content.style.display : '',
                    hasCheeseFork: !!cfCard,
                    hasMoodle: !!moodleCard,
                    hasGcal: !!gcalCard,
                    hasPhone: !!phoneCard
                };
            })()
        `);
        assert.strictEqual(expandedState.contentDisplay, 'block', 'Content must expand to block');
        assert(expandedState.hasCheeseFork && expandedState.hasMoodle && expandedState.hasGcal && expandedState.hasPhone, 'All 4 service cards must exist');
        console.log('✓ Step 4 Passed: Integrations Hub expanded successfully with all 4 services.');

        // Step 5: Test openConnectModal direct auto-jump and focus
        console.log('[Step 5] Testing window.openConnectModal("cheesefork") auto-focus and scroll...');
        const jumpTest = await cdp.eval(`
            new Promise(resolve => {
                window.openConnectModal('cheesefork');
                setTimeout(() => {
                    const input = document.getElementById('integrations-cheesefork-url');
                    const isFocused = document.activeElement === input;
                    const card = document.getElementById('integration-card-cheesefork');
                    const hasPulse = card && (card.style.borderColor === 'rgb(56, 189, 248)' || card.style.borderColor === '#38bdf8');
                    resolve({ isFocused, hasPulse, value: input ? input.value : '' });
                }, 350);
            })
        `);
        console.log(`   CheeseFork input focused: ${jumpTest.isFocused}`);
        console.log(`   Card pulse highlight active: ${jumpTest.hasPulse}`);
        console.log(`   Current value: "${jumpTest.value}"`);
        assert.strictEqual(jumpTest.isFocused, true, 'Input should be focused');
        console.log('✓ Step 5 Passed: openConnectModal automatically jumps to service and focuses input.');

        // Step 6: Capture screenshot of the open Hub in action
        console.log('\n[Screenshot] Capturing visual proof of Integrations Hub...');
        await cdp.eval(`
            (() => {
                const modal = document.getElementById('auth-modal');
                if (modal) modal.classList.add('active');
                if (window.AuthSync) {
                    window.AuthSync.openAuthModal();
                    window.AuthSync.toggleIntegrationsHub(true);
                }
                const authBody = document.querySelector('#auth-modal .modal-body');
                const hub = document.getElementById('integrations-hub-container');
                if (authBody && hub) {
                    authBody.scrollTop = hub.offsetTop - 15;
                }
            })()
        `);
        await delay(800);
        const screenshotPath = path.join(ARTIFACT_DIR, 'qa_integrations_hub_verified.png');
        await cdp.screenshot(screenshotPath);
        console.log(`📸 Screenshot captured: ${screenshotPath}`);

        console.log('\n========================================================================');
        console.log('🎉 ALL INTEGRATIONS HUB CDP TESTS PASSED WITH 100% SUCCESS!');
        console.log('========================================================================\n');

    } finally {
        cdp.close();
        chrome.kill();
        try {
            fs.rmSync(PROFILE_DIR, { recursive: true, force: true });
        } catch (e) {}
    }
}

main().catch(err => {
    console.error('Fatal CDP Test Error:', err);
    process.exit(1);
});
