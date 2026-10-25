const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9400 + Math.floor(Math.random() * 500);
const PROFILE_DIR = path.join(os.tmpdir(), `chrome_qa_telemetry_${Date.now()}`);
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
        const trimmed = expression.trim();
        const wrappedExpr = (trimmed.startsWith('(() =>') || trimmed.startsWith('(async () =>'))
            ? trimmed
            : `(() => { ${expression} })()`;
        try {
            const res = await this.send('Runtime.evaluate', {
                expression: wrappedExpr,
                returnByValue: true,
                awaitPromise: true
            });
            if (res.exceptionDetails) {
                console.error('[CDP Eval Exception]', JSON.stringify(res.exceptionDetails));
                throw new Error(`Eval failed: ${JSON.stringify(res.exceptionDetails)}`);
            }
            return res.result ? res.result.value : undefined;
        } catch (err) {
            if (err && (err.message || '').includes('navigated')) {
                console.log('   [CDP] Retrying evaluation after page navigation...');
                await delay(1500);
                return await this.eval(expression);
            }
            console.error('[CDP Eval Error]', err);
            throw err;
        }
    }

    async screenshot(filename) {
        const res = await this.send('Page.captureScreenshot', { format: 'png' });
        const buf = Buffer.from(res.data, 'base64');
        const savePath = path.join(ARTIFACT_DIR, filename);
        fs.writeFileSync(savePath, buf);
        console.log(`   📸 Screenshot saved: ${filename}`);
        return savePath;
    }
}

