// ==============================================================================
// Browser QA Automation: Physics Variant Selection & Instant Persistence
// File: tests/qa_verify_physics_variant.js
// ==============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const assert = require('assert');

const ARTIFACTS_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\aa7d2a33-2de8-4eeb-b8bd-18c8fdd69b14';
const PORT = 9876;
const SERVER_PORT = 8080;
const TARGET_URL = `http://127.0.0.1:${SERVER_PORT}/?qa_test=1`;
const SCREENSHOT_PATH = path.join(ARTIFACTS_DIR, 'qa_physics_variant_persistence.png');

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
        if (res && res.exceptionDetails) {
            throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
        }
        return res ? res.result && res.result.value : null;
    }
}

async function run() {
    console.log('🚀 Starting Physics Variant Browser QA Verification...');

    let serverProcess = null;
    const listening = await isServerListening(SERVER_PORT);
    if (!listening) {
        console.log(`[Server] Spawning server.js on port ${SERVER_PORT}...`);
        serverProcess = spawn('node', ['server.js'], {
            cwd: path.join(__dirname, '..'),
            stdio: 'ignore'
        });
        await delay(1200);
    }

    const chromeExe = findChrome();
    assert(chromeExe, 'Chrome executable not found on host');

    console.log(`[Chrome] Launching Chrome on port ${PORT}...`);
    const chromeProc = spawn(chromeExe, [
        `--remote-debugging-port=${PORT}`,
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--window-size=1440,900',
        TARGET_URL
    ]);

    await delay(2000);

    try {
        const targets = await getJson(`http://127.0.0.1:${PORT}/json`);
        const page = targets.find(t => t.type === 'page');
        assert(page, 'No page target found in Chrome DevTools Protocol');

        const client = new CDPClient(page.webSocketDebuggerUrl);
        await client.connect();

        await client.send('Page.enable');
        await client.send('Runtime.enable');
        await client.send('DOM.enable');

        console.log('[Page] Waiting for page load and state initialization...');
        await client.eval(`new Promise(r => {
            const check = () => {
                if (window.gameState && window.openCourseDetails && window.selectPhysicsVariant) r(true);
                else setTimeout(check, 100);
            };
            check();
        })`);

        console.log('▶ Step 1: Opening Course Details Modal for Physics 1 (114051)...');
        await client.eval(`window.openCourseDetails('114051');`);
        await delay(800);

        console.log('▶ Step 2: Clicking variant button for Physics 1M (01140071)...');
        const clicked = await client.eval(`(() => {
            const btn = document.querySelector('button[data-variant-code="01140071"]');
            if (!btn) return false;
            btn.click();
            return true;
        })()`);
        assert(clicked, 'Physics 1M button was not found or clicked');
        await delay(800);

        console.log('▶ Step 3: Verifying persistence in gameState and DegreePlanner...');
        const stateP1 = await client.eval(`(() => {
            const userP1 = window.gameState.userSettings && window.gameState.userSettings.physicsVariants && window.gameState.userSettings.physicsVariants.physics1;
            const localP1 = localStorage.getItem('semestero_physics_variant_physics1');
            const cObj = window.gameState.courses['114071'] || window.gameState.courses['01140071'];
            return {
                userP1,
                localP1,
                hasCourse: Boolean(cObj),
                name: cObj ? cObj.name : null,
                credits: cObj ? cObj.credits : null
            };
        })()`);
        console.log('  ✓ Physics 1 state:', stateP1);
        assert.strictEqual(stateP1.userP1, '01140071');
        assert.strictEqual(stateP1.localP1, '01140071');
        assert(stateP1.hasCourse, 'gameState must contain Physics 1M');
        assert.strictEqual(stateP1.name, "פיזיקה 1מ'");
        assert.strictEqual(stateP1.credits, 3.5);

        console.log('▶ Step 4: Closing modal to verify state does not reset upon exit...');
        await client.eval(`(() => {
            const closeBtn = document.getElementById('course-modal-close');
            if (closeBtn) closeBtn.click();
        })()`);
        await delay(600);

        const verifyAfterExit = await client.eval(`(() => {
            const cObj = window.gameState.courses['114071'] || window.gameState.courses['01140071'];
            return { hasCourse: Boolean(cObj), name: cObj ? cObj.name : null };
        })()`);
        console.log('  ✓ State after exit:', verifyAfterExit);
        assert(verifyAfterExit.hasCourse, 'Physics 1M must persist after modal is closed');

        console.log('▶ Step 5: Opening Physics 2 and selecting Physics 2MM (01140075)...');
        await client.eval(`window.openCourseDetails('114052');`);
        await delay(800);

        const clickedP2 = await client.eval(`(() => {
            const btn = document.querySelector('button[data-variant-code="01140075"]');
            if (!btn) return false;
            btn.click();
            return true;
        })()`);
        assert(clickedP2, 'Physics 2MM button was not found or clicked');
        await delay(800);

        const stateP2 = await client.eval(`(() => {
            const userP2 = window.gameState.userSettings && window.gameState.userSettings.physicsVariants && window.gameState.userSettings.physicsVariants.physics2;
            const cObj = window.gameState.courses['114075'] || window.gameState.courses['01140075'];
            return {
                userP2,
                hasCourse: Boolean(cObj),
                name: cObj ? cObj.name : null,
                credits: cObj ? cObj.credits : null
            };
        })()`);
        console.log('  ✓ Physics 2 state:', stateP2);
        assert.strictEqual(stateP2.userP2, '01140075');
        assert(stateP2.hasCourse, 'gameState must contain Physics 2MM');
        assert.strictEqual(stateP2.name, "פיזיקה 2ממ");
        assert.strictEqual(stateP2.credits, 5.0);

        console.log('▶ Step 6: Capturing visual QA screenshot of modal with saved Physics 2MM...');
        const shot = await client.send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(SCREENSHOT_PATH, Buffer.from(shot.data, 'base64'));
        console.log('📸 Screenshot saved:', SCREENSHOT_PATH);

        console.log('🎉 ALL BROWSER QA CHECKS PASSED FOR PHYSICS VARIANT PERSISTENCE!');
    } finally {
        if (serverProcess) serverProcess.kill();
        chromeProc.kill();
    }
}

run().catch(err => {
    console.error('❌ Browser QA Failed:', err);
    process.exit(1);
});
