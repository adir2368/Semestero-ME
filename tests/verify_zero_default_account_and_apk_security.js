const { spawn } = require('child_process');
const http = require('http');
const assert = require('assert');
const path = require('path');
const os = require('os');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9500 + Math.floor(Math.random() * 350);
const PROFILE_DIR = path.join(os.tmpdir(), `chrome_qa_zero_default_${Date.now()}`);
const SERVER_PORT = 8080;
const BASE_URL = `http://127.0.0.1:${SERVER_PORT}`;
const ARTIFACT_DIR = "C:/Users/user/.gemini/antigravity/brain/aa7d2a33-2de8-4eeb-b8bd-18c8fdd69b14";

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

function isServerListening(port) {
    return new Promise(resolve => {
        const req = http.get(`http://127.0.0.1:${port}/`, () => resolve(true));
        req.on('error', () => resolve(false));
        req.setTimeout(1000, () => {
            req.abort();
            resolve(false);
        });
    });
}

class CDPClient {
    constructor(wsUrl) {
        this.wsUrl = wsUrl;
        this.id = 1;
        this.callbacks = new Map();
        this.pageErrors = [];
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.wsUrl);
            this.ws.onopen = () => resolve();
            this.ws.onerror = (err) => reject(err);
            this.ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                if (msg.method === 'Runtime.exceptionThrown') {
                    const desc = msg.params.exceptionDetails.exception
                        ? (msg.params.exceptionDetails.exception.description || msg.params.exceptionDetails.text)
                        : msg.params.exceptionDetails.text;
                    this.pageErrors.push(desc);
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

    async screenshot(filePath) {
        const res = await this.send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
    }

    close() {
        if (this.ws) this.ws.close();
    }
}

function collectFilesRecursive(dir, exts) {
    const out = [];
    if (!fs.existsSync(dir)) return out;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            out.push(...collectFilesRecursive(full, exts));
        } else if (exts.some(ext => entry.name.endsWith(ext))) {
            out.push(full);
        }
    }
    return out;
}

function runStaticPiiAndSecretAudit() {
    console.log('[Audit 1] Scanning all shipped Web & Android source files for hardcoded PII / tokens / passwords...');
    const rootShippedFiles = [
        'index.html',
        'app.js',
        'auth_sync.js',
        'planner_module.js',
        'moodle_sync.js',
        'timetable_generator.js',
        'preloaded_user_state.js',
        'user_saved_state.json',
        'site_analytics.js',
        'ui_enhancements.js',
        'sw.js'
    ].map(f => path.join(ROOT, f)).filter(f => fs.existsSync(f));

    const androidFiles = collectFilesRecursive(path.join(ROOT, 'android', 'app', 'src', 'main'), ['.java', '.xml']);
    const allFiles = [...rootShippedFiles, ...androidFiles];

    const forbiddenLiterals = [
        { token: '053-6202662', label: 'Developer personal phone number (hyphenated)' },
        { token: '0536202662', label: 'Developer personal phone number (digits)' },
        { token: 'D4bh8oHO0GQI5Gx1iYAbWsouBVx2', label: 'Developer personal CheeseFork UID' },
        { token: '47ff4e9841a2293be4696691eeeafe5127137f5c', label: 'Developer personal Moodle ICS authtoken' },
        { token: 'userid=39495', label: 'Developer personal Moodle userid' },
        { token: 'BenchyTech1', label: 'Plaintext Master Password' },
        { token: 'MASTER_PASSWORDS', label: 'Legacy plaintext password array' },
        { token: 'SemesteroQA2026!', label: 'Plaintext QA Password' },
        { token: 'התחברות מהירה כאדיר משה', label: 'Legacy Quick Login button' }
    ];

    for (const filePath of allFiles) {
        const content = fs.readFileSync(filePath, 'utf8');
        const rel = path.relative(ROOT, filePath);
        for (const item of forbiddenLiterals) {
            if (content.includes(item.token)) {
                throw new Error(`SECURITY LEAK in ${rel}: found ${item.label} ("${item.token}")`);
            }
        }
    }

    const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    assert(!indexHtml.includes('39.5 / 157.5'), 'index.html still flashes 39.5 / 157.5 credits instead of 0.0 / 157.5');

    // Verify Android widget XML & Java contain zero Adir personal schedule/GPA/Miluim defaults
    const widgetForbidden = ['88.4', 'מכניקת מוצקים 2', 'דניאל אורנשטיין', 'יוגה ורובוטיקה', 'פיסיקה 2מ • תרגיל בית 3', 'getString("miluim_days", "21")', 'android:text="21"'];
    for (const filePath of androidFiles) {
        const content = fs.readFileSync(filePath, 'utf8');
        const rel = path.relative(ROOT, filePath);
        for (const wf of widgetForbidden) {
            if (content.includes(wf)) {
                throw new Error(`ANDROID WIDGET LEAK in ${rel}: found hardcoded personal widget string "${wf}"`);
            }
        }
    }

    console.log(`  ✓ PASS: Scanned ${allFiles.length} shipped Web & Android files — 0 PII, 0 tokens, 0 plaintext passwords, 0 personal widget defaults!\n`);
}

