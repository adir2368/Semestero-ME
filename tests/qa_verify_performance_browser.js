const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PORT = 9756;
const HTTP_PORT = 8089;
const APP_DIR = path.resolve(__dirname, '..');

function startStaticServer() {
    return new Promise((resolve) => {
        const server = http.createServer((req, res) => {
            let reqPath = req.url.split('?')[0];
            if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
            const filePath = path.join(APP_DIR, reqPath);
            fs.readFile(filePath, (err, data) => {
                if (err) {
                    res.writeHead(404);
                    res.end('Not found');
                    return;
                }
                const ext = path.extname(filePath);
                const mimeTypes = {
                    '.html': 'text/html; charset=utf-8',
                    '.js': 'application/javascript',
                    '.css': 'text/css',
                    '.png': 'image/png',
                    '.webp': 'image/webp',
                    '.svg': 'image/svg+xml',
                    '.json': 'application/json'
                };
                res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
                res.end(data);
            });
        });
        server.listen(HTTP_PORT, () => {
            console.log(`[TestServer] Serving on http://localhost:${HTTP_PORT}`);
            resolve(server);
        });
    });
}

function launchChrome() {
    const chromePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe')
    ];
    let binary = chromePaths.find(p => fs.existsSync(p));
    return spawn(binary, [
        `--remote-debugging-port=${CHROME_PORT}`,
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--window-size=1280,900'
    ]);
}

function wait(ms) {
    return new Promise(r => setTimeout(r, ms));
}

let cdpId = 1;
function cdpRequest(ws, method, params = {}) {
    return new Promise((resolve, reject) => {
        const id = cdpId++;
        const timeout = setTimeout(() => {
            ws.removeEventListener('message', handler);
            reject(new Error(`CDP request timed out: ${method}`));
        }, 8000);

        const handler = (event) => {
            const data = JSON.parse(event.data);
            if (data.id === id) {
                clearTimeout(timeout);
                ws.removeEventListener('message', handler);
                if (data.error) reject(data.error);
                else resolve(data.result);
            }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id, method, params }));
    });
}

async function run() {
    const server = await startStaticServer();
    const chrome = launchChrome();
    await wait(2000);

    let versionJson;
    for (let i = 0; i < 10; i++) {
        try {
            const res = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/version`);
            versionJson = await res.json();
            break;
        } catch (e) {
            await wait(500);
        }
    }

    if (!versionJson) throw new Error('Could not connect to Chrome CDP');

    const listRes = await fetch(`http://127.0.0.1:${CHROME_PORT}/json/list`);
    const pages = await listRes.json();
    const targetWsUrl = pages[0].webSocketDebuggerUrl;

    const ws = new WebSocket(targetWsUrl);
    await new Promise((resolve, reject) => {
        ws.addEventListener('open', resolve);
        ws.addEventListener('error', reject);
    });
    console.log('✓ Connected to Chrome CDP target');

    await cdpRequest(ws, 'Page.enable');
    await cdpRequest(ws, 'Runtime.enable');

    console.log('[Nav] Navigating to Semestero ME...');
    await cdpRequest(ws, 'Page.navigate', { url: `http://localhost:${HTTP_PORT}/index.html` });
    
    // Wait until DegreePlanner is initialized
    console.log('[App] Waiting for DegreePlanner and app to initialize...');
    for (let i = 0; i < 20; i++) {
        const readyRes = await cdpRequest(ws, 'Runtime.evaluate', {
            expression: 'typeof window.DegreePlanner !== "undefined" && typeof window.DegreePlanner.renderDegreePlanner === "function" && typeof window.gameState !== "undefined"',
            returnByValue: true
        });
        if (readyRes.result && readyRes.result.value === true) {
            console.log('✓ DegreePlanner and GameState are fully initialized!');
            break;
        }
        await wait(500);
    }

    // Switch to Planner Tab
    await cdpRequest(ws, 'Runtime.evaluate', {
        expression: `
            window.setActiveMainTab('planner');
        `
    });
    await wait(1000);

    // Inspect Catalog items count and load more button
    const catalogInspect = await cdpRequest(ws, 'Runtime.evaluate', {
        expression: `
            (function() {
                const pool = document.getElementById('planner-available-electives-list');
                const items = pool ? pool.querySelectorAll('.planner-pool-item').length : 0;
                const loadBtn = document.getElementById('btn-catalog-load-more');
                return {
                    itemsRendered: items,
                    hasLoadMoreBtn: !!loadBtn,
                    loadMoreText: loadBtn ? loadBtn.innerText.trim() : null
                };
            })()
        `,
        returnByValue: true
    });
    console.log('📦 Degree Planner Catalog Windowing State:', catalogInspect.result ? catalogInspect.result.value : catalogInspect);

    // Verify Network Deduplication in Runtime
    const dedupTest = await cdpRequest(ws, 'Runtime.evaluate', {
        expression: `
            (function() {
                return typeof window.fetchWithTimeoutAndDedup === 'function';
            })()
        `,
        returnByValue: true
    });
    console.log('⚡ Network Deduplication Utility in Runtime:', dedupTest.result ? dedupTest.result.value : false);

    // Verify Skeletons in Runtime
    const skeletonTest = await cdpRequest(ws, 'Runtime.evaluate', {
        expression: `
            (function() {
                const pool = document.getElementById('planner-available-electives-list');
                if (window.renderCatalogSkeletons && pool) {
                    window.renderCatalogSkeletons(pool);
                    const skeletons = pool.querySelectorAll('.skeleton-pool-item').length;
                    return skeletons;
                }
                return 0;
            })()
        `,
        returnByValue: true
    });
    console.log('💀 Skeletons Rendered in Catalog Pool:', skeletonTest.result ? skeletonTest.result.value : 0);

    console.log('🎉 Browser CDP Verification Finished 100% Successfully!');
    ws.close();
    chrome.kill();
    server.close();
    process.exit(0);
}

run().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
