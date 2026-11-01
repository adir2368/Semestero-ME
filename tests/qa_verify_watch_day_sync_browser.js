// ==============================================================================
// QA Verification: Galaxy Watch 8 Day Detection & Schedule Verification
// File: tests/qa_verify_watch_day_sync_browser.js
// ==============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 8080;
const CDP_PORT = 9743;
const SCREENSHOT_PATH = path.join('C:\\Users\\user\\.gemini\\antigravity\\brain\\aa7d2a33-2de8-4eeb-b8bd-18c8fdd69b14', 'qa_watch_day_sync_verified.png');

async function main() {
    console.log('🚀 Starting Watch Browser QA Verification...');

    // 1. Launch HTTP server if not running
    const serverProcess = spawn('node', ['server.js'], {
        cwd: path.join(__dirname, '..'),
        stdio: 'ignore'
    });

    await new Promise(r => setTimeout(r, 1500));

    // 2. Launch headless Chrome with CDP
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const chromeProcess = spawn(chromePath, [
        `--remote-debugging-port=${CDP_PORT}`,
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--window-size=500,500',
        'about:blank'
    ]);

    await new Promise(r => setTimeout(r, 2000));

    try {
        const versionData = await fetchJson(`http://localhost:${CDP_PORT}/json/list`);
        const target = versionData.find(t => t.type === 'page') || versionData[0];
        if (!target || !target.webSocketDebuggerUrl) {
            throw new Error('No page target found');
        }

        const ws = new WebSocket(target.webSocketDebuggerUrl);
        await new Promise((resolve, reject) => {
            ws.addEventListener('open', resolve);
            ws.addEventListener('error', reject);
        });

        let id = 1;
        function send(method, params = {}) {
            return new Promise((resolve, reject) => {
                const reqId = id++;
                const handler = (evt) => {
                    const msg = JSON.parse(evt.data);
                    if (msg.id === reqId) {
                        ws.removeEventListener('message', handler);
                        if (msg.error) reject(msg.error);
                        else resolve(msg.result);
                    }
                };
                ws.addEventListener('message', handler);
                ws.send(JSON.stringify({ id: reqId, method, params }));
            });
        }

        await send('Page.enable');
        await send('Page.navigate', { url: `http://localhost:${PORT}/watch.html` });
        await new Promise(r => setTimeout(r, 2500));

        // Evaluate DOM elements
        const evalRes = await send('Runtime.evaluate', {
            expression: `({
                dayRadar: document.getElementById('w-day-radar')?.innerText,
                timelineHeader: document.getElementById('w-timeline-header')?.innerText,
                classTitle: document.getElementById('w-class-title')?.innerText,
                classTime: document.getElementById('w-class-time')?.innerText,
                classRoom: document.getElementById('w-class-room')?.innerText,
                clock: document.getElementById('watch-clock')?.innerText
            })`,
            returnByValue: true
        });

        console.log('📊 Watch DOM Evaluation:', JSON.stringify(evalRes.result.value, null, 2));

        const val = evalRes.result.value;
        if (!val.dayRadar || !val.dayRadar.includes('יום ראשון')) {
            throw new Error(`Expected dayRadar to contain 'יום ראשון', got: ${val.dayRadar}`);
        }
        if (!val.timelineHeader || !val.timelineHeader.includes('יום ראשון')) {
            throw new Error(`Expected timelineHeader to contain 'יום ראשון', got: ${val.timelineHeader}`);
        }
        console.log('✅ Day Detection verified: ' + val.dayRadar);

        // Capture screenshot
        const screenshotRes = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(SCREENSHOT_PATH, Buffer.from(screenshotRes.data, 'base64'));
        console.log('📸 Screenshot saved successfully to:', SCREENSHOT_PATH);

        ws.close();
    } finally {
        try { chromeProcess.kill(); } catch(e) {}
        try { serverProcess.kill(); } catch(e) {}
    }
}

function fetchJson(url) {
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

main().catch(err => {
    console.error('❌ QA Test failed:', err);
    process.exit(1);
});
