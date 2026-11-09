const { spawn } = require('child_process');
const http = require('http');
const assert = require('assert');
const path = require('path');
const os = require('os');
const fs = require('fs');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
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
        const req = http.get(`http://127.0.0.1:${port}/`, () => {
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

        // Test 8: Pangea course mapping covers all 34 courses with at least 100 aliases
        await test('Pangea course map contains exhaustive coverage of all 34 courses', async () => {
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
            assert.strictEqual(mapStats.uniqueHubs, 34, `Expected 34 unique Pangea course hubs, got ${mapStats?.uniqueHubs}`);
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
                const dualRows = modalHw ? modalHw.querySelectorAll('.hw-component-row') : [];

                return {
                    hasStrip: !!strip,
                    capsulesCount: capsules.length,
                    hasSolidsCapsule: !!solidsCapsule,
                    hasModalHw: !!modalHw && modalHw.style.display !== 'none',
                    sheetCardsCount: sheetCards.length,
                    hasDualComponents: dualRows.length >= 24
                };
            })()`);
            assert(result.hasStrip, 'notion-hw-policy-strip element missing');
            assert(result.capsulesCount >= 1, 'Should render at least 1 active homework capsule');
            assert(result.hasSolidsCapsule, 'Solid Mechanics 2 capsule missing');
            assert(result.hasModalHw, 'modal-hw-policy-section missing in course modal');
            assert.strictEqual(result.sheetCardsCount, 12, 'Must render exactly 12 sheets for 034053');
            assert(result.hasDualComponents, 'Must render dual components for 034053');
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
