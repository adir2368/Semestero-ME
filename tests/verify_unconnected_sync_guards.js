const { spawn } = require('child_process');
const http = require('http');
const assert = require('assert');
const path = require('path');
const os = require('os');
const fs = require('fs');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9600 + Math.floor(Math.random() * 300);
const PROFILE_DIR = path.join(os.tmpdir(), `chrome_qa_guards_${Date.now()}`);
const TARGET_URL = `http://localhost:8080/?qa_guards=${Date.now()}`;
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

    async eval(expression) {
        const res = await this.send('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: true
        });
        if (res.exceptionDetails) {
            throw new Error(`Eval failed: ${JSON.stringify(res.exceptionDetails)}`);
        }
        return res.result ? res.result.value : undefined;
    }

    async captureScreenshot(filepath) {
        const res = await this.send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(filepath, Buffer.from(res.data, 'base64'));
        console.log(`📸 Screenshot captured: ${filepath}`);
    }

    close() {
        if (this.ws) this.ws.close();
    }
}

async function run() {
    console.log('================================================================');
    console.log('🛡️ QA SUITE: UNCONNECTED SYNC GUARDS & TRUTHFUL STATUS INDICATORS');
    console.log('================================================================\n');

    console.log(`[Launch] Starting headless Chrome on port ${PORT}...`);
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

    try {
        // Initialize clean guest state
        console.log('[Setup] Initializing clean guest/unconnected state...');
        await cdp.eval(`
            (() => {
                sessionStorage.setItem('sw_last_controller_reload', String(Date.now()));
                localStorage.setItem('ast_onboarding_shown', 'true');
                localStorage.removeItem('ast_cheesefork_url');
                localStorage.removeItem('atlas_me_moodle_sync_default');
                localStorage.removeItem('ast_active_session_user');
                if (window.MoodleSync && window.MoodleSync.config) {
                    window.MoodleSync.config.url = '';
                }
                if (window.gameState) {
                    window.gameState.moodleCalendarUrl = '';
                    window.gameState.appsScriptWebhook = '';
                }
                const obModal = document.getElementById('onboarding-wizard-modal');
                if (obModal) obModal.classList.remove('active');
            })()
        `);
        await delay(800);

        // Test 1: Timetable header CheeseFork status
        console.log('\n[Test 1] Verifying Timetable sync status indicator when unconnected...');
        await cdp.eval(`
            (() => {
                if (window.switchTab) window.switchTab('timetable');
                else if (document.getElementById('tab-timetable')) document.getElementById('tab-timetable').click();
                if (typeof updateDailyTimetableFocus === 'function') updateDailyTimetableFocus();
            })()
        `);
        await delay(600);

        const ttSyncText = await cdp.eval(`
            (() => {
                const el = document.getElementById('timetable-sync-text');
                return el ? el.innerText.trim() : '';
            })()
        `);
        console.log(`   Timetable bar text: "${ttSyncText}"`);
        assert(ttSyncText.includes('אינו מחובר'), `Expected 'אינו מחובר', got: "${ttSyncText}"`);
        assert(!ttSyncText.includes('מתעדכן אוטומטית כל יום מ-CheeseFork'), `Should not claim automatic updates when CheeseFork is not connected!`);
        console.log('✓ Test 1 Passed: Timetable header truthfully displays CheeseFork is not connected.');

        // Test 2: Clicking CheeseFork Sync when unconnected
        console.log('\n[Test 2] Clicking #btn-sync-cheesefork-now when unconnected...');
        const cfToast = await cdp.eval(`
            new Promise(resolve => {
                let caught = null;
                const origToast = window.showToastNotification;
                window.showToastNotification = function(msg) {
                    caught = msg;
                    if (origToast) origToast.apply(this, arguments);
                };
                const btn = document.getElementById('btn-sync-cheesefork-now');
                if (btn) btn.click();
                setTimeout(() => {
                    window.showToastNotification = origToast;
                    resolve(caught);
                }, 300);
            })
        `);
        console.log(`   Toast notification: "${cfToast}"`);
        assert(cfToast && cfToast.includes('אינך מחובר ל-CheeseFork'), `Expected CheeseFork warning toast, got: "${cfToast}"`);
        console.log('✓ Test 2 Passed: Clicking CheeseFork sync explicitly notifies user they are not connected.');

        // Test 3: Notion Tasks header #btn-sync-moodle-tasks when unconnected
        console.log('\n[Test 3] Clicking #btn-sync-moodle-tasks in Tasks workspace when unconnected...');
        await cdp.eval(`
            (() => {
                if (window.switchTab) window.switchTab('tasks');
                else if (document.getElementById('tab-tasks')) document.getElementById('tab-tasks').click();
                if (typeof renderNotionTasksTable === 'function') renderNotionTasksTable();
            })()
        `);
        await delay(600);

        const moodleHeaderToast = await cdp.eval(`
            new Promise(resolve => {
                let caught = null;
                const origToast = window.showHudToast;
                window.showHudToast = function(msg) {
                    caught = msg;
                    if (origToast) origToast.apply(this, arguments);
                };
                const btn = document.getElementById('btn-sync-moodle-tasks');
                if (btn) btn.click();
                setTimeout(() => {
                    window.showHudToast = origToast;
                    const modal = document.getElementById('moodle-sync-modal');
                    const modalOpen = modal && (modal.style.display === 'flex' || modal.classList.contains('active'));
                    resolve({ toast: caught, modalOpen });
                }, 400);
            })
        `);
        console.log(`   Toast: "${moodleHeaderToast.toast}", Modal opened: ${moodleHeaderToast.modalOpen}`);
        assert(moodleHeaderToast.toast && moodleHeaderToast.toast.includes('אינך מחובר למודל'), `Expected Moodle warning toast, got: "${moodleHeaderToast.toast}"`);
        assert.strictEqual(moodleHeaderToast.modalOpen, true, 'Moodle modal should open on sync click');
        console.log('✓ Test 3 Passed: Clicking Moodle tasks sync warns user and opens configuration modal.');

        // Test 4: Moodle Modal Status and Sync Action with empty URL
        console.log('\n[Test 4] Verifying Moodle modal status and sync attempt with empty input...');
        const modalSyncTest = await cdp.eval(`
            new Promise(resolve => {
                const statusDiv = document.getElementById('modal-moodle-sync-status');
                const initialStatus = statusDiv ? statusDiv.innerText.trim() : '';

                const urlInput = document.getElementById('modal-moodle-calendar-url');
                if (urlInput) urlInput.value = '';

                const syncBtn = document.getElementById('modal-btn-moodle-sync');
                if (syncBtn) syncBtn.click();

                setTimeout(() => {
                    const updatedStatus = statusDiv ? statusDiv.innerText.trim() : '';
                    resolve({ initialStatus, updatedStatus });
                }, 400);
            })
        `);
        console.log(`   Initial status: "${modalSyncTest.initialStatus}"`);
        console.log(`   Status after sync click: "${modalSyncTest.updatedStatus}"`);
        assert(modalSyncTest.initialStatus.includes('אינו מחובר'), `Initial status should indicate unconnected, got: "${modalSyncTest.initialStatus}"`);
        assert(modalSyncTest.updatedStatus.includes('אינך מחובר למודל'), `Status after sync should warn about not connected, got: "${modalSyncTest.updatedStatus}"`);
        console.log('✓ Test 4 Passed: Moodle modal correctly warns user on empty sync and forbids mock syncing.');

        // Test 5: Calendar Sync Modal (Google Calendar Webcal)
        console.log('\n[Test 5] Checking Google Calendar Webcal Sync modal...');
        const calendarModalTest = await cdp.eval(`
            new Promise(resolve => {
                if (window.openCalendarSyncModal) window.openCalendarSyncModal();
                const badge = document.getElementById('calendar-sync-status-badge');
                const desc = document.getElementById('calendar-sync-status-desc');
                const input = document.getElementById('sync-webcal-url-input');

                let caughtToast = null;
                const origToast = window.showToastNotification;
                window.showToastNotification = function(msg) {
                    caughtToast = msg;
                    if (origToast) origToast.apply(this, arguments);
                };

                const copyBtn = document.getElementById('btn-copy-webcal-url');
                if (copyBtn) copyBtn.click();

                setTimeout(() => {
                    window.showToastNotification = origToast;
                    resolve({
                        badgeText: badge ? badge.innerText.trim() : '',
                        descText: desc ? desc.innerText.trim() : '',
                        inputValue: input ? input.value : '',
                        copyToast: caughtToast
                    });
                }, 300);
            })
        `);
        console.log(`   Modal Badge: "${calendarModalTest.badgeText}"`);
        console.log(`   Copy Toast: "${calendarModalTest.copyToast}"`);
        assert(calendarModalTest.badgeText.includes('אינו מחובר'), `Badge should not say connected! Got: "${calendarModalTest.badgeText}"`);
        assert(calendarModalTest.copyToast && calendarModalTest.copyToast.includes('אינך מחובר לסנכרון ענן'), `Copy button should warn when unconnected, got: "${calendarModalTest.copyToast}"`);
        console.log('✓ Test 5 Passed: Google Calendar modal badge is not green connected and copy warns user.');

        // Test 6: In Settings, triggerManualCalendarPull when unconnected
        console.log('\n[Test 6] Checking Google Calendar Manual Pull in Settings...');
        const gcalPullTest = await cdp.eval(`
            new Promise(resolve => {
                let caught = null;
                const origToast = window.showToastNotification;
                window.showToastNotification = function(msg) {
                    caught = msg;
                    if (origToast) origToast.apply(this, arguments);
                };

                const pullBtn = document.getElementById('btn-trigger-manual-calendar-pull');
                if (pullBtn) pullBtn.click();

                setTimeout(() => {
                    window.showToastNotification = origToast;
                    resolve(caught);
                }, 300);
            })
        `);
        console.log(`   Pull Toast: "${gcalPullTest}"`);
        assert(gcalPullTest && gcalPullTest.includes('אינך מחובר ליומני Google'), `Expected Google Calendar warning toast, got: "${gcalPullTest}"`);
        console.log('✓ Test 6 Passed: Pulling Google Calendar without Webhook/IDs warns user.');

        // Test 7: Connect Moodle with a URL and verify status switches to connected
        console.log('\n[Test 7] Connecting Moodle with valid URL and testing status update...');
        const moodleConnectTest = await cdp.eval(`
            new Promise(resolve => {
                window.MoodleSync.config.url = 'https://moodle26.technion.ac.il/calendar/export_execute.php?userid=39495&authtoken=validtesttoken&preset_what=all&preset_time=custom';
                window.MoodleSync.saveConfig();
                window.MoodleSync.openModal();
                const statusDiv = document.getElementById('modal-moodle-sync-status');
                setTimeout(() => {
                    resolve(statusDiv ? statusDiv.innerText.trim() : '');
                }, 200);
            })
        `);
        console.log(`   Moodle Status after connecting: "${moodleConnectTest}"`);
        assert(moodleConnectTest.includes('מחובר למודל הטכניון'), `Status should say 'מחובר למודל הטכניון', got: "${moodleConnectTest}"`);
        console.log('✓ Test 7 Passed: Moodle correctly indicates connected only after link is configured.');

        // Test 8: Connect CheeseFork with a URL and verify status switches to connected
        console.log('\n[Test 8] Connecting CheeseFork and verifying status update...');
        const cfConnectTest = await cdp.eval(`
            (() => {
                localStorage.setItem('ast_cheesefork_url', 'https://cheesefork.netlify.app/?uid=student123&semester=202601');
                updateDailyTimetableFocus();
                const el = document.getElementById('timetable-sync-text');
                return el ? el.innerText.trim() : '';
            })()
        `);
        console.log(`   Timetable bar text after connecting: "${cfConnectTest}"`);
        assert(cfConnectTest.includes('מחובר ל-CheeseFork'), `Timetable should show 'מחובר ל-CheeseFork', got: "${cfConnectTest}"`);
        console.log('✓ Test 8 Passed: CheeseFork correctly indicates connected only after link is configured.');

        // Capture screenshot
        console.log('\n[Screenshot] Capturing QA verification screenshot...');
        const screenshotPath = path.join(ARTIFACT_DIR, 'qa_unconnected_sync_guards_verified.png');
        await cdp.captureScreenshot(screenshotPath);

        console.log('\n================================================================');
        console.log('🎉 ALL 8 TESTS PASSED SUCCESSFULLY! 100% VERIFIED!');
        console.log('================================================================\n');

    } finally {
        cdp.close();
        chrome.kill();
        await delay(1000);
        try {
            fs.rmSync(PROFILE_DIR, { recursive: true, force: true });
        } catch (e) {}
    }
}

run().then(() => process.exit(0)).catch(err => {
    console.error('❌ QA Suite Error:', err);
    process.exit(1);
});
