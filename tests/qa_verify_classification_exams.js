// ==============================================================================
// Browser QA Automation: Technion Classification Exams (בחינות סיווג) Verification
// File: tests/qa_verify_classification_exams.js
// ==============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const assert = require('assert');

const ARTIFACTS_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\aa7d2a33-2de8-4eeb-b8bd-18c8fdd69b14';
const PORT = 9880;
const SERVER_PORT = 8080;
const TARGET_URL = `http://127.0.0.1:${SERVER_PORT}/?qa_test=1`;
const SCREENSHOT_PATH = path.join(ARTIFACTS_DIR, 'qa_classification_exams_verified.png');

function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function isServerListening(port) {
    return new Promise((resolve) => {
        const req = http.get(`http://127.0.0.1:${port}`, () => resolve(true));
        req.on('error', () => resolve(false));
    });
}

function findChrome() {
    const paths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
    ];
    for (const p of paths) {
        if (p && fs.existsSync(p)) return p;
    }
    return null;
}

function getJson(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
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
        const id = this.id++;
        return new Promise((resolve, reject) => {
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
            console.error('Runtime exception details:', JSON.stringify(res.exceptionDetails, null, 2));
            throw new Error(res.exceptionDetails.text || 'Runtime exception');
        }
        return res.result ? res.result.value : undefined;
    }

    close() {
        if (this.ws) this.ws.close();
    }
}

