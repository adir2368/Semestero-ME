const { spawn } = require('child_process');
const http = require('http');
const assert = require('assert');
const path = require('path');
const os = require('os');
const fs = require('fs');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9700 + Math.floor(Math.random() * 200);
const PROFILE_DIR = path.join(os.tmpdir(), `chrome_qa_health_${Date.now()}`);
const SERVER_PORT = 8080;
const TARGET_URL = `http://127.0.0.1:${SERVER_PORT}/?qa_health_test=${Date.now()}`;

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

class CDPClient {
    constructor(wsUrl) {
        this.wsUrl = wsUrl;
        this.id = 1;
        this.callbacks = new Map();
        this.consoleLogs = [];
        this.pageErrors = [];
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.wsUrl);
            this.ws.onopen = () => resolve();
            this.ws.onerror = (err) => reject(err);
            this.ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                if (msg.method === 'Runtime.consoleAPICalled') {
                    const text = (msg.params.args || []).map(a => a.value || a.description || '').join(' ');
                    this.consoleLogs.push({ type: msg.params.type, text });
                }
                if (msg.method === 'Runtime.exceptionThrown') {
                    const desc = msg.params.exceptionDetails.exception ? (msg.params.exceptionDetails.exception.description || msg.params.exceptionDetails.text) : msg.params.exceptionDetails.text;
                    this.pageErrors.push(desc);
                }
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
}

