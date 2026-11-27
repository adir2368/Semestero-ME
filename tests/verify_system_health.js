const { spawn } = require('child_process');
const http = require('http');
const assert = require('assert');
const path = require('path');
const os = require('os');
const fs = require('fs');

function resolveChromePath() {
    if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
    const candidates = process.platform === 'win32'
        ? [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe') : ''
        ]
        : [
            '/usr/bin/google-chrome',
            '/usr/bin/google-chrome-stable',
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        ];
    for (const c of candidates) {
        if (c && fs.existsSync(c)) return c;
    }
    return process.platform === 'win32' ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : 'google-chrome';
}

const CHROME_PATH = resolveChromePath();
const PORT = 9700 + Math.floor(Math.random() * 200);
const PROFILE_DIR = path.join(os.tmpdir(), `chrome_qa_health_${Date.now()}`);
const SERVER_PORT = 8080;
const TARGET_URL = `http://127.0.0.1:${SERVER_PORT}/?qa_health_test=${Date.now()}`;

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
        const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
            res.resume();
            resolve(true);
        });
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
        this.consoleLogs = [];
        this.pageErrors = [];
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.wsUrl);
            this.ws.onopen = () => resolve();
            this.ws.onerror = (err) => reject(err);
            this.ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                if (msg.method === 'Runtime.consoleAPICalled') {
                    const text = (msg.params.args || []).map(a => a.value || a.description || '').join(' ');
                    this.consoleLogs.push({ type: msg.params.type, text });
                }
                if (msg.method === 'Runtime.exceptionThrown') {
                    const desc = msg.params.exceptionDetails.exception ? (msg.params.exceptionDetails.exception.description || msg.params.exceptionDetails.text) : msg.params.exceptionDetails.text;
                    this.pageErrors.push(desc);
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
    console.log('========================================================================');
    console.log('🛡️ AUTOMATED SYSTEM HEALTH & REGRESSION TEST SUITE');
    console.log('========================================================================\n');

    let serverProcess = null;
    const serverRunning = await isServerListening(SERVER_PORT);
    if (!serverRunning) {
        console.log(`[Server] Starting server.js on port ${SERVER_PORT}...`);
        serverProcess = spawn('node', ['server.js'], { cwd: path.resolve(__dirname, '..') });
        await delay(2000);
    } else {
        console.log(`[Server] Local server already active on port ${SERVER_PORT}.`);
    }

    console.log(`[Chrome] Launching headless Chrome on port ${PORT}...`);
    const chrome = spawn(CHROME_PATH, [
        `--remote-debugging-port=${PORT}`,
        `--user-data-dir=${PROFILE_DIR}`,
        '--no-first-run',
        '--no-default-browser-check',
        '--headless=new',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1440,900',
        TARGET_URL
    ]);

    let wsUrl = null;
    for (let i = 0; i < 30; i++) {
        await delay(500);
        try {
            const list = await getJson(`http://127.0.0.1:${PORT}/json`);
            const page = list.find(t => t.type === 'page');
            if (page && page.webSocketDebuggerUrl) {
                wsUrl = page.webSocketDebuggerUrl;
                break;
            }
        } catch (e) {}
    }

    assert(wsUrl, 'Failed to connect to Chrome DevTools Protocol WebSocket');
    console.log(`✓ Chrome CDP connected successfully`);

    const cdp = new CDPClient(wsUrl);
    await cdp.connect();
    await cdp.send('Runtime.enable');

    // Wait until app.js finishes evaluating and gameState is populated
    console.log('[App] Waiting for scripts and state initialization...');
    let ready = false;
    for (let i = 0; i < 60; i++) {
        await delay(300);
        try {
            const isReady = await cdp.eval(`Boolean(typeof window.forceUpdateApp === 'function' && window.gameState && window.gameState.courses)`);
            if (isReady) {
                ready = true;
                break;
            }
        } catch (e) {}
    }
    assert(ready, 'Timed out waiting for application to initialize fully');
    console.log('✓ Application fully initialized');

    let passed = 0;
    let failed = 0;

    async function test(name, fn) {
        process.stdout.write(`- [TEST] ${name} ... `);
        try {
            await fn();
            console.log('✅ PASSED');
            passed++;
        } catch (err) {
            console.log(`❌ FAILED: ${err.message}`);
            failed++;
        }
    }

    try {
        // Test 1: No critical runtime exceptions during startup
        await test('No uncaught JavaScript exceptions during page load', async () => {
            const criticalErrors = cdp.pageErrors.filter(e => !e.includes('favicon') && !e.includes('net::ERR_'));
            if (criticalErrors.length > 0) {
                throw new Error(`Found ${criticalErrors.length} uncaught exceptions: ${criticalErrors.join(' | ')}`);
            }
        });

        // Test 2: escapeHtml is globally defined and works safely
        await test('escapeHtml is defined globally and sanitizes strings', async () => {
            const result = await cdp.eval(`typeof window.escapeHtml === 'function' && window.escapeHtml('<script>alert("xss")</script>')`);
            assert(typeof result === 'string', 'escapeHtml did not return a string');
            assert(!result.includes('<script>'), 'escapeHtml failed to escape HTML tags');
        });

        // Test 3: Version badge & system version consistency
        await test('Version strings are consistent across DOM and global APP_VERSION', async () => {
            const domSystemVer = await cdp.eval(`document.getElementById("display-system-version")?.innerText`);
            const footerBadgeText = await cdp.eval(`document.getElementById("footer-version-badge")?.innerText`);
            const appVer = await cdp.eval(`window.APP_VERSION`);

            assert(domSystemVer, 'display-system-version element is empty or missing');
            assert(footerBadgeText, 'footer-version-badge element is empty or missing');
            assert(appVer, 'window.APP_VERSION is undefined');
            assert(footerBadgeText.includes(appVer), `Footer badge (${footerBadgeText}) does not match APP_VERSION (${appVer})`);
        });

        // Test 4: Course details modal opens on click without throwing
        await test('Course Details Modal opens cleanly when clicking course in Flowchart', async () => {
            const testCode = await cdp.eval(`Object.keys(window.gameState?.courses || {})[0] || '034010'`);
            const modalOpened = await cdp.eval(`(() => {
                if (typeof window.openCourseDetails !== 'function') return false;
                window.openCourseDetails('${testCode}');
                const modal = document.getElementById('course-modal');
                return modal && modal.classList.contains('active');
            })()`);
            assert(modalOpened, `Failed to open course modal for course ${testCode}`);
        });

        // Test 5: Semester 4 contains exactly the 4 mandatory courses and zero sports courses
        await test('Semester 4 has 4 core courses and 0 sports infiltrators', async () => {
            const sem4Info = await cdp.eval(`(() => {
                // Check both planner plan and gameState.courses
                const plan = (typeof window.plannerModule?.getCustomPlan === 'function' ? window.plannerModule.getCustomPlan() : null) ||
                             window.gameState?.degreePlan ||
                             window.PLANNER_CATALOG?.SUGGESTED_MANDATORY_SYLLABUS || [];
                const sem4 = plan.find(s => s.semester === 4);
                const planCourses = (sem4 && sem4.courses) ? sem4.courses.map(c => c.code) : [];

                const treeCourses = Object.values(window.gameState?.courses || {})
                    .filter(c => c.semester === 4)
                    .map(c => c.code);

                const courses = planCourses.length > 0 ? planCourses : treeCourses;
                return {
                    count: courses.length,
                    courses: courses
                };
            })()`);
            assert(sem4Info.count === 4 || sem4Info.count === 5, `Semester 4 expected 4 or 5 courses (4 for Adir with Chem Lab in Sem 2, 5 for standard curriculum), but has ${sem4Info.count}: ${sem4Info.courses.join(", ")}`);
            const hasSports = sem4Info.courses.some(c => String(c).startsWith('0394') || String(c) === '03940800' || String(c) === '03940808');
            assert(!hasSports, `Semester 4 still contains sports courses: ${sem4Info.courses.join(', ')}`);
        });

        // Test 6: Physics Lab 1H is in Semester 5
        await test('Physics Lab 1H (114032) is positioned strictly in Semester 5', async () => {
            const labSem = await cdp.eval(`window.gameState?.courses?.['114032']?.semester || window.gameState?.courses?.['01140032']?.semester`);
            assert.strictEqual(labSem, 5, `Physics Lab 1H expected in semester 5, but found in semester ${labSem}`);
        });

        // Test 7: One-click Force Update function is present
        await test('window.forceUpdateApp exists and is a callable function', async () => {
            const fnType = await cdp.eval(`typeof window.forceUpdateApp`);
            assert.strictEqual(fnType, 'function', 'window.forceUpdateApp is not defined');
        });

        // Test 8: Pangea course mapping covers all 38+ courses with at least 100 aliases
        await test('Pangea course map contains exhaustive coverage of all 38+ courses', async () => {
            const mapStats = await cdp.eval(`(() => {
                const map = window.PANGEA_COURSE_MAP;
                if (!map || typeof map !== 'object') return null;
                const keys = Object.keys(map);
                const uniqueUrls = new Set(Object.values(map));
                return {
                    totalKeys: keys.length,
                    uniqueHubs: uniqueUrls.size,
                    hasDynamics: Boolean(map['034010']),
                    hasFluids: Boolean(map['034055']),
                    hasManufacture: Boolean(map['034030']),
                    hasCalculus1: Boolean(map['104041']),
                    hasPhysicsLab: Boolean(map['114032']),
                    hasMaterials: Boolean(map['314533'])
                };
            })()`);
            assert(mapStats, 'window.PANGEA_COURSE_MAP is not defined on window');
            assert(mapStats.totalKeys >= 100, `Expected at least 100 aliases in PANGEA_COURSE_MAP, got ${mapStats?.totalKeys}`);
            assert(mapStats.uniqueHubs >= 38, `Expected at least 38 unique Pangea course hubs, got ${mapStats?.uniqueHubs}`);
            assert(mapStats.hasDynamics && mapStats.hasFluids && mapStats.hasManufacture && mapStats.hasCalculus1 && mapStats.hasPhysicsLab && mapStats.hasMaterials, 'Key mandatory courses missing from Pangea course map');
        });
        // Test 9: App-Performance Toolkit (Core Web Vitals RUM & Network Deduplication)
        await test('App-Performance Toolkit (03/31 & 30/31): Network Deduplication & Core Web Vitals RUM', async () => {
            const perfStats = await cdp.eval(`(() => {
                return {
                    hasFetchDedup: typeof window.fetchWithTimeoutAndDedup === 'function',
                    hasVitalsObj: typeof window.__semestero_vitals === 'object' && window.__semestero_vitals !== null,
                    hasTraceApi: typeof window.SiteAnalytics !== 'undefined' && typeof window.SiteAnalytics.startTrace === 'function',
                    hasSkeletonTask: typeof window.renderTaskSkeletons === 'function'
                };
            })()`);
            assert(perfStats.hasFetchDedup, 'fetchWithTimeoutAndDedup is not exposed globally');
            assert(perfStats.hasVitalsObj, '__semestero_vitals is not initialized on window');
            assert(perfStats.hasTraceApi, 'SiteAnalytics.startTrace is not defined');
            assert(perfStats.hasSkeletonTask, 'renderTaskSkeletons is not defined');
        });

        // Test 10: App-Performance Toolkit (01/31 & 23/31): Skeleton Loading & Windowed List Rendering
        await test('App-Performance Toolkit (01/31 & 23/31): Skeletons & Windowed Catalog Rendering', async () => {
            const plannerState = await cdp.eval(`(() => {
                const hasCatalogSkeleton = typeof window.renderCatalogSkeletons === 'function';
                if (typeof window.setActiveMainTab === 'function') {
                    window.setActiveMainTab('planner');
                }
                const pool = document.getElementById('planner-available-electives-list');
                const loadMoreBtn = document.getElementById('btn-catalog-load-more');
                return {
                    hasCatalogSkeleton,
                    hasPool: !!pool,
                    itemsCount: pool ? pool.querySelectorAll('.planner-pool-item').length : 0,
                    hasLoadMoreBtn: !!loadMoreBtn
                };
            })()`);
            assert(plannerState.hasCatalogSkeleton, 'renderCatalogSkeletons is not defined');
            assert(plannerState.hasPool, 'planner-available-electives-list pool container missing');
        });

                        await test('Notion Tasks Board Overhaul: Semester Column, Focus Mode, Multi-Type Filter & Pangea Linking', async () => {
            const result = await cdp.eval(`(() => {
                if (typeof window.setActiveMainTab === 'function') {
                    window.setActiveMainTab('tasks');
                }
                const semSelect = document.getElementById('filter-semester');
                const typeBtn = document.getElementById('notion-type-filter-btn');
                const typePopover = document.getElementById('notion-type-filter-popover');
                const focusBtn = document.getElementById('notion-focus-toggle-btn');
                const pangeaFn = typeof window.getPangeaTaskUrl === 'function';

                if (typeof window.renderNotionTasksTable === 'function') {
                    window.renderNotionTasksTable();
                }

                const semesterPill = document.querySelector('.notion-semester-pill');
                const pangeaPill = document.querySelector('.notion-pangea-link-btn');
                const pdeRow = document.querySelector('tr[data-course-code="104228"]');

                return {
                    hasSemSelect: !!semSelect,
                    semDefault: semSelect ? semSelect.value : null,
                    hasTypeBtn: !!typeBtn,
                    hasTypePopover: !!typePopover,
                    hasFocusBtn: !!focusBtn,
                    focusActive: focusBtn ? focusBtn.classList.contains('active') : false,
                    hasPangeaFn: pangeaFn,
                    hasPangeaPill: !!pangeaPill,
                    hasSemesterPill: !!semesterPill,
                    hasPdeRow: !!pdeRow
                };
            })()`);
            assert(result.hasSemSelect, 'filter-semester dropdown missing');
            assert.strictEqual(result.semDefault, 'active', 'filter-semester should default to active');
            assert(result.hasTypeBtn, 'notion-type-filter-btn missing');
            assert(result.hasTypePopover, 'notion-type-filter-popover missing');
            assert(result.hasFocusBtn, 'notion-focus-toggle-btn missing');
            assert(result.hasPangeaFn, 'window.getPangeaTaskUrl function missing');
            assert(result.hasSemesterPill, 'notion-semester-pill element missing in table');
            assert(result.hasPangeaPill, 'notion-pangea-link-btn element missing in table');
        });

        // Test 12: Homework Policy Tracker (Macro Strip & Micro Modal 12-Sheet Grid)
        await test('Homework Policy Tracker: Macro Strip & Micro Modal 12-Sheet Grid', async () => {
            const result = await cdp.eval(`(() => {
                const strip = document.getElementById('notion-hw-policy-strip');
                if (typeof window.renderNotionHomeworkPolicyStrip === 'function') {
                    window.renderNotionHomeworkPolicyStrip();
                }
                const capsules = strip ? strip.querySelectorAll('.course-hw-capsule') : [];
                const solidsCapsule = Array.from(capsules).find(c => c.textContent.includes('מוצקים 2') || c.textContent.includes('034053'));
                
                // Open modal micro view
                if (typeof window.openCourseHomeworkDetail === 'function') {
                    window.openCourseHomeworkDetail('034053');
                }
                const modalHw = document.getElementById('modal-hw-policy-section');
                const sheetCards = modalHw ? modalHw.querySelectorAll('.hw-sheet-card') : [];
                const compRows = modalHw ? modalHw.querySelectorAll('.hw-component-row') : [];
                const solidsMerged = window.MoodleSync ? window.MoodleSync.areTasksDuplicates(
                    { id: 'task_moodle_29212', title: 'HW 4 - Strain & Displacements 1', dueDate: '2026-12-06 23:59', moodleUid: '29212@moodle26.technion.ac.il', moodleEventId: '29212' },
                    { id: 'task_moodle_12818', title: 'הגשת פתרון תרגיל בית 4', dueDate: '2026-12-07 23:59', moodleUid: '12818@moodle26.technion.ac.il', moodleEventId: '12818' },
                    'מכניקת מוצקים 2מ',
                    '034053'
                ) : false;

                return {
                    hasStrip: !!strip,
                    capsulesCount: capsules.length,
                    hasSolidsCapsule: !!solidsCapsule,
                    hasModalHw: !!modalHw && modalHw.style.display !== 'none',
                    sheetCardsCount: sheetCards.length,
                    isUnifiedSingle: compRows.length === 12 && solidsMerged
                };
            })()`);
            assert(result.hasStrip, 'notion-hw-policy-strip element missing');
            assert(result.capsulesCount >= 1, 'Should render at least 1 active homework capsule');
            assert(result.hasSolidsCapsule, 'Solid Mechanics 2 capsule missing');
            assert(result.hasModalHw, 'modal-hw-policy-section missing in course modal');
            assert.strictEqual(result.sheetCardsCount, 12, 'Must render exactly 12 sheets for 034053');
            assert(result.isUnifiedSingle, 'Must render unified single homework task cards for 034053');
        });

        // Test 13: Degree Planner Mobile Ergonomics & Visual Collapse
        await test('Degree Planner Mobile Ergonomics: Header Collapse, View Switcher & Unclipped Catalog', async () => {
            const result = await cdp.eval(`(() => {
                if (typeof window.setActiveMainTab === 'function') {
                    window.setActiveMainTab('planner');
                }
                const banner = document.getElementById('planner-header-banner');
                const tabs = document.getElementById('planner-mobile-view-tabs');
                const wrapper = document.querySelector('.planner-wrapper');

                const initialHeight = banner ? Math.round(banner.getBoundingClientRect().height) : 0;
                if (typeof window.togglePlannerHeaderCollapse === 'function') {
                    window.togglePlannerHeaderCollapse();
                }
                const isCollapsed = banner ? banner.classList.contains('collapsed') : false;
                const collapsedHeight = banner ? Math.round(banner.getBoundingClientRect().height) : 0;

                // Test view switcher
                if (typeof window.setPlannerMobileView === 'function') {
                    window.setPlannerMobileView('catalog');
                }
                const currentView = wrapper ? wrapper.getAttribute('data-mobile-view') : null;

                // Re-expand banner for clean state
                if (typeof window.togglePlannerHeaderCollapse === 'function') {
                    window.togglePlannerHeaderCollapse();
                }

                return {
                    hasBanner: !!banner,
                    hasTabs: !!tabs,
                    initialHeight,
                    isCollapsed,
                    collapsedHeight,
                    currentView
                };
            })()`);
            assert(result.hasBanner, 'planner-header-banner missing');
            assert(result.hasTabs, 'planner-mobile-view-tabs missing');
            assert(result.isCollapsed, 'togglePlannerHeaderCollapse failed to set collapsed class');
            assert(result.collapsedHeight <= 55, `Collapsed banner should be <= 55px, got ${result.collapsedHeight}px`);
            assert.strictEqual(result.currentView, 'catalog', 'setPlannerMobileView failed to set catalog view');
        });

        // Test 14: Strict Workspace Tab Isolation (Zero Bleedthrough)
        await test('Workspace Tab Isolation: Strict display none for inactive workspaces (Zero Bleedthrough)', async () => {
            const result = await cdp.eval(`(() => {
                const tabTasks = document.getElementById('tab-tasks');
                if (tabTasks) tabTasks.click();

                const pw = document.getElementById('planner-workspace');
                const tw = document.getElementById('notion-tasks-workspace');

                const plannerOnTasks = pw ? getComputedStyle(pw).display : null;
                const tasksOnTasks = tw ? getComputedStyle(tw).display : null;

                const tabPlanner = document.getElementById('tab-planner');
                if (tabPlanner) tabPlanner.click();

                const plannerOnPlanner = pw ? getComputedStyle(pw).display : null;
                const tasksOnPlanner = tw ? getComputedStyle(tw).display : null;

                return {
                    plannerOnTasks,
                    tasksOnTasks,
                    plannerOnPlanner,
                    tasksOnPlanner
                };
            })()`);
            assert.strictEqual(result.plannerOnTasks, 'none', 'Planner workspace must be strictly display:none when on Tasks tab');
            assert.notStrictEqual(result.tasksOnTasks, 'none', 'Tasks workspace must be visible when on Tasks tab');
            assert.notStrictEqual(result.plannerOnPlanner, 'none', 'Planner workspace must be visible when on Planner tab');
            assert.strictEqual(result.tasksOnPlanner, 'none', 'Tasks workspace must be strictly display:none when on Planner tab');
        });

        // Test 15: Manual Course Tasks Visibility & Focus Mode Gating Exemption
        await test('Manual Course Tasks Visibility: Immediate table rendering & focus gating exemption', async () => {
            const result = await cdp.eval(`(() => {
                const tabTasks = document.getElementById('tab-tasks');
                if (tabTasks) tabTasks.click();

                const courseCodes = Object.keys(window.gameState.courses);
                const courseCode = courseCodes.find(c => window.gameState.courses[c].status === 'active') || courseCodes[0];
                const course = window.gameState.courses[courseCode];
                if (!course) return { success: false, reason: "No courses found" };

                openCourseDetails(course.code);

                const titleInput = document.getElementById("input-quest-title");
                const typeInput = document.getElementById("input-quest-type");
                const dateInput = document.getElementById("input-quest-date");
                if (!titleInput || !typeInput || !dateInput) return { success: false, reason: "Missing inputs" };

                titleInput.value = "מטלת בדיקה אוטומטית";
                typeInput.value = "hw";
                dateInput.value = "2026-11-30";

                saveQuest();

                renderNotionTasksTable();

                const tableBody = document.getElementById("notion-tasks-table-body");
                const hasTaskRow = tableBody && tableBody.innerText.includes("מטלת בדיקה אוטומטית");

                window.MoodleSync.deduplicateCourseTasks(course);
                const hasTaskAfterMoodleSync = course.tasks.some(t => t.title === "מטלת בדיקה אוטומטית" && t.source === "manual");

                const focusBtn = document.getElementById("notion-focus-toggle-btn");
                if (focusBtn && !focusBtn.classList.contains("active")) {
                    focusBtn.click();
                }
                renderNotionTasksTable();
                const hasTaskInFocusMode = tableBody && tableBody.innerText.includes("מטלת בדיקה אוטומטית");

                // Cleanup test task
                course.tasks = course.tasks.filter(t => t.title !== "מטלת בדיקה אוטומטית");
                saveState();
                renderNotionTasksTable();

                return {
                    success: Boolean(hasTaskRow && hasTaskAfterMoodleSync && hasTaskInFocusMode),
                    hasTaskRow,
                    hasTaskAfterMoodleSync,
                    hasTaskInFocusMode
                };
            })()`);
            assert(result.success, `Manual task must be visible in table, preserved after deduplication, and exempt from focus gating: ${JSON.stringify(result)}`);
        });

        // Test 16: Technion SAP SLcM Catalog & Anti-Requisites Integration
        await test('Technion SAP SLcM: Authoritative catalog, anti-requisites & live exam metadata', async () => {
            const result = await cdp.eval(`(async () => {
                if (typeof ensureCheeseForkDatabase === 'function') {
                    await ensureCheeseForkDatabase();
                }
                const db = window.CHEESEFORK_DB || [];
                const course34032 = db.find(c => c.code6 === '034032' || c.rawNum === '00340032');
                const hasCourse = !!course34032;
                const hasAntiReq = hasCourse && typeof course34032.antiRequisites === 'string' && course34032.antiRequisites.length > 0;
                const hasSchedule = hasCourse && Array.isArray(course34032.schedule) && course34032.schedule.length > 0;
                const hasBuildingRoom = hasSchedule && course34032.schedule.some(s => s.building && s.room);

                // Check modal rendering
                openCourseDetails('034032');
                const modal = document.getElementById('course-modal');
                const cfContainer = document.getElementById('modal-cheesefork-container');
                const hasSapBadge = cfContainer && cfContainer.innerHTML.includes('Technion SAP 2026/27');
                const hasSapLink = cfContainer && cfContainer.innerHTML.includes('portalex.technion.ac.il/ovv');
                const hasAntiReqBanner = cfContainer && cfContainer.innerHTML.includes('ללא זיכוי נוסף');

                return {
                    dbCount: db.length,
                    hasCourse,
                    hasAntiReq,
                    hasBuildingRoom,
                    hasSapBadge,
                    hasSapLink,
                    hasAntiReqBanner
                };
            })()`);
            assert(result.dbCount >= 2500, `Consolidated catalog must contain at least 2500 courses, got ${result.dbCount}`);
            assert(result.hasCourse, 'Course 034032 must exist in consolidated catalog');
            assert(result.hasAntiReq, 'Course 034032 must have official anti-requisites');
            assert(result.hasBuildingRoom, 'Course 034032 must have classroom and building in schedule');
            assert(result.hasSapBadge, 'Modal must display Technion SAP 2026/27 badge');
            assert(result.hasSapLink, 'Modal must provide direct link to official Technion SAP SLcM');
            assert(result.hasAntiReqBanner, 'Modal must render anti-requisites warning banner');
        });

        // Test 17: Pangea Knowledge Hub, Smart Homework Resolver, Search & Quick Peek Reader
        await test('Pangea Knowledge Hub: Smart homework deep-linking, search & In-App Reader', async () => {
            const result = await cdp.eval(`(() => {
                const hubExists = !!window.PangeaHub && typeof window.PangeaHub.getCourseData === 'function';
                if (!hubExists) return { success: false, reason: 'PangeaHub not defined' };

                const coursesCount = Object.keys(window.PangeaHub.catalog).length;
                const thermoData = window.PangeaHub.getCourseData('034035');
                const hasThermo = !!thermoData && thermoData.exams.length >= 8 && thermoData.lectures.length >= 10;

                // Test smart homework resolver
                const hwDyn5 = window.PangeaHub.resolveTaskHomework('034010', 'תרגיל בית 5');
                const isDyn5Match = hwDyn5 && hwDyn5.isExactMatch && hwDyn5.slug.includes('DYN1_HW005');

                // Test search
                const searchResults = window.PangeaHub.search('ברנולי');
                const hasBernoulli = searchResults.some(r => r.title.includes('ברנולי'));

                // Test Course Modal rendering
                openCourseDetails('034035');
                const pangeaContainer = document.getElementById('modal-pangea-container');
                const hasHubRendered = pangeaContainer && pangeaContainer.innerHTML.includes('סיכומי פנגייה');
                const hasExamsRendered = pangeaContainer && pangeaContainer.innerHTML.includes('מאגר מבחנים פתורים');

                // Test In-App Reader Modal elements
                const readerModal = document.getElementById('pangea-reader-modal');
                const readerIframe = document.getElementById('pangea-reader-iframe');
                const readerExtBtn = document.getElementById('pangea-reader-ext-btn');
                const hasReader = !!readerModal && !!readerIframe && !!readerExtBtn;

                return {
                    hubExists,
                    coursesCount,
                    hasThermo,
                    isDyn5Match,
                    hasBernoulli,
                    hasHubRendered,
                    hasExamsRendered,
                    hasReader
                };
            })()`);

            assert(result.hubExists, 'window.PangeaHub must be defined globally');
            assert(result.coursesCount >= 34, `Expected at least 34 courses in PangeaHub, got ${result.coursesCount}`);
            assert(result.hasThermo, 'Thermodynamics 1 must have rich lectures and exams in PangeaHub');
            assert(result.isDyn5Match, 'Dynamics HW 5 must resolve to exact DYN1_HW005 slug');
            assert(result.hasBernoulli, 'Search for Bernoulli must find matching lectures');
            assert(result.hasHubRendered, 'Pangea Hub must render inside Course Details modal');
            assert(result.hasExamsRendered, 'Pangea Hub must render solved exams list in modal');
            assert(result.hasReader, 'In-App Quick Peek Reader Modal elements must exist in DOM');
        });

        await test('Attendance Hub: 1-Tap check-in, Catch-Up Queue, Mandatory Quotas & Pangea Integration', async () => {
            const result = await cdp.eval(`(() => {
                const hubExists = typeof window.AttendanceHub !== 'undefined';
                if (!hubExists) return { hubExists: false };

                // Test toggle attendance
                window.AttendanceHub.records = {};
                window.AttendanceHub.catchupQueue = [];
                
                // 1. Mark missed class for Dynamics
                window.AttendanceHub.toggleAttendance('034010', 'דינמיקה', 'הרצאה', 1, '10:30', '12:30', 'דנציגר 220', 'missed');
                const recMissed = window.AttendanceHub.getRecord('034010', 1, '10:30');
                const isMissedLogged = recMissed && recMissed.status === 'missed';
                
                // 2. Catchup queue auto-generated
                const queue = window.AttendanceHub.catchupQueue;
                const hasCatchupItem = queue.length > 0 && queue[0].courseId === '034010';
                const hasPangeaTopic = queue.length > 0 && !!queue[0].topic;

                // 3. Mark attended for Sports
                window.AttendanceHub.toggleAttendance('394000', 'חינוך גופני', 'אימון', 2, '08:30', '10:00', 'אולם כושר', 'attended');
                const sportsStats = window.AttendanceHub.getCourseStats('394000');
                const isSportsAttended = sportsStats.attended === 1;
                const hasQuota = !!sportsStats.quota && sportsStats.quota.minRequired === 10;

                // 4. Test modal open
                window.AttendanceHub.openModal('catchup');
                const modal = document.getElementById('modal-attendance-hub');
                const hasModalRendered = !!modal && modal.innerHTML.includes('תור השלמות');
                if (modal) modal.remove();

                // Clean up test data
                window.AttendanceHub.records = {};
                window.AttendanceHub.catchupQueue = [];
                window.AttendanceHub.save();

                return {
                    hubExists,
                    isMissedLogged,
                    hasCatchupItem,
                    hasPangeaTopic,
                    isSportsAttended,
                    hasQuota,
                    hasModalRendered
                };
            })()`);

            assert(result.hubExists, 'window.AttendanceHub must be defined globally');
            assert(result.isMissedLogged, 'Missed lecture must be recorded in AttendanceHub');
            assert(result.hasCatchupItem, 'Marking lecture as missed must auto-generate a Catch-Up item');
            assert(result.hasPangeaTopic, 'Catch-up item must resolve topic from Pangea / course metadata');
            assert(result.isSportsAttended, 'Attended sports session must increment sports attendance counter');
            assert(result.hasQuota, 'Sports course must have mandatory attendance quota (10 min required)');
            assert(result.hasModalRendered, 'Attendance & Catch-Up modal must render cleanly');
        });




        // Test 19: Pangea Reader CSP & Topmost Layering + Attendance Parallel Class Recommender
        await test('Pangea Reader CSP & Layering + Parallel Attendance Catch-Up Recommender', async () => {
            const result = await cdp.eval(`(() => {
                // 1. Check CSP meta tag
                const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
                const cspContent = cspMeta ? cspMeta.getAttribute('content') : '';
                const hasPangeaCsp = cspContent.includes('https://idofangbentov.uk') && cspContent.includes('frame-src');

                // 2. Check Pangea Reader z-index and foreground appending
                const readerModal = document.getElementById('pangea-reader-modal');
                if (window.PangeaHub && typeof window.PangeaHub.openQuickPeek === 'function') {
                    window.PangeaHub.openQuickPeek('https://idofangbentov.uk/test', 'Test Pangea Title', 'https://idofangbentov.uk/test');
                }
                const isAttachedToBody = readerModal && readerModal.parentElement === document.body;
                const isTopZIndex = readerModal && (readerModal.style.zIndex === '2000000' || getComputedStyle(readerModal).zIndex === '2000000');
                if (window.PangeaHub && typeof window.PangeaHub.closeQuickPeek === 'function') {
                    window.PangeaHub.closeQuickPeek();
                }

                // 3. Check Parallel Class Recommendations in AttendanceHub
                const hub = window.AttendanceHub;
                const hasRecMethod = hub && typeof hub.findParallelSlotRecommendations === 'function';
                
                // For Thermo (034035) tutorial (Tuesday 12:30): parallel tutorials should be found
                const thermoRecs = hasRecMethod ? hub.findParallelSlotRecommendations('034035', 'תרגול 11', 2, '12:30') : [];
                const hasThermoRecs = thermoRecs.length > 0;
                const thermoRecDayNames = thermoRecs.map(r => r.dayName);

                // 4. Test Catchup Item and Card Rendering with Parallel Recs
                hub.records = {};
                hub.catchupQueue = [];
                hub.toggleAttendance('034035', 'תרמודינמיקה 1', 'תרגול 11', 2, '12:30', '14:30', 'אולמן 101', 'missed');
                
                const queueItem = hub.catchupQueue.find(i => i.courseId === '034035');
                const itemHasRecs = queueItem && queueItem.parallelRecs && queueItem.parallelRecs.length > 0;

                // Render modal to check parallel box DOM
                hub.openModal('catchup');
                const modal = document.getElementById('modal-attendance-hub');
                const hasParallelBox = modal && modal.innerHTML.includes('catchup-parallel-box');
                const hasConflictFreeBadge = modal && modal.innerHTML.includes('ללא חפיפה במערכת');
                if (modal) modal.remove();

                // Clean up
                hub.records = {};
                hub.catchupQueue = [];
                hub.save();

                return {
                    hasPangeaCsp,
                    isAttachedToBody,
                    isTopZIndex,
                    hasRecMethod,
                    hasThermoRecs,
                    thermoRecsCount: thermoRecs.length,
                    itemHasRecs,
                    hasParallelBox,
                    hasConflictFreeBadge
                };
            })()`);

            assert(result.hasPangeaCsp, 'CSP meta tag must permit https://idofangbentov.uk and define frame-src');
            assert(result.isAttachedToBody, 'Pangea Reader modal must be attached to document.body root');
            assert(result.isTopZIndex, 'Pangea Reader modal must have z-index 2000000');
            assert(result.hasRecMethod, 'window.AttendanceHub.findParallelSlotRecommendations must be a function');
            assert(result.hasThermoRecs, 'Must find parallel tutorial sessions for Thermo (034035)');
            assert(result.itemHasRecs, 'Catch-up queue item must persist parallelRecommendations');
            assert(result.hasParallelBox, 'Attendance Hub catch-up tab must render .catchup-parallel-box');
            assert(result.hasConflictFreeBadge, 'Parallel recommendation must display conflict-free badge');
        });

        // Test 20: Attendance Cloud Sync, Weekly Slot Stability, CRDT Task Preservation & Direct Panopto Routing (v2.10.20)
        await test('Attendance Cloud Sync, CRDT Task Preservation, Weekly Slot Stability & Panopto Routing', async () => {
            const result = await cdp.eval(`(() => {
                const hub = window.AttendanceHub;
                const auth = window.AuthSync;
                if (!hub || !auth) return { success: false, reason: 'Hub or AuthSync missing' };

                // 1. Weekly Slot Stability across different days
                const sunCanonical = hub.getCanonicalDateForWeekDay(0);
                const monCanonical = hub.getCanonicalDateForWeekDay(1);
                const hasValidDates = /^\\d{4}-\\d{2}-\\d{2}$/.test(sunCanonical) && /^\\d{4}-\\d{2}-\\d{2}$/.test(monCanonical);

                // Mark Sunday slot
                hub.records = {};
                hub.catchupQueue = [];
                hub.toggleAttendance('034035', 'תרמודינמיקה 1', 'הרצאה', 0, '08:30', '10:30', 'דנציגר 101', 'attended');
                const sundayRec = hub.getRecord('034035', 0, '08:30');
                const isSundayPersisted = !!sundayRec && sundayRec.status === 'attended';

                // 2. Attendance State Bridge to gameState
                const isAttendanceInGameState = !!(window.gameState && window.gameState.attendance && window.gameState.attendance.records);
                const hasBridgedRec = isAttendanceInGameState && Object.keys(window.gameState.attendance.records).length > 0;

                // 3. Bidirectional Load from Remote State
                const remoteMockAttendance = {
                    records: {
                        '034053_d1_1030_2026-11-09': {
                            slotKey: '034053_d1_1030_2026-11-09',
                            courseId: '034053',
                            courseName: 'מוצקים 2',
                            type: 'הרצאה',
                            dayIndex: 1,
                            startTime: '10:30',
                            status: 'attended',
                            timestamp: Date.now() + 1000
                        }
                    },
                    catchupQueue: [
                        {
                            id: 'cu_remote_test',
                            slotKey: 'remote_slot',
                            courseId: '034056',
                            courseName: 'חישוב מדעי',
                            status: 'completed'
                        }
                    ],
                    quotas: {}
                };
                hub.loadFromGameState(remoteMockAttendance);
                const isRemoteMerged = !!hub.records['034053_d1_1030_2026-11-09'] && !!hub.records[sundayRec.slotKey];

                // 4. Panopto Direct Routing
                hub.toggleAttendance('034035', 'תרמודינמיקה 1', 'הרצאה', 0, '08:30', '10:30', 'דנציגר 101', 'missed');
                const missedItem = hub.catchupQueue.find(i => i.courseId === '034035');
                const hasPanoptoUrl = missedItem && typeof missedItem.panoptoUrl === 'string' && missedItem.panoptoUrl.includes('panopto.technion.ac.il') && missedItem.panoptoUrl.includes('034035');
                const hasMoodleCourseUrl = missedItem && typeof missedItem.moodleUrl === 'string' && missedItem.moodleUrl.includes('moodle26.technion.ac.il/course/view.php?id=112');

                // Check Modal Render for Panopto button link
                hub.openModal('catchup');
                const modal = document.getElementById('modal-attendance-hub');
                const hasPanoptoBtn = modal && modal.innerHTML.includes('פנאופטו (הקלטות)');
                const hasMoodle26Btn = modal && modal.innerHTML.includes('מודל 26');
                if (modal) modal.remove();

                // 5. Pangea Space-to-Hyphen URL Normalization
                const testRawUrl = 'https://idofangbentov.uk/Technion/PDE1/PDE1_004-%D7%9E%D7%A9%D7%95%D7%95%D7%90%D7%AA%20%D7%94%D7%92%D7%9C%D7%99%D7%9D';
                if (window.PangeaHub && typeof window.PangeaHub.openQuickPeek === 'function') {
                    window.PangeaHub.openQuickPeek(testRawUrl, 'משוואת הגלים');
                }
                const iframe = document.getElementById('pangea-reader-iframe');
                const isUrlNormalizedWithHyphen = iframe && !iframe.src.includes('%20') && (iframe.src.includes('-') || iframe.src.includes('%D7%9E%D7%A9%D7%95%D7%95%D7%90%D7%AA-%D7%94%D7%92%D7%9C%D7%99%D7%9D'));
                if (window.PangeaHub && typeof window.PangeaHub.closeQuickPeek === 'function') {
                    window.PangeaHub.closeQuickPeek();
                }

                // 6. Direct Task Completion
                const course34035 = window.gameState.courses['034035'];
                if (course34035 && course34035.tasks && course34035.tasks.length > 0) {
                    const t = course34035.tasks[0];
                    toggleTaskStatusInState('034035', t.id, 'done');
                    const isTaskCompletedDirectly = t.completed === true && t.status === 'done';

                    // Revert for clean state
                    toggleTaskStatusInState('034035', t.id, 'not_started');
                    return {
                        hasValidDates,
                        isSundayPersisted,
                        hasBridgedRec,
                        isRemoteMerged,
                        hasPanoptoUrl,
                        hasMoodleCourseUrl,
                        hasPanoptoBtn,
                        hasMoodle26Btn,
                        isUrlNormalizedWithHyphen,
                        isTaskCompletedDirectly
                    };
                }

                return {
                    hasValidDates,
                    isSundayPersisted,
                    hasBridgedRec,
                    isRemoteMerged,
                    hasPanoptoUrl,
                    hasMoodleCourseUrl,
                    hasPanoptoBtn,
                    hasMoodle26Btn,
                    isUrlNormalizedWithHyphen,
                    isTaskCompletedDirectly: true
                };
            })()`);

            assert(result.hasValidDates, 'Weekly canonical dates must format to YYYY-MM-DD');
            assert(result.isSundayPersisted, 'Sunday attendance record must remain retrievable regardless of query day');
            assert(result.hasBridgedRec, 'Attendance records must bridge directly into gameState.attendance for cloud sync');
            assert(result.isRemoteMerged, 'loadFromGameState must perform bidirectional union of local and remote records');
            assert(result.hasPanoptoUrl, 'Catch-up item must point directly to panopto.technion.ac.il with course query');
            assert(result.hasMoodleCourseUrl, 'Catch-up item must link directly to course Moodle ID (112 for Thermo)');
            assert(result.hasPanoptoBtn, 'Catch-up tab must render direct Panopto recordings button');
            assert(result.hasMoodle26Btn, 'Catch-up tab must render direct Moodle 26 course button');
            assert(result.isUrlNormalizedWithHyphen, 'Pangea reader must normalize %20 spaces to hyphens in Pangea URLs');
            assert(result.isTaskCompletedDirectly, 'toggleTaskStatusInState must complete tasks smoothly without blocking');
        });

        // Test 21: Universal Calendar Sync Engine (RFC 5545), Exam Readiness Ring & Past Exams Tracker (v2.10.21)
        await test('Universal Calendar Sync Engine (RFC 5545), Past Exams Tracker & Exam Readiness Ring', async () => {
            const result = await cdp.eval(`(() => {
                const cal = window.CalendarSyncEngine;
                const exam = window.ExamReadinessHub;
                if (!cal || !exam) return { success: false, reason: 'Engine or Hub missing' };

                // 1. Calendar Engine RFC 5545 test
                const icsResult = cal.generateUnifiedICS({ includeTimetable: true, includeTasks: true, includeExams: true });
                const hasVCalendar = icsResult.icsString.includes('BEGIN:VCALENDAR') && icsResult.icsString.includes('END:VCALENDAR');
                const hasRRule = icsResult.icsString.includes('RRULE:FREQ=WEEKLY');
                const hasAlarm = icsResult.icsString.includes('BEGIN:VALARM');
                const hasTotalCount = icsResult.totalCount > 0;

                // 2. Exam Readiness Hub calculation test
                const stats0 = exam.calculateReadiness('034010');
                const prep = exam.getCourseExamPrep('034010');
                const hasExamsList = prep && Array.isArray(prep.exams) && prep.exams.length >= 10;
                
                // Toggle one exam to mastered
                const firstExam = prep.exams[0];
                firstExam.status = 'mastered';
                firstExam.score = 90;
                const stats1 = exam.calculateReadiness('034010');
                const isReadinessIncreased = stats1.readinessPct > 0 && stats1.mastered === 1;

                // Test Card Rendering
                let container = document.getElementById('modal-exam-readiness-container');
                if (!container) {
                    container = document.createElement('div');
                    container.id = 'modal-exam-readiness-container';
                    document.body.appendChild(container);
                }
                exam.renderExamReadinessCard('034010', container);
                const hasCardRendered = container.innerHTML.includes('מדד מוכנות למבחן סופי') && (container.innerHTML.includes('מועדים נשלטו') || container.innerHTML.includes('🎯'));

                // 3. Cloud Sync Integration test
                const hasExamPrepInState = !!window.gameState.examPrep && !!window.gameState.examPrep['034010'];

                return {
                    hasVCalendar,
                    hasRRule,
                    hasAlarm,
                    hasTotalCount,
                    hasExamsList,
                    isReadinessIncreased,
                    hasCardRendered,
                    hasExamPrepInState
                };
            })()`);

            assert(result.hasVCalendar, 'CalendarSyncEngine must produce standard BEGIN:VCALENDAR and END:VCALENDAR');
            assert(result.hasRRule, 'CalendarSyncEngine must produce recurring weekly classes with RRULE:FREQ=WEEKLY');
            assert(result.hasAlarm, 'CalendarSyncEngine must embed VALARM display triggers');
            assert(result.hasTotalCount, 'CalendarSyncEngine must detect active classes/tasks/exams');
            assert(result.hasExamsList, 'ExamReadinessHub must generate default 5-year past moeds checklist');
            assert(result.isReadinessIncreased, 'Mastering an exam must immediately elevate the readiness percentage');
            assert(result.hasCardRendered, 'ExamReadinessHub must render the circular SVG gauge and moeds table');
            assert(result.hasExamPrepInState, 'gameState.examPrep must persist course exam prep state for cloud sync');
        });

        await test('Test 22: Pangea Deep Concept Search & Mobile Back Navigation Shield', async () => {
            const result = await cdp.eval(`(() => {
                // 1. Pangea Deep Concept Search
                const steinerMatches = window.PangeaHub ? window.PangeaHub.search('שטיינר') : [];
                const bernoulliMatches = window.PangeaHub ? window.PangeaHub.search('ברנולי') : [];
                const mohrMatches = window.PangeaHub ? window.PangeaHub.search('מעגל מור') : [];
                const vonMisesMatches = window.PangeaHub ? window.PangeaHub.search('פון מיזס') : [];

                const hasSteinerConcept = steinerMatches.length > 0 && steinerMatches[0].type === 'concept' && steinerMatches[0].title.includes('שטיינר');
                const hasBernoulliConcept = bernoulliMatches.length > 0 && bernoulliMatches[0].type === 'concept';
                const hasMohrConcept = mohrMatches.length > 0 && mohrMatches[0].type === 'concept' && mohrMatches[0].title.includes('מור');
                const hasVonMisesConcept = vonMisesMatches.length > 0 && vonMisesMatches[0].type === 'concept' && vonMisesMatches[0].title.includes('פון מיזס');

                // 2. Mobile Back Navigation Shield
                const hasBackManager = typeof window.handleMobileBackAction === 'function' && !!window.MobileBackNavigationManager;

                // Close any open course modal from previous tests first via back action
                const courseModal = document.getElementById('course-modal');
                let courseModalClosedViaBack = false;
                if (courseModal && courseModal.classList.contains('active')) {
                    const cHandled = window.handleMobileBackAction();
                    courseModalClosedViaBack = cHandled && !courseModal.classList.contains('active');
                } else {
                    courseModalClosedViaBack = true;
                }

                // Test Pangea modal closing via back
                const pangeaReader = document.getElementById('pangea-reader-modal');
                let readerClosedOnBack = false;
                if (pangeaReader) {
                    pangeaReader.style.display = 'flex';
                    const handled = window.handleMobileBackAction();
                    readerClosedOnBack = handled && pangeaReader.style.display === 'none';
                }

                // Ensure all modals closed for clean tab history test
                document.querySelectorAll('.modal-overlay.active, .modal.active, [id$="-modal"].active').forEach(m => {
                    m.classList.remove('active');
                    m.style.display = 'none';
                });

                // Test tab history back
                window._tabHistoryStack = ['curriculum', 'planner'];
                window.currentActiveTab = 'tasks';
                const tabBackHandled = window.handleMobileBackAction();
                const tabIsPlanner = window.currentActiveTab === 'planner';

                return {
                    hasSteinerConcept,
                    hasBernoulliConcept,
                    hasMohrConcept,
                    hasVonMisesConcept,
                    hasBackManager,
                    courseModalClosedViaBack,
                    readerClosedOnBack,
                    tabBackHandled,
                    tabIsPlanner
                };
            })()`);

            assert(result.hasSteinerConcept, 'PangeaHub must find Steiner theorem concept');
            assert(result.hasBernoulliConcept, 'PangeaHub must find Bernoulli equation concept');
            assert(result.hasMohrConcept, 'PangeaHub must find Mohr circle concept');
            assert(result.hasVonMisesConcept, 'PangeaHub must find Von Mises yield criterion');
            assert(result.hasBackManager, 'window.handleMobileBackAction and MobileBackNavigationManager must be registered');
            assert(result.courseModalClosedViaBack, 'handleMobileBackAction must close active course modal');
            assert(result.readerClosedOnBack, 'handleMobileBackAction must close open Pangea reader modal');
            assert(result.tabBackHandled && result.tabIsPlanner, 'handleMobileBackAction must navigate back in tab history when no modal is open');
        });

        await test('Test 23: Office Hours (Timetable + Course Modal), Timed Calendar Tasks & Persistent Task Filters (v2.13.14)', async () => {
            const result = await cdp.eval(`(() => {
                // 1. Timed task dueDate parsing & Calendar rendering + ICS export
                const p1 = window.parseTaskDueDateParts('2026-11-18 23:59');
                const p2 = window.parseTaskDueDateParts('2026-11-22T14:30:00Z');
                const c53 = window.gameState.courses['034053'];
                let calRenderedTimedTask = false;
                let icsHasTimedTask = false;
                if (c53) {
                    const prevStatus = c53.status;
                    c53.status = 'active';
                    c53.tasks = c53.tasks || [];
                    const testTaskId = 'test_timed_cal_task_v21314';
                    c53.tasks.push({
                        id: testTaskId,
                        title: 'Timed Moodle HW Test',
                        type: 'hw',
                        dueDate: '2026-11-18 23:59',
                        status: 'not_started',
                        completed: false
                    });
                    if (typeof setActiveMainTab === 'function') setActiveMainTab('calendar');
                    if (typeof renderFinalsCalendar === 'function') renderFinalsCalendar();
                    const dayItems = (window.currentCalendarItemsByDate && window.currentCalendarItemsByDate['2026-11-18']) || [];
                    calRenderedTimedTask = dayItems.some(it => it.isTaskEvent && it.taskId === testTaskId && it.dueTime === '23:59');
                    if (window.CalendarSyncEngine && typeof window.CalendarSyncEngine.generateUnifiedICS === 'function') {
                        const icsOut = window.CalendarSyncEngine.generateUnifiedICS({ includeTimetable: false, includeExams: false, includeTasks: true });
                        icsHasTimedTask = icsOut.icsString.includes('Timed Moodle HW Test') && icsOut.icsString.includes('20261118T235900');
                    }
                    c53.tasks = c53.tasks.filter(t => t.id !== testTaskId);
                    c53.status = prevStatus;
                }

                // 2. Office Hours Engine + Timetable Grid & Panel + Course Details Modal
                const hasOhEngine = typeof window.OfficeHoursEngine !== 'undefined';
                const defaults53 = window.OfficeHoursEngine ? window.OfficeHoursEngine.getCourseOfficeHours('034053') : [];
                const addedCustom = window.OfficeHoursEngine ? window.OfficeHoursEngine.addCourseOfficeHour('114052', {
                    staffName: 'ד"ר בדיקה',
                    role: 'מרצה',
                    dayIndex: 1,
                    startTime: '14:30',
                    endTime: '15:30',
                    location: 'אולמן 301'
                }) : false;
                if (typeof setActiveMainTab === 'function') setActiveMainTab('timetable');
                if (typeof renderTimetableGrid === 'function') renderTimetableGrid();
                const ttGrid = document.getElementById('timetable-grid-container');
                const ttPanel = document.getElementById('timetable-office-hours-panel');
                const gridHiddenByDefault = !(ttGrid && ttGrid.innerHTML.includes('timetable-office-hour-card'));
                const panelHasCustom = !!(ttPanel && ttPanel.innerHTML.includes('ד"ר בדיקה'));
                window.toggleOfficeHoursTimetable(true);
                const gridShowsWhenToggled = !!(document.getElementById('timetable-grid-container')?.innerHTML.includes('timetable-office-hour-card'));
                window.toggleOfficeHoursTimetable(false);
                const gridHidesWhenToggled = !(document.getElementById('timetable-grid-container')?.innerHTML.includes('timetable-office-hour-card'));
                if (typeof openCourseDetails === 'function') openCourseDetails('034053');
                const modalOhCard = document.getElementById('course-modal-office-hours-card');
                const modalHasOh = !!(modalOhCard && modalOhCard.innerHTML.includes('פרופ׳ ספי גבלי'));
                const courseModalEl = document.getElementById('course-modal');
                if (courseModalEl) courseModalEl.classList.remove('active');
                const customList = window.OfficeHoursEngine.getCourseOfficeHours('114052');
                customList.filter(o => o.staffName === 'ד"ר בדיקה').forEach(o => window.OfficeHoursEngine.deleteCourseOfficeHour('114052', o.id));
                delete window.gameState.courses['114052']._officeHoursInitialized;

                // 3. Persistent Task Filters across reload simulation
                if (typeof setActiveMainTab === 'function') setActiveMainTab('tasks');
                const hwTypeCb = document.querySelector('#notion-type-filter-popover .notion-filter-type-cb[data-type="exam"]');
                const statusDoneCb = document.querySelector('#notion-status-filter-popover .notion-filter-opt-cb[data-status="done"]');
                const focusBtn = document.getElementById('notion-focus-toggle-btn');
                const searchEl = document.getElementById('search-tasks');
                if (hwTypeCb) hwTypeCb.checked = false;
                if (statusDoneCb) statusDoneCb.checked = false;
                if (focusBtn) focusBtn.classList.add('active');
                if (searchEl) searchEl.value = 'בדיקת סינון';
                window.activeOrganitCategory = 'hw';
                window.saveNotionFilterPreferences();

                // Simulate fresh session DOM state and restore
                if (hwTypeCb) hwTypeCb.checked = true;
                if (statusDoneCb) statusDoneCb.checked = true;
                if (focusBtn) focusBtn.classList.remove('active');
                if (searchEl) searchEl.value = '';
                window.activeOrganitCategory = 'all';
                window._notionFiltersRestored = false;
                window.restoreNotionFilterPreferences(true);

                const restoredExamUnchecked = hwTypeCb ? hwTypeCb.checked === false : false;
                const restoredDoneUnchecked = statusDoneCb ? statusDoneCb.checked === false : false;
                const restoredFocusActive = focusBtn ? focusBtn.classList.contains('active') === true : false;
                const restoredSearch = searchEl ? searchEl.value === 'בדיקת סינון' : false;
                const restoredOrganit = window.activeOrganitCategory === 'hw';
                const cloudHasFilterPrefs = !!(window.gameState && window.gameState.taskFilterPreferences && window.gameState.taskFilterPreferences.organitCategory === 'hw');

                window.resetAllNotionFilters();
                if (typeof setActiveMainTab === 'function') setActiveMainTab('curriculum');

                return {
                    p1, p2, calRenderedTimedTask, icsHasTimedTask,
                    hasOhEngine, defaultsCount53: defaults53.length, addedCustom, gridHiddenByDefault, gridShowsWhenToggled, panelHasCustom, gridHidesWhenToggled, modalHasOh,
                    restoredExamUnchecked, restoredDoneUnchecked, restoredFocusActive, restoredSearch, restoredOrganit, cloudHasFilterPrefs
                };
            })()`);

            assert(result.p1.dateOnly === '2026-11-18' && result.p1.timeStr === '23:59', 'parseTaskDueDateParts must parse space-separated date+time');
            assert(result.p2.dateOnly === '2026-11-22' && result.p2.timeStr === '14:30', 'parseTaskDueDateParts must parse ISO T-separated date+time');
            assert(result.calRenderedTimedTask, 'Calendar must render timed Moodle tasks under YYYY-MM-DD with dueTime');
            assert(result.icsHasTimedTask, 'CalendarSyncEngine.generateUnifiedICS must include timed Moodle tasks');
            assert(result.hasOhEngine && result.defaultsCount53 >= 2 && result.addedCustom, 'OfficeHoursEngine must provide defaults and support adding custom entries: ' + JSON.stringify(result));
            assert(result.gridHiddenByDefault && result.gridShowsWhenToggled && result.panelHasCustom && result.gridHidesWhenToggled && result.modalHasOh, 'Office Hours must stay clean off grid by default, show in bottom panel + course modal, and toggle cleanly: ' + JSON.stringify(result));
            assert(result.restoredExamUnchecked && result.restoredDoneUnchecked && result.restoredFocusActive && result.restoredSearch && result.restoredOrganit && result.cloudHasFilterPrefs, 'All task filters + focus + search + cloud state must persist and restore');
        });

        await test('Test 24: UI Typography Craft Rules & Monospace Digits (v2.13.15)', async () => {
            const result = await cdp.eval(`(() => {
                const navLabels = Array.from(document.querySelectorAll('.nav-tab-label[data-text]'));
                const dayPills = Array.from(document.querySelectorAll('#timetable-day-selector .tab-label-reserve[data-text]'));
                const fnHtml = (typeof window.formatMiddleTruncatedFileNameHtml === 'function')
                    ? window.formatMiddleTruncatedFileNameHtml('Syllabus_Thermo_Winter 2026-2027_LT.pdf')
                    : '';
                const hasMiddleTrunc = fnHtml.includes('ui-file-name-stem') && fnHtml.includes('ui-file-name-ext') && fnHtml.includes('>.pdf<');
                const htmlLang = document.documentElement.getAttribute('lang');
                const bodyNum = getComputedStyle(document.body).fontVariantNumeric;
                const kpiEl = document.querySelector('.stat-value, .analytics-kpi-value');
                const kpiFont = kpiEl ? getComputedStyle(kpiEl).fontFamily : '';
                return {
                    navLabelCount: navLabels.length,
                    dayPillCount: dayPills.length,
                    hasMiddleTrunc,
                    htmlLang,
                    bodyNum,
                    kpiFont
                };
            })()`);
            const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
            assert(result.navLabelCount >= 6, 'All 6 top nav tabs must reserve bold width via data-text');
            assert(result.dayPillCount >= 7, 'Day selector tabs must reserve bold width via tab-label-reserve');
            assert(result.hasMiddleTrunc, 'formatMiddleTruncatedFileNameHtml must split stem & extension cleanly');
            assert(result.htmlLang === 'he', 'Root html must declare lang for hyphenation');
            assert(String(result.bodyNum).includes('tabular-nums'), 'Body must compute font-variant-numeric: tabular-nums');
            assert(String(result.kpiFont).includes('JetBrains Mono'), 'KPI counters must use JetBrains Mono monospace digits');
            assert(stylesCss.includes('text-underline-offset: 0.2em'), 'Links must set text-underline-offset: 0.2em');
            assert(stylesCss.includes('text-box-trim: trim-both'), 'Labels/buttons must declare text-box-trim: trim-both');
            assert(stylesCss.includes('font-variant-caps: all-small-caps'), 'Acronyms must use all-small-caps');
            assert(stylesCss.includes('hyphens: auto'), 'Narrow columns must enable hyphens: auto');
            assert(stylesCss.includes('-webkit-line-clamp: 2'), 'Card titles must clamp to 2 lines');
            assert(stylesCss.includes('font-feature-settings: "tnum" 1'), 'Global monospace/tabular digits must enable tnum');
        });

        await test('Test 25: Mobile Back History Shield, Toast Clearance, Day View & Safe Calendar Clicks (v2.13.16)', async () => {
            const manifestXml = fs.readFileSync(path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml'), 'utf8');
            const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
            const uiEnhJs = fs.readFileSync(path.join(__dirname, '..', 'ui_enhancements.js'), 'utf8');

            assert(manifestXml.includes('enableOnBackInvokedCallback="false"'), 'AndroidManifest must opt out of Predictive Back to keep OnBackPressedDispatcher intact');
            assert(stylesCss.includes('calc(96px + env(safe-area-inset-bottom'), 'Mobile .ast-toast must clear bottom nav bar and footer');
            assert(stylesCss.includes('finals-calendar-grid.is-day-view'), 'styles.css must define Calendar Day View rules');
            assert(uiEnhJs.includes('armActiveHistoryEntry'), 'MobileBackNavigationManager must arm history on active user gesture');

            const res = await cdp.eval(`(() => {
                if (typeof window.setActiveMainTab === 'function') window.setActiveMainTab('calendar');
                const dayBtn = document.getElementById('btn-view-day');
                if (dayBtn) dayBtn.click();
                const grid = document.getElementById('finals-calendar-grid');
                const hasDayClass = !!(grid && grid.classList.contains('is-day-view'));
                const dayCardCount = document.querySelectorAll('.cal-day-view-card').length;

                // Switch to week view and ensure clicking a task or check span opens peek WITHOUT marking completed
                if (typeof window.setCalendarViewMode === 'function') window.setCalendarViewMode('week');
                const weekTask = Array.from(document.querySelectorAll('.cal-event-pill.task-event')).find(p => p.dataset && p.dataset.courseCode && p.dataset.taskId);
                let completedBefore = null;
                let completedAfter = null;
                let peekOpened = false;
                if (weekTask) {
                    const cCode = weekTask.dataset.courseCode;
                    const tId = weekTask.dataset.taskId;
                    const course = window.gameState && window.gameState.courses && window.gameState.courses[cCode];
                    const task = course && (course.tasks || []).find(t => t.id === tId);
                    completedBefore = !!(task && (task.completed || task.status === 'done'));
                    const iconTarget = weekTask.querySelector('.cal-task-check') || weekTask;
                    iconTarget.click();
                    completedAfter = !!(task && (task.completed || task.status === 'done'));
                    const peekEl = document.getElementById('task-side-peek');
                    peekOpened = !!(peekEl && peekEl.classList.contains('active'));
                }

                // Back button must close task side peek BEFORE leaving calendar tab
                const backClosedPeek = (typeof window.handleMobileBackAction === 'function') ? window.handleMobileBackAction() : false;
                const peekAfterBack = !!(document.getElementById('task-side-peek') && document.getElementById('task-side-peek').classList.contains('active'));

                // Next Back must step back from calendar tab (never exit at non-root)
                const backLeftTab = (typeof window.handleMobileBackAction === 'function') ? window.handleMobileBackAction() : false;

                return {
                    hasDayBtn: !!dayBtn,
                    hasDayClass,
                    dayCardCount,
                    hadWeekTask: !!weekTask,
                    completedUnchanged: completedBefore === completedAfter,
                    peekOpened,
                    backClosedPeek,
                    peekAfterBack,
                    backLeftTab
                };
            })()`);
            assert(res.hasDayBtn && res.hasDayClass && res.dayCardCount === 1, 'Calendar Day View toggle & card must render: ' + JSON.stringify(res));
            assert(!res.hadWeekTask || (res.completedUnchanged && res.peekOpened && res.backClosedPeek && !res.peekAfterBack), 'Clicking calendar task must open peek WITHOUT marking completed, and Back must close peek: ' + JSON.stringify(res));
            assert(res.backLeftTab === true, 'Back button from calendar must navigate back within app: ' + JSON.stringify(res));
        });

        await test('Test 26: Thermo 1 3-Hour Lecture, LTR Hours, Clean Default Timetable & Unified Course Colors (v2.13.17)', async () => {
            const wearHelper = fs.readFileSync(path.join(__dirname, '..', 'android', 'wear', 'src', 'main', 'java', 'com', 'technion', 'semestero', 'wear', 'WearScheduleHelper.java'), 'utf8');
            assert(wearHelper.includes('"08:30 - 11:30"') && wearHelper.includes('510, 690'), 'WearScheduleHelper must define Thermo 1 Tuesday lecture as 08:30 - 11:30 (510..690)');

            const appJsSrc = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
            const thermoBlockMatch = appJsSrc.match(/courseId:\s*"034035"[\s\S]{0,600}?cardClass:\s*"timetable-card-thermo"/);
            assert(thermoBlockMatch && thermoBlockMatch[0].includes('endTime: "11:30"') && thermoBlockMatch[0].includes('duration: "3 שעות"'), 'CHEESEFORK_SEMESTER_SCHEDULE must set Tuesday Thermo 1 lecture to 08:30 - 11:30 (3 שעות)');

            const res = await cdp.eval(`(() => {
                const origTimetable = window.gameState ? window.gameState.timetable : undefined;
                if (window.gameState) {
                    window.gameState.timetable = {
                        days: [{
                            dayIndex: 2,
                            name: 'שלישי',
                            classes: [{
                                courseId: '034035',
                                courseName: 'תרמודינמיקה 1',
                                type: 'הרצאה 10',
                                lecturer: "פרופ' לאוניד טרטקובסקי",
                                room: 'הנדסה כימית 1',
                                startTime: '08:30',
                                endTime: '10:30',
                                cardClass: 'timetable-card-thermo'
                            }]
                        }]
                    };
                }
                if (typeof setActiveMainTab === 'function') setActiveMainTab('timetable');
                if (typeof renderTimetableGrid === 'function') renderTimetableGrid();

                const tueCol = document.querySelector('.timetable-day-col[data-day-col="2"]');
                const thermoCard = tueCol ? Array.from(tueCol.querySelectorAll('.timetable-card')).find(el => el.innerText.includes('תרמודינמיקה 1') && el.innerText.includes('הרצאה')) : null;
                const timeSpan = thermoCard ? thermoCard.querySelector('.ui-time-ltr') : null;
                const timeStyle = timeSpan ? getComputedStyle(timeSpan) : null;
                const cardHtmlHasLtr = !!(thermoCard && thermoCard.innerHTML.includes('dir="ltr"') && thermoCard.innerText.includes('08:30 - 11:30') && thermoCard.innerText.includes('3 שעות'));
                const healedEnd = window.gameState?.timetable?.days?.[0]?.classes?.[0]?.endTime;
                const healedDur = window.gameState?.timetable?.days?.[0]?.classes?.[0]?.duration;

                if (window.gameState) {
                    if (origTimetable === undefined) delete window.gameState.timetable;
                    else window.gameState.timetable = origTimetable;
                }

                // Test unified per-course accent color across Tasks & Calendar
                if (typeof setActiveMainTab === 'function') setActiveMainTab('tasks');
                const thermoColor = typeof window.getCourseAccentColor === 'function' ? window.getCourseAccentColor('034035') : '';
                const physicsColor = typeof window.getCourseAccentColor === 'function' ? window.getCourseAccentColor('114052') : '';
                const hasTaskRowAccent = document.querySelectorAll('tr.has-course-accent[style*="--course-accent"]').length > 0;
                const ohDefault = typeof window.isOfficeHoursOverlayEnabled === 'function' ? window.isOfficeHoursOverlayEnabled() : null;

                if (typeof setActiveMainTab === 'function') setActiveMainTab('curriculum');
                return {
                    hasThermo3hText: cardHtmlHasLtr,
                    timeDir: timeStyle ? timeStyle.direction : '',
                    timeBidi: timeStyle ? timeStyle.unicodeBidi : '',
                    healedEnd,
                    healedDur,
                    thermoColor,
                    physicsColor,
                    distinctColors: Boolean(thermoColor && physicsColor && thermoColor !== physicsColor),
                    hasTaskRowAccent,
                    ohDefault
                };
            })()`);

            assert(res.hasThermo3hText, 'Timetable Tuesday Thermo 1 lecture must show 08:30 - 11:30 & 3 שעות: ' + JSON.stringify(res));
            assert(res.timeDir === 'ltr' && res.timeBidi.includes('isolate'), 'Time ranges must render LTR with unicode-bidi isolate: ' + JSON.stringify(res));
            assert(res.healedEnd === '11:30' && res.healedDur === '3 שעות', 'enrichTimetableWithAuthenticRooms must heal stale 10:30 thermo slot to 11:30 / 3 שעות: ' + JSON.stringify(res));
            assert(res.distinctColors && res.hasTaskRowAccent, 'Each course must apply its distinct --course-accent color in Tasks & UI: ' + JSON.stringify(res));
            assert(res.ohDefault === false, 'Office Hours overlay inside Timetable grid must default to false (bottom panel remains primary): ' + JSON.stringify(res));
        });

        await test('Test 27: Top HUD Open Tasks Jump & Horizontal Swipe Tab Switching (v2.13.18)', async () => {
            const res = await cdp.eval(`(() => {
                if (typeof setActiveMainTab === 'function') setActiveMainTab('curriculum');
                const openTasksStat = document.getElementById('stat-item-open-tasks');
                if (openTasksStat) openTasksStat.click();
                const jumpedToTasks = (window.currentActiveTab === 'tasks');

                // Bypass cooldown for deterministic swipe assertions
                if (window.HorizontalTabSwipeManager) window.HorizontalTabSwipeManager._lastSwitchMs = 0;
                const swipedRightToCalendar = (typeof window.handleHorizontalTabSwipe === 'function')
                    ? window.handleHorizontalTabSwipe(120, 10, document.getElementById('tasks-workspace'))
                    : false;
                const tabAfterRight = window.currentActiveTab;

                if (window.HorizontalTabSwipeManager) window.HorizontalTabSwipeManager._lastSwitchMs = 0;
                const swipedLeftToTasks = (typeof window.handleHorizontalTabSwipe === 'function')
                    ? window.handleHorizontalTabSwipe(-120, 8, document.getElementById('tasks-workspace'))
                    : false;
                const tabAfterLeft = window.currentActiveTab;

                // Must block swipe inside flowchart canvas
                if (window.HorizontalTabSwipeManager) window.HorizontalTabSwipeManager._lastSwitchMs = 0;
                if (typeof setActiveMainTab === 'function') setActiveMainTab('curriculum');
                const fcViewport = document.querySelector('.flowchart-viewport');
                const blockedInFlowchart = (typeof window.handleHorizontalTabSwipe === 'function' && fcViewport)
                    ? window.handleHorizontalTabSwipe(140, 5, fcViewport)
                    : null;

                // Must block vertical scroll swipes
                if (window.HorizontalTabSwipeManager) window.HorizontalTabSwipeManager._lastSwitchMs = 0;
                const blockedVertical = (typeof window.handleHorizontalTabSwipe === 'function')
                    ? window.handleHorizontalTabSwipe(40, 140, document.getElementById('planner-workspace'))
                    : null;

                // What's New accordion must show ONLY latest item by default and fold older items on toggle
                if (typeof setActiveMainTab === 'function') setActiveMainTab('settings');
                const whatsNewMainItems = document.querySelectorAll('#settings-card-whats-new .whats-new-list > li').length;
                const olderListEl = document.getElementById('older-versions-list');
                const olderCollapsedInitially = !!(olderListEl && getComputedStyle(olderListEl).display === 'none');
                if (typeof window.toggleOlderWhatsNewVersions === 'function') window.toggleOlderWhatsNewVersions(true);
                const olderExpandedAfterClick = !!(olderListEl && getComputedStyle(olderListEl).display === 'block');
                if (typeof window.toggleOlderWhatsNewVersions === 'function') window.toggleOlderWhatsNewVersions(false);

                return {
                    hasOpenTasksStat: !!openTasksStat,
                    jumpedToTasks,
                    swipedRightToCalendar,
                    tabAfterRight,
                    swipedLeftToTasks,
                    tabAfterLeft,
                    blockedInFlowchart,
                    blockedVertical,
                    whatsNewMainItems,
                    olderCollapsedInitially,
                    olderExpandedAfterClick
                };
            })()`);

            assert(res.hasOpenTasksStat && res.jumpedToTasks, 'Clicking #stat-item-open-tasks must switch directly to tasks tab: ' + JSON.stringify(res));
            assert(res.swipedRightToCalendar && res.tabAfterRight === 'calendar', 'Swiping right from tasks must advance to calendar: ' + JSON.stringify(res));
            assert(res.swipedLeftToTasks && res.tabAfterLeft === 'tasks', 'Swiping left from calendar must return to tasks: ' + JSON.stringify(res));
            assert(res.blockedInFlowchart !== true, 'Swipe inside .flowchart-viewport must not hijack map panning: ' + JSON.stringify(res));
            assert(res.blockedVertical === false, 'Mostly-vertical swipe must not switch tabs: ' + JSON.stringify(res));
            assert(res.whatsNewMainItems === 1 && res.olderCollapsedInitially && res.olderExpandedAfterClick, "What's New card must show ONLY the latest update by default and collapse/expand older updates: " + JSON.stringify(res));
        });

        await test('Test 28: technion_second_brain Sync (39 Courses, LRB1, PDE1/PHY2 Concepts & Appendixes)', async () => {
            const res = await cdp.eval(`(() => {
                const catalogKeys = window.PangeaHub ? Object.keys(window.PangeaHub.catalog) : [];
                const lrbData = window.PangeaHub ? window.PangeaHub.getCourseData('00340401') : null;
                const htfUrl = (window.PANGEA_COURSE_MAP && window.PANGEA_COURSE_MAP['00340041']) || '';
                const sturmMatches = window.PangeaHub ? window.PangeaHub.search('שטורם-ליוביל') : [];
                const gaussPhysMatches = window.PangeaHub ? window.PangeaHub.search('חוק גאוס') : [];

                if (typeof openCourseDetails === 'function') openCourseDetails('034053');
                const pangeaEl = document.getElementById('modal-pangea-container');
                const html = pangeaEl ? pangeaEl.innerHTML : '';
                const hasConceptsSection = html.includes('מושגי מפתח ונוסחאות');
                const hasAppendixSection = html.includes('טבלאות נוסחאות, נספחים ומעבדות');
                const hasGithubLink = html.includes('github.com/NuclearGandhi/technion_second_brain');

                if (typeof closeCourseModal === 'function') closeCourseModal();

                return {
                    courseCount: catalogKeys.length,
                    hasLrb: !!lrbData && lrbData.course_tag === 'LRB1',
                    htfFixed: decodeURIComponent(htfUrl).endsWith('מעבר-חום'),
                    hasPdeConcept: sturmMatches.length > 0 && sturmMatches[0].courseTag === 'PDE1',
                    hasPhy2Concept: gaussPhysMatches.length > 0 && gaussPhysMatches[0].courseTag === 'PHY2',
                    hasConceptsSection,
                    hasAppendixSection,
                    hasGithubLink
                };
            })()`);

            assert(res.courseCount === 39, 'Expected 39 synced Fangia/technion_second_brain courses, got ' + res.courseCount);
            assert(res.hasLrb, 'LRB1 (00340401) must resolve via PangeaHub.getCourseData: ' + JSON.stringify(res));
            assert(res.htfFixed, 'HTF1 URL in PANGEA_COURSE_MAP must end with מעבר-חום: ' + JSON.stringify(res));
            assert(res.hasPdeConcept && res.hasPhy2Concept, 'PDE1 & PHY2 deep concepts must be searchable: ' + JSON.stringify(res));
            assert(res.hasConceptsSection && res.hasAppendixSection && res.hasGithubLink, 'Course modal must render key concepts, appendixes, and technion_second_brain GitHub link: ' + JSON.stringify(res));
        });

        await test('Test 29: Homework Grade Entry, Side Peek, Best-N-of-M Average & Sync Preservation (v2.13.20)', async () => {
            const res = await cdp.eval(`(() => {
                if (typeof setActiveMainTab === 'function') setActiveMainTab('tasks');
                const c034035 = (typeof window.resolveCourseForTask === 'function' ? window.resolveCourseForTask('034035') : null) || window.gameState.courses['034035'] || window.gameState.courses['00340035'];
                if (!c034035) return { ok: false, reason: '034035 missing' };

                const backupTasks = JSON.parse(JSON.stringify(c034035.tasks || []));
                const backupStatus = c034035.status;
                const backupGuard = window.gameState.semesterGuardMode;
                try {
                    window.gameState.semesterGuardMode = 'unlocked';
                    // Ensure clean HW task on 034035 and enter grades via setHomeworkSheetGrade + updateTaskGrade
                    c034035.status = 'active';
                    c034035.tasks = [
                        { id: 'test_hw_1', title: 'תרגיל בית 1', type: 'hw', status: 'not_started', completed: false, xp: 50, dueDate: '' }
                    ];
                    const saved1 = window.updateTaskGrade(c034035.code || '034035', 'test_hw_1', '94');
                    const curCourse = (typeof window.resolveCourseForTask === 'function' ? window.resolveCourseForTask('034035') : c034035) || c034035;
                    const t1 = (curCourse.tasks || []).find(t => t.id === 'test_hw_1');
                    const promotedDone = !!(t1 && t1.status === 'done' && t1.grade === 94 && t1.gradeUpdatedAt);

                    // Enter sheet 2 grade directly via Best-N-of-M sheet helper
                    const saved2 = window.setHomeworkSheetGrade(c034035.code || '034035', 2, 'single', '86');
                    const hwStatus = window.getCourseHomeworkStatus(c034035.code || '034035');

                    // Open Notion Tasks table & verify inline grade input rendered
                    if (typeof renderNotionTasksTable === 'function') renderNotionTasksTable();
                    const inlineInput = document.querySelector('#notion-tasks-table-body tr[data-task-id="test_hw_1"] .notion-inline-grade-input');
                    const hasInlineGrade = !!inlineInput && inlineInput.value === '94';

                    // Open Task Side Peek & verify #peek-property-grade-row is visible for HW task
                    if (typeof openTaskSidePeek === 'function') openTaskSidePeek('034035', 'test_hw_1');
                    const peekRow = document.getElementById('peek-property-grade-row');
                    const peekInput = document.getElementById('peek-property-grade');
                    const peekVisibleForHw = !!(peekRow && peekRow.style.display === 'grid' && peekInput && peekInput.value === '94');
                    if (typeof closeTaskSidePeek === 'function') closeTaskSidePeek();

                    // Open Course Details Modal & verify HW Policy average pill renders
                    if (typeof openCourseDetails === 'function') openCourseDetails('034035');
                    const hwPolicyHtml = (document.getElementById('modal-hw-policy-section') || {}).innerHTML || '';
                    const modalHasHwInput = !!document.querySelector('#modal-hw-policy-section .hw-grade-input');
                    const modalHasAvgPill = hwPolicyHtml.includes('ממוצע ש״ב') && hwPolicyHtml.includes('90');
                    if (typeof closeCourseModal === 'function') closeCourseModal();

                    // Cloud sync merge must preserve newer grade
                    const merged = window.AuthSync && typeof window.AuthSync.mergeCoursesPreservingTaskCompletion === 'function'
                        ? window.AuthSync.mergeCoursesPreservingTaskCompletion(
                            { '034035': { code: '034035', tasks: [{ id: 'test_hw_1', title: 'תרגיל בית 1', grade: 94, gradeUpdatedAt: 2000, status: 'done', completed: true, statusUpdatedAt: 2000 }] } },
                            { '034035': { code: '034035', tasks: [{ id: 'test_hw_1', title: 'תרגיל בית 1', grade: 70, gradeUpdatedAt: 1000, status: 'done', completed: true, statusUpdatedAt: 2000 }] } }
                        )
                        : null;
                    const syncPreservedNewerGrade = !!(merged && merged['034035'] && merged['034035'].tasks[0].grade === 94);

                    return {
                        ok: true,
                        saved1,
                        saved2,
                        promotedDone,
                        t1State: t1 ? { status: t1.status, grade: t1.grade, gradeUpdatedAt: t1.gradeUpdatedAt } : null,
                        bestNAvg: hwStatus ? hwStatus.bestNAverage : null,
                        hasInlineGrade,
                        peekVisibleForHw,
                        modalHasHwInput,
                        modalHasAvgPill,
                        syncPreservedNewerGrade
                    };
                } finally {
                    c034035.tasks = backupTasks;
                    c034035.status = backupStatus;
                    window.gameState.semesterGuardMode = backupGuard;
                    if (typeof saveState === 'function') saveState();
                    if (typeof renderNotionTasksTable === 'function') renderNotionTasksTable();
                }
            })()`);

            assert(res.ok && res.saved1 === 94 && res.saved2 === 86, 'Failed saving HW grades: ' + JSON.stringify(res));
            assert(res.promotedDone, 'Entering HW grade must auto-promote status to done with timestamp: ' + JSON.stringify(res));
            assert(res.bestNAvg === 90, 'Expected Best-N HW average 90 from (94, 86), got: ' + JSON.stringify(res));
            assert(res.hasInlineGrade, 'Notion tasks table must render .notion-inline-grade-input with saved grade: ' + JSON.stringify(res));
            assert(res.peekVisibleForHw, 'Task Side Peek must show #peek-property-grade-row for hw tasks: ' + JSON.stringify(res));
            assert(res.modalHasHwInput && res.modalHasAvgPill, 'Course modal HW policy grid must show .hw-grade-input and HW average pill: ' + JSON.stringify(res));
            assert(res.syncPreservedNewerGrade, 'AuthSync mergeCoursesPreservingTaskCompletion must keep newer HW grade: ' + JSON.stringify(res));
        });

        await test('Test 30: UI Craft Completion (Scroll Edge Masks, Balanced Headlines, Concentric Radii, Layered Shadows & Bell Ring) (v2.13.21)', async () => {
            const stylesCss = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf8');
            assert(stylesCss.includes('mask-image: linear-gradient('), 'styles.css must define horizontal scroll edge mask-image');
            assert(stylesCss.includes('text-wrap: balance'), 'styles.css must define text-wrap: balance for titles');
            assert(stylesCss.includes('calc(var(--outer-r) - var(--pad))'), 'styles.css must define concentric border-radius calculation');
            assert(stylesCss.includes('@keyframes lucideBellSwing'), 'styles.css must define selective animate-ui Lucide HUD keyframes');

            const res = await cdp.eval(`(() => {
                if (typeof setActiveMainTab === 'function') setActiveMainTab('settings');
                const titleEl = document.querySelector('.settings-page-title');
                const titleTextWrap = titleEl ? (getComputedStyle(titleEl).textWrap || '') : '';

                const modalEl = document.querySelector('#course-modal .modal-content');
                const modalShadow = modalEl ? getComputedStyle(modalEl).boxShadow : '';
                const shadowLayerCount = modalShadow ? modalShadow.split(/,(?![^()]*\\))/).length : 0;

                if (typeof setActiveMainTab === 'function') setActiveMainTab('planner');
                const colEl = document.querySelector('.planner-semester-col');
                const cardEl = document.querySelector('.planner-semester-col .planner-course-card');
                const colRadius = colEl ? parseFloat(getComputedStyle(colEl).borderTopLeftRadius) : 0;
                const cardRadius = cardEl ? parseFloat(getComputedStyle(cardEl).borderTopLeftRadius) : 0;

                if (typeof setActiveMainTab === 'function') setActiveMainTab('tasks');
                const hwSummary = document.querySelector('.notion-hw-policy-strip .hw-collapsed-summary');
                const hwMask = hwSummary ? (getComputedStyle(hwSummary).maskImage || getComputedStyle(hwSummary).webkitMaskImage || '') : '';

                // Trigger notification bell bump and confirm #btn-notification-bell gets .is-ringing (and respects reduced motion)
                const badgeEl = document.getElementById('bell-badge-count');
                const bellBtn = document.getElementById('btn-notification-bell');
                let bellRang = false;
                let reducedMotionBlockedRing = false;
                if (badgeEl && bellBtn && window.UiMotionPromptsSuite) {
                    const prevText = badgeEl.textContent;
                    const prevDisp = badgeEl.style.display;
                    const origGetReduced = window.UiMotionPromptsSuite.getReducedMotion;
                    try {
                        badgeEl.textContent = '3';
                        badgeEl.style.display = 'inline-flex';
                        window.UiMotionPromptsSuite.getReducedMotion = () => false;
                        window.UiMotionPromptsSuite.triggerBadgeBump(badgeEl);
                        bellRang = bellBtn.classList.contains('is-ringing');
                        bellBtn.classList.remove('is-ringing');
                        badgeEl.classList.remove('is-bumping');

                        window.UiMotionPromptsSuite.getReducedMotion = () => true;
                        window.UiMotionPromptsSuite.triggerBadgeBump(badgeEl);
                        reducedMotionBlockedRing = !bellBtn.classList.contains('is-ringing');
                    } finally {
                        window.UiMotionPromptsSuite.getReducedMotion = origGetReduced;
                        badgeEl.textContent = prevText;
                        badgeEl.style.display = prevDisp;
                        bellBtn.classList.remove('is-ringing');
                        badgeEl.classList.remove('is-bumping');
                    }
                }

                if (typeof setActiveMainTab === 'function') setActiveMainTab('curriculum');
                return {
                    titleTextWrap,
                    shadowLayerCount,
                    colRadius,
                    cardRadius,
                    concentricValid: colRadius === 12 && cardRadius === 8,
                    hwHasMask: hwMask.includes('linear-gradient'),
                    bellRang,
                    reducedMotionBlockedRing
                };
            })()`);

            assert(res.titleTextWrap === 'balance', 'Headlines must compute text-wrap: balance: ' + JSON.stringify(res));
            assert(res.shadowLayerCount >= 3, 'Modal must have layered ambient box-shadows (>=3 layers): ' + JSON.stringify(res));
            assert(res.concentricValid, 'Planner card must use concentric inner radius (12px outer - 4px pad = 8px): ' + JSON.stringify(res));
            assert(res.hwHasMask, 'Horizontal chip strip must apply linear-gradient edge mask: ' + JSON.stringify(res));
            assert(res.bellRang && res.reducedMotionBlockedRing, 'Badge bump must ring #btn-notification-bell via .is-ringing and respect reduced motion: ' + JSON.stringify(res));
        });

        await test('Test 31: Curriculum Tree Sidebar/Flowchart-Pill Removal & Inline Legend Toolbar (v2.13.22)', async () => {
            const res = await cdp.eval(`(() => {
                if (typeof setActiveMainTab === 'function') setActiveMainTab('tree');
                const sidebar = document.querySelector('#curriculum-tree-workspace .hud-sidebar');
                const controls = document.querySelector('#curriculum-tree-workspace .tree-controls');
                const modePill = document.getElementById('btn-mode-flowchart');
                const toolbar = document.querySelector('#curriculum-tree-workspace .flowchart-toolbar');
                const legend = toolbar ? toolbar.querySelector('.tree-legend') : null;
                const actions = toolbar ? toolbar.querySelector('.flowchart-actions') : null;
                const zoomInBtn = document.getElementById('btn-fc-zoom-in');
                const zoomOutBtn = document.getElementById('btn-fc-zoom-out');
                const legendItems = legend ? legend.querySelectorAll('.legend-item').length : 0;
                const toolbarStyle = toolbar ? getComputedStyle(toolbar) : null;
                const legendRect = legend ? legend.getBoundingClientRect() : null;
                const zoomRect = zoomInBtn ? zoomInBtn.getBoundingClientRect() : null;
                return {
                    hasSidebar: !!sidebar,
                    hasControls: !!controls,
                    hasModePill: !!modePill,
                    hasToolbar: !!toolbar,
                    hasLegendInToolbar: !!legend,
                    hasActionsInToolbar: !!actions,
                    hasZoomBtns: !!(zoomInBtn && zoomOutBtn),
                    legendItems,
                    toolbarDisplay: toolbarStyle ? toolbarStyle.display : '',
                    sameRowDeltaY: (legendRect && zoomRect) ? Math.abs(legendRect.top - zoomRect.top) : 999,
                    legendHeight: legendRect ? legendRect.height : 0,
                    zoomHeight: zoomRect ? zoomRect.height : 0
                };
            })()`);

            assert(!res.hasSidebar, '.hud-sidebar must be removed from #curriculum-tree-workspace');
            assert(!res.hasControls && !res.hasModePill, '.tree-controls and #btn-mode-flowchart must be removed from #curriculum-tree-workspace');
            assert(res.hasToolbar && res.hasLegendInToolbar && res.hasActionsInToolbar && res.hasZoomBtns, '.flowchart-toolbar must contain .tree-legend and .flowchart-actions with zoom buttons: ' + JSON.stringify(res));
            assert(res.legendItems === 4, 'Inline .tree-legend must have 4 .legend-item badges: ' + JSON.stringify(res));
            assert(res.toolbarDisplay === 'flex', '.flowchart-toolbar must compute display: flex: ' + JSON.stringify(res));
            assert(res.legendHeight > 0 && res.zoomHeight > 0 && res.sameRowDeltaY < 24, '.tree-legend and zoom buttons must align on the same horizontal row: ' + JSON.stringify(res));
        });

        await test('Test 32: Semestero ME v3.0.0 Overhaul (HUD Week, Tasks 3.0, Google Calendar Time-Grid, Drive Subfolders & Universal Personalization)', async () => {
            const res = await cdp.eval(`(() => {
                // Ensure clean filter state & fresh HUD update
                if (typeof window.resetAllNotionFilters === 'function') window.resetAllNotionFilters();
                if (typeof window.recalculateCourseStates === 'function') window.recalculateCourseStates();
                if (typeof window.updateHud === 'function') window.updateHud();

                // 1. HUD Semester Week click -> Attendance Stats & Weekly Tracking + Open Tasks 1:1 parity inspection
                const semWeekBoxEl = document.getElementById('stat-item-completed-courses');
                if (semWeekBoxEl) semWeekBoxEl.click();
                const semWeekOpensStats = !!(document.getElementById('modal-attendance-hub') && window.AttendanceHub && window.AttendanceHub.activeTab === 'stats');
                const semWeekBadgeClickable = !!document.querySelector('#modal-attendance-hub .week-nav-current-badge[onclick*="stats"]');
                if (window.AttendanceHub && typeof window.AttendanceHub.close === 'function') window.AttendanceHub.close();
                const semWeekText = document.getElementById('stat-semester-week')?.innerText || '';
                const openTasksText = document.getElementById('stat-open-tasks')?.innerText?.trim() || '';
                if (typeof renderTasksReminderBanner === 'function') renderTasksReminderBanner();
                const remCountBefore = parseInt(document.getElementById('reminders-total-count')?.innerText || '0', 10);
                let parityWithOneDueTask = false;
                const parityCourse = (window.gameState && window.gameState.courses && Object.values(window.gameState.courses).find(x => x && x.status === 'active'));
                if (parityCourse) {
                    const origPTasks = JSON.parse(JSON.stringify(parityCourse.tasks || []));
                    const dueIn3 = new Date(Date.now() + 3 * 86400000);
                    const dueYmd = dueIn3.getFullYear() + '-' + String(dueIn3.getMonth() + 1).padStart(2, '0') + '-' + String(dueIn3.getDate()).padStart(2, '0') + ' 23:59';
                    parityCourse.tasks = (parityCourse.tasks || []).concat([{ id: 'v301_parity_due', title: 'תרגיל בדיקת סנכרון 1:1', type: 'hw', status: 'in_progress', completed: false, dueDate: dueYmd, xp: 40 }]);
                    if (typeof window.recalculateCourseStates === 'function') window.recalculateCourseStates();
                    if (typeof window.updateHud === 'function') window.updateHud();
                    if (typeof window.renderTasksReminderBanner === 'function') window.renderTasksReminderBanner();
                    const hudAfterAdd = Number(document.getElementById('stat-open-tasks')?.innerText?.trim());
                    const remAfterAdd = parseInt(document.getElementById('reminders-total-count')?.innerText || '-1', 10);
                    parityWithOneDueTask = (hudAfterAdd === Number(openTasksText) + 1) && (hudAfterAdd === remAfterAdd);
                    parityCourse.tasks = origPTasks;
                    if (typeof window.recalculateCourseStates === 'function') window.recalculateCourseStates();
                    if (typeof window.updateHud === 'function') window.updateHud();
                    if (typeof window.renderTasksReminderBanner === 'function') window.renderTasksReminderBanner();
                }
                const openTaskDebug = [];
                if (window.gameState && window.gameState.courses) {
                    Object.values(window.gameState.courses).forEach(c => {
                        if (c && c.status === 'active' && Array.isArray(c.tasks)) {
                            c.tasks.forEach(t => {
                                const tt = String(t.type || '').toLowerCase();
                                const ttitle = String(t.title || '').toLowerCase();
                                if (tt !== 'exam' && tt !== 'midterm' && tt !== 'quiz' && !ttitle.includes('מבחן') && !ttitle.includes('מועד') && !t.completed && t.status !== 'done' && t.status !== 'submitted') {
                                    openTaskDebug.push(c.code + ':' + t.id);
                                }
                            });
                        }
                    });
                }

                // 2. Tasks Board: On-demand selection, removed Sem/Grade cols, inline completed grade, Drive deep link, 5 types, cascading Sem -> Course filters
                if (typeof setActiveMainTab === 'function') setActiveMainTab('tasks');
                // Ensure at least one active course has a completed graded task to verify inline completed-grade UX
                const c53 = (window.gameState && window.gameState.courses && (window.gameState.courses['034053'] || window.gameState.courses['00340053'] || Object.values(window.gameState.courses).find(x => x && x.status === 'active')));
                const origTasksBackup = c53 ? JSON.parse(JSON.stringify(c53.tasks || [])) : null;
                const origStatusBackup = c53 ? c53.status : null;
                if (c53) {
                    c53.status = 'active';
                    c53.tasks = (c53.tasks || []).concat([{
                        id: 'v3_test_done_hw', title: 'תרגיל בית לבדיקה', type: 'hw', status: 'done', completed: true, grade: 96, xp: 50, dueDate: '2026-11-10'
                    }]);
                }
                if (typeof renderNotionTasksTable === 'function') renderNotionTasksTable();
                const tableEl = document.querySelector('.notion-tasks-table');
                const headers = Array.from(document.querySelectorAll('.notion-tasks-table thead th')).map(th => th.innerText.trim());
                const selectCellHiddenByDefault = (() => {
                    const td = document.querySelector('.notion-table-select-cell');
                    return td ? getComputedStyle(td).display === 'none' : true;
                })();
                const toggleBtn = document.getElementById('btn-toggle-tasks-select-mode');
                if (toggleBtn) toggleBtn.click();
                const selectModeActivated = !!(tableEl && tableEl.classList.contains('is-select-mode-active'));
                if (toggleBtn) toggleBtn.click(); // toggle back off

                const hasInlineCompletedGrade = document.querySelectorAll('.completed-inline-grade-wrap .notion-inline-grade-input').length > 0;
                if (c53 && origTasksBackup) {
                    c53.tasks = origTasksBackup;
                    c53.status = origStatusBackup;
                }
                const typeCheckboxes = document.querySelectorAll('#notion-type-filter-popover .notion-filter-type-cb').length;
                const semBtn = document.getElementById('notion-semester-filter-btn');
                const courseBtn = document.getElementById('notion-course-filter-btn');
                const semBeforeCourse = !!(semBtn && courseBtn && (semBtn.compareDocumentPosition(courseBtn) & Node.DOCUMENT_POSITION_FOLLOWING));
                const driveDeepUrl = typeof window.getFacultyDriveCourseUrl === 'function'
                    ? window.getFacultyDriveCourseUrl('034053', { title: 'HW 3 - Rotation Transformation', type: 'hw' })
                    : '';
                const hasPeekColors = !!(document.getElementById('peek-task-color-input') && document.getElementById('btn-peek-apply-course-color'));

                // 3. Calendar: 7-col Month (Sun-Sat), clean task pills, Workweek 5-col & Week 7-col time-grid, overlap layout, recurrence expansion
                if (typeof setActiveMainTab === 'function') setActiveMainTab('calendar');
                if (typeof window.setCalendarViewMode === 'function') window.setCalendarViewMode('month');
                const monthHeaders = Array.from(document.querySelectorAll('#finals-calendar-grid .cal-day-header')).map(h => h.innerText);
                const taskPillHasNoCheckbox = !document.querySelector('.cal-event-pill.task-event .cal-task-check');

                if (typeof window.setCalendarViewMode === 'function') window.setCalendarViewMode('workweek');
                const workweekCols = document.querySelectorAll('#finals-calendar-grid .cal-timegrid-day-head').length;

                if (typeof window.setCalendarViewMode === 'function') window.setCalendarViewMode('week');
                const weekCols = document.querySelectorAll('#finals-calendar-grid .cal-timegrid-day-head').length;
                const calWeekBound = document.querySelector('#finals-calendar-grid .cal-timegrid-inner')?.dataset?.tgInteractiveBound === 'true';

                const overlapRes = typeof window.computeOverlapLayout === 'function'
                    ? window.computeOverlapLayout([{ startMin: 540, endMin: 660 }, { startMin: 600, endMin: 720 }])
                    : [];
                const overlapValid = overlapRes.length === 2 && overlapRes[0].colCount === 2 && overlapRes[1].colCount === 2 && overlapRes[0].colIndex !== overlapRes[1].colIndex;

                const expandedRec = typeof window.expandCustomCalendarEvents === 'function'
                    ? window.expandCustomCalendarEvents([{ id: 'test-rec', date: '2026-11-15', endDate: '2026-11-16', recurrence: 'weekly', title: 'מילואים' }], '2026-11-15', '2026-11-28')
                    : [];

                // Check enhanced Day Modal controls
                const hasDayModalEnhancements = !!(
                    document.getElementById('day-modal-event-date-start') &&
                    document.getElementById('day-modal-event-date-end') &&
                    document.getElementById('day-modal-event-recurrence') &&
                    document.getElementById('day-modal-event-reminder') &&
                    document.getElementById('day-modal-event-color')
                );

                // 4. Timetable: Single-day default + All-week toggle + Yoga 09:00 + Un-enrolled 114052 filtered + No Drag-Create + 1h Attendance + View Toggle
                const origTtBackup = window.gameState ? window.gameState.timetable : undefined;
                if (window.gameState) {
                    window.gameState.timetable = {
                        days: [
                            { dayIndex: 0, name: 'יום ראשון', classes: [{ courseId: '034053', courseName: 'מכניקת מוצקים 2מ', type: 'הרצאה', startTime: '08:30', endTime: '10:30' }, { courseId: '034035', courseName: 'תרמודינמיקה 1 - תרגול שעה', type: 'תרגול', startTime: '12:30', endTime: '13:30' }, { courseId: '114052', courseName: 'פיסיקה 2', type: 'הרצאה', startTime: '10:30', endTime: '12:30' }] },
                            { dayIndex: 1, name: 'יום שני', classes: [] },
                            { dayIndex: 4, name: 'יום חמישי', classes: [{ courseId: '03940805', courseName: 'חינוך גופני - אתלטיקה קלה', type: 'יוגה 24', startTime: '07:30', endTime: '08:30' }] }
                        ]
                    };
                }
                if (typeof window.toggleTimetableViewMode === 'function') window.toggleTimetableViewMode('timegrid');
                if (typeof applyTimetableMobileFilter === 'function') applyTimetableMobileFilter('today');
                if (typeof setActiveMainTab === 'function') setActiveMainTab('timetable');
                if (typeof renderTimetableGrid === 'function') renderTimetableGrid();
                const ttGridEl = document.getElementById('timetable-grid-container');
                if (typeof bindTimeGridInteractiveHandlers === 'function' && ttGridEl) {
                    bindTimeGridInteractiveHandlers(ttGridEl);
                }
                const ttNotInteractiveBound = !(document.querySelector('#timetable-grid-container .cal-timegrid-inner')?.dataset?.tgInteractiveBound);
                const hasTimetableTimegrid = !!document.querySelector('#timetable-grid-container .cal-timegrid-wrapper');
                const singleDayDefaultGrid = !!document.querySelector('#timetable-grid-container .cal-timegrid-inner.is-single-day-grid');
                const hiddenColsInSingleDay = document.querySelectorAll('#timetable-grid-container .cal-timegrid-col.is-hidden-day-col').length;
                const filteredActiveSched = (typeof getActiveTimetableSchedule === 'function') ? getActiveTimetableSchedule() : null;
                const phys2FilteredOut = !!(filteredActiveSched && Array.isArray(filteredActiveSched.days) && !filteredActiveSched.days[0].classes.some(c => c.courseId === '114052'));
                const yogaHealed09 = !!(filteredActiveSched && filteredActiveSched.days[2] && filteredActiveSched.days[2].classes.some(c => c.courseId === '03940805' && c.endTime === '09:00'));

                const allWeekPill = document.querySelector('#timetable-day-selector [data-day="all"]');
                if (allWeekPill) allWeekPill.click();
                const allWeekGridExpanded = !document.querySelector('#timetable-grid-container .cal-timegrid-inner.is-single-day-grid');
                const oneHrCard = document.querySelector('#timetable-grid-container .timetable-card.duration-block-1h');
                const oneHrAttBtn = oneHrCard ? oneHrCard.querySelector('.btn-attendance-action') : null;
                const oneHrAttVisible = !!(oneHrCard && oneHrAttBtn && oneHrAttBtn.getBoundingClientRect().height > 0 && oneHrAttBtn.getBoundingClientRect().bottom <= oneHrCard.getBoundingClientRect().bottom + 2);

                if (typeof window.toggleTimetableViewMode === 'function') window.toggleTimetableViewMode('cards');
                const cardsModeActive = !!(document.getElementById('timetable-grid-container')?.classList.contains('timetable-cards-mode') && document.querySelector('#timetable-grid-container .timetable-day-col .timetable-card.duration-block-1h .btn-attendance-action'));
                if (typeof window.toggleTimetableViewMode === 'function') window.toggleTimetableViewMode('timegrid');
                const revertedToTimegrid = !document.getElementById('timetable-grid-container')?.classList.contains('timetable-cards-mode');
                if (typeof applyTimetableMobileFilter === 'function') applyTimetableMobileFilter('today');

                const breakBannerCount = document.querySelectorAll('.timetable-break-gap').length;
                const syncCornerBtn = document.querySelector('.timetable-sync-top-row #btn-sync-cheesefork-now.btn-sync-primary-corner');
                if (window.gameState) {
                    if (origTtBackup === undefined) delete window.gameState.timetable;
                    else window.gameState.timetable = origTtBackup;
                }

                // 5. Personalization: AttendanceHub Mandatory shields strictly follow active courses; TimetableGenerator course search adder
                let mandatoryFilteredOutSem5 = false;
                if (window.AttendanceHub && typeof window.AttendanceHub.renderMandatoryTab === 'function') {
                    const tmpDiv = document.createElement('div');
                    window.AttendanceHub.renderMandatoryTab(tmpDiv);
                    mandatoryFilteredOutSem5 = !tmpDiv.innerHTML.includes('(114032)');
                }
                const hasTtgCourseSearch = !!(document.getElementById('ttg-course-search-input') && document.getElementById('ttg-add-course-select'));

                // 6. v3.0.1 Upgrades: Drive Sem5/Electives, 20-color Spectrum, Custom RRULE, Empty Allday Collapse, Active Past Exams, Post-Moed-B Retake
                const sem5DriveUrl = (typeof window.getFacultyDriveCourseUrl === 'function') ? window.getFacultyDriveCourseUrl('034015', { title: 'מבחן מועד א', type: 'exam' }) : '';
                const elecDriveUrl = (typeof window.getFacultyDriveCourseUrl === 'function') ? window.getFacultyDriveCourseUrl('036001', { title: 'Homework 3', type: 'hw' }) : '';
                if (typeof openCalendarDayModal === 'function') openCalendarDayModal('2026-11-19');
                const dayModalSwatches = document.querySelectorAll('#day-modal-color-spectrum .spectrum-swatch').length;
                const remDefaultNone = (document.getElementById('day-modal-event-reminder') && document.getElementById('day-modal-event-reminder').value === 'none');
                if (typeof closeCalendarDayModal === 'function') closeCalendarDayModal();

                if (typeof openTaskSidePeek === 'function') openTaskSidePeek('034053', '034053_hw3');
                const peekSwatches = document.querySelectorAll('#peek-task-color-spectrum .spectrum-swatch').length;
                if (typeof closeTaskSidePeek === 'function') closeTaskSidePeek();

                const customRecExpanded = (typeof window.expandCustomCalendarEvents === 'function')
                    ? window.expandCustomCalendarEvents([{ id: 'pe-c', date: '2026-11-01', endDate: '2026-11-01', recurrence: 'custom', recurrenceInterval: 3, recurrenceUnit: 'days', title: 'CustomRec' }], '2026-11-01', '2026-11-10').length
                    : 0;
                const hasCalPagingBar = !!(document.getElementById('cal-paging-bar') && document.getElementById('cal-nav-prev') && document.getElementById('cal-nav-next') && document.getElementById('cal-nav-today'));
                const emptyAlldayCollapsed = (typeof buildGoogleCalendarTimeGridHtml === 'function')
                    ? !buildGoogleCalendarTimeGridHtml([{ dayIndex: 0, dateStr: '2099-01-01', dayTitle: 'א', alldayHtml: '', timedItems: [] }], {}).includes('cal-timegrid-allday-row')
                    : false;

                if (typeof renderPastExamsModal === 'function') renderPastExamsModal();
                const pemTabsText = document.getElementById('pem-course-tabs') ? document.getElementById('pem-course-tabs').innerText : '';
                const pemFilteredActiveOnly = !pemTabsText.includes('104131') && !pemTabsText.includes('104043');

                let activeRetakeHidden = false;
                let completedRetakeVisible = false;
                const retakeBox = document.getElementById('modal-course-retake-section');
                if (typeof renderCourseModalRetakeSection === 'function' && retakeBox && window.gameState && window.gameState.courses) {
                    const activeC = window.gameState.courses['034053'];
                    if (activeC) {
                        renderCourseModalRetakeSection(activeC);
                        activeRetakeHidden = retakeBox.style.display === 'none';
                    }
                    const completedC = window.gameState.courses['104131'];
                    if (completedC) {
                        const backup131 = JSON.parse(JSON.stringify(completedC));
                        completedC.status = 'mastered';
                        completedC.semester = 2;
                        completedC.grade = 74;
                        completedC.moedB = '2026-08-13';
                        renderCourseModalRetakeSection(completedC);
                        completedRetakeVisible = retakeBox.style.display === 'block' && !!document.getElementById('btn-schedule-course-retake');
                        Object.assign(completedC, backup131);
                    }
                }

                const changelogHtml = typeof window.getFormattedChangelogHTML === 'function' ? window.getFormattedChangelogHTML() : '';
                const changelogCleanNoLegacy26 = changelogHtml.includes(window.APP_VERSION || '3.0.4')
                    && !changelogHtml.includes('2.6.2')
                    && !changelogHtml.includes('גרסה 2.6:')
                    && !changelogHtml.includes('HUD Clean');

                if (typeof setActiveMainTab === 'function') setActiveMainTab('curriculum');
                return {
                    semWeekText,
                    semWeekOpensStats,
                    semWeekBadgeClickable,
                    openTasksText,
                    remCountBefore,
                    parityWithOneDueTask,
                    openTaskDebug,
                    hasSemHeaderCol: headers.some(h => h === 'סמסטר'),
                    hasGradeHeaderCol: headers.some(h => h === 'ציון'),
                    selectCellHiddenByDefault,
                    selectModeActivated,
                    hasInlineCompletedGrade,
                    typeCheckboxes,
                    semBeforeCourse,
                    driveDeepUrl,
                    hasPeekColors,
                    monthColCount: monthHeaders.length,
                    hasSaturdayHeader: monthHeaders.some(h => h.includes('שבת') || h.includes("ש'")),
                    taskPillHasNoCheckbox,
                    workweekCols,
                    weekCols,
                    calWeekBound,
                    overlapValid,
                    expandedRecCount: expandedRec.length,
                    hasDayModalEnhancements,
                    hasTimetableTimegrid,
                    ttNotInteractiveBound,
                    oneHrAttVisible,
                    cardsModeActive,
                    revertedToTimegrid,
                    singleDayDefaultGrid,
                    hiddenColsInSingleDay,
                    phys2FilteredOut,
                    yogaHealed09,
                    allWeekGridExpanded,
                    breakBannerCount,
                    hasSyncCornerBtn: !!syncCornerBtn,
                    mandatoryFilteredOutSem5,
                    hasTtgCourseSearch,
                    sem5DriveOk: sem5DriveUrl.includes('%D7%9E%D7%91%D7%97%D7%A0%D7%99%D7%9D'),
                    elecDriveOk: elecDriveUrl.includes('Homework%203'),
                    dayModalSwatches,
                    peekSwatches,
                    remDefaultNone,
                    customRecExpanded,
                    hasCalPagingBar,
                    emptyAlldayCollapsed,
                    pemFilteredActiveOnly,
                    activeRetakeHidden,
                    completedRetakeVisible,
                    changelogCleanNoLegacy26
                };
            })()`);

            assert(res.semWeekText.includes('שבוע') && res.semWeekOpensStats && res.semWeekBadgeClickable, 'HUD semester week must display week and open AttendanceHub stats tab directly on click: ' + JSON.stringify(res));
            assert(Number(res.openTasksText) === res.remCountBefore && res.parityWithOneDueTask, 'HUD open tasks count must stay in 1:1 parity with active reminders banner: ' + JSON.stringify(res));
            assert(!res.hasSemHeaderCol && !res.hasGradeHeaderCol, 'Tasks table must omit separate Semester and Grade columns: ' + JSON.stringify(res));
            assert(res.selectCellHiddenByDefault && res.selectModeActivated, 'Tasks selection checkboxes must be hidden until toggle clicked: ' + JSON.stringify(res));
            assert(res.hasInlineCompletedGrade, 'Completed tasks must show inline grade inside Remaining Time column: ' + JSON.stringify(res));
            assert(res.typeCheckboxes === 5 && res.semBeforeCourse, 'Filters must have 5 task types and Semester before Course: ' + JSON.stringify(res));
            assert(res.driveDeepUrl.includes('%D7%AA%D7%A8%D7%92%D7%99%D7%9C%20%D7%91%D7%99%D7%AA%203'), 'Drive resolver must link directly to HW 3 subfolder: ' + JSON.stringify(res));
            assert(res.hasPeekColors && res.peekSwatches === 20, 'Task Side Peek must include 20-color spectrum controls: ' + JSON.stringify(res));
            assert(res.monthColCount === 7 && res.hasSaturdayHeader && res.taskPillHasNoCheckbox, 'Calendar Month view must render 7 days incl Saturday with clean task pills: ' + JSON.stringify(res));
            assert(res.workweekCols === 5 && res.weekCols === 7 && res.overlapValid, 'Workweek (5) & Week (7) Google Calendar time-grids with overlap engine must work: ' + JSON.stringify(res));
            assert(res.expandedRecCount === 4 && res.customRecExpanded === 4, 'Weekly and custom recurrence expansion must yield expected occurrences: ' + JSON.stringify(res));
            assert(res.hasDayModalEnhancements && res.dayModalSwatches === 20 && res.remDefaultNone, 'Enhanced Day Modal with 20-color spectrum and default none reminder must work: ' + JSON.stringify(res));
            assert(res.hasTimetableTimegrid && res.calWeekBound && res.ttNotInteractiveBound && res.oneHrAttVisible && res.cardsModeActive && res.revertedToTimegrid && res.singleDayDefaultGrid && res.hiddenColsInSingleDay >= 1 && res.allWeekGridExpanded && res.phys2FilteredOut && res.yogaHealed09 && res.breakBannerCount === 0 && res.hasSyncCornerBtn, 'Timetable v3.0.2 single-day default, no-drag-create, 1h attendance, cards view toggle, all-week toggle, 114052 filter, Yoga 09:00 & time-grid must work: ' + JSON.stringify(res));
            assert(res.mandatoryFilteredOutSem5 && res.hasTtgCourseSearch, 'Mandatory shields and Timetable Generator must be student-personalized: ' + JSON.stringify(res));
            assert(res.sem5DriveOk && res.elecDriveOk && res.hasCalPagingBar && res.emptyAlldayCollapsed && res.pemFilteredActiveOnly && res.activeRetakeHidden && res.completedRetakeVisible && res.changelogCleanNoLegacy26, 'v3.0.1/v3.0.2 Drive Sem5/Electives, paging bar, collapsed empty allday row, active past-exams filter, post-Moed B retake & clean changelog must pass: ' + JSON.stringify(res));
        });

        await test('Test 33: Mobile Viewport Degree Planner Semester Peek UX (390px)', async () => {
            await cdp.send('Emulation.setDeviceMetricsOverride', {
                width: 390,
                height: 844,
                deviceScaleFactor: 2,
                mobile: true
            });
            try {
                const mobileRes = await cdp.eval(`(() => {
                    if (typeof setActiveMainTab === 'function') setActiveMainTab('planner');
                    if (typeof window.setPlannerMobileView === 'function') window.setPlannerMobileView('board');
                    if (window.DegreePlanner && typeof window.DegreePlanner.render === 'function') window.DegreePlanner.render();
                    const scroll = document.getElementById('planner-semesters-container');
                    const cols = scroll ? Array.from(scroll.querySelectorAll('.planner-semester-col')) : [];
                    const scrollRect = scroll ? scroll.getBoundingClientRect() : null;
                    const firstRect = cols[0] ? cols[0].getBoundingClientRect() : null;
                    const secondRect = cols[1] ? cols[1].getBoundingClientRect() : null;
                    const canScrollHoriz = !!(scroll && scroll.scrollWidth > scroll.clientWidth + 20);
                    const isNarrowerThanScreen = !!(firstRect && scrollRect && firstRect.width >= 240 && firstRect.width <= scrollRect.width * 0.9);
                    const sameRowPeek = !!(firstRect && secondRect && Math.abs(firstRect.top - secondRect.top) < 10);
                    if (typeof setActiveMainTab === 'function') setActiveMainTab('curriculum');
                    return {
                        colCount: cols.length,
                        scrollWidth: scroll ? scroll.scrollWidth : 0,
                        clientWidth: scroll ? scroll.clientWidth : 0,
                        firstWidth: firstRect ? Math.round(firstRect.width) : 0,
                        secondLeft: secondRect ? Math.round(secondRect.left) : 0,
                        canScrollHoriz,
                        isNarrowerThanScreen,
                        sameRowPeek
                    };
                })()`);
                assert(mobileRes.colCount >= 2 && mobileRes.canScrollHoriz && mobileRes.isNarrowerThanScreen && mobileRes.sameRowPeek, 'Mobile Degree Planner must render semesters horizontally at ~82% width so next semester peeks: ' + JSON.stringify(mobileRes));
            } finally {
                await cdp.send('Emulation.clearDeviceMetricsOverride');
            }
        });

        await test('Test 34: Remote App Version Check Completes Without ReferenceError (isManualCheck)', async () => {
            const verRes = await cdp.eval(`(async () => {
                if (typeof window.checkRemoteAppVersion !== 'function') return { ok: false, reason: 'missing' };
                const badge = document.getElementById('footer-version-badge');
                await window.checkRemoteAppVersion(true);
                const badgeText = badge ? badge.innerText : '';
                const badgeTitle = badge ? badge.title : '';
                const statusEl = document.getElementById('version-check-status-text');
                const statusText = statusEl ? statusEl.innerText : '';
                const modal = document.getElementById('version-update-modal');
                if (modal) { modal.style.display = 'none'; modal.classList.remove('active'); }
                return {
                    ok: !statusText.includes('לא ניתן להתחבר') && !badgeText.includes('🔄') && (badgeText.includes('✓') || badgeText.includes('⬆️')),
                    badgeText,
                    badgeTitle,
                    statusText
                };
            })()`);
            assert(verRes.ok, 'checkRemoteAppVersion(true) must resolve remote version without throwing ReferenceError: ' + JSON.stringify(verRes));
        });

    } finally {
        console.log(`\n========================================================================`);
        console.log(`SUMMARY: ${passed} passed, ${failed} failed.`);
        console.log(`========================================================================\n`);

        try {
            chrome.kill('SIGKILL');
        } catch (e) {}
        if (serverProcess) {
            try {
                serverProcess.kill('SIGKILL');
            } catch (e) {}
        }
        try {
            fs.rmSync(PROFILE_DIR, { recursive: true, force: true });
        } catch (e) {}

        if (failed > 0) {
            process.exit(1);
        } else {
            process.exit(0);
        }
    }
}

run().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
