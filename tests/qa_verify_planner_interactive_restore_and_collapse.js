// ==============================================================================
// Browser QA Automation: Degree Planner Interactive Restore & Collapsible Classification Card
// File: tests/qa_verify_planner_interactive_restore_and_collapse.js
// ==============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const assert = require('assert');

const ARTIFACTS_DIR = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\aa7d2a33-2de8-4eeb-b8bd-18c8fdd69b14';
const PORT = 9883;
const SERVER_PORT = 8899;
const TARGET_URL = `http://127.0.0.1:${SERVER_PORT}/?qa_test=1`;
const SCREENSHOT_PATH = path.join(ARTIFACTS_DIR, 'qa_planner_interactive_restore_and_collapse.png');

function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function startStaticServer(port) {
    const rootDir = path.resolve(__dirname, '..');
    return new Promise((resolve) => {
        const server = http.createServer((req, res) => {
            let reqPath = req.url.split('?')[0];
            if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
            const filePath = path.join(rootDir, reqPath);
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.writeHead(404);
                    res.end('Not Found');
                    return;
                }
                const ext = path.extname(filePath).toLowerCase();
                const mimes = {
                    '.html': 'text/html; charset=utf-8',
                    '.js': 'application/javascript; charset=utf-8',
                    '.css': 'text/css; charset=utf-8',
                    '.json': 'application/json',
                    '.png': 'image/png',
                    '.svg': 'image/svg+xml'
                };
                res.writeHead(200, {
                    'Content-Type': mimes[ext] || 'application/octet-stream',
                    'Cache-Control': 'no-cache, no-store, must-revalidate'
                });
                res.end(data);
            });
        });
        server.listen(port, '127.0.0.1', () => resolve(server));
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
            const reqId = this.id++;
            this.callbacks.set(reqId, { resolve, reject });
            this.ws.send(JSON.stringify({ id: reqId, method, params }));
        });
    }

    async evaluate(expression) {
        const res = await this.send('Runtime.evaluate', {
            expression,
            returnByValue: true,
            awaitPromise: true
        });
        if (res.exceptionDetails) {
            throw new Error(`Evaluation failed: ${JSON.stringify(res.exceptionDetails)}`);
        }
        return res.result ? res.result.value : undefined;
    }

    close() {
        if (this.ws) this.ws.close();
    }
}