async function run() {
    console.log('========================================================================');
    console.log('🛡️ AUTOMATED SYSTEM HEALTH & REGRESSION TEST SUITE');
    console.log('========================================================================\n');

    let serverProcess = null;
    const serverRunning = await isServerListening(SERVER_PORT);
    if (!serverRunning) {
        console.log(`[Server] Starting server.js on port ${SERVER_PORT}...`);
        serverProcess = spawn('node', ['server.js'], { cwd: path.resolve(__dirname, '..') });
        await delay(2000);
    } else {
        console.log(`[Server] Local server already active on port ${SERVER_PORT}.`);
    }

    console.log(`[Chrome] Launching headless Chrome on port ${PORT}...`);
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

    assert(wsUrl, 'Failed to connect to Chrome DevTools Protocol WebSocket');
    console.log(`✓ Chrome CDP connected successfully`);

    const cdp = new CDPClient(wsUrl);
    await cdp.connect();
    await cdp.send('Runtime.enable');

    // Wait until app.js finishes evaluating and gameState is populated
    console.log('[App] Waiting for scripts and state initialization...');
    let ready = false;
    for (let i = 0; i < 60; i++) {
        await delay(300);
        try {
            const isReady = await cdp.eval(`Boolean(typeof window.forceUpdateApp === 'function' && window.gameState && window.gameState.courses)`);
            if (isReady) {
                ready = true;
                break;
            }
        } catch (e) {}
    }
    assert(ready, 'Timed out waiting for application to initialize fully');
    console.log('✓ Application fully initialized');

    let passed = 0;
    let failed = 0;

    async function test(name, fn) {
        process.stdout.write(`- [TEST] ${name} ... `);
        try {
            await fn();
            console.log('✅ PASSED');
            passed++;
        } catch (err) {
            console.log(`❌ FAILED: ${err.message}`);
            failed++;
        }
    }

    try {
        // Test 1: No critical runtime exceptions during startup
        await test('No uncaught JavaScript exceptions during page load', async () => {
            const criticalErrors = cdp.pageErrors.filter(e => !e.includes('favicon') && !e.includes('net::ERR_'));
            if (criticalErrors.length > 0) {
                throw new Error(`Found ${criticalErrors.length} uncaught exceptions: ${criticalErrors.join(' | ')}`);
            }
        });

        // Test 2: escapeHtml is globally defined and works safely
        await test('escapeHtml is defined globally and sanitizes strings', async () => {
            const result = await cdp.eval(`typeof window.escapeHtml === 'function' && window.escapeHtml('<script>alert("xss")</script>')`);
            assert(typeof result === 'string', 'escapeHtml did not return a string');
            assert(!result.includes('<script>'), 'escapeHtml failed to escape HTML tags');
        });

        // Test 3: Version badge & system version consistency
        await test('Version strings are consistent across DOM and global APP_VERSION', async () => {
            const domSystemVer = await cdp.eval(`document.getElementById("display-system-version")?.innerText`);
            const footerBadgeText = await cdp.eval(`document.getElementById("footer-version-badge")?.innerText`);
            const appVer = await cdp.eval(`window.APP_VERSION`);

            assert(domSystemVer, 'display-system-version element is empty or missing');
            assert(footerBadgeText, 'footer-version-badge element is empty or missing');
            assert(appVer, 'window.APP_VERSION is undefined');
            assert(footerBadgeText.includes(appVer), `Footer badge (${footerBadgeText}) does not match APP_VERSION (${appVer})`);
        });

        // Test 4: Course details modal opens on click without throwing
        await test('Course Details Modal opens cleanly when clicking course in Flowchart', async () => {
            const testCode = await cdp.eval(`Object.keys(window.gameState?.courses || {})[0] || '034010'`);
            const modalOpened = await cdp.eval(`(() => {
                if (typeof window.openCourseDetails !== 'function') return false;
                window.openCourseDetails('${testCode}');
                const modal = document.getElementById('course-modal');
                return modal && modal.classList.contains('active');
            })()`);
            assert(modalOpened, `Failed to open course modal for course ${testCode}`);
        });

        // Test 5: Semester 4 contains exactly the 4 mandatory courses and zero sports courses
        await test('Semester 4 has 4 core courses and 0 sports infiltrators', async () => {
            const sem4Info = await cdp.eval(`(() => {
                // Check both planner plan and gameState.courses
                const plan = (typeof window.plannerModule?.getCustomPlan === 'function' ? window.plannerModule.getCustomPlan() : null) ||
                             window.gameState?.degreePlan ||
                             window.PLANNER_CATALOG?.SUGGESTED_MANDATORY_SYLLABUS || [];
                const sem4 = plan.find(s => s.semester === 4);
                const planCourses = (sem4 && sem4.courses) ? sem4.courses.map(c => c.code) : [];

                const treeCourses = Object.values(window.gameState?.courses || {})
                    .filter(c => c.semester === 4)
                    .map(c => c.code);

                const courses = planCourses.length > 0 ? planCourses : treeCourses;
                return {
                    count: courses.length,
                    courses: courses
                };
            })()`);
            assert.strictEqual(sem4Info.count, 4, `Semester 4 expected 4 courses, but has ${sem4Info.count}: ${sem4Info.courses.join(', ')}`);
            const hasSports = sem4Info.courses.some(c => String(c).startsWith('0394') || String(c) === '03940800' || String(c) === '03940808');
            assert(!hasSports, `Semester 4 still contains sports courses: ${sem4Info.courses.join(', ')}`);
        });

        // Test 6: Physics Lab 1H is in Semester 5
        await test('Physics Lab 1H (114032) is positioned strictly in Semester 5', async () => {
            const labSem = await cdp.eval(`window.gameState?.courses?.['114032']?.semester || window.gameState?.courses?.['01140032']?.semester`);
            assert.strictEqual(labSem, 5, `Physics Lab 1H expected in semester 5, but found in semester ${labSem}`);
        });

        // Test 7: One-click Force Update function is present
        await test('window.forceUpdateApp exists and is a callable function', async () => {
            const fnType = await cdp.eval(`typeof window.forceUpdateApp`);
            assert.strictEqual(fnType, 'function', 'window.forceUpdateApp is not defined');
        });

    } finally {
        console.log(`\n========================================================================`);
        console.log(`SUMMARY: ${passed} passed, ${failed} failed.`);
        console.log(`========================================================================\n`);

        try {
            chrome.kill('SIGKILL');
        } catch (e) {}
        if (serverProcess) {
            try {
                serverProcess.kill('SIGKILL');
            } catch (e) {}
        }
        try {
            fs.rmSync(PROFILE_DIR, { recursive: true, force: true });
        } catch (e) {}

        if (failed > 0) {
            process.exit(1);
        } else {
            process.exit(0);
        }
    }
}

run().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
