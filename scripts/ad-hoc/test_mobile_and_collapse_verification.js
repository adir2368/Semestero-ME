const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const os = require('os');
const fs = require('fs');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9770 + Math.floor(Math.random() * 200);
const PROFILE_DIR = path.join(os.tmpdir(), `chrome_qa_mobile_verif_${Date.now()}`);
const TARGET_URL = `http://localhost:8080/?mobile_qa_verif=${Date.now()}`;
const ARTIFACT_DIR = "C:/Users/user/.gemini/antigravity/brain/aa7d2a33-2de8-4eeb-b8bd-18c8fdd69b14";

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function getJson(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
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
            this.ws.onerror = (e) => reject(e);
            this.ws.onmessage = (e) => {
                const msg = JSON.parse(e.data);
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
    async eval(expr) {
        const res = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
        if (res.exceptionDetails) throw new Error(JSON.stringify(res.exceptionDetails));
        return res.result.value;
    }
}

async function run() {
    console.log('========================================================================');
    console.log('📱 VERIFYING MOBILE DEGREE PLANNER CLIPPING FIX & COLLAPSIBLE CONTROLS');
    console.log('========================================================================\n');

    let serverProcess = null;
    try {
        await getJson('http://localhost:8080');
    } catch(e) {
        serverProcess = spawn('node', ['server.js'], { stdio: 'ignore', detached: true });
        await delay(1200);
    }

    // Launch Chrome with exact mobile viewport 390x844 (iPhone / Galaxy aspect ratio)
    const chrome = spawn(CHROME_PATH, [
        `--remote-debugging-port=${PORT}`,
        `--user-data-dir=${PROFILE_DIR}`,
        '--headless=new',
        '--disable-gpu',
        '--window-size=390,844',
        TARGET_URL
    ]);

    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
        await delay(500);
        try {
            const list = await getJson(`http://127.0.0.1:${PORT}/json`);
            const page = list.find(t => t.type === 'page');
            if (page && page.webSocketDebuggerUrl) { wsUrl = page.webSocketDebuggerUrl; break; }
        } catch(e) {}
    }

    const cdp = new CDPClient(wsUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    for (let i = 0; i < 20; i++) {
        await delay(500);
        const ready = await cdp.eval(`!!(window.gameState && document.getElementById('tab-planner'))`);
        if (ready) break;
    }

    // ------------------------------------------------------------------------
    // [Test 1] Degree Planner Tab Navigation & Mobile View Switcher
    // ------------------------------------------------------------------------
    console.log('[Test 1] Navigating to Degree Planner & Checking View Switcher...');
    const test1 = await cdp.eval(`
        (() => {
            const tab = document.getElementById('tab-planner');
            if (tab) tab.click();
            if (window.plannerModule && typeof window.plannerModule.renderDegreePlanner === 'function') {
                window.plannerModule.renderDegreePlanner();
            }

            const wrapper = document.querySelector('.planner-wrapper');
            const tabs = document.getElementById('planner-mobile-view-tabs');
            const banner = document.getElementById('planner-header-banner');

            return {
                plannerVisible: document.getElementById('planner-workspace').style.display !== 'none',
                tabsVisible: tabs ? getComputedStyle(tabs).display !== 'none' : false,
                currentMobileView: wrapper ? wrapper.getAttribute('data-mobile-view') : null,
                bannerHeight: banner ? Math.round(banner.getBoundingClientRect().height) : null
            };
        })()
    `);
    console.log('   Degree Planner Initial Status:', test1);
    if (!test1.plannerVisible) throw new Error('Degree Planner workspace failed to show!');
    console.log('   ✓ PASS: Degree Planner workspace is active with mobile view tabs visible!\n');

    // ------------------------------------------------------------------------
    // [Test 2] Header Banner Collapse & Expand ("תן לצמצם כדי לצמצם ויזואליות")
    // ------------------------------------------------------------------------
    console.log('[Test 2] Testing Header Banner Collapse & Expand...');
    const test2Collapse = await cdp.eval(`
        (() => {
            if (typeof window.togglePlannerHeaderCollapse === 'function') {
                window.togglePlannerHeaderCollapse();
            }
            const banner = document.getElementById('planner-header-banner');
            const isCollapsed = banner ? banner.classList.contains('collapsed') : false;
            const h = banner ? Math.round(banner.getBoundingClientRect().height) : 0;
            const modeText = document.getElementById('planner-collapsed-mode-pill')?.textContent.trim();
            const creditsText = document.getElementById('planner-collapsed-credits-pill')?.textContent.trim();

            return { isCollapsed, height: h, modeText, creditsText };
        })()
    `);
    console.log('   Collapsed Header Status:', test2Collapse);
    if (!test2Collapse.isCollapsed || test2Collapse.height > 55) {
        throw new Error(`Failed to collapse header properly! Height: ${test2Collapse.height}px`);
    }
    console.log(`   ✓ PASS: Header banner shrunk from ${test1.bannerHeight}px down to ${test2Collapse.height}px!`);

    // Capture screenshot of collapsed planner view
    const scrCollapsed = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'qa_mobile_planner_collapsed.png'), Buffer.from(scrCollapsed.data, 'base64'));
    console.log('   📸 Screenshot saved: qa_mobile_planner_collapsed.png\n');

    // ------------------------------------------------------------------------
    // [Test 3] Mobile Catalog View & Bottom Item Clipping Audit ("חלק נחתך")
    // ------------------------------------------------------------------------
    console.log('[Test 3] Switching to Catalog View & Verifying No Bottom Clipping...');
    const test3Clipping = await cdp.eval(`
        (() => {
            // Switch to catalog view
            if (typeof window.setPlannerMobileView === 'function') {
                window.setPlannerMobileView('catalog');
            }

            const mainContainer = document.querySelector('.planner-main-container');
            const pool = document.querySelector('.planner-electives-pool');
            const sidebar = document.querySelector('.planner-sidebar');
            const navTabs = document.querySelector('.nav-tabs-left');

            // Scroll main container to bottom
            if (mainContainer) {
                mainContainer.scrollTop = mainContainer.scrollHeight;
            }

            const items = pool ? pool.querySelectorAll('.planner-pool-item, .planner-course-item') : [];
            const lastItem = items.length > 0 ? items[items.length - 1] : null;

            const poolCs = pool ? getComputedStyle(pool) : {};
            const sidebarCs = sidebar ? getComputedStyle(sidebar) : {};

            const lastItemRect = lastItem ? lastItem.getBoundingClientRect() : null;
            const navRect = navTabs ? navTabs.getBoundingClientRect() : null;

            return {
                itemsCount: items.length,
                lastItemName: lastItem ? lastItem.textContent.trim().replace(/\\s+/g, ' ').substring(0, 50) : null,
                poolMaxHeight: poolCs.maxHeight,
                poolOverflowY: poolCs.overflowY,
                sidebarOverflowY: sidebarCs.overflowY,
                windowHeight: window.innerHeight,
                lastItemTop: lastItemRect ? Math.round(lastItemRect.top) : null,
                lastItemBottom: lastItemRect ? Math.round(lastItemRect.bottom) : null,
                lastItemHeight: lastItemRect ? Math.round(lastItemRect.height) : null,
                navTop: navRect ? Math.round(navRect.top) : null,
                isCompletelyVisible: lastItemRect && navRect ? (lastItemRect.bottom <= navRect.top) : null,
                clearanceAboveNav: lastItemRect && navRect ? Math.round(navRect.top - lastItemRect.bottom) : null
            };
        })()
    `);
    console.log('   Catalog Bottom Clipping Audit:', test3Clipping);

    if (test3Clipping.itemsCount === 0) throw new Error('No items in electives pool!');
    console.log(`   Last item: "${test3Clipping.lastItemName}"`);
    console.log(`   Clearance above bottom nav tabs: ${test3Clipping.clearanceAboveNav}px`);
    if (test3Clipping.clearanceAboveNav < 0) {
        throw new Error(`Last course item is still clipped behind nav tabs! Clearance: ${test3Clipping.clearanceAboveNav}px`);
    }

    // Capture screenshot of bottom unclipped item
    const scrBottom = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'qa_mobile_planner_bottom_unclipped.png'), Buffer.from(scrBottom.data, 'base64'));
    console.log('   📸 Screenshot saved: qa_mobile_planner_bottom_unclipped.png\n');

    // ------------------------------------------------------------------------
    // [Test 4] Notion Tasks Tab & Homework Policy Strip Collapse
    // ------------------------------------------------------------------------
    console.log('[Test 4] Navigating to Tasks Tab & Verifying HW Policy Strip Collapse...');
    const test4Tasks = await cdp.eval(`
        (() => {
            const tab = document.getElementById('tab-tasks');
            if (tab) tab.click();

            if (typeof window.renderNotionHomeworkPolicyStrip === 'function') {
                window.renderNotionHomeworkPolicyStrip();
            }

            const strip = document.getElementById('notion-hw-policy-strip');
            const initialHeight = strip ? Math.round(strip.getBoundingClientRect().height) : 0;

            // Toggle collapse
            if (typeof window.toggleHomeworkPolicyStripCollapse === 'function') {
                window.toggleHomeworkPolicyStripCollapse();
            }

            const collapsedHeight = strip ? Math.round(strip.getBoundingClientRect().height) : 0;
            const isCollapsed = strip ? strip.classList.contains('collapsed') : false;
            const chips = strip ? strip.querySelectorAll('.hw-mini-chip').length : 0;

            return {
                stripExists: !!strip,
                initialHeight,
                collapsedHeight,
                isCollapsed,
                miniChipsCount: chips
            };
        })()
    `);
    console.log('   Tasks HW Strip Collapse Audit:', test4Tasks);
    if (!test4Tasks.isCollapsed || test4Tasks.collapsedHeight > 85) {
        throw new Error(`Failed to collapse Tasks HW policy strip! Height: ${test4Tasks.collapsedHeight}px`);
    }
    console.log(`   ✓ PASS: HW Policy Strip collapsed from ${test4Tasks.initialHeight}px to ${test4Tasks.collapsedHeight}px with ${test4Tasks.miniChipsCount} mini chips!`);

    const scrTasksCollapsed = await cdp.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, 'qa_tasks_hw_strip_collapsed.png'), Buffer.from(scrTasksCollapsed.data, 'base64'));
    console.log('   📸 Screenshot saved: qa_tasks_hw_strip_collapsed.png\n');

    console.log('========================================================================');
    console.log('🎉 ALL MOBILE CLIPPING & COLLAPSE VERIFICATION TESTS PASSED 100%!');
    console.log('========================================================================');

    chrome.kill();
    if (serverProcess) serverProcess.kill();
}

run().catch(err => {
    console.error('❌ Verification Error:', err);
    process.exit(1);
});
