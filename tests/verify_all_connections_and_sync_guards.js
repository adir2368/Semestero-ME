const { spawn } = require('child_process');
const http = require('http');
const assert = require('assert');
const path = require('path');
const os = require('os');
const fs = require('fs');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9600 + Math.floor(Math.random() * 300);
const PROFILE_DIR = path.join(os.tmpdir(), `chrome_qa_all_connections_${Date.now()}`);
const TARGET_URL = `http://localhost:8080/?qa_all_conn=${Date.now()}`;
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
    console.log('========================================================================');
    console.log('🛡️ QA SUITE: COMPREHENSIVE CONNECTION AUDIT & UNCONNECTED SYNC GUARDS');
    console.log('========================================================================\n');

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
        // Initialize clean state: unconnected guest
        console.log('[Setup] Initializing clean guest/unconnected state...');
        await cdp.eval(`
            (() => {
                sessionStorage.setItem('sw_last_controller_reload', String(Date.now()));
                localStorage.setItem('ast_onboarding_shown', 'true');
                localStorage.removeItem('ast_cheesefork_url');
                localStorage.removeItem('atlas_me_moodle_sync_default');
                localStorage.removeItem('ast_active_session_user');
                localStorage.removeItem('ast_persistent_user_phone');
                if (window.MoodleSync && window.MoodleSync.config) {
                    window.MoodleSync.config.url = '';
                    window.MoodleSync.saveConfig();
                }
                if (window.gameState) {
                    window.gameState.moodleCalendarUrl = '';
                    window.gameState.cheeseforkScheduleUrl = '';
                    window.gameState.googleAppsScriptWebhookUrl = '';
                    if (window.gameState.calendarIds) {
                        window.gameState.calendarIds = { exams: '', hw: '', practice: '' };
                    }
                    if (window.gameState.userProfile) {
                        window.gameState.userProfile.phone = '';
                    }
                    if (window.gameState.timetable) {
                        window.gameState.timetable = { days: [] };
                    }
                }
                if (typeof renderPhoneAndNotificationPreferences === 'function') {
                    renderPhoneAndNotificationPreferences();
                }
                if (typeof renderSettingsPage === 'function') {
                    renderSettingsPage();
                }
                if (typeof updateDailyTimetableFocus === 'function') {
                    updateDailyTimetableFocus();
                }
            })()
        `);
        await delay(500);

        // Test 1: Moodle unconnected indicator & warning on sync click
        console.log('\n[Test 1] Checking Moodle unconnected status & sync guard...');
        const moodleTest = await cdp.eval(`
            new Promise(resolve => {
                let caughtToast = null;
                const origToast = window.showToastNotification;
                window.showToastNotification = function(msg) {
                    caughtToast = msg;
                    if (origToast) origToast.apply(this, arguments);
                };

                const syncBtn = document.getElementById('btn-sync-moodle-tasks');
                if (syncBtn) syncBtn.click();

                const sidebarStatus = document.getElementById('moodle-sync-status');
                const sidebarText = sidebarStatus ? sidebarStatus.innerText.trim() : '';

                setTimeout(() => {
                    window.showToastNotification = origToast;
                    resolve({
                        toast: caughtToast,
                        sidebarStatus: sidebarText
                    });
                }, 300);
            })
        `);
        console.log(`   Toast: "${moodleTest.toast}"`);
        console.log(`   Sidebar Status: "${moodleTest.sidebarStatus}"`);
        assert(moodleTest.toast && moodleTest.toast.includes('אינך מחובר למודל הטכניון'), `Expected Moodle unconnected toast, got: "${moodleTest.toast}"`);
        assert(moodleTest.sidebarStatus.includes('אינו מחובר'), `Expected Moodle sidebar status to say 'אינו מחובר', got: "${moodleTest.sidebarStatus}"`);
        console.log('✓ Test 1 Passed: Moodle correctly indicates unconnected and warns user.');

        // Test 2: CheeseFork unconnected indicator & sync guards
        console.log('\n[Test 2] Checking CheeseFork unconnected status & sync guards...');
        const cfTest = await cdp.eval(`
            new Promise(resolve => {
                const timetableTextEl = document.getElementById('timetable-sync-text');
                const timetableText = timetableTextEl ? timetableTextEl.innerText.trim() : '';

                let caughtToast = null;
                const origToast = window.showToastNotification;
                window.showToastNotification = function(msg) {
                    caughtToast = msg;
                    if (origToast) origToast.apply(this, arguments);
                };

                const cfSyncBtn = document.getElementById('btn-sync-cheesefork-now');
                if (cfSyncBtn) cfSyncBtn.click();

                setTimeout(() => {
                    window.showToastNotification = origToast;
                    resolve({
                        toast: caughtToast,
                        timetableText: timetableText
                    });
                }, 300);
            })
        `);
        console.log(`   Toast: "${cfTest.toast}"`);
        console.log(`   Timetable Text: "${cfTest.timetableText}"`);
        assert(cfTest.timetableText.includes('אינו מחובר'), `Timetable header should indicate CheeseFork is unconnected! Got: "${cfTest.timetableText}"`);
        assert(cfTest.toast && cfTest.toast.includes('אינך מחובר ל-CheeseFork'), `Expected CheeseFork unconnected toast, got: "${cfTest.toast}"`);
        console.log('✓ Test 2 Passed: CheeseFork correctly indicates unconnected and warns on sync attempt.');

        // Test 3: Phone Notification Alert unconnected state & test button guard
        console.log('\n[Test 3] Checking Phone Channel unconnected status & test button guard...');
        const phoneTest = await cdp.eval(`
            new Promise(resolve => {
                const phoneIndicator = document.getElementById('phone-status-indicator');
                const phoneDesc = document.getElementById('phone-status-desc');
                const indicatorText = phoneIndicator ? phoneIndicator.innerText.trim() : '';
                const descText = phoneDesc ? phoneDesc.innerText.trim() : '';

                let caughtToast = null;
                const origToast = window.showToastNotification;
                window.showToastNotification = function(msg) {
                    caughtToast = msg;
                    if (origToast) origToast.apply(this, arguments);
                };

                const testBtn = document.getElementById('btn-test-phone-alert');
                if (testBtn) testBtn.click();

                setTimeout(() => {
                    window.showToastNotification = origToast;
                    resolve({
                        indicatorText,
                        descText,
                        toast: caughtToast
                    });
                }, 300);
            })
        `);
        console.log(`   Phone Indicator: "${phoneTest.indicatorText}"`);
        console.log(`   Phone Desc: "${phoneTest.descText}"`);
        console.log(`   Test Button Toast: "${phoneTest.toast}"`);
        assert(phoneTest.indicatorText.includes('אינו מחובר'), `Phone indicator should say 'אינו מחובר', got: "${phoneTest.indicatorText}"`);
        assert(phoneTest.descText.includes('אינו מחובר'), `Phone desc should say 'אינו מחובר', got: "${phoneTest.descText}"`);
        assert(phoneTest.toast && phoneTest.toast.includes('אינך מחובר לערוץ התראות טלפון'), `Expected unconnected toast for phone, got: "${phoneTest.toast}"`);
        console.log('✓ Test 3 Passed: Phone notification channel truthful status & unconnected guard verified.');

        // Test 4: Settings Google Calendar status badge & save toast
        console.log('\n[Test 4] Checking Settings Google Calendar badge & save validation...');
        const gcalSettingsTest = await cdp.eval(`
            new Promise(resolve => {
                if (typeof renderSettingsPage === 'function') renderSettingsPage();
                const badge = document.getElementById('settings-gcal-status-badge');
                const badgeText = badge ? badge.innerText.trim() : '';

                let caughtToast = null;
                const origToast = window.showToastNotification;
                window.showToastNotification = function(msg) {
                    caughtToast = msg;
                    if (origToast) origToast.apply(this, arguments);
                };

                const saveBtn = document.getElementById('btn-save-section-calendars');
                if (saveBtn) saveBtn.click();

                setTimeout(() => {
                    window.showToastNotification = origToast;
                    resolve({
                        badgeText,
                        saveToast: caughtToast
                    });
                }, 300);
            })
        `);
        console.log(`   Settings GCal Badge: "${gcalSettingsTest.badgeText}"`);
        console.log(`   Save GCal Toast: "${gcalSettingsTest.saveToast}"`);
        assert(gcalSettingsTest.badgeText.includes('אינו מחובר ליומני Google'), `Expected unconnected status badge, got: "${gcalSettingsTest.badgeText}"`);
        assert(gcalSettingsTest.saveToast && gcalSettingsTest.saveToast.includes('אינך מחובר ליומני Google'), `Expected warning note on save when unconnected, got: "${gcalSettingsTest.saveToast}"`);
        console.log('✓ Test 4 Passed: Settings Google Calendar card status badge and save validation verified.');

        // Test 5: Cloud Gist sync unconnected guard
        console.log('\n[Test 5] Checking Cloud Gist syncScheduleToCloudGist guard...');
        const gistTest = await cdp.eval(`
            new Promise(async (resolve) => {
                let caughtToast = null;
                const origToast = window.showToastNotification;
                window.showToastNotification = function(msg) {
                    caughtToast = msg;
                    if (origToast) origToast.apply(this, arguments);
                };

                const res = await syncScheduleToCloudGist(true);
                const indicator = document.getElementById('sync-status-indicator');
                const indicatorText = indicator ? indicator.innerText.trim() : '';

                setTimeout(() => {
                    window.showToastNotification = origToast;
                    resolve({
                        res,
                        indicatorText,
                        toast: caughtToast
                    });
                }, 200);
            })
        `);
        console.log(`   Gist Sync Result: ${gistTest.res}`);
        console.log(`   Gist Indicator: "${gistTest.indicatorText}"`);
        console.log(`   Gist Toast: "${gistTest.toast}"`);
        assert.strictEqual(gistTest.res, false, 'Gist sync should return false when token is not configured');
        assert(gistTest.indicatorText.includes('אינו מחובר לסנכרון ענן'), `Expected Gist indicator to say 'אינו מחובר לסנכרון ענן', got: "${gistTest.indicatorText}"`);
        assert(gistTest.toast && gistTest.toast.includes('אינך מחובר לסנכרון ענן'), `Expected Gist unconnected warning toast, got: "${gistTest.toast}"`);
        console.log('✓ Test 5 Passed: Cloud Gist sync returns false and alerts user when unconnected.');

        // Test 6: Timetable cancellation export when no schedule exists
        console.log('\n[Test 6] Checking exportTimetableCancellationICS guard...');
        const cancelExportTest = await cdp.eval(`
            new Promise(resolve => {
                let caughtToast = null;
                const origToast = window.showToastNotification;
                window.showToastNotification = function(msg) {
                    caughtToast = msg;
                    if (origToast) origToast.apply(this, arguments);
                };

                exportTimetableCancellationICS();

                setTimeout(() => {
                    window.showToastNotification = origToast;
                    resolve(caughtToast);
                }, 200);
            })
        `);
        console.log(`   Cancel Export Toast: "${cancelExportTest}"`);
        assert(cancelExportTest && cancelExportTest.includes('לא נמצאה מערכת שעות פעילה לביטול') || cancelExportTest.includes('לא נמצאו שיעורים פעילים'), `Expected no-classes warning for cancellation, got: "${cancelExportTest}"`);
        console.log('✓ Test 6 Passed: exportTimetableCancellationICS guards against exporting empty cancellations.');

        // Test 7: Morning 07:30 Briefing Data when no schedule exists
        console.log('\n[Test 7] Checking generateMorning730BriefingData timetable notice...');
        const briefingTest = await cdp.eval(`
            (() => {
                const b = generateMorning730BriefingData(new Date());
                return b;
            })()
        `);
        console.log(`   Briefing Title: "${briefingTest.title}"`);
        console.log(`   Briefing Body: "${briefingTest.body}"`);
        assert(!briefingTest.body.includes('יום חופשי מלימודים!'), 'Should not proclaim a vacation day when user simply has no schedule!');
        assert(briefingTest.body.includes('טרם הוגדרה או סונכרנה מערכת שעות פעילה'), 'Expected briefing to guide user to sync CheeseFork timetable!');
        console.log('✓ Test 7 Passed: Morning briefing truthfully states no timetable is synced.');

        // Test 8: Connecting phone number and verifying status switch
        console.log('\n[Test 8] Connecting phone number and verifying truthful status switch...');
        const phoneConnectTest = await cdp.eval(`
            new Promise(resolve => {
                window.gameState.userProfile = window.gameState.userProfile || {};
                window.gameState.userProfile.phone = '052-1234567';
                savePhoneAndNotificationPreferences('settings');

                const indicator = document.getElementById('phone-status-indicator');
                const desc = document.getElementById('phone-status-desc');

                let caughtToasts = [];
                const origToast = window.showToastNotification;
                window.showToastNotification = function(msg) {
                    caughtToasts.push(msg);
                    if (origToast) origToast.apply(this, arguments);
                };

                testSendPhoneNotification();

                setTimeout(() => {
                    window.showToastNotification = origToast;
                    resolve({
                        indicatorText: indicator ? indicator.innerText.trim() : '',
                        descText: desc ? desc.innerText.trim() : '',
                        testToasts: caughtToasts
                    });
                }, 300);
            })
        `);
        console.log(`   Phone Indicator after connect: "${phoneConnectTest.indicatorText}"`);
        console.log(`   Phone Desc after connect: "${phoneConnectTest.descText}"`);
        console.log(`   Test Toasts after connect:`, phoneConnectTest.testToasts);
        assert(phoneConnectTest.indicatorText.includes('מוגדר מקומית') || phoneConnectTest.indicatorText.includes('מחובר לענן'), `Expected phone indicator to show configured phone, got: "${phoneConnectTest.indicatorText}"`);
        assert(phoneConnectTest.testToasts.some(t => t.includes('נשלחה התראת בדיקה למספר 052-1234567')), `Expected successful test alert toast, got: ${JSON.stringify(phoneConnectTest.testToasts)}`);
        console.log('✓ Test 8 Passed: Phone status dynamically reflects configured phone and test alert succeeds.');

        // Test 9: Connecting Moodle URL and verifying status switch
        console.log('\n[Test 9] Connecting Moodle URL and verifying status switch...');
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
        console.log('✓ Test 9 Passed: Moodle correctly indicates connected only after link is configured.');

        // Test 10: Connecting CheeseFork URL and verifying status switch
        console.log('\n[Test 10] Connecting CheeseFork and verifying status switch...');
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
        console.log('✓ Test 10 Passed: CheeseFork correctly indicates connected only after link is configured.');

        // Capture verification screenshot
        console.log('\n[Screenshot] Capturing QA verification screenshot...');
        const screenshotPath = path.join(ARTIFACT_DIR, 'qa_all_connections_guards_verified.png');
        await cdp.captureScreenshot(screenshotPath);

        console.log('\n========================================================================');
        console.log('🎉 ALL 10 TESTS PASSED SUCCESSFULLY! 100% VERIFIED!');
        console.log('========================================================================\n');

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