async function waitForAppReady(cdp) {
    for (let i = 0; i < 60; i++) {
        await delay(250);
        try {
            const ok = await cdp.eval(`Boolean(window.AuthSync && window.gameState && window.gameState.courses && window.DegreePlanner)`);
            if (ok) return;
        } catch (e) {}
    }
    throw new Error('Timed out waiting for app initialization');
}

async function run() {
    console.log('========================================================================');
    console.log('🔒 ZERO-DEFAULT ACCOUNT, APK EVICTION & MULTI-TENANT SECURITY SUITE');
    console.log('========================================================================\n');

    runStaticPiiAndSecretAudit();

    let serverProcess = null;
    if (!(await isServerListening(SERVER_PORT))) {
        console.log(`[Server] Starting local server on port ${SERVER_PORT}...`);
        serverProcess = spawn('node', ['server.js'], { cwd: ROOT });
        await delay(2000);
    }

    const chrome = spawn(CHROME_PATH, [
        `--remote-debugging-port=${PORT}`,
        `--user-data-dir=${PROFILE_DIR}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--headless=new',
        '--disable-gpu',
        '--window-size=1440,900',
        `${BASE_URL}/?fresh_web=${Date.now()}`
    ]);

    let cdp = null;
    try {
        let wsUrl = null;
        for (let i = 0; i < 30; i++) {
            await delay(400);
            try {
                const list = await getJson(`http://127.0.0.1:${PORT}/json`);
                const page = list.find(t => t.type === 'page');
                if (page && page.webSocketDebuggerUrl) {
                    wsUrl = page.webSocketDebuggerUrl;
                    break;
                }
            } catch (e) {}
        }
        assert(wsUrl, 'Failed to connect to Chrome CDP');
        cdp = new CDPClient(wsUrl);
        await cdp.connect();
        await cdp.send('Page.enable');
        await cdp.send('Runtime.enable');

        // Prevent SW reload race during tests
        await cdp.eval(`sessionStorage.setItem('sw_last_controller_reload', String(Date.now()));`);
        await waitForAppReady(cdp);

        // -------------------------------------------------------------------------
        // SCENARIO 1: Fresh Web Open -> Strict Nominal Guest State
        // -------------------------------------------------------------------------
        console.log('[Scenario 1] Verifying Fresh Web Open -> Nominal Guest State...');
        const webGuest = await cdp.eval(`(() => {
            const courses = Object.values(window.gameState.courses || {});
            const completed = courses.filter(c => c.status === 'completed' || (typeof c.grade === 'number' && c.grade > 0));
            const plan = window.DegreePlanner.getCustomPlan() || [];
            const findCourseSem = (code) => {
                for (const s of plan) {
                    if ((s.courses || []).some(c => String(c.code) === code)) return s.semester;
                }
                return window.gameState.courses?.[code]?.semester || null;
            };
            const yogaInPlan = plan.some(s => (s.courses || []).some(c => String(c.code) === '03940805'));
            return {
                loggedUser: localStorage.getItem('ast_logged_in_user'),
                isLoggedIn: window.AuthSync.isLoggedIn(),
                isAdir: window.AuthSync.isAdirActive(),
                profileId: window.AuthSync.getActiveUser().id,
                hudName: document.getElementById('hud-user-name')?.innerText || '',
                gpa: Number(window.gameState.gpa || 0),
                completedCount: completed.length,
                phone: window.gameState.userProfile?.phone || '',
                cfUrl: localStorage.getItem('ast_cheesefork_url'),
                moodleUrl: localStorage.getItem('ast_moodle_calendar_url'),
                moodleConfigUrl: window.MoodleSync?.config?.url || '',
                physics1Sem: findCourseSem('114051') || findCourseSem('01140051'),
                chemLabSem: findCourseSem('125013') || findCourseSem('01250013'),
                yogaInPlan
            };
        })()`);

        assert.strictEqual(webGuest.loggedUser, 'guest', 'Web fresh open must set ast_logged_in_user = guest');
        assert.strictEqual(webGuest.isLoggedIn, false, 'Guest must not be logged in');
        assert.strictEqual(webGuest.isAdir, false, 'Guest must NEVER be Adir');
        assert.strictEqual(webGuest.profileId, 'guest', 'Active profile ID must be guest');
        assert(!webGuest.hudName.includes('אדיר'), `HUD name leaked Adir: ${webGuest.hudName}`);
        assert.strictEqual(webGuest.gpa, 0, `Guest GPA must be 0, got ${webGuest.gpa}`);
        assert.strictEqual(webGuest.completedCount, 0, `Guest completed courses must be 0, got ${webGuest.completedCount}`);
        assert.strictEqual(webGuest.phone, '', `Guest phone must be empty, got ${webGuest.phone}`);
        assert.strictEqual(webGuest.cfUrl, null, 'Guest CheeseFork URL must be null');
        assert.strictEqual(webGuest.moodleUrl, null, 'Guest Moodle URL must be null');
        assert.strictEqual(webGuest.moodleConfigUrl, '', 'Guest MoodleSync.config.url must be empty');
        assert.strictEqual(webGuest.physics1Sem, 2, `Standard curriculum Physics 1 must be in Sem 2, got ${webGuest.physics1Sem}`);
        assert.strictEqual(webGuest.chemLabSem, 4, `Standard curriculum Chemistry Lab must be in Sem 4, got ${webGuest.chemLabSem}`);
        assert.strictEqual(webGuest.yogaInPlan, false, 'Guest curriculum must NOT include Adir Yoga 03940805');
        console.log('  ✓ PASS: Fresh Web opens strictly in clean Guest state with standard curriculum.\n');

        // -------------------------------------------------------------------------
        // SCENARIO 2: Simulated Fresh Capacitor Android APK Install
        // -------------------------------------------------------------------------
        console.log('[Scenario 2] Verifying Fresh Capacitor Android APK Install...');
        const capScript = await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
            source: `
                window.alert = (msg) => { console.log('[Alert]', msg); };
                window.confirm = () => true;
                window.__widgetBridgeCalls = { clear: 0, cfUrls: [], gpaUpdates: [] };
                window.Capacitor = {
                    isNativePlatform: () => true,
                    getPlatform: () => 'android',
                    Plugins: {}
                };
                window.SemesteroWidgetBridge = {
                    clearWidgetData: () => { window.__widgetBridgeCalls.clear++; },
                    updateLaunchpadCheeseForkUrl: (u) => { window.__widgetBridgeCalls.cfUrls.push(u); },
                    updateClassWidget: () => {},
                    updateTasksWidget: () => {},
                    updateMiluimWidget: () => {},
                    updateScheduleWidget: () => {},
                    updateFinalsGpaWidget: (gpa) => { window.__widgetBridgeCalls.gpaUpdates.push(gpa); },
                    updatePomodoroWidget: () => {},
                    refreshAllWidgets: () => {},
                    getPendingCompletedTaskIds: () => '',
                    getPendingMiluimDays: () => -1
                };
                sessionStorage.setItem('sw_last_controller_reload', String(Date.now()));
            `
        });

        await cdp.eval(`localStorage.clear();`);
        await cdp.send('Page.navigate', { url: `${BASE_URL}/?fresh_apk=${Date.now()}` });
        await waitForAppReady(cdp);

        const apkFresh = await cdp.eval(`(() => {
            const plan = window.DegreePlanner.getCustomPlan() || [];
            const findCourseSem = (code) => {
                for (const s of plan) {
                    if ((s.courses || []).some(c => String(c.code) === code)) return s.semester;
                }
                return null;
            };
            return {
                isNative: window.Capacitor?.isNativePlatform(),
                loggedUser: localStorage.getItem('ast_logged_in_user'),
                isAdir: window.AuthSync.isAdirActive(),
                gpa: Number(window.gameState.gpa || 0),
                physics1Sem: findCourseSem('114051') || findCourseSem('01140051'),
                chemLabSem: findCourseSem('125013') || findCourseSem('01250013')
            };
        })()`);

        assert.strictEqual(apkFresh.isNative, true, 'Capacitor native platform mock must be active');
        assert.strictEqual(apkFresh.loggedUser, 'guest', 'Fresh APK install MUST open as guest, NEVER adir_moshe');
        assert.strictEqual(apkFresh.isAdir, false, 'Fresh APK install MUST NOT authenticate as Adir');
        assert.strictEqual(apkFresh.gpa, 0, 'Fresh APK install GPA must be 0');
        assert.strictEqual(apkFresh.physics1Sem, 2, 'Fresh APK Physics 1 must be Sem 2');
        assert.strictEqual(apkFresh.chemLabSem, 4, 'Fresh APK Chem Lab must be Sem 4');
        console.log('  ✓ PASS: Fresh Android APK install opens strictly as isolated Guest (0 leaks).\n');

        if (ARTIFACT_DIR && fs.existsSync(ARTIFACT_DIR)) {
            await cdp.screenshot(path.join(ARTIFACT_DIR, 'qa_zero_default_apk_guest_verified.png'));
            console.log('  📸 Saved APK Guest nominal state screenshot: qa_zero_default_apk_guest_verified.png\n');
        }

        // -------------------------------------------------------------------------
        // SCENARIO 3: Retroactive Eviction of Already-Installed Unverified APK Session
        // -------------------------------------------------------------------------
        console.log('[Scenario 3] Verifying Retroactive Eviction of Pre-v2.8.8 Contaminated APK Device...');
        const seedScript = await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
            source: `
                if (!sessionStorage.getItem('__retroactive_seeded')) {
                    sessionStorage.setItem('__retroactive_seeded', '1');
                    localStorage.setItem('ast_logged_in_user', 'adir_moshe');
                    localStorage.setItem('ast_is_developer_device', 'true');
                    localStorage.setItem('academic_skill_tree_save', JSON.stringify({ gpa: 86.04, courses: { '104041': { grade: 84, status: 'completed' } } }));
                    localStorage.setItem('ast_cheesefork_url', 'https://cheesefork.netlify.app/?semester=202601&uid=legacy');
                    localStorage.setItem('ast_persistent_user_phone', '050-0000000');
                    localStorage.removeItem('ast_auth_verified_v3');
                }
            `
        });

        await cdp.eval(`sessionStorage.removeItem('__retroactive_seeded');`);
        await cdp.send('Page.navigate', { url: `${BASE_URL}/?retroactive_apk=${Date.now()}` });
        await waitForAppReady(cdp);
        await cdp.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: seedScript.identifier });

        const evicted = await cdp.eval(`(() => ({
            loggedUser: localStorage.getItem('ast_logged_in_user'),
            devFlag: localStorage.getItem('ast_is_developer_device'),
            legacySave: localStorage.getItem('academic_skill_tree_save'),
            cfUrl: localStorage.getItem('ast_cheesefork_url'),
            legacyPhone: localStorage.getItem('ast_persistent_user_phone'),
            isAdir: window.AuthSync.isAdirActive(),
            gpa: Number(window.gameState.gpa || 0),
            widgetClears: window.__widgetBridgeCalls?.clear || 0
        }))()`);

        assert.strictEqual(evicted.loggedUser, 'guest', 'Unverified adir_moshe APK session MUST be evicted to guest');
        assert.strictEqual(evicted.devFlag, null, 'ast_is_developer_device MUST be purged');
        assert.strictEqual(evicted.legacySave, null, 'academic_skill_tree_save MUST be purged on unverified device');
        assert.strictEqual(evicted.cfUrl, null, 'Unscoped ast_cheesefork_url MUST be purged');
        assert.strictEqual(evicted.legacyPhone, null, 'ast_persistent_user_phone MUST be purged');
        assert.strictEqual(evicted.isAdir, false, 'isAdirActive() MUST be false after eviction');
        assert.strictEqual(evicted.gpa, 0, 'Evicted device GPA MUST be 0');
        assert(evicted.widgetClears >= 1, `SemesteroWidgetBridge.clearWidgetData() must be called on eviction (count=${evicted.widgetClears})`);
        console.log('  ✓ PASS: Pre-existing unverified APK session evicted to Guest & native widgets cleared!\n');

        // -------------------------------------------------------------------------
        // SCENARIO 4: URL Backdoors & Auth Bypass Attack Vectors
        // -------------------------------------------------------------------------
        console.log('[Scenario 4] Stress-Testing URL Backdoors & Auth Attack Vectors...');
        await cdp.send('Page.navigate', { url: `${BASE_URL}/?user=adir&auth=adir` });
        await waitForAppReady(cdp);

        const attackResults = await cdp.eval(`(async () => {
            window.alert = (msg) => { console.log('[BlockedAlert]', msg); };
            window.confirm = () => true;
            const urlBackdoorUser = localStorage.getItem('ast_logged_in_user');
            const urlBackdoorAdir = window.AuthSync.isAdirActive();

            const qaNoPass = await window.AuthSync.loginAsQA();
            const qaWrongPass = await window.AuthSync.loginAsQA('wrong');
            const emptyUserLogin = await window.AuthSync.loginWithPassword('', 'anything');
            const singleCharFuzzyLogin = await window.AuthSync.loginWithPassword('א', 'anything');
            const wrongAdirPass = await window.AuthSync.loginWithPassword('adir_moshe', 'WrongPass999');
            const weakGithubPass = await window.AuthSync.loginWithPassword('adir2368', 'adir2368');
            const resetAdirAttempt = await window.AuthSync.resetPassword('adir_moshe', 'NewPass123!', 'adir.m.2368@gmail.com');
            const hijackAdirReg = await window.AuthSync.registerStudent({
                name: 'Hacker',
                email: 'adir.m.2368@gmail.com',
                password: 'Pass123456',
                startingSemester: 3
            });

            return {
                urlBackdoorUser,
                urlBackdoorAdir,
                qaNoPass,
                qaWrongPass,
                emptyUserLogin,
                singleCharFuzzyLogin,
                wrongAdirPass,
                weakGithubPass,
                resetAdirAttempt,
                hijackAdirReg,
                finalUser: localStorage.getItem('ast_logged_in_user'),
                finalIsAdir: window.AuthSync.isAdirActive()
            };
        })()`);

        assert.strictEqual(attackResults.urlBackdoorUser, 'guest', '?user=adir&auth=adir backdoor must be blocked');
        assert.strictEqual(attackResults.urlBackdoorAdir, false, '?user=adir must not activate Adir');
        assert.strictEqual(attackResults.qaNoPass, false, 'Passwordless loginAsQA() must be blocked');
        assert.strictEqual(attackResults.qaWrongPass, false, 'Wrong-password loginAsQA() must be blocked');
        assert.strictEqual(attackResults.emptyUserLogin, false, 'Empty identifier login must be blocked');
        assert.strictEqual(attackResults.singleCharFuzzyLogin, false, 'Fuzzy substring login must be blocked');
        assert.strictEqual(attackResults.wrongAdirPass, false, 'Wrong Adir password must be blocked');
        assert.strictEqual(attackResults.weakGithubPass, false, 'Public GitHub handle adir2368 must NOT work as password');
        assert.strictEqual(attackResults.resetAdirAttempt, false, 'resetPassword on adir_moshe must be blocked');
        assert.strictEqual(attackResults.hijackAdirReg, false, 'registerStudent with Adir email must be blocked');
        assert.strictEqual(attackResults.finalUser, 'guest', 'Must remain guest after all attack attempts');
        assert.strictEqual(attackResults.finalIsAdir, false, 'Must not be Adir after all attack attempts');
        console.log('  ✓ PASS: All 9 auth bypass & backdoor attack vectors blocked!\n');

        // -------------------------------------------------------------------------
        // SCENARIO 5: Valid Developer Login, Reload Persistence, & Clean Logout
        // -------------------------------------------------------------------------
        console.log('[Scenario 5] Verifying Authentic Developer Login, Reload Persistence & Clean Logout...');
        const devLogin = await cdp.eval(`(async () => {
            const ok = await window.AuthSync.loginWithPassword('adir.m.2368@gmail.com', 'BenchyTech1');
            const proofRaw = localStorage.getItem('ast_auth_verified_v3');
            let sigLen = 0;
            try { sigLen = JSON.parse(proofRaw).sig.length; } catch (e) {}
            const deleteBlocked = await window.AuthSync.deleteAccount();
            return {
                ok,
                loggedUser: localStorage.getItem('ast_logged_in_user'),
                isAdir: window.AuthSync.isAdirActive(),
                proofLen: sigLen,
                gpa: Number(window.gameState.gpa || 0),
                deleteBlocked
            };
        })()`);

        assert.strictEqual(devLogin.ok, true, 'Authentic developer password login must succeed');
        assert.strictEqual(devLogin.loggedUser, 'adir_moshe');
        assert.strictEqual(devLogin.isAdir, true);
        assert.strictEqual(devLogin.proofLen, 64, 'SHA-256 session proof must be 64 hex chars');
        assert(devLogin.gpa > 85, `Developer GPA must restore (>85), got ${devLogin.gpa}`);
        assert.strictEqual(devLogin.deleteBlocked, false, 'deleteAccount() must block deletion of adir_moshe');

        // Reload page and confirm verified session persists
        await cdp.send('Page.reload', { ignoreCache: true });
        await waitForAppReady(cdp);

        const afterReload = await cdp.eval(`(() => ({
            loggedUser: localStorage.getItem('ast_logged_in_user'),
            isAdir: window.AuthSync.isAdirActive(),
            gpa: Number(window.gameState.gpa || 0)
        }))()`);
        assert.strictEqual(afterReload.loggedUser, 'adir_moshe', 'Verified session must persist across page reload');
        assert.strictEqual(afterReload.isAdir, true, 'isAdirActive() must remain true after reload');
        assert(afterReload.gpa > 85, `GPA must remain >85 after reload, got ${afterReload.gpa}`);

        // Logout and verify complete cleanup back to nominal Guest
        const afterLogout = await cdp.eval(`(() => {
            const clearsBefore = window.__widgetBridgeCalls?.clear || 0;
            window.AuthSync.logout(true);
            const plan = window.DegreePlanner.getCustomPlan() || [];
            const findCourseSem = (code) => {
                for (const s of plan) {
                    if ((s.courses || []).some(c => String(c.code) === code)) return s.semester;
                }
                return null;
            };
            return {
                loggedUser: localStorage.getItem('ast_logged_in_user'),
                proof: localStorage.getItem('ast_auth_verified_v3'),
                devFlag: localStorage.getItem('ast_is_developer_device'),
                cfMirror: localStorage.getItem('ast_cheesefork_url'),
                moodleMirror: localStorage.getItem('ast_moodle_calendar_url'),
                isAdir: window.AuthSync.isAdirActive(),
                gpa: Number(window.gameState.gpa || 0),
                physics1Sem: findCourseSem('114051') || findCourseSem('01140051'),
                chemLabSem: findCourseSem('125013') || findCourseSem('01250013'),
                widgetClearDelta: (window.__widgetBridgeCalls?.clear || 0) - clearsBefore
            };
        })()`);

        assert.strictEqual(afterLogout.loggedUser, 'guest', 'Logout must reset user to guest');
        assert.strictEqual(afterLogout.proof, null, 'Logout must clear ast_auth_verified_v3');
        assert.strictEqual(afterLogout.devFlag, null, 'Logout must clear ast_is_developer_device');
        assert.strictEqual(afterLogout.cfMirror, null, 'Logout must clear active CheeseFork mirror');
        assert.strictEqual(afterLogout.moodleMirror, null, 'Logout must clear active Moodle mirror');
        assert.strictEqual(afterLogout.isAdir, false, 'Logout must deactivate Adir');
        assert.strictEqual(afterLogout.gpa, 0, 'Logout must reset GPA to 0');
        assert.strictEqual(afterLogout.physics1Sem, 2, 'Logout must reset Physics 1 back to Sem 2');
        assert.strictEqual(afterLogout.chemLabSem, 4, 'Logout must reset Chem Lab back to Sem 4');
        assert(afterLogout.widgetClearDelta >= 1, 'Logout must clear native Android widgets');
        console.log('  ✓ PASS: Developer login, reload persistence, and zero-trace logout verified!\n');

        // -------------------------------------------------------------------------
        // SCENARIO 6: Multi-Tenant Student A <-> Student B <-> Guest Isolation
        // -------------------------------------------------------------------------
        console.log('[Scenario 6] Verifying Student A <-> Student B <-> Guest Shared-Device Isolation...');
        const multiTenant = await cdp.eval(`(async () => {
            window.alert = () => {};
            window.confirm = () => true;
            const ts = Date.now();
            const emailA = 'qa.alpha.' + ts + '@technion.test';
            const emailB = 'qa.beta.' + ts + '@technion.test';

            // 0. Seed temporary Guest noise before Student A/B register
            localStorage.setItem('ast_user_state_guest', JSON.stringify({
                gpa: 77.7,
                courses: { '104041': { grade: 77, status: 'mastered' } }
            }));

            // 1. Register Student A with Grade 95 in 104041 + scoped integrations
            const regA = await window.AuthSync.registerStudent({
                name: 'QA Student Alpha',
                email: emailA,
                password: 'AlphaPass1!',
                startingSemester: 2,
                priorCompleted: { '104041': { completed: true, grade: 95 } }
            });
            const uidA = localStorage.getItem('ast_logged_in_user');
            await window.AuthSync.updateUserProfile({
                name: 'QA Student Alpha',
                email: emailA,
                phone: '0541111111',
                semester: 2
            });
            await window.AuthSync.saveCheeseForkUrl('https://cheesefork.cf/?semester=202601&uid=alpha_only_uid');
            localStorage.setItem('ast_moodle_calendar_url_' + uidA, 'https://moodle25.technion.ac.il/calendar/export_execute.php?userid=11111&authtoken=alpha_tok');
            localStorage.setItem('ast_moodle_calendar_url', 'https://moodle25.technion.ac.il/calendar/export_execute.php?userid=11111&authtoken=alpha_tok');

            // Verify duplicate email registration block & single-factor reset block
            const dupRegBlocked = !(await window.AuthSync.registerStudent({
                name: 'Impersonator',
                email: emailA,
                password: 'HackPass9!',
                startingSemester: 1
            }));
            const wrongNameResetBlocked = !(await window.AuthSync.resetPassword('Wrong Name', 'HackPass9!', emailA));

            // 2. Logout Student A -> check Guest clean state
            window.AuthSync.logout(true);
            const guestSnap = {
                uid: localStorage.getItem('ast_logged_in_user'),
                gpa: Number(window.gameState.gpa || 0),
                cf: localStorage.getItem('ast_cheesefork_url'),
                moodle: localStorage.getItem('ast_moodle_calendar_url'),
                phone: (window.gameState.userProfile && window.gameState.userProfile.phone) || ''
            };

            // 3. Register Student B (0 completed courses) -> ensure ZERO inheritance from Student A or Guest!
            const regB = await window.AuthSync.registerStudent({
                name: 'QA Student Beta',
                email: emailB,
                password: 'BetaPass2!',
                startingSemester: 1,
                priorCompleted: {}
            });
            const uidB = localStorage.getItem('ast_logged_in_user');
            const profBRaw = localStorage.getItem('ast_profile_' + uidB) || '{}';
            const stateBRaw = localStorage.getItem('ast_user_state_' + uidB) || '{}';
            const profB = JSON.parse(profBRaw);
            const stateB = JSON.parse(stateBRaw);
            const betaSnap = {
                uid: uidB,
                gpa: Number(window.gameState.gpa || 0),
                cf: localStorage.getItem('ast_cheesefork_url'),
                moodle: localStorage.getItem('ast_moodle_calendar_url'),
                phone: (window.gameState.userProfile && window.gameState.userProfile.phone) || '',
                hasHash: typeof profB.passwordHash === 'string' && profB.passwordHash.length === 64,
                noPlaintextProf: !profB.password,
                noPlaintextState: !stateB.account_password
            };

            // 4. Switch back to Student A via password login -> verify Student A's data & integrations restore cleanly!
            window.AuthSync.logout(true);
            const loginA = await window.AuthSync.loginWithPassword(emailA, 'AlphaPass1!');
            const alphaRestored = {
                loginA,
                uid: localStorage.getItem('ast_logged_in_user'),
                gpa: Number(window.gameState.gpa || 0),
                phone: localStorage.getItem('ast_user_phone_' + uidA),
                cf: localStorage.getItem('ast_cheesefork_url'),
                moodle: localStorage.getItem('ast_moodle_calendar_url')
            };

            // 5. Clean up both temporary test accounts from Supabase & localStorage via deleteAccount()
            const delA = await window.AuthSync.deleteAccount();
            const loginB = await window.AuthSync.loginWithPassword(emailB, 'BetaPass2!');
            const delB = await window.AuthSync.deleteAccount();

            return {
                regA,
                regB,
                dupRegBlocked,
                wrongNameResetBlocked,
                guestSnap,
                betaSnap,
                alphaRestored,
                delA,
                loginB,
                delB,
                finalUid: localStorage.getItem('ast_logged_in_user')
            };
        })()`);

        assert.strictEqual(multiTenant.regA, true, 'Student A registration must succeed');
        assert.strictEqual(multiTenant.regB, true, 'Student B registration must succeed');
        assert.strictEqual(multiTenant.dupRegBlocked, true, 'Duplicate email registration must be blocked');
        assert.strictEqual(multiTenant.wrongNameResetBlocked, true, 'Password reset with wrong full name must be blocked');
        assert.strictEqual(multiTenant.guestSnap.uid, 'guest');
        assert.strictEqual(multiTenant.guestSnap.gpa, 0);
        assert.strictEqual(multiTenant.guestSnap.cf, null);
        assert.strictEqual(multiTenant.guestSnap.moodle, null);
        assert.strictEqual(multiTenant.guestSnap.phone, '');
        assert.strictEqual(multiTenant.betaSnap.gpa, 0, 'Student B must have 0 GPA (no leak from Student A or Guest)');
        assert.strictEqual(multiTenant.betaSnap.cf, null, 'Student B must not inherit Student A CheeseFork URL');
        assert.strictEqual(multiTenant.betaSnap.moodle, null, 'Student B must not inherit Student A Moodle URL');
        assert.strictEqual(multiTenant.betaSnap.phone, '', 'Student B must not inherit Student A phone');
        assert.strictEqual(multiTenant.betaSnap.hasHash, true, 'Student B password must be stored as 64-char SHA-256 hash');
        assert.strictEqual(multiTenant.betaSnap.noPlaintextProf, true, 'No plaintext password in ast_profile_<uid>');
        assert.strictEqual(multiTenant.betaSnap.noPlaintextState, true, 'No plaintext account_password in ast_user_state_<uid>');
        assert.strictEqual(multiTenant.alphaRestored.loginA, true, 'Student A re-login must succeed');
        assert.strictEqual(multiTenant.alphaRestored.gpa, 95, 'Student A GPA (95) must restore cleanly');
        assert.strictEqual(multiTenant.alphaRestored.phone, '054-1111111', 'Student A phone must restore cleanly');
        assert(String(multiTenant.alphaRestored.cf).includes('alpha_only_uid'), 'Student A CheeseFork URL must restore cleanly');
        assert(String(multiTenant.alphaRestored.moodle).includes('alpha_tok'), 'Student A Moodle URL must restore cleanly');
        assert.strictEqual(multiTenant.delA, true, 'Student A cleanup deleteAccount() must succeed');
        assert.strictEqual(multiTenant.loginB, true, 'Student B re-login must succeed');
        assert.strictEqual(multiTenant.delB, true, 'Student B cleanup deleteAccount() must succeed');
        assert.strictEqual(multiTenant.finalUid, 'guest', 'Final session after deletions must be guest');
        console.log('  ✓ PASS: Student A <-> Student B <-> Guest multi-tenant isolation & cloud cleanup verified!\n');

        await cdp.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: capScript.identifier });

        console.log('========================================================================');
        console.log('🎉 ALL ZERO-DEFAULT ACCOUNT & APK SECURITY E2E TESTS PASSED (100%)!');
        console.log('========================================================================');
    } finally {
        if (cdp) cdp.close();
        try { chrome.kill('SIGKILL'); } catch (e) {}
        if (serverProcess) {
            try { serverProcess.kill('SIGKILL'); } catch (e) {}
        }
        try { fs.rmSync(PROFILE_DIR, { recursive: true, force: true }); } catch (e) {}
    }
}

run().catch(err => {
    console.error('❌ SECURITY SUITE FAILED:', err);
    process.exit(1);
});
