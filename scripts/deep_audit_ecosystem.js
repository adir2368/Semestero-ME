const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9345;
const PROFILE_DIR = path.join(os.tmpdir(), `chrome_deep_audit_${Date.now()}`);
const TARGET_URL = `http://localhost:8080/?deep_audit=${Date.now()}`;
const ARTIFACT_DIR = "C:/Users/user/.gemini/antigravity/brain/aa7d2a33-2de8-4eeb-b8bd-18c8fdd69b14";

function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
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

class CDPClient {
    constructor(wsUrl) {
        this.wsUrl = wsUrl;
        this.ws = null;
        this.id = 1;
        this.callbacks = new Map();
        this.logs = [];
        this.exceptions = [];
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.wsUrl);
            this.ws.onopen = () => resolve();
            this.ws.onerror = (err) => reject(err);
            this.ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                if (msg.method === 'Runtime.consoleAPICalled') {
                    const text = msg.params.args.map(a => a.value !== undefined ? a.value : (a.description || '')).join(' ');
                    this.logs.push(`[Console ${msg.params.type}] ${text}`);
                } else if (msg.method === 'Runtime.exceptionThrown') {
                    const desc = msg.params.exceptionDetails.text || (msg.params.exceptionDetails.exception && msg.params.exceptionDetails.exception.description);
                    this.exceptions.push(`[Exception] ${desc}`);
                } else if (msg.id && this.callbacks.has(msg.id)) {
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

    async eval(expression) {
        const wrappedExpr = expression.trim().startsWith('(() =>') ? expression : `(() => { ${expression} })()`;
        const res = await this.send('Runtime.evaluate', {
            expression: wrappedExpr,
            returnByValue: true,
            awaitPromise: true
        });
        if (res.exceptionDetails) {
            throw new Error(`Eval failed: ${JSON.stringify(res.exceptionDetails)}`);
        }
        return res.result ? res.result.value : undefined;
    }

    async screenshot(filename) {
        const res = await this.send('Page.captureScreenshot', { format: 'png' });
        const buf = Buffer.from(res.data, 'base64');
        const savePath = path.join(ARTIFACT_DIR, filename);
        fs.writeFileSync(savePath, buf);
        console.log(`   📸 Screenshot saved: ${filename}`);
        return savePath;
    }
}

async function runAudit() {
    console.log('🚀 Starting Deep Ecosystem & UX Investigation on http://localhost:8080/ ...');

    const chrome = spawn(CHROME_PATH, [
        `--remote-debugging-port=${PORT}`,
        `--user-data-dir=${PROFILE_DIR}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--headless=new',
        '--window-size=1440,900',
        TARGET_URL
    ]);

    await delay(1500);

    try {
        const tabs = await getJson(`http://127.0.0.1:${PORT}/json`);
        const page = tabs.find(t => t.type === 'page');
        const cdp = new CDPClient(page.webSocketDebuggerUrl);
        await cdp.connect();
        await cdp.send('Runtime.enable');
        await delay(2000);

        // 1. Setup Adir profile
        await cdp.eval(`
            localStorage.setItem('ast_is_developer_device', 'true');
            localStorage.setItem('ast_profile_adir_moshe', JSON.stringify({ id: 'adir_moshe', name: 'אדיר משה' }));
            localStorage.setItem('ast_logged_in_user', 'adir_moshe');
            if (window.AuthSync) window.AuthSync.currentUser = 'adir_moshe';
        `);
        await cdp.eval('location.reload()');
        await delay(2500);

        console.log('\n--- AUDITING ALL WORKSPACE TABS & FLOWS ---');

        // Audit Tab 1: Flowchart
        await cdp.eval("document.getElementById('tab-curriculum').click()");
        await delay(1000);
        const flowchartAudit = await cdp.eval(`
            (() => {
                const totalNodes = document.querySelectorAll('.fc-node-group').length;
                const completedNodes = document.querySelectorAll('.fc-node-group.mastered').length;
                const lockedNodes = document.querySelectorAll('.fc-node-group.locked').length;
                const availableNodes = document.querySelectorAll('.fc-node-group.available').length;
                const activeNodes = document.querySelectorAll('.fc-node-group.active').length;
                const searchInput = !!document.getElementById('course-prereq-search-input');
                return { totalNodes, completedNodes, lockedNodes, availableNodes, activeNodes, searchInput };
            })()
        `);
        console.log('1. Flowchart Audit:', flowchartAudit);

        // Audit Tab 2: Degree Planner
        await cdp.eval("document.getElementById('tab-planner').click()");
        await delay(1000);
        const plannerAudit = await cdp.eval(`
            (() => {
                const cols = document.querySelectorAll('.planner-semester-col').length;
                const coursesInPlan = document.querySelectorAll('.planner-course-card').length;
                const electivesInPool = document.querySelectorAll('.planner-pool-item').length;
                const totalCreditsText = document.getElementById('planner-total-credits-val')?.innerText || '';
                const auditBanner = !!document.getElementById('planner-clearance-audit-banner');
                return { cols, coursesInPlan, electivesInPool, totalCreditsText, auditBanner };
            })()
        `);
        console.log('2. Degree Planner Audit:', plannerAudit);

        // Audit Tab 3: Notion Tasks
        await cdp.eval("document.getElementById('tab-tasks').click()");
        await delay(1000);
        const tasksAudit = await cdp.eval(`
            (() => {
                const totalTasks = document.querySelectorAll('.task-row, tr[data-task-id]').length;
                const pills = Array.from(document.querySelectorAll('.organit-pill')).map(p => ({
                    id: p.id,
                    text: p.innerText.replace(/\\n/g, ' ')
                }));
                const pinnedCount = document.querySelectorAll('.task-row-pinned, [data-pinned="true"]').length;
                const hasMoodleSyncBtn = !!document.getElementById('btn-sync-moodle-tasks');
                const hasMiluimAdvisorBtn = !!document.getElementById('btn-open-miluim-advisor');
                const hasAddTaskBtn = !!document.getElementById('btn-open-add-custom-task-modal');
                return { totalTasks, pills, pinnedCount, hasMoodleSyncBtn, hasMiluimAdvisorBtn, hasAddTaskBtn };
            })()
        `);
        console.log('3. Tasks Audit:', tasksAudit);

        // Audit Tab 4: Calendar & Exam Gap Runway
        await cdp.eval("document.getElementById('tab-calendar').click()");
        await delay(1000);
        const runwayAudit = await cdp.eval(`
            (() => {
                const runwayCard = document.getElementById('exam-gap-runway-card');
                const runwayTrack = document.getElementById('exam-gap-runway-track');
                const examPills = runwayTrack ? runwayTrack.querySelectorAll('.runway-exam-node, .runway-exam-pill, .runway-exam-item').length : 0;
                const calendarDays = document.querySelectorAll('.calendar-day-cell, .cal-day, .day-cell').length;
                return { hasRunway: !!runwayCard, examPills, calendarDays };
            })()
        `);
        console.log('4. Calendar & Runway Audit:', runwayAudit);

        // Audit Tab 5: Timetable
        await cdp.eval("document.getElementById('tab-timetable').click()");
        await delay(1000);
        const timetableAudit = await cdp.eval(`
            (() => {
                const cards = Array.from(document.querySelectorAll('.timetable-card')).map(c => {
                    const tag = c.querySelector('.timetable-tag')?.innerText || '';
                    const time = c.querySelector('.timetable-card-time')?.innerText || '';
                    const room = c.querySelector('.timetable-card-room-bar')?.innerText || '';
                    const lecturer = (c.querySelector('.timetable-lecturer') || c.querySelector('.ttg-card-instructor'))?.innerText || '';
                    const title = (c.querySelector('.timetable-card-title') || c.querySelector('.timetable-card-name'))?.innerText || '';
                    return { tag, time, room: room.replace(/\\n/g, ' '), lecturer: lecturer.replace(/\\n/g, ' '), title };
                });
                const hasGeneratorBtn = !!document.getElementById('btn-open-timetable-generator');
                const hasGcalBtn = !!document.getElementById('btn-manage-gcal-sync') || !!document.getElementById('btn-open-gcal-manager');
                const hasExportIcsBtn = !!document.getElementById('btn-export-timetable-ics');
                const hasExportPngBtn = !!document.getElementById('btn-export-timetable-png');
                return { cardsCount: cards.length, cards, hasGeneratorBtn, hasGcalBtn, hasExportIcsBtn, hasExportPngBtn };
            })()
        `);
        console.log('5. Timetable Audit:', timetableAudit);

        // Audit Analytics Modal
        await cdp.eval("document.getElementById('btn-open-analytics').click()");
        await delay(1000);
        const analyticsAudit = await cdp.eval(`
            (() => {
                const modal = document.getElementById('analytics-modal');
                const isOpen = modal && (modal.style.display === 'flex' || modal.classList.contains('active'));
                const gpaText = document.getElementById('analytics-kpi-gpa')?.innerText || '';
                const creditsText = document.getElementById('analytics-kpi-credits')?.innerText || '';
                const coursesText = document.getElementById('analytics-kpi-courses')?.innerText || '';
                const closeBtn = document.getElementById('btn-close-analytics-modal');
                if (closeBtn) closeBtn.click();
                return { isOpen, gpaText, creditsText, coursesText };
            })()
        `);
        console.log('6. Analytics Modal Audit:', analyticsAudit);
        await delay(500);

        // Audit Notification Hub Drawer
        await cdp.eval("document.getElementById('btn-notification-bell').click()");
        await delay(800);
        const drawerAudit = await cdp.eval(`
            (() => {
                const drawer = document.getElementById('notifications-drawer');
                const isOpen = drawer && drawer.classList.contains('active');
                const deviceBadge = document.getElementById('drawer-desktop-badge')?.innerText || '';
                const lectureCardCount = document.getElementById('notif-count-lectures')?.innerText || '';
                const taskCardCount = document.getElementById('notif-count-tasks')?.innerText || '';
                return { isOpen, deviceBadge, lectureCardCount, taskCardCount };
            })()
        `);
        console.log('7. Notification Drawer Audit:', drawerAudit);
        await cdp.eval("document.getElementById('btn-close-notif-drawer').click()");
        await delay(500);

        // Audit Timetable Combinations Generator Modal
        await cdp.eval("document.getElementById('tab-timetable').click()");
        await delay(500);
        await cdp.eval("document.getElementById('btn-open-timetable-generator').click()");
        await delay(1000);
        const generatorAudit = await cdp.eval(`
            (() => {
                const modal = document.getElementById('modal-timetable-generator');
                const isOpen = modal && (modal.style.display === 'flex' || modal.classList.contains('active'));
                const preAnchorSelects = document.querySelectorAll('.ttg-pre-anchor-select').length;
                const activeAnchorsCount = document.getElementById('ttg-anchors-count-badge')?.innerText || '';
                const sortButtons = Array.from(document.querySelectorAll('.ttg-sort-btn')).map(b => b.innerText.trim());
                const previewDayCols = document.querySelectorAll('.ttg-day-column').length;
                const optionsCount = document.querySelectorAll('.ttg-opt-pill').length;
                return { isOpen, preAnchorSelects, activeAnchorsCount, sortButtons, previewDayCols, optionsCount };
            })()
        `);
        console.log('8. Timetable Generator Studio Audit:', generatorAudit);

        // Check Console Errors / Logs
        console.log('\n--- RUNTIME CONSOLE & EXCEPTION AUDIT ---');
        console.log(`Total Logs Captured: ${cdp.logs.length}`);
        console.log(`Total Exceptions: ${cdp.exceptions.length}`);
        if (cdp.exceptions.length > 0) {
            console.error('EXCEPTIONS:', cdp.exceptions);
        }

        if (cdp.ws) cdp.ws.close();
        chrome.kill();
        process.exit(0);
    } catch (err) {
        console.error('AUDIT ERROR:', err);
        chrome.kill();
        process.exit(1);
    }
}

runAudit();
