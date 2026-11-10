/**
 * QA Test Suite: Extended Powerhouse Tour & Tutorial Autonomy Verification
 */

const http = require('http');
const assert = require('assert');
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9880 + Math.floor(Math.random() * 100);
const PROFILE_DIR = path.join(os.tmpdir(), `chrome_extended_tour_${Date.now()}`);
const SERVER_PORT = 8080;
const APP_URL = `http://127.0.0.1:${SERVER_PORT}/?qa_extended_tour=${Date.now()}`;

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getJson(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(e); }
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

    async eval(expr) {
        const res = await this.send('Runtime.evaluate', {
            expression: expr,
            returnByValue: true,
            awaitPromise: true
        });
        if (res.exceptionDetails) {
            throw new Error('Eval Exception: ' + JSON.stringify(res.exceptionDetails));
        }
        return res.result ? res.result.value : undefined;
    }
}

async function runExtendedTourSuite() {
    console.log('========================================================================');
    console.log('🌟 QA: EXTENDED POWERHOUSE TOUR & RAPID TOUR AUTONOMY VERIFICATION');
    console.log('========================================================================\n');

    const server = spawn('node', ['server.js'], { stdio: 'inherit' });
    await delay(1500);

    const chrome = spawn(CHROME_PATH, [
        `--remote-debugging-port=${PORT}`,
        `--user-data-dir=${PROFILE_DIR}`,
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--window-size=1280,850',
        APP_URL
    ]);

    try {
        let wsUrl = null;
        for (let i = 0; i < 25; i++) {
            await delay(400);
            try {
                const list = await getJson(`http://127.0.0.1:${PORT}/json`);
                if (list && list.length > 0 && list[0].webSocketDebuggerUrl) {
                    wsUrl = list[0].webSocketDebuggerUrl;
                    break;
                }
            } catch (e) {}
        }
        assert(wsUrl, 'Chrome debugger WebSocket should be open');
        const cdp = new CDPClient(wsUrl);
        await cdp.connect();
        await delay(2500);

        // 1. Verify Guest Mode freedom in Auth modal
        console.log('[Test 1] Verifying Guest Mode CTA in Auth Modal...');
        const guestCta = await cdp.eval(`(() => {
            const authModal = document.getElementById('auth-modal');
            const btns = authModal ? Array.from(authModal.querySelectorAll('button')).map(b => b.innerText) : [];
            const hasGuestBtn = btns.some(t => t.includes('נסה את המערכת כאורח') || t.includes('ללא התחברות'));
            return { hasGuestBtn, count: btns.length };
        })()`);
        console.log('   Guest CTA in Auth:', guestCta);
        assert.strictEqual(guestCta.hasGuestBtn, true, 'Guest CTA button must be present in auth modal');
        console.log('   ✓ PASS: Unconstrained Guest Mode verified.\n');

        // 2. Test Rapid Tour (3 steps) and extension bridge
        console.log('[Test 2] Testing Rapid Tour Mode & Extend Bridge...');
        await cdp.eval(`window.startInteractiveTour(0, 'rapid');`);
        await delay(1200);

        const rapidStep0 = await cdp.eval(`(() => {
            return {
                active: window.InteractiveTour.active,
                mode: window.InteractiveTour.tourMode,
                step: window.InteractiveTour.currentStep,
                total: window.InteractiveTour.tourSteps.length
            };
        })()`);
        console.log('   Rapid Step 0:', rapidStep0);
        assert.strictEqual(rapidStep0.active, true);
        assert.strictEqual(rapidStep0.mode, 'rapid');
        assert.strictEqual(rapidStep0.total, 3, 'Rapid tour must have exactly 3 core steps');

        // Advance to step 1 (Planner)
        await cdp.eval(`document.getElementById('tour-btn-next').click();`);
        await delay(1200);

        // Advance to step 2 (Tasks)
        await cdp.eval(`document.getElementById('tour-btn-next').click();`);
        await delay(1200);

        const rapidStep2 = await cdp.eval(`(() => {
            const extendBtn = document.getElementById('tour-btn-extend');
            return {
                step: window.InteractiveTour.currentStep,
                hasExtendBtn: !!extendBtn,
                extendBtnText: extendBtn ? extendBtn.innerText : ''
            };
        })()`);
        console.log('   Rapid Step 2:', rapidStep2);
        assert.strictEqual(rapidStep2.step, 2);
        assert.strictEqual(rapidStep2.hasExtendBtn, true, 'Rapid tour final step must offer button to extend tour');
        assert(rapidStep2.extendBtnText.includes('מורחב'), 'Extend button text must mention extended tour');

        // Click Extend button to transition to Extended Tour
        console.log('   Clicking "המשך לסיור מורחב"...');
        await cdp.eval(`document.getElementById('tour-btn-extend').click();`);
        await delay(1500);

        const extendedStep3 = await cdp.eval(`(() => {
            const popover = document.getElementById('tour-popover');
            return {
                active: window.InteractiveTour.active,
                mode: window.InteractiveTour.tourMode,
                step: window.InteractiveTour.currentStep,
                total: window.InteractiveTour.tourSteps.length,
                windowBadge: popover ? popover.querySelector('.tour-window-badge')?.innerText : '',
                title: popover ? popover.querySelector('.tour-popover-title')?.innerText : ''
            };
        })()`);
        console.log('   Extended Step 3 (Attendance Hub):', extendedStep3);
        assert.strictEqual(extendedStep3.mode, 'extended', 'Mode must now be extended');
        assert.strictEqual(extendedStep3.step, 3, 'Should advance directly to step 3');
        assert.strictEqual(extendedStep3.total, 12, 'Extended tour must have 12 powerhouse stations');
        assert(extendedStep3.windowBadge.includes('נוכחות') || extendedStep3.title.includes('נוכחות'), 'Must highlight Attendance Hub');
        console.log('   ✓ PASS: Seamless bridge from rapid to extended tour verified.\n');

        // 3. Verify step 4: Pangea Knowledge Hub
        console.log('[Test 3] Advancing to Step 4: Pangea Knowledge Hub...');
        await cdp.eval(`document.getElementById('tour-btn-next').click();`);
        await delay(1400);

        const step4Pangea = await cdp.eval(`(() => {
            const popover = document.getElementById('tour-popover');
            return {
                step: window.InteractiveTour.currentStep,
                windowBadge: popover ? popover.querySelector('.tour-window-badge')?.innerText : '',
                title: popover ? popover.querySelector('.tour-popover-title')?.innerText : ''
            };
        })()`);
        console.log('   Step 4:', step4Pangea);
        assert.strictEqual(step4Pangea.step, 4);
        assert(step4Pangea.windowBadge.includes('פנגיה') || step4Pangea.title.includes('פנגיה'), 'Must highlight Pangea Knowledge Hub');
        console.log('   ✓ PASS: Pangea Knowledge Hub station verified.\n');

        // 4. Verify step 7: Grade Sheet & What-If Simulator
        console.log('[Test 4] Jumping to Step 7: Grade Sheet & What-If Simulator...');
        await cdp.eval(`window.startInteractiveTour(7, 'extended');`);
        await delay(1500);

        const step7Grades = await cdp.eval(`(() => {
            const popover = document.getElementById('tour-popover');
            return {
                step: window.InteractiveTour.currentStep,
                windowBadge: popover ? popover.querySelector('.tour-window-badge')?.innerText : '',
                title: popover ? popover.querySelector('.tour-popover-title')?.innerText : ''
            };
        })()`);
        console.log('   Step 7:', step7Grades);
        assert.strictEqual(step7Grades.step, 7);
        assert(step7Grades.windowBadge.includes('ציונים') || step7Grades.title.includes('ציונים'), 'Must highlight Grade Sheet & What-If');
        console.log('   ✓ PASS: Grade Sheet & What-If Simulator station verified.\n');

        // 5. Verify step 8: Samsung Galaxy Watch 8
        console.log('[Test 5] Jumping to Step 8: Samsung Galaxy Watch 8 Wear OS...');
        await cdp.eval(`window.startInteractiveTour(8, 'extended');`);
        await delay(1500);

        const step8Watch = await cdp.eval(`(() => {
            const popover = document.getElementById('tour-popover');
            return {
                step: window.InteractiveTour.currentStep,
                windowBadge: popover ? popover.querySelector('.tour-window-badge')?.innerText : '',
                title: popover ? popover.querySelector('.tour-popover-title')?.innerText : ''
            };
        })()`);
        console.log('   Step 8:', step8Watch);
        assert.strictEqual(step8Watch.step, 8);
        assert(step8Watch.windowBadge.includes('Watch') || step8Watch.title.includes('Watch') || step8Watch.title.includes('שעון'), 'Must highlight Galaxy Watch 8');
        console.log('   ✓ PASS: Galaxy Watch 8 Wear OS station verified.\n');

        // 6. Test Skip via Escape key
        console.log('[Test 6] Testing Instant Skip Freedom via Esc key...');
        await cdp.eval(`
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape' }));
        `);
        await delay(400);

        const afterEsc = await cdp.eval(`(() => {
            return {
                active: window.InteractiveTour.active,
                svgGone: !document.getElementById('tour-spotlight-svg'),
                popoverGone: !document.getElementById('tour-popover')
            };
        })()`);
        console.log('   After Esc:', afterEsc);
        assert.strictEqual(afterEsc.active, false, 'Tour must close on Esc');
        assert.strictEqual(afterEsc.svgGone, true, 'SVG mask must be removed');
        assert.strictEqual(afterEsc.popoverGone, true, 'Popover must be removed');
        console.log('   ✓ PASS: Instant skip autonomy verified.\n');

        console.log('========================================================================');
        console.log('🎉 ALL EXTENDED & RAPID TOUR VERIFICATIONS PASSED SUCCESSFULLY!');
        console.log('========================================================================\n');

    } finally {
        try { chrome.kill(); } catch (e) {}
        try { server.kill(); } catch (e) {}
    }
}

runExtendedTourSuite().catch(err => {
    console.error('❌ Extended Tour QA Failed:', err);
    process.exit(1);
});