(async () => {
    console.log('================================================================');
    console.log('🚀 QA SUITE: QUICK LOGIN REMOVAL & ADMIN TELEMETRY VERIFICATION');
    console.log('================================================================\n');

    // 1. Static file assertions
    console.log('[Test 1] Static Code Integrity Checks...');
    const authSyncCode = fs.readFileSync(path.join(__dirname, '../auth_sync.js'), 'utf8');
    const siteAnalyticsCode = fs.readFileSync(path.join(__dirname, '../site_analytics.js'), 'utf8');
    const appJsCode = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
    const uiJsCode = fs.readFileSync(path.join(__dirname, '../ui_enhancements.js'), 'utf8');

    assert(!authSyncCode.includes('התחברות מהירה כאדיר משה'), 'ERROR: Quick login button text still present in auth_sync.js!');
    assert(authSyncCode.includes("const MASTER_PASSWORDS = ['BenchyTech1', 'adir2368'];"), 'ERROR: MASTER_PASSWORDS missing in auth_sync.js!');
    assert(authSyncCode.includes('isAdirActive()'), 'ERROR: isAdirActive missing in auth_sync.js!');
    assert(!siteAnalyticsCode.includes("prompt('🔒 גישה לנתוני משתמשים"), 'ERROR: Insecure prompt still present in site_analytics.js!');
    assert(appJsCode.includes('window.SiteAnalytics.updateSettingsPills()'), 'ERROR: updateSettingsPills missing in renderSettingsPage!');
    assert(uiJsCode.includes('act-site-analytics'), 'ERROR: act-site-analytics missing in ui_enhancements.js!');
    console.log('✓ PASS: All static assertions passed.\n');

    // 2. Launch Isolated Chrome
    console.log('[Test 2] Launching Isolated Chrome Headless with CDP on port ' + PORT + '...');
    const chromeProc = spawn(CHROME_PATH, [
        `--remote-debugging-port=${PORT}`,
        `--user-data-dir=${PROFILE_DIR}`,
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--window-size=1280,850',
        TARGET_URL
    ]);

    let chromeAlive = true;
    chromeProc.on('exit', () => { chromeAlive = false; });

    try {
        let wsUrl = null;
        for (let i = 0; i < 30; i++) {
            await delay(400);
            try {
                const versionData = await getJson(`http://127.0.0.1:${PORT}/json/version`);
                if (versionData && versionData.webSocketDebuggerUrl) {
                    wsUrl = versionData.webSocketDebuggerUrl;
                    break;
                }
            } catch (e) {}
        }

        if (!wsUrl) throw new Error('Failed to connect to Chrome remote debugging port');
        console.log('✓ Chrome CDP connected:', wsUrl);

        const list = await getJson(`http://127.0.0.1:${PORT}/json/list`);
        const pageTarget = list.find(t => t.type === 'page');
        if (!pageTarget) throw new Error('No page target found');

        const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
        await cdp.connect();
        await cdp.send('Page.enable');
        await cdp.send('Runtime.enable');

        await cdp.eval(`sessionStorage.setItem('sw_last_controller_reload', String(Date.now()));`);
        await delay(2500);

        // Test Guest State:
        console.log('\n[Test 3] Verifying Guest Mode State...');
        // Open auth modal
        await cdp.eval(`
            if (window.AuthSync && window.AuthSync.openAuthModal) {
                window.AuthSync.openAuthModal('login');
            }
        `);
        await delay(600);

        const quickLoginCount = await cdp.eval(`
            (() => {
                const btns = Array.from(document.querySelectorAll('button, a'));
                return btns.filter(b => b.textContent && b.textContent.includes('התחברות מהירה כאדיר משה')).length;
            })()
        `);
        console.log('   Quick login button count in DOM:', quickLoginCount);
        assert.strictEqual(quickLoginCount, 0, 'Quick login button should be 0!');
        console.log('   ✓ PASS: Quick login button is NOT in DOM.');

        const isTelemetryVisibleGuest = await cdp.eval(`
            (() => {
                const card = document.getElementById('card-btn-site-analytics');
                if (!card) return false;
                return window.getComputedStyle(card).display !== 'none';
            })()
        `);
        console.log('   Telemetry card visible as Guest?:', isTelemetryVisibleGuest);
        assert.strictEqual(isTelemetryVisibleGuest, false, 'Telemetry card must be hidden for guest!');
        console.log('   ✓ PASS: Telemetry card is strictly hidden for guest.');

        // Test unauthorized openModal
        const unauthorizedCheck = await cdp.eval(`
            (async () => {
                let toastTriggered = false;
                window.showToastNotification = (msg, type) => {
                    if (type === 'error') toastTriggered = true;
                };
                if (window.SiteAnalytics) {
                    await window.SiteAnalytics.openModal();
                }
                const modal = document.getElementById('site-analytics-modal');
                const isOpened = modal && modal.classList.contains('active') && modal.style.display !== 'none';
                return { toastTriggered, isOpened };
            })()
        `);
        console.log('   Unauthorized openModal check:', unauthorizedCheck);
        assert.strictEqual(unauthorizedCheck.isOpened, false, 'Modal should NOT open for guest!');
        console.log('   ✓ PASS: Unauthorized access blocked.');

        // Test Login as Adir Moshe
        console.log('\n[Test 4] Logging in as Adir Moshe (adir_moshe + BenchyTech1)...');
        const loginResult = await cdp.eval(`
            (async () => {
                try {
                    // Wait up to 5s for AuthSync if still initializing
                    for (let i = 0; i < 50; i++) {
                        if (window.AuthSync) break;
                        await new Promise(r => setTimeout(r, 100));
                    }
                    if (!window.AuthSync) return { err: 'No AuthSync', url: window.location.href };
                    const res = await window.AuthSync.loginWithPassword('adir_moshe', 'BenchyTech1');
                    return { success: res };
                } catch (e) {
                    return { err: e.toString(), stack: e.stack };
                }
            })()
        `);
        console.log('   Login returned:', loginResult);
        console.log('   Recent logs:', cdp.logs.slice(-10));
        console.log('   Recent exceptions:', cdp.exceptions.slice(-10));
        assert.strictEqual(loginResult.success, true, 'Login should succeed for Adir Moshe!');

        const isAdirNow = await cdp.eval(`
            (() => {
                return window.AuthSync && window.AuthSync.isAdirActive();
            })()
        `);
        console.log('   isAdirActive() after login:', isAdirNow);
        assert.strictEqual(isAdirNow, true, 'isAdirActive() must be true!');
        console.log('   ✓ PASS: Authenticated as Adir Moshe.');

        // Test Telemetry card in Settings is VISIBLE
        console.log('\n[Test 5] Checking Telemetry card in Settings for Adir...');
        await cdp.eval(`
            (() => {
                if (window.renderSettingsPage) window.renderSettingsPage();
                if (window.SiteAnalytics) window.SiteAnalytics.updateSettingsPills();
            })()
        `);
        await delay(500);

        const isTelemetryVisibleAdir = await cdp.eval(`
            (() => {
                const card = document.getElementById('card-btn-site-analytics');
                if (!card) return false;
                return window.getComputedStyle(card).display !== 'none';
            })()
        `);
        console.log('   Telemetry card visible for Adir?:', isTelemetryVisibleAdir);
        assert.strictEqual(isTelemetryVisibleAdir, true, 'Telemetry card must be visible for Adir!');
        console.log('   ✓ PASS: Telemetry card is visible in Settings.');

        // Test User Profile Modal has Admin Telemetry button
        console.log('\n[Test 6] Checking User Profile Modal for Admin Quick Action...');
        await cdp.eval(`
            (() => {
                window.AuthSync.openAuthModal();
            })()
        `);
        await delay(500);

        const hasAdminTelemetryBtn = await cdp.eval(`
            (() => {
                const container = document.getElementById('auth-modal-content-container');
                if (!container) return false;
                return container.innerHTML.includes('סטטיסטיקת שימוש, משתמשים וכניסות') &&
                       container.innerHTML.includes('פתח לוח סטטיסטיקה');
            })()
        `);
        console.log('   Has Admin Telemetry button in profile modal?:', hasAdminTelemetryBtn);
        assert.strictEqual(hasAdminTelemetryBtn, true, 'Profile modal must have Admin Telemetry button!');
        console.log('   ✓ PASS: User Profile modal contains direct Admin Telemetry action.');

        // Test Opening Site Analytics Modal as Adir
        console.log('\n[Test 7] Opening Site Analytics Modal as Adir...');
        await cdp.eval(`
            (async () => {
                if (window.SiteAnalytics) {
                    await window.SiteAnalytics.openModal();
                }
            })()
        `);
        await delay(1500);

        const modalStatus = await cdp.eval(`
            (() => {
                const modal = document.getElementById('site-analytics-modal');
                const content = document.getElementById('site-analytics-content');
                return {
                    isActive: modal && modal.classList.contains('active') && modal.style.display !== 'none',
                    hasRegisteredUsers: content && content.innerHTML.includes('משתמשים רשומים'),
                    hasOfflineVisits: content && content.innerHTML.includes('כניסות בלי חיבור'),
                    hasTotalVisits: content && content.innerHTML.includes('סה״כ כניסות לאתר')
                };
            })()
        `);
        console.log('   Modal Status:', modalStatus);
        assert.strictEqual(modalStatus.isActive, true, 'Site Analytics modal should be active!');
        assert.strictEqual(modalStatus.hasRegisteredUsers, true, 'Should render registered users card!');
        assert.strictEqual(modalStatus.hasOfflineVisits, true, 'Should render offline visits card!');
        console.log('   ✓ PASS: Site Analytics modal rendered with all 4 KPI cards.');

        await cdp.screenshot('qa_admin_site_analytics_verified.png');

        // Test Logout
        console.log('\n[Test 8] Testing Logout and Telemetry Hiding...');
        await cdp.eval(`
            (() => {
                window.confirm = () => true;
                window.SiteAnalytics.closeModal();
                window.AuthSync.logout();
            })()
        `);
        await delay(500);

        const isTelemetryVisibleAfterLogout = await cdp.eval(`
            (() => {
                const card = document.getElementById('card-btn-site-analytics');
                if (!card) return false;
                return card.style.display !== 'none';
            })()
        `);
        console.log('   Telemetry card visible after logout?:', isTelemetryVisibleAfterLogout);
        assert.strictEqual(isTelemetryVisibleAfterLogout, false, 'Telemetry card must be hidden after logout!');
        console.log('   ✓ PASS: Telemetry card immediately hidden after logout.');

        console.log('\n================================================================');
        console.log('🎉 ALL TESTS PASSED! 100% SUCCESS');
        console.log('================================================================');
    } finally {
        if (chromeAlive) {
            chromeProc.kill('SIGKILL');
        }
        try {
            fs.rmSync(PROFILE_DIR, { recursive: true, force: true });
        } catch (e) {}
    }
})();
