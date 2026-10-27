const { spawn } = require('child_process');
const http = require('http');
const assert = require('assert');
const path = require('path');
const os = require('os');
const fs = require('fs');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9700 + Math.floor(Math.random() * 200);
const PROFILE_DIR = path.join(os.tmpdir(), `chrome_qa_auth_${Date.now()}`);
const SERVER_PORT = 8080;
const TARGET_URL = `http://127.0.0.1:${SERVER_PORT}/?qa_test_auth_flow=1`;

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
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.wsUrl);
            this.ws.onopen = () => resolve();
            this.ws.onerror = (err) => reject(err);
            this.ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                if (msg.method === 'Runtime.consoleAPICalled') {
                    console.log('[BROWSER CONSOLE]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
                } else if (msg.method === 'Runtime.exceptionThrown') {
                    console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails);
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
    let serverProcess = null;
    let chrome = null;

    try {
        const serverRunning = await isServerListening(SERVER_PORT);
        if (!serverRunning) {
            serverProcess = spawn('node', ['server.js'], {
                cwd: path.resolve(__dirname, '..'),
                stdio: 'ignore'
            });
            await delay(1200);
        }

        chrome = spawn(CHROME_PATH, [
            `--remote-debugging-port=${PORT}`,
            `--user-data-dir=${PROFILE_DIR}`,
            '--headless=new',
            '--disable-gpu',
            '--no-first-run',
            '--disable-features=ServiceWorker',
            TARGET_URL
        ]);

        await delay(1500);
        const pages = await getJson(`http://127.0.0.1:${PORT}/json`);
        const target = pages.find(p => p.url.includes('qa_test_auth_flow')) || pages[0];
        const cdp = new CDPClient(target.webSocketDebuggerUrl);
        await cdp.connect();

        await cdp.send('Runtime.enable');

        // Wait for page ready and for auth modal to trigger (allowing for PWA service worker refresh if any)
        let modalActive = false;
        for (let i = 0; i < 20; i++) {
            await delay(500);
            modalActive = await cdp.eval(`(() => {
                const modal = document.getElementById('auth-modal');
                return modal && modal.classList.contains('active');
            })()`);
            if (modalActive) break;
        }
        console.log('1. Auth Modal opened automatically on entrance:', modalActive ? '✅ YES' : '❌ NO');
        assert(modalActive, 'Auth modal should open on entrance for fresh guest');

        // 2. Verify switch to full Onboarding & Registration Wizard
        const switchSuccess = await cdp.eval(`(() => {
            const btn = document.getElementById('btn-switch-to-register');
            if (btn) {
                btn.click();
                return true;
            }
            if (window.AuthSync) {
                window.AuthSync.openOnboardingWizard();
                return true;
            }
            return false;
        })()`);
        console.log('2. Switched to Onboarding & Registration Wizard:', switchSuccess ? '✅ YES' : '❌ NO');
        assert(switchSuccess, 'Should switch to registration wizard');

        await delay(500);

        // Check full onboarding wizard visibility and fields
        const hasWizardFields = await cdp.eval(`(() => {
            const wizard = document.getElementById('onboarding-wizard-modal');
            const isVisible = wizard && wizard.classList.contains('active');
            const nameInput = document.getElementById('onboarding-student-name-input');
            const semSelect = document.getElementById('onboarding-current-sem-select');
            const checklist = document.getElementById('onboarding-courses-checklist');
            return Boolean(isVisible && nameInput && semSelect && checklist);
        })()`);
        console.log('3. Full 3-step Onboarding Wizard fields rendered and active:', hasWizardFields ? '✅ YES' : '❌ NO');
        assert(hasWizardFields, 'Full 3-step Onboarding Wizard must be active with all fields');

        // 4. Test tour trigger
        const tourAvailable = await cdp.eval(`(() => {
            return typeof window.InteractiveTour?.startTour === 'function' || typeof window.startInteractiveTour === 'function';
        })()`);
        console.log('4. Interactive Tour engine available:', tourAvailable ? '✅ YES' : '❌ NO');
        assert(tourAvailable, 'Interactive tour engine must be available');

        // 5. Test finish onboarding launches tour automatically
        const tourLaunched = await cdp.eval(`(async () => {
            const nameInput = document.getElementById('onboarding-student-name-input');
            if (nameInput) nameInput.value = 'סטודנט בדיקה';
            if (window.AuthSync?.finishOnboarding) {
                window.AuthSync.finishOnboarding();
            }
            await new Promise(r => setTimeout(r, 1000));
            return Boolean(window.InteractiveTour && window.InteractiveTour.active);
        })()`);
        console.log('5. Interactive Tour auto-launched after onboarding completion:', tourLaunched ? '✅ YES' : '❌ NO');
        assert(tourLaunched, 'Tour must launch automatically after finishing onboarding');

        console.log('\n✅ All onboarding, registration and tour launch assertions passed!');

    } finally {
        if (chrome) try { chrome.kill('SIGKILL'); } catch (e) {}
        if (serverProcess) try { serverProcess.kill('SIGKILL'); } catch (e) {}
        try { fs.rmSync(PROFILE_DIR, { recursive: true, force: true }); } catch (e) {}
    }
}

run().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