async function main() {
    console.log('========================================================================');
    console.log('🏛️ QA AUDIT: TECHNION CLASSIFICATION EXAMS (בחינות סיווג) & V2.8.9');
    console.log('========================================================================\n');

    let serverProcess = null;
    let chromeProcess = null;

    try {
        const serverRunning = await isServerListening(SERVER_PORT);
        if (!serverRunning) {
            console.log(`[Server] Starting HTTP server on port ${SERVER_PORT}...`);
            serverProcess = spawn('node', ['server.js'], {
                cwd: path.resolve(__dirname, '..'),
                stdio: 'ignore',
                detached: false
            });
            await delay(1500);
        }

        const chromePath = findChrome();
        if (!chromePath) throw new Error('Chrome executable not found');

        console.log(`[Chrome] Launching Chrome on port ${PORT}...`);
        const userDataDir = path.join(require('os').tmpdir(), 'chrome_qa_classification_' + Date.now());
        chromeProcess = spawn(chromePath, [
            `--remote-debugging-port=${PORT}`,
            `--user-data-dir=${userDataDir}`,
            '--headless=new',
            '--no-first-run',
            '--no-default-browser-check',
            '--disable-gpu',
            '--window-size=1280,960'
        ], { stdio: 'ignore' });

        await delay(2000);

        const versionInfo = await getJson(`http://127.0.0.1:${PORT}/json/version`);
        console.log('✓ Chrome connected:', versionInfo['User-Agent']);

        const targets = await getJson(`http://127.0.0.1:${PORT}/json/list`);
        const target = targets.find(t => t.type === 'page');
        if (!target) throw new Error('No target page found');

        const cdp = new CDPClient(target.webSocketDebuggerUrl);
        await cdp.connect();
        console.log('✓ CDP WebSocket active');

        await cdp.send('Page.enable');
        await cdp.send('Runtime.enable');
        await cdp.send('Page.navigate', { url: TARGET_URL });
        console.log(`[Page] Navigating to ${TARGET_URL}...`);

        await delay(3000);

        // 1. Verify Application Version & System Badge
        console.log('\n--- Test 1: Verify v2.8.9 Version Badges ---');
        const appVersion = await cdp.evaluate('window.APP_VERSION || (APP_CURRENT_REVISION && APP_CURRENT_REVISION.version)');
        console.log('App version evaluated:', appVersion);
        assert.strictEqual(appVersion, '2.8.9', 'App version must be 2.8.9');

        const badgeVersion = await cdp.evaluate(`
            document.getElementById('display-system-version') ? document.getElementById('display-system-version').innerText : ''
        `);
        console.log('System version badge text:', badgeVersion);
        assert.ok(badgeVersion.includes('2.8.9'), 'display-system-version badge must contain 2.8.9');

        // 2. Verify Degree Planner Classification Exams Card
        console.log('\n--- Test 2: Degree Planner Classification Exams Card ---');
        const cardExists = await cdp.evaluate(`(() => {
            const card = document.querySelector('.planner-classification-card');
            const mech = document.getElementById('select-classification-mechanics');
            const elec = document.getElementById('select-classification-electricity');
            const math = document.getElementById('select-classification-math');
            const badge = document.getElementById('planner-classification-badge');
            return {
                cardFound: !!card,
                mechVal: mech ? mech.value : null,
                elecVal: elec ? elec.value : null,
                mathVal: math ? math.value : null,
                badgeText: badge ? badge.innerText : null
            };
        })()`);
        console.log('Planner classification card evaluated:', cardExists);
        assert.ok(cardExists.cardFound, 'Planner classification card must exist in DOM');
        assert.ok(cardExists.badgeText.includes('תקין'), 'Default badge must be תקין');

        // 3. Open Course Modal for Physics 1 (114051)
        console.log('\n--- Test 3: Course Modal Classification Selector (Physics 1) ---');
        const modalPhys1 = await cdp.evaluate(`(() => {
            if (typeof openCourseDetails === 'function') {
                openCourseDetails('01140051');
            }
            const modal = document.getElementById('course-modal');
            const classContainer = document.getElementById('modal-classification-exam-container');
            return {
                modalActive: modal && modal.classList.contains('active'),
                containerHtml: classContainer ? classContainer.innerHTML.length : 0,
                hasButtons: classContainer ? classContainer.querySelectorAll('button[data-classification-val]').length : 0
            };
        })()`);
        console.log('Physics 1 modal details:', modalPhys1);
        assert.ok(modalPhys1.modalActive, 'Course modal must be open');
        assert.ok(modalPhys1.hasButtons >= 3, 'Must render classification buttons');

        // 4. Test Interactive Pill Button Click inside Course Modal
        console.log('\n--- Test 4: Interactive Pill Button Click inside Course Modal ---');
        const toggleResult = await cdp.evaluate(`(() => {
            const pendingBtn = document.querySelector('#modal-classification-exam-container button[data-classification-val="pending"]');
            if (pendingBtn) {
                pendingBtn.click();
            }
            const statusAfterPending = window.getClassificationExamStatus('mechanics');
            const savedLocalPending = localStorage.getItem('semestero_classification_mechanics');

            // Now click back to exempt_bagrut
            const bagrutBtn = document.querySelector('#modal-classification-exam-container button[data-classification-val="exempt_bagrut"]');
            if (bagrutBtn) {
                bagrutBtn.click();
            }
            const statusAfterBagrut = window.getClassificationExamStatus('mechanics');
            const savedLocalBagrut = localStorage.getItem('semestero_classification_mechanics');

            return {
                statusAfterPending,
                savedLocalPending,
                statusAfterBagrut,
                savedLocalBagrut
            };
        })()`);
        console.log('Toggle result:', toggleResult);
        assert.strictEqual(toggleResult.statusAfterPending, 'pending', 'Status after clicking pending must be pending');
        assert.strictEqual(toggleResult.savedLocalPending, 'pending', 'LocalStorage must reflect pending');
        assert.strictEqual(toggleResult.statusAfterBagrut, 'exempt_bagrut', 'Status after clicking bagrut must be exempt_bagrut');
        assert.strictEqual(toggleResult.savedLocalBagrut, 'exempt_bagrut', 'LocalStorage must reflect exempt_bagrut');

        // 5. Open Course Modal for Calculus 1 (104041)
        console.log('\n--- Test 5: Course Modal Classification Selector (Calculus 1) ---');
        const modalMath = await cdp.evaluate(`(() => {
            if (typeof openCourseDetails === 'function') {
                openCourseDetails('01040041');
            }
            const classContainer = document.getElementById('modal-classification-exam-container');
            return {
                mathContainerText: classContainer ? classContainer.innerText : ''
            };
        })()`);
        console.log('Math modal text preview:', modalMath.mathContainerText.substring(0, 80));
        assert.ok(modalMath.mathContainerText.includes('מתמטיקה'), 'Container must show Math classification for Calculus');

        // Capture visual proof screenshot
        console.log(`\n[Screenshot] Capturing browser proof to ${SCREENSHOT_PATH}...`);
        const shot = await cdp.send('Page.captureScreenshot', { format: 'png', quality: 90 });
        fs.writeFileSync(SCREENSHOT_PATH, Buffer.from(shot.data, 'base64'));
        console.log('✓ Screenshot successfully saved!\n');

        cdp.close();

        console.log('========================================================================');
        console.log('🎉 QA AUDIT 100% SUCCESS: TECHNION CLASSIFICATION EXAMS FULLY VERIFIED!');
        console.log('========================================================================');

    } finally {
        if (chromeProcess) chromeProcess.kill();
        if (serverProcess) serverProcess.kill();
    }
}

main().catch(err => {
    console.error('QA Test Failed:', err);
    process.exit(1);
});
