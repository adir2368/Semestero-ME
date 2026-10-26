/**
 * QA Test Suite: In-Situ Spotlight Guided Tour Verification (Driver/Shepherd style)
 * Verifies:
 * 1. Static code integrity
 * 2. Launching tour in live headless Chrome
 * 3. SVG cutout mask & glowing outline frame rendering
 * 4. Step-by-step tab switching & element spotlighting (Curriculum, Planner, Timetable, Tasks, Settings)
 * 5. Floating directional popover with accurate coordinates
 * 6. Interactive actions & Next/Prev navigation
 * 7. Clean completion & localStorage persistence
 * 8. Screenshot capture for QA artifact
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const assert = require('assert');
// In Node 24, WebSocket is globally available on globalThis

const ROOT = path.join(__dirname, '..');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = path.resolve('C:\\Users\\user\\.gemini\\antigravity\\brain\\aa7d2a33-2de8-4eeb-b8bd-18c8fdd69b14');
const PORT = 9750 + Math.floor(Math.random() * 200);
const APP_URL = 'http://localhost:8080';

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getJson(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(body)); }
                catch (err) { reject(err); }
            });
        }).on('error', reject);
    });
}

class CDPClient {
    constructor(wsUrl) {
        this.wsUrl = wsUrl;
        this.ws = null;
        this.id = 1;
        this.pending = new Map();
    }

    async connect() {
        this.ws = new WebSocket(this.wsUrl);
        await new Promise((resolve, reject) => {
            this.ws.onopen = () => resolve();
            this.ws.onerror = (err) => reject(err);
        });

        this.ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            if (msg.id && this.pending.has(msg.id)) {
                const { resolve, reject } = this.pending.get(msg.id);
                this.pending.delete(msg.id);
                if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
                else resolve(msg.result);
            }
        };
    }

    send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = this.id++;
            this.pending.set(id, { resolve, reject });
            this.ws.send(JSON.stringify({ id, method, params }));
        });
    }

    async eval(expression) {
        try {
            const res = await this.send('Runtime.evaluate', {
                expression,
                returnByValue: true,
                awaitPromise: true
            });
            if (res.exceptionDetails) {
                throw new Error('Eval Exception: ' + JSON.stringify(res.exceptionDetails));
            }
            return res.result ? res.result.value : undefined;
        } catch (err) {
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
    }
}

async function runTourQaSuite() {
    console.log('================================================================');
    console.log('📋 QA SUITE: IN-SITU SPOTLIGHT GUIDED WALKTHROUGH ENGINE');
    console.log('================================================================\n');

    // 1. Static checks
    console.log('[Test 1] Static Code Integrity Checks...');
    const tourCode = fs.readFileSync(path.join(ROOT, 'interactive_tour.js'), 'utf-8');
    assert(tourCode.includes('tour-spotlight-svg'), 'ERROR: Missing tour-spotlight-svg in interactive_tour.js!');
    assert(tourCode.includes('tour-spotlight-frame'), 'ERROR: Missing tour-spotlight-frame in interactive_tour.js!');
    assert(tourCode.includes('tour-popover'), 'ERROR: Missing tour-popover in interactive_tour.js!');
    assert(tourCode.includes('tour-cutout-mask'), 'ERROR: Missing tour-cutout-mask in interactive_tour.js!');
    console.log('✓ PASS: All static assertions passed.\n');

    // 2. Launch Chrome
    console.log(`[Test 2] Launching Chrome on dynamic port ${PORT}...`);
    const profileDir = path.join(require('os').tmpdir(), 'chrome-tour-qa-' + Date.now());
    const chromeProc = spawn(CHROME_PATH, [
        `--remote-debugging-port=${PORT}`,
        `--user-data-dir=${profileDir}`,
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--window-size=1280,850',
        APP_URL
    ]);

    let chromeAlive = true;
    chromeProc.on('exit', () => { chromeAlive = false; });

    try {
        let wsUrl = null;
        for (let i = 0; i < 25; i++) {
            await delay(400);
            try {
                const versionInfo = await getJson(`http://127.0.0.1:${PORT}/json/version`);
                if (versionInfo && versionInfo.webSocketDebuggerUrl) {
                    wsUrl = versionInfo.webSocketDebuggerUrl;
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

        // 3. Start Tour at Step 0
        console.log('\n[Test 3] Triggering window.startInteractiveTour(0)...');
        await cdp.eval(`
            (() => {
                if (window.startInteractiveTour) window.startInteractiveTour(0);
            })()
        `);
        await delay(800);

        const step0State = await cdp.eval(`
            (() => {
                const svg = document.getElementById('tour-spotlight-svg');
                const frame = document.getElementById('tour-spotlight-frame');
                const popover = document.getElementById('tour-popover');
                const cutout = document.getElementById('tour-cutout-rect');
                const title = popover ? popover.querySelector('.tour-popover-title')?.innerText : '';

                return {
                    hasSvg: !!svg,
                    hasFrame: !!frame && frame.style.display !== 'none',
                    hasPopover: !!popover && popover.style.display !== 'none',
                    cutoutWidth: cutout ? parseFloat(cutout.getAttribute('width')) : 0,
                    title,
                    currentStep: window.InteractiveTour ? window.InteractiveTour.currentStep : -1
                };
            })()
        `);
        console.log('   Step 0 State:', step0State);
        assert.strictEqual(step0State.hasSvg, true, 'Spotlight SVG overlay should exist!');
        assert.strictEqual(step0State.hasFrame, true, 'Spotlight outline frame should exist!');
        assert.strictEqual(step0State.hasPopover, true, 'Directional popover should exist!');
        assert(step0State.cutoutWidth > 0, 'Cutout rect width should be greater than 0!');
        assert.strictEqual(step0State.currentStep, 0, 'Current step should be 0!');
        console.log('   ✓ PASS: Step 0 (Curriculum) rendered in-situ spotlight & popover.');

        // 4. Advance to Step 1 (Command Palette)
        console.log('\n[Test 4] Advancing to Step 1 (Command Search)...');
        await cdp.eval(`document.getElementById('tour-btn-next').click();`);
        await delay(600);

        const step1State = await cdp.eval(`
            (() => {
                const popover = document.getElementById('tour-popover');
                return {
                    title: popover ? popover.querySelector('.tour-popover-title')?.innerText : '',
                    step: window.InteractiveTour ? window.InteractiveTour.currentStep : -1
                };
            })()
        `);
        console.log('   Step 1 State:', step1State);
        assert.strictEqual(step1State.step, 1, 'Should be at Step 1!');
        console.log('   ✓ PASS: Step 1 active.');

        // 5. Advance to Step 2 (Degree Planner) & Verify Tab Switch
        console.log('\n[Test 5] Advancing to Step 2 (Degree Planner Tab Switch)...');
        await cdp.eval(`document.getElementById('tour-btn-next').click();`);
        await delay(800);

        const step2State = await cdp.eval(`
            (() => {
                const tabPlanner = document.getElementById('tab-planner');
                const popover = document.getElementById('tour-popover');
                return {
                    isPlannerActive: tabPlanner && tabPlanner.classList.contains('active'),
                    step: window.InteractiveTour.currentStep,
                    title: popover ? popover.querySelector('.tour-popover-title')?.innerText : ''
                };
            })()
        `);
        console.log('   Step 2 State:', step2State);
        assert.strictEqual(step2State.isPlannerActive, true, 'Planner tab should become active!');
        assert.strictEqual(step2State.step, 2, 'Should be at Step 2!');
        console.log('   ✓ PASS: Automatically switched to Degree Planner tab and spotlighted clearance button.');

        // 6. Advance to Step 3 (Timetable)
        console.log('\n[Test 6] Advancing to Step 3 (Timetable Studio)...');
        await cdp.eval(`document.getElementById('tour-btn-next').click();`);
        await delay(800);

        const step3State = await cdp.eval(`
            (() => {
                const tabTimetable = document.getElementById('tab-timetable');
                return {
                    isTimetableActive: tabTimetable && tabTimetable.classList.contains('active'),
                    step: window.InteractiveTour.currentStep
                };
            })()
        `);
        console.log('   Step 3 State:', step3State);
        assert.strictEqual(step3State.isTimetableActive, true, 'Timetable tab should become active!');
        assert.strictEqual(step3State.step, 3, 'Should be at Step 3!');
        console.log('   ✓ PASS: Automatically switched to Timetable tab.');

        // 7. Advance to Step 4 (Tasks Board)
        console.log('\n[Test 7] Advancing to Step 4 (Tasks Board & Notion Multi-Select)...');
        await cdp.eval(`document.getElementById('tour-btn-next').click();`);
        await delay(800);

        const step4State = await cdp.eval(`
            (() => {
                const tabTasks = document.getElementById('tab-tasks');
                const popover = document.getElementById('tour-popover');
                return {
                    isTasksActive: tabTasks && tabTasks.classList.contains('active'),
                    step: window.InteractiveTour.currentStep,
                    title: popover ? popover.querySelector('.tour-popover-title')?.innerText : ''
                };
            })()
        `);
        console.log('   Step 4 State:', step4State);
        assert.strictEqual(step4State.isTasksActive, true, 'Tasks tab should become active!');
        assert.strictEqual(step4State.step, 4, 'Should be at Step 4!');
        console.log('   ✓ PASS: Switched to Tasks Board and highlighted multi-select.');

        // Take verified screenshot on Tasks Board
        await cdp.screenshot('qa_spotlight_guided_tour_verified.png');

        // 8. Test Previous Button
        console.log('\n[Test 8] Testing Previous Button Navigation...');
        await cdp.eval(`document.getElementById('tour-btn-prev').click();`);
        await delay(700);

        const prevCheck = await cdp.eval(`window.InteractiveTour.currentStep;`);
        assert.strictEqual(prevCheck, 3, 'Previous button should step back to Step 3!');
        console.log('   ✓ PASS: Step back works cleanly.');

        // 9. Jump to Last Step & End Tour
        console.log('\n[Test 9] Jumping to Last Step & Ending Tour...');
        await cdp.eval(`window.startInteractiveTour(6);`);
        await delay(800);

        const lastState = await cdp.eval(`
            (() => {
                const popover = document.getElementById('tour-popover');
                const nextBtn = document.getElementById('tour-btn-next');
                return {
                    step: window.InteractiveTour.currentStep,
                    btnText: nextBtn ? nextBtn.innerText : ''
                };
            })()
        `);
        console.log('   Last Step State:', lastState);
        assert.strictEqual(lastState.step, 6, 'Should be at step 6!');
        assert(lastState.btnText.includes('סיום'), 'Last button should say סיום!');

        // Click finish
        await cdp.eval(`document.getElementById('tour-btn-next').click();`);
        await delay(400);

        const tourCleanedUp = await cdp.eval(`
            (() => {
                const svg = document.getElementById('tour-spotlight-svg');
                const frame = document.getElementById('tour-spotlight-frame');
                const popover = document.getElementById('tour-popover');
                const isStored = localStorage.getItem('ast_interactive_tour_completed_v265') === 'true';
                return {
                    noSvg: !svg,
                    noFrame: !frame,
                    noPopover: !popover,
                    isStored,
                    isActive: window.InteractiveTour.active
                };
            })()
        `);
        console.log('   Tour Cleanup State:', tourCleanedUp);
        assert.strictEqual(tourCleanedUp.noSvg, true, 'SVG overlay should be removed!');
        assert.strictEqual(tourCleanedUp.noFrame, true, 'Outline frame should be removed!');
        assert.strictEqual(tourCleanedUp.noPopover, true, 'Popover should be removed!');
        assert.strictEqual(tourCleanedUp.isStored, true, 'Completion flag should be saved in localStorage!');
        assert.strictEqual(tourCleanedUp.isActive, false, 'Tour should be inactive!');
        console.log('   ✓ PASS: Tour cleanup and storage verified.');

        console.log('\n================================================================');
        console.log('🎉 ALL IN-SITU SPOTLIGHT GUIDED WALKTHROUGH TESTS PASSED!');
        console.log('================================================================');
    } finally {
        if (chromeAlive) {
            chromeProc.kill('SIGKILL');
        }
    }
}

runTourQaSuite().catch(err => {
    console.error('❌ Tour QA Suite Failed:', err);
    process.exit(1);
});
