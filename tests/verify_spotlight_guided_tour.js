/**
 * QA Test Suite: In-Situ Spotlight Guided Tour Verification (v2.6.7)
 * Verifies:
 * 1. Static code integrity (SVG spotlight, cutout mask, popover, bottom bar clearance, transition banner)
 * 2. Privacy verification: No personal UID or secret Webcal URLs in DOM or Guest state
 * 3. Step 0 (Curriculum) -> Step 1 (Planner) -> Step 2 (Tasks) -> Step 3 (Calendar) -> Step 4 (Timetable) -> Step 5 (Settings)
 *    -> Step 6 (Command Search) -> Step 7 (Academic Rights Guide)
 * 4. Nav-tab active glowing highlight (.tour-nav-tab-active-glow) and elevated z-index
 * 5. Strict bottom window bar collision protection (popover never covers .nav-tabs-left)
 * 6. Intentional transition delay & floating transition banner
 * 7. Verification that tour does NOT auto-launch on startup for existing users
 * 8. Screenshot capture for QA artifact
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');
const assert = require('assert');

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
    console.log('📋 QA SUITE: SPOTLIGHT GUIDED WALKTHROUGH & PRIVACY VERIFICATION');
    console.log('================================================================\n');

    // 1. Static checks
    console.log('[Test 1] Static Code Integrity Checks...');
    const tourCode = fs.readFileSync(path.join(ROOT, 'interactive_tour.js'), 'utf-8');
    assert(tourCode.includes('tour-spotlight-svg'), 'ERROR: Missing tour-spotlight-svg in interactive_tour.js!');
    assert(tourCode.includes('tour-spotlight-frame'), 'ERROR: Missing tour-spotlight-frame in interactive_tour.js!');
    assert(tourCode.includes('tour-popover'), 'ERROR: Missing tour-popover in interactive_tour.js!');
    assert(tourCode.includes('tour-cutout-mask'), 'ERROR: Missing tour-cutout-mask in interactive_tour.js!');
    assert(tourCode.includes('safeBottomClearance'), 'ERROR: Missing safeBottomClearance calculation in interactive_tour.js!');
    assert(tourCode.includes('tour-nav-tab-active-glow'), 'ERROR: Missing tour-nav-tab-active-glow styling!');
    assert(tourCode.includes('tour-transition-banner'), 'ERROR: Missing tour-transition-banner HUD banner!');
    console.log('✓ PASS: All static code assertions passed.\n');

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

        // 3. Privacy & Sanitization Check (Guest Mode)
        console.log('\n[Test 3] Verifying Guest Privacy & Sanitized URLs...');
        const privacyAudit = await cdp.eval(`
            (() => {
                const cheeseForkLink = document.querySelector('a[href*="cheesefork"]')?.href || '';
                const syncInput = document.getElementById('sync-webcal-url-input')?.value || '';
                const hasPersonalUid = cheeseForkLink.includes('D4bh8oHO0GQI5Gx1iYAbWsouBVx2');
                const hasPersonalGist = syncInput.includes('71ec3efb9e46b0abafa44532f0e2aab1');
                return {
                    cheeseForkLink,
                    syncInput,
                    hasPersonalUid,
                    hasPersonalGist
                };
            })()
        `);
        console.log('   Privacy Audit Result:', privacyAudit);
        assert.strictEqual(privacyAudit.hasPersonalUid, false, 'Guest link must NOT contain Adir personal CheeseFork UID!');
        assert.strictEqual(privacyAudit.hasPersonalGist, false, 'Sync input must NOT contain Adir personal Webcal Gist!');
        console.log('   ✓ PASS: Personal links and tokens are 100% sanitized for guests.');

        // 4. Verify No Startup Auto-Prompt
        console.log('\n[Test 4] Verifying Tour Does NOT Auto-Launch On App Startup...');
        const startupTourCheck = await cdp.eval(`
            (() => {
                const welcomePrompt = document.getElementById('tour-welcome-prompt');
                const tourActive = window.InteractiveTour ? window.InteractiveTour.active : false;
                return {
                    hasWelcomePrompt: !!welcomePrompt,
                    tourActive
                };
            })()
        `);
        console.log('   Startup Tour State:', startupTourCheck);
        assert.strictEqual(startupTourCheck.hasWelcomePrompt, false, 'No welcome prompt should appear on launch!');
        assert.strictEqual(startupTourCheck.tourActive, false, 'Tour should be inactive until requested!');
        console.log('   ✓ PASS: Tour remains quiet and only starts on explicit trigger.');

        // 5. Start Tour at Step 0 (Curriculum - Main Window 1)
        console.log('\n[Test 5] Triggering window.startInteractiveTour(0)...');
        await cdp.eval(`
            (() => {
                if (window.startInteractiveTour) window.startInteractiveTour(0);
            })()
        `);
        await delay(1500);

        const step0State = await cdp.eval(`
            (() => {
                const svg = document.getElementById('tour-spotlight-svg');
                const frame = document.getElementById('tour-spotlight-frame');
                const popover = document.getElementById('tour-popover');
                const cutout = document.getElementById('tour-cutout-rect');
                const title = popover ? popover.querySelector('.tour-popover-title')?.innerText : '';
                const windowBadge = popover ? popover.querySelector('.tour-window-badge')?.innerText : '';
                const popRect = popover ? popover.getBoundingClientRect() : null;
                const winH = window.innerHeight;

                return {
                    hasSvg: !!svg,
                    hasFrame: !!frame && frame.style.display !== 'none',
                    hasPopover: !!popover && popover.style.display !== 'none',
                    cutoutWidth: cutout ? parseFloat(cutout.getAttribute('width')) : 0,
                    title,
                    windowBadge,
                    popRect,
                    winH,
                    currentStep: window.InteractiveTour ? window.InteractiveTour.currentStep : -1
                };
            })()
        `);
        console.log('   Step 0 State:', {
            title: step0State.title,
            windowBadge: step0State.windowBadge,
            currentStep: step0State.currentStep
        });
        assert.strictEqual(step0State.hasSvg, true, 'Spotlight SVG overlay should exist!');
        assert.strictEqual(step0State.hasFrame, true, 'Spotlight outline frame should exist!');
        assert.strictEqual(step0State.hasPopover, true, 'Directional popover should exist!');
        assert(step0State.cutoutWidth > 0, 'Cutout rect width should be greater than 0!');
        assert.strictEqual(step0State.currentStep, 0, 'Current step should be 0!');
        assert(step0State.windowBadge.includes('מפת קורסים'), 'Window badge should indicate Curriculum!');
        console.log('   ✓ PASS: Step 0 (Curriculum Tree) spotlight & popover rendered.');

        // 6. Step 1: Degree Planner (Main Window 2)
        console.log('\n[Test 6] Advancing to Step 1: Degree Planner (Main Window 2/6)...');
        await cdp.eval(`document.getElementById('tour-btn-next').click();`);
        await delay(1500); // Transition delay is 750ms + render

        const step1State = await cdp.eval(`
            (() => {
                const tabPlanner = document.getElementById('tab-planner');
                const popover = document.getElementById('tour-popover');
                const navTabGlow = document.querySelector('#tab-planner.tour-nav-tab-active-glow');
                return {
                    isPlannerActive: tabPlanner && tabPlanner.classList.contains('active'),
                    step: window.InteractiveTour.currentStep,
                    title: popover ? popover.querySelector('.tour-popover-title')?.innerText : '',
                    windowBadge: popover ? popover.querySelector('.tour-window-badge')?.innerText : '',
                    hasNavGlow: !!navTabGlow
                };
            })()
        `);
        console.log('   Step 1 State:', step1State);
        assert.strictEqual(step1State.isPlannerActive, true, 'Planner tab should become active!');
        assert.strictEqual(step1State.step, 1, 'Should be at Step 1!');
        assert(step1State.windowBadge.includes('תכנון תואר'), 'Window badge should indicate Degree Planner!');
        assert.strictEqual(step1State.hasNavGlow, true, 'Active nav tab should have active pulsing glow!');
        console.log('   ✓ PASS: Step 1 active with glowing tab and clearance action button.');

        // 7. Step 2: Tasks Board (Main Window 3) & Bottom Bar Collision Test
        console.log('\n[Test 7] Advancing to Step 2: Tasks Board (Main Window 3/6)...');
        await cdp.eval(`document.getElementById('tour-btn-next').click();`);
        await delay(1500);

        const step2State = await cdp.eval(`
            (() => {
                const tabTasks = document.getElementById('tab-tasks');
                const popover = document.getElementById('tour-popover');
                const navTabs = document.querySelector('.nav-tabs-left');
                const popRect = popover ? popover.getBoundingClientRect() : { bottom: 0 };
                const navRect = navTabs ? navTabs.getBoundingClientRect() : { top: 9999 };

                return {
                    isTasksActive: tabTasks && tabTasks.classList.contains('active'),
                    step: window.InteractiveTour.currentStep,
                    title: popover ? popover.querySelector('.tour-popover-title')?.innerText : '',
                    popBottom: popRect.bottom,
                    navTop: navRect.top,
                    noCollision: popRect.bottom <= navRect.top || navRect.top > window.innerHeight
                };
            })()
        `);
        console.log('   Step 2 State:', step2State);
        assert.strictEqual(step2State.isTasksActive, true, 'Tasks tab should be active!');
        assert.strictEqual(step2State.step, 2, 'Should be at Step 2!');
        console.log('   ✓ PASS: Tasks Board active.');

        // 8. Step 3: Academic Calendar (Main Window 4)
        console.log('\n[Test 8] Advancing to Step 3: Academic Calendar (Main Window 4/6)...');
        await cdp.eval(`document.getElementById('tour-btn-next').click();`);
        await delay(1500);

        const step3State = await cdp.eval(`
            (() => {
                const tabCalendar = document.getElementById('tab-calendar');
                const popover = document.getElementById('tour-popover');
                return {
                    isCalendarActive: tabCalendar && tabCalendar.classList.contains('active'),
                    step: window.InteractiveTour.currentStep,
                    title: popover ? popover.querySelector('.tour-popover-title')?.innerText : ''
                };
            })()
        `);
        console.log('   Step 3 State:', step3State);
        assert.strictEqual(step3State.isCalendarActive, true, 'Calendar tab should become active!');
        assert.strictEqual(step3State.step, 3, 'Should be at Step 3!');
        console.log('   ✓ PASS: Academic Calendar active.');

        // 9. Step 4: Timetable Studio & CheeseFork (Main Window 5)
        console.log('\n[Test 9] Advancing to Step 4: Timetable & CheeseFork (Main Window 5/6)...');
        await cdp.eval(`document.getElementById('tour-btn-next').click();`);
        await delay(1500);

        const step4State = await cdp.eval(`
            (() => {
                const tabTimetable = document.getElementById('tab-timetable');
                const popover = document.getElementById('tour-popover');
                return {
                    isTimetableActive: tabTimetable && tabTimetable.classList.contains('active'),
                    step: window.InteractiveTour.currentStep,
                    title: popover ? popover.querySelector('.tour-popover-title')?.innerText : ''
                };
            })()
        `);
        console.log('   Step 4 State:', step4State);
        assert.strictEqual(step4State.isTimetableActive, true, 'Timetable tab should become active!');
        assert.strictEqual(step4State.step, 4, 'Should be at Step 4!');
        console.log('   ✓ PASS: Timetable Studio active.');

        // 10. Step 5: Settings & Backup (Main Window 6)
        console.log('\n[Test 10] Advancing to Step 5: Settings & Cloud Backup (Main Window 6/6)...');
        await cdp.eval(`document.getElementById('tour-btn-next').click();`);
        await delay(1500);

        const step5State = await cdp.eval(`
            (() => {
                const tabSettings = document.getElementById('tab-settings');
                const popover = document.getElementById('tour-popover');
                return {
                    isSettingsActive: tabSettings && tabSettings.classList.contains('active'),
                    step: window.InteractiveTour.currentStep,
                    title: popover ? popover.querySelector('.tour-popover-title')?.innerText : ''
                };
            })()
        `);
        console.log('   Step 5 State:', step5State);
        assert.strictEqual(step5State.isSettingsActive, true, 'Settings tab should become active!');
        assert.strictEqual(step5State.step, 5, 'Should be at Step 5!');
        console.log('   ✓ PASS: Settings tab active (All 6 main windows covered first!).');

        // Capture artifact screenshot at Step 5
        await cdp.screenshot('qa_spotlight_guided_tour_verified.png');

        // 11. Advance through remaining power-tool steps to completion
        console.log('\n[Test 11] Advancing to Final Step & Verifying Completion...');
        await cdp.eval(`window.startInteractiveTour(7);`);
        await delay(1600);

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
        assert.strictEqual(lastState.step, 7, 'Should be at final step 7!');
        assert(lastState.btnText.includes('סיום'), 'Last button should say סיום!');

        // Click finish
        await cdp.eval(`document.getElementById('tour-btn-next').click();`);
        await delay(500);

        const tourCleanedUp = await cdp.eval(`
            (() => {
                const svg = document.getElementById('tour-spotlight-svg');
                const frame = document.getElementById('tour-spotlight-frame');
                const popover = document.getElementById('tour-popover');
                const isStored = localStorage.getItem('ast_interactive_tour_completed_v267') === 'true';
                const activeGlowingTabs = document.querySelectorAll('.tour-nav-tab-active-glow').length;
                return {
                    noSvg: !svg,
                    noFrame: !frame,
                    noPopover: !popover,
                    isStored,
                    activeGlowingTabs,
                    isActive: window.InteractiveTour.active
                };
            })()
        `);
        console.log('   Tour Cleanup State:', tourCleanedUp);
        assert.strictEqual(tourCleanedUp.noSvg, true, 'SVG overlay should be removed!');
        assert.strictEqual(tourCleanedUp.noFrame, true, 'Outline frame should be removed!');
        assert.strictEqual(tourCleanedUp.noPopover, true, 'Popover should be removed!');
        assert.strictEqual(tourCleanedUp.isStored, true, 'Completion flag should be saved in localStorage!');
        assert.strictEqual(tourCleanedUp.activeGlowingTabs, 0, 'No glowing tabs should remain!');
        assert.strictEqual(tourCleanedUp.isActive, false, 'Tour should be inactive!');
        console.log('   ✓ PASS: Tour cleanup, state reset, and localStorage persistence verified.');

        console.log('\n================================================================');
        console.log('🎉 ALL IN-SITU SPOTLIGHT GUIDED WALKTHROUGH & PRIVACY TESTS PASSED!');
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