async function main() {
    console.log('========================================================================');
    console.log('🚀 QA BROWSER AUTOMATION: DEGREE PLANNER INTERACTIVE RESTORE & COLLAPSE');
    console.log('========================================================================\n');

    let serverProcess = null;
    let chromeProcess = null;
    let client = null;

    try {
        console.log(`Starting clean in-process static HTTP server on port ${SERVER_PORT}...`);
        serverProcess = await startStaticServer(SERVER_PORT);
        console.log(`Server listening on http://127.0.0.1:${SERVER_PORT}.`);

        const chromePath = findChrome();
        assert.ok(chromePath, 'Chrome executable must exist');
        console.log(`Found Chrome: ${chromePath}`);

        const tmpProfile = path.join(require('os').tmpdir(), 'chrome_qa_planner_restore_' + Date.now());
        console.log(`Launching Chrome with debugging port ${PORT}...`);
        chromeProcess = spawn(chromePath, [
            `--remote-debugging-port=${PORT}`,
            `--user-data-dir=${tmpProfile}`,
            '--headless=new',
            '--disable-gpu',
            '--no-first-run',
            '--no-default-browser-check',
            'about:blank'
        ]);

        await delay(2500);

        const versionInfo = await getJson(`http://127.0.0.1:${PORT}/json/version`);
        console.log(`Chrome WebSocket Debugger URL: ${versionInfo.webSocketDebuggerUrl}`);

        const targets = await getJson(`http://127.0.0.1:${PORT}/json/list`);
        const pageTarget = targets.find(t => t.type === 'page');
        assert.ok(pageTarget, 'Page target must be available');

        client = new CDPClient(pageTarget.webSocketDebuggerUrl);
        await client.connect();
        console.log('Connected to Chrome DevTools Protocol.');

        await client.send('Page.enable');
        await client.send('Runtime.enable');
        await client.send('Emulation.setDeviceMetricsOverride', {
            width: 1366,
            height: 900,
            deviceScaleFactor: 1,
            mobile: false
        });

        console.log(`Navigating to ${TARGET_URL}...`);
        await client.send('Page.navigate', { url: TARGET_URL });
        await delay(3000);

        // 1. Switch to Degree Planner Tab
        console.log('1. Switching to Degree Planner Tab...');
        await client.evaluate(`(() => {
            if (typeof switchTab === 'function') switchTab('planner');
            if (typeof DegreePlanner !== 'undefined' && DegreePlanner.renderDegreePlanner) DegreePlanner.renderDegreePlanner();
        })()`);
        await delay(1200);

        // 2. Test Classification Card Collapsible Toggle
        console.log('2. Testing Classification Card Collapsible Toggle...');
        const initialCollapseState = await client.evaluate(`(() => {
            const body = document.getElementById('planner-classification-body');
            const btn = document.getElementById('btn-toggle-classification-card');
            return {
                bodyDisplay: body ? window.getComputedStyle(body).display : null,
                btnText: btn ? btn.innerText.trim() : null
            };
        })()`);
        console.log('   Initial classification state:', initialCollapseState);
        assert.ok(initialCollapseState.bodyDisplay !== 'none', 'Classification body should initially be visible');
        assert.strictEqual(initialCollapseState.btnText, '▼', 'Toggle button text should initially be ▼');

        // Click header / toggle button to collapse
        console.log('   Clicking collapse button...');
        await client.evaluate(`(() => {
            const btn = document.getElementById('btn-toggle-classification-card');
            if (btn) btn.click();
        })()`);
        await delay(300);

        const collapsedState = await client.evaluate(`(() => {
            const body = document.getElementById('planner-classification-body');
            const btn = document.getElementById('btn-toggle-classification-card');
            return {
                bodyDisplay: body ? window.getComputedStyle(body).display : null,
                btnText: btn ? btn.innerText.trim() : null,
                stored: localStorage.getItem('semestero_classification_collapsed')
            };
        })()`);
        console.log('   Collapsed state:', collapsedState);
        assert.strictEqual(collapsedState.bodyDisplay, 'none', 'Classification body must now be hidden (display: none)');
        assert.strictEqual(collapsedState.btnText, '◀', 'Toggle button text must flip to ◀');
        assert.strictEqual(collapsedState.stored, 'true', 'localStorage must persist collapsed=true');
        console.log('   ✓ Collapsible card toggled to collapsed and persisted successfully.');

        // Toggle back to expanded for completeness
        console.log('   Clicking expand button...');
        await client.evaluate(`(() => {
            const btn = document.getElementById('btn-toggle-classification-card');
            if (btn) btn.click();
        })()`);
        await delay(300);

        // 3. Test Interactive Mandatory Course Restore
        console.log('3. Testing Interactive Mandatory Course Restore & Semester Picker...');
        // Prepare state: remove Physics 2 (114052) so it appears in missing mandatory list
        await client.evaluate(`(() => {
            const phys2Codes = ['01140052', '114052', '01140075', '114075', '01140078', '114078', '01140076', '114076'];
            const cPlan = DegreePlanner.getCustomPlan();
            if (cPlan) {
                cPlan.forEach(sem => {
                    sem.courses = (sem.courses || []).filter(c => !phys2Codes.includes(c.code) && !phys2Codes.includes(c.altCode));
                });
            }
            if (window.gameState && window.gameState.courses) {
                phys2Codes.forEach(k => {
                    if (window.gameState.courses[k]) {
                        window.gameState.courses[k].status = 'available';
                        delete window.gameState.courses[k].grade;
                    }
                });
            }
            if (window.gameState && Array.isArray(window.gameState.removedCourses)) {
                // Ensure it was tracked in removedCourses to rigorously test unremoveCourseFromGameState
                if (!window.gameState.removedCourses.includes('114052')) window.gameState.removedCourses.push('114052');
                if (!window.gameState.removedCourses.includes('114075')) window.gameState.removedCourses.push('114075');
            }
            DegreePlanner.saveCustomPlan(true);
            DegreePlanner.renderDegreePlanner();
        })()`);
        await delay(800);

        const missingAlertCheck = await client.evaluate(`(() => {
            const list = document.querySelector('.planner-missing-mandatory-list');
            const btns = list ? Array.from(list.querySelectorAll('.btn-restore-mandatory')).map(b => ({
                text: b.innerText.trim(),
                code: b.getAttribute('data-code')
            })) : [];
            const isPhys2Code = c => ['01140052', '114052', '01140075', '114075', '1140052', '1140075'].includes(c);
            const p2Btn = btns.find(b => isPhys2Code(b.code));
            return {
                hasList: !!list,
                allButtons: btns,
                p2Btn: p2Btn || null
            };
        })()`);
        console.log('   Missing mandatory list status:', missingAlertCheck);
        assert.ok(missingAlertCheck.p2Btn, 'Restore button for Physics 2 must exist in missing list');
        assert.ok(missingAlertCheck.p2Btn.text.includes('הוסף'), 'Button text must be "➕ הוסף" (not "החזר")');
        console.log(`   ✓ Button text confirmed: "${missingAlertCheck.p2Btn.text}"`);

        // Click "➕ הוסף" to open the interactive semester picker
        console.log('   Clicking "➕ הוסף" for Physics 2...');
        await client.evaluate(`(() => {
            const list = document.querySelector('.planner-missing-mandatory-list');
            const btns = Array.from(list.querySelectorAll('.btn-restore-mandatory'));
            const isPhys2Code = c => ['01140052', '114052', '01140075', '114075', '1140052', '1140075'].includes(c);
            const p2Btn = btns.find(b => isPhys2Code(b.getAttribute('data-code')));
            if (p2Btn) p2Btn.click();
        })()`);
        await delay(500);

        const pickerModalCheck = await client.evaluate(`(() => {
            const modal = document.getElementById('planner-sem-picker-modal');
            const title = modal ? modal.querySelector('h3') : null;
            const sem3Btn = modal ? modal.querySelector('.sem-choice-btn[data-semester="3"]') : null;
            return {
                modalOpen: !!modal,
                titleText: title ? title.innerText.trim() : null,
                sem3Disabled: sem3Btn ? sem3Btn.disabled : null
            };
        })()`);
        console.log('   Picker modal status:', pickerModalCheck);
        assert.ok(pickerModalCheck.modalOpen, 'Semester picker modal must open');
        assert.ok(pickerModalCheck.titleText.includes('פיזיקה 2'), 'Modal title must name Physics 2');
        assert.strictEqual(pickerModalCheck.sem3Disabled, false, 'Semester 3 must be available and enabled for Physics 2');
        console.log('   ✓ Semester picker modal opened with available semesters.');

        // Pick Semester 3
        console.log('   Selecting Semester 3 in picker modal...');
        await client.evaluate(`(() => {
            const modal = document.getElementById('planner-sem-picker-modal');
            const sem3Btn = modal ? modal.querySelector('.sem-choice-btn[data-semester="3"]') : null;
            if (sem3Btn) sem3Btn.click();
        })()`);
        await delay(1000);

        // Verify Physics 2 is now in Semester 3 and NOT purged after debounce/state notification
        const placementCheck = await client.evaluate(`(() => {
            const cPlan = DegreePlanner.getCustomPlan();
            const sem3 = cPlan ? cPlan.find(s => s.semester === 3) : null;
            const p2InSem3 = sem3 ? (sem3.courses || []).some(c => c.code.includes('114052') || (c.altCode && c.altCode.includes('114052'))) : false;
            const inRemoved = window.gameState && Array.isArray(window.gameState.removedCourses)
                ? window.gameState.removedCourses.includes('114052') || window.gameState.removedCourses.includes('114075')
                : false;
            return {
                p2InSem3,
                inRemoved
            };
        })()`);
        console.log('   Placement result (immediate):', placementCheck);
        assert.ok(placementCheck.p2InSem3, 'Physics 2 must be placed in Semester 3');
        assert.strictEqual(placementCheck.inRemoved, false, 'Physics 2 must be cleansed from gameState.removedCourses');

        // Wait another 1.2s to verify it does not revert / disappear
        console.log('   Waiting 1.2s to confirm stability (no reversion / disappear bug)...');
        await delay(1200);

        const permanentCheck = await client.evaluate(`(() => {
            const cPlan = DegreePlanner.getCustomPlan();
            const sem3 = cPlan ? cPlan.find(s => s.semester === 3) : null;
            const p2InSem3 = sem3 ? (sem3.courses || []).some(c => c.code.includes('114052') || (c.altCode && c.altCode.includes('114052'))) : false;
            return { p2InSem3 };
        })()`);
        console.log('   Placement result (after delay):', permanentCheck);
        assert.ok(permanentCheck.p2InSem3, 'Physics 2 must stay permanently placed in Semester 3 without disappearing!');
        console.log('   ✓ Physics 2 successfully placed in Semester 3 and retained without disappearing!');

        // 4. Capture screenshot
        console.log('4. Capturing verification screenshot...');
        const screenshotData = await client.send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(SCREENSHOT_PATH, Buffer.from(screenshotData.data, 'base64'));
        console.log(`   ✓ Screenshot saved to: ${SCREENSHOT_PATH}\n`);

        console.log('========================================================================');
        console.log('🎉 ALL DEGREE PLANNER INTERACTIVE RESTORE & COLLAPSE TESTS PASSED!');
        console.log('========================================================================');

    } catch (err) {
        console.error('❌ TEST FAILED:', err);
        process.exitCode = 1;
    } finally {
        if (client) client.close();
        if (chromeProcess) chromeProcess.kill();
        if (serverProcess && typeof serverProcess.close === 'function') serverProcess.close();
    }
}

main();
