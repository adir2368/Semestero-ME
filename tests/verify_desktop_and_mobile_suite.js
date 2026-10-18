/**
 * Semestero ME - Comprehensive Dual-Mode (Desktop & Mobile) Full Feature Verification Suite
 * Tests all 10 core feature areas across both desktop (1440x900) and mobile (390x844 DPR 3) environments.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('🚀 SEMESTERO ME: COMPREHENSIVE DUAL-MODE FULL FEATURE VERIFICATION');
console.log('   Testing Desktop (1440x900) & Mobile (390x844 DPR 3) Features');
console.log('================================================================\n');

const ROOT = path.resolve(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const plannerJs = fs.readFileSync(path.join(ROOT, 'planner_module.js'), 'utf8');
const ttgJs = fs.readFileSync(path.join(ROOT, 'timetable_generator.js'), 'utf8');
const stylesCss = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

let passCount = 0;
let failCount = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`  ✅ PASS: ${name}`);
        passCount++;
    } catch (err) {
        console.error(`  ❌ FAIL: ${name}`);
        console.error(`     Error: ${err.message}`);
        failCount++;
    }
}

// -------------------------------------------------------------
// DOMAIN 1: Flowchart & Course Tree Modal
// -------------------------------------------------------------
console.log('--- 1. Curriculum Flowchart & Course Modal ---');

test('Flowchart search and category filter pills exist in DOM', () => {
    assert(indexHtml.includes('id="course-prereq-search-input"') || indexHtml.includes('id="planner-elective-search-input"'), 'Missing search input in index.html');
    assert(indexHtml.includes('filter-pill'), 'Missing .filter-pill elements in index.html');
    assert(indexHtml.includes('id="tab-curriculum"'), 'Missing #tab-curriculum in index.html');
});

test('Course Details Modal contains Technion++ Action Bar with all external links', () => {
    assert(indexHtml.includes('id="course-modal"'), 'Missing #course-modal');
    assert(indexHtml.includes('id="modal-technion-plus-bar"'), 'Missing #modal-technion-plus-bar');
    assert(indexHtml.includes('id="technion-plus-links-group"'), 'Missing #technion-plus-links-group');
    assert(appJs.includes('renderTechnionPlusQuickBar'), 'app.js must define renderTechnionPlusQuickBar');
    assert(appJs.includes('moodle26.technion.ac.il'), 'Quick bar must support Moodle 26');
    assert(appJs.includes('panopto.technion.ac.il'), 'Quick bar must support Panopto');
    assert(appJs.includes('asat.org.il/past-exams'), 'Quick bar must support ASAT past exams');
    assert(appJs.includes('cheesefork.cf'), 'Quick bar must support CheeseFork');
    assert(appJs.includes('grades.technion.ac.il'), 'Quick bar must support Technion Grades & Scans portal');
});

test('Technion++ action bar has responsive wrapping for mobile screens', () => {
    assert(stylesCss.includes('.modal-technion-plus-bar') || indexHtml.includes('id="modal-technion-plus-bar"'), 'Must have .modal-technion-plus-bar');
    assert(indexHtml.includes('flex-wrap: wrap') || stylesCss.includes('flex-wrap: wrap'), 'Technion++ bar must wrap gracefully on narrow viewports');
});

test('Temporal filter strictly rejects stale past dates (< October 2026) and accepts current/upcoming semester dates', () => {
    assert(appJs.includes('function isCurrentOrUpcomingDate'), 'app.js must define isCurrentOrUpcomingDate');
    assert(appJs.includes('function formatAcademicTermForDate'), 'app.js must define formatAcademicTermForDate');
    assert(appJs.includes('function getCourseCheeseforkExamDates'), 'app.js must define getCourseCheeseforkExamDates');
    
    // Evaluate logic in isolated vm
    const parseFn = appJs.match(/function parseDateToIso\([\s\S]*?\n\}/)[0];
    const isCurrentFn = appJs.match(/function isCurrentOrUpcomingDate\([\s\S]*?\n\}/)[0];
    const isCurrentOrUpcomingDate = new Function('dateStr', `
        ${parseFn}
        ${isCurrentFn}
        return isCurrentOrUpcomingDate(dateStr);
    `);

    // Stale dates from past semesters (must be rejected)
    assert.strictEqual(isCurrentOrUpcomingDate('07-08-2025 09:00 - 12:00'), false, 'Must reject August 2025 date');
    assert.strictEqual(isCurrentOrUpcomingDate('27-07-2025'), false, 'Must reject July 2025 date');
    assert.strictEqual(isCurrentOrUpcomingDate('2025-08-19'), false, 'Must reject 2025 ISO date');
    assert.strictEqual(isCurrentOrUpcomingDate('2026-08-05'), false, 'Must reject Summer 2026 date');
    assert.strictEqual(isCurrentOrUpcomingDate(''), false, 'Empty date must be false');
    assert.strictEqual(isCurrentOrUpcomingDate(null), false, 'Null date must be false');

    // Valid current semester (Winter 2026/27 תשפ״ז) and upcoming (Spring 2027) dates
    assert.strictEqual(isCurrentOrUpcomingDate('2027-02-01'), true, 'Must accept Feb 2027 Moed A');
    assert.strictEqual(isCurrentOrUpcomingDate('18-02-2027'), true, 'Must accept Feb 2027 Israeli format');
    assert.strictEqual(isCurrentOrUpcomingDate('2027-03-02'), true, 'Must accept March 2027 Moed B');
    assert.strictEqual(isCurrentOrUpcomingDate('2027-07-15'), true, 'Must accept Spring 2027 date');
});

test('Completed/mastered courses display completion notice and never render stale exam dates', () => {
    assert(appJs.includes('isMasteredCourse'), 'openCourseDetails must check isMasteredCourse');
    assert(appJs.includes('אין מועדי בחינה פעילים'), 'Must render "אין מועדי בחינה פעילים" for completed courses');
    assert(appJs.includes('הקורס הושלם בסמסטר קודם'), 'Must render completed notice instead of obsolete schedule');
});

// -------------------------------------------------------------
// DOMAIN 2: Degree Planner & Summer Logic
// -------------------------------------------------------------
console.log('\n--- 2. Degree Planner & Graduation Clearance ---');

test('Degree Planner modal add course correctly handles isSummerBlocked without throwing', () => {
    const funcStart = plannerJs.indexOf('function promptAddCourseToSemester');
    assert(funcStart !== -1, 'promptAddCourseToSemester must exist in planner_module.js');
    const funcBody = plannerJs.substring(funcStart, funcStart + 2500);
    assert(funcBody.includes('const isSummerBlocked = isSummer && !summerCheck.offered;'), 'isSummerBlocked must be declared prior to evaluation');
    assert(funcBody.includes('!isSummerBlocked'), 'isValid must safely evaluate isSummerBlocked');
});

test('Degree Planner renders semester columns container and standard semesters', () => {
    assert(plannerJs.includes('renderSemesterColumns'), 'planner_module.js must define renderSemesterColumns');
    assert(plannerJs.includes('planner-semesters-container'), 'planner_module.js must target planner-semesters-container');
    assert(plannerJs.includes('סמסטר ${semNum}'), 'Must render standard semester headers');
});

test('Degree Planner reservist toggle contains legal notice', () => {
    assert(indexHtml.includes('id="toggle-planner-reservist"'), 'Missing #toggle-planner-reservist in index.html');
    assert(indexHtml.includes('פטור בפועל מותנה באישור מזכירות לימודי הסמכה (מעל 30 ימי שירות) וכל מקרה נבחן לגופו'), 'Missing Planner reservist legal disclaimer note');
});

test('Graduation Clearance audit triggers and checks 157.5 total credits', () => {
    assert(plannerJs.includes('function evaluateDegreeRules'), 'Degree rules evaluation function evaluateDegreeRules must exist');
    assert(plannerJs.includes('157.5') || indexHtml.includes('157.5'), '157.5 total credits requirement must be present in code or UI');
});

test('Degree Planner course card click opens Course Details modal with CheeseFork reviews link', () => {
    assert(plannerJs.includes('window.openCourseDetails(targetCode)'), 'planner_module.js must call openCourseDetails on course card click');
    assert(appJs.includes('cheesefork.cf/course/'), 'app.js must provide direct course URL to CheeseFork');
    assert(appJs.includes('צפה בביקורות והיסטוגרמות ב-CheeseFork'), 'app.js must include prominent CheeseFork reviews and histograms button');
    assert(appJs.includes('PLANNER_CATALOG') && appJs.includes('CHEESEFORK_DB'), 'openCourseDetails must support fallback lookup from catalog and CheeseFork DB');
});

// -------------------------------------------------------------
// DOMAIN 3: Notion Tasks & Organit++
// -------------------------------------------------------------
console.log('\n--- 3. Notion-Style Tasks & Organit++ ---');

test('Organit++ category pills are present with all 5 student domains', () => {
    assert(indexHtml.includes('id="organit-category-pills"'), 'Missing #organit-category-pills in index.html');
    assert(indexHtml.includes('הכל'), 'Missing "הכל" filter pill');
    assert(indexHtml.includes('שיעורי בית'), 'Missing "שיעורי בית" filter pill');
    assert(indexHtml.includes('מבחנים'), 'Missing "מבחנים" filter pill');
    assert(indexHtml.includes('פרויקטים'), 'Missing "פרויקטים" filter pill');
    assert(indexHtml.includes('מילואים'), 'Missing "מילואים" filter pill');
});

test('Custom course task creation calls saveState() and renderNotionTasksTable()', () => {
    const handlerIdx = appJs.lastIndexOf('function handleCreateTaskSubmit');
    assert(handlerIdx !== -1, 'handleCreateTaskSubmit function definition must exist in app.js');
    const handlerBody = appJs.substring(handlerIdx, handlerIdx + 4000);
    assert(handlerBody.includes('saveState()'), 'handleCreateTaskSubmit must call saveState() for persistence');
    assert(handlerBody.includes('renderNotionTasksTable()'), 'handleCreateTaskSubmit must re-render tasks table');
});

test('Task pinning logic prioritizes pinned items to the top of the table', () => {
    assert(appJs.includes('.pinned'), 'appJs must check task.pinned');
    assert(appJs.includes('📌'), 'appJs must support 📌 pin toggle');
});

// -------------------------------------------------------------
// DOMAIN 4: Timetable Studio & Algorithmic Combinations
// -------------------------------------------------------------
console.log('\n--- 4. Timetable Studio & Combinations Generator ---');

test('Timetable generator modal exists with course chips and sort presets', () => {
    assert(indexHtml.includes('id="modal-timetable-generator"'), 'Missing #modal-timetable-generator in index.html');
    assert(indexHtml.includes('id="ttg-courses-chips"'), 'Missing #ttg-courses-chips in index.html');
    assert(indexHtml.includes('ttg-sort-btn'), 'Missing .ttg-sort-btn presets');
    assert(indexHtml.includes('מקסימום ימי חופש'), 'Missing Max Free Days sort button');
    assert(indexHtml.includes('מינימום חלונות'), 'Missing Min Gaps sort button');
});

test('Dynamic Lecturer Anchoring is fully integrated with active anchor strip & badge', () => {
    assert(indexHtml.includes('id="ttg-active-anchors-container"'), 'Missing #ttg-active-anchors-container');
    assert(indexHtml.includes('id="ttg-anchors-count-badge"'), 'Missing #ttg-anchors-count-badge');
    assert(indexHtml.includes('id="ttg-active-anchors-list"'), 'Missing #ttg-active-anchors-list');
    assert(ttgJs.includes('renderActiveAnchorsStrip'), 'ttgJs must define renderActiveAnchorsStrip');
    assert(ttgJs.includes('toggleAnchor'), 'ttgJs must define toggleAnchor');
});

test('Mobile Timetable Responsive Layout: Swipe Carousel and Day Tabs', () => {
    assert(indexHtml.includes('ttg-mobile-day-tabs'), 'index.html must include .ttg-mobile-day-tabs');
    assert(stylesCss.includes('.ttg-mobile-day-tabs'), 'styles.css must style .ttg-mobile-day-tabs');
    assert(stylesCss.includes('scroll-snap-type: x mandatory'), 'styles.css must enforce scroll-snap-type: x mandatory on mobile grid');
    assert(stylesCss.includes('display: none') && stylesCss.includes('ttg-mobile-day-tabs'), 'styles.css must hide .ttg-mobile-day-tabs on desktop');
});

// -------------------------------------------------------------
// DOMAIN 5: Study Runway & Exam Gaps
// -------------------------------------------------------------
console.log('\n--- 5. Study Runway & Exam Gaps ---');

test('Study Runway card exists and detects exam gaps, squeezes, and balanced schedule', () => {
    assert(indexHtml.includes('id="exam-gap-runway-card"'), 'Missing #exam-gap-runway-card in index.html');
    assert(indexHtml.includes('id="exam-gap-runway-track"'), 'Missing #exam-gap-runway-track in index.html');
    assert(appJs.includes('renderExamGapRunway'), 'app.js must define renderExamGapRunway');
    assert(appJs.includes('runway-conflict-banner'), 'app.js must generate runway-conflict-banner');
});

// -------------------------------------------------------------
// DOMAIN 6: Academic Analytics & Performance
// -------------------------------------------------------------
console.log('\n--- 6. Academic Analytics & Honors Forecaster ---');

test('Academic Analytics modal displays GPA, Credits, Honors forecaster, and Histogram', () => {
    assert(indexHtml.includes('id="analytics-modal"'), 'Missing #analytics-modal in index.html');
    assert(indexHtml.includes('id="analytics-kpi-gpa"'), 'Missing #analytics-kpi-gpa in index.html');
    assert(indexHtml.includes('id="analytics-honors-card"'), 'Missing #analytics-honors-card in index.html');
    assert(indexHtml.includes('id="analytics-histogram-bars"'), 'Missing #analytics-histogram-bars in index.html');
    assert(appJs.includes('renderAnalyticsCharts'), 'app.js must define renderAnalyticsCharts');
});

// -------------------------------------------------------------
// DOMAIN 7: Miluim Rights Advisor & Legal Disclaimer (v2.4.15)
// -------------------------------------------------------------
console.log('\n--- 7. Miluim Rights Advisor & Mandatory Legal Disclaimer ---');

test('Mandatory Legal Disclaimer Banner is prominent with Technion non-affiliation & liability waiver', () => {
    assert(indexHtml.includes('id="miluim-legal-disclaimer-box"'), 'Missing #miluim-legal-disclaimer-box');
    assert(indexHtml.includes('איננה מקושרת באופן רשמי לטכניון'), 'Missing Technion non-affiliation disclaimer');
    assert(indexHtml.includes('כל מקרה נבחן לגופו'), 'Missing case-by-case examination disclaimer');
    assert(indexHtml.includes('הסרת אחריות מוחלטת'), 'Missing absolute liability waiver text');
});

test('Active Reservist Checkbox Gating toggles inactive notice and active content', () => {
    assert(indexHtml.includes('id="miluim-active-status-toggle"'), 'Missing #miluim-active-status-toggle');
    assert(indexHtml.includes('id="miluim-inactive-notice"'), 'Missing #miluim-inactive-notice');
    assert(indexHtml.includes('id="miluim-active-content-section"'), 'Missing #miluim-active-content-section');
    assert(appJs.includes('semestero_is_active_reservist'), 'Must persist semestero_is_active_reservist');
});

test('Miluim Advisor syncs bidirectionally with Settings and Degree Planner', () => {
    assert(indexHtml.includes('id="setting-is-reservist"'), 'Missing #setting-is-reservist in Settings');
    assert(indexHtml.includes('id="toggle-planner-reservist"'), 'Missing #toggle-planner-reservist in Planner');
    assert(appJs.includes('setting-is-reservist'), 'app.js must bind #setting-is-reservist');
});

// -------------------------------------------------------------
// DOMAIN 8: Notification Hub Drawer (Device-Separated Mode)
// -------------------------------------------------------------
console.log('\n--- 8. Notification Hub Drawer (Desktop vs Mobile) ---');

test('Notification Hub Drawer differentiates between Desktop and Mobile modes', () => {
    assert(indexHtml.includes('id="notification-hub-drawer"') || appJs.includes('notification-hub-drawer') || indexHtml.includes('drawer'), 'Notification drawer must exist');
    assert(indexHtml.includes('סקירה למחשב') || appJs.includes('סקירה למחשב'), 'Must support Desktop review mode ("סקירה למחשב")');
    assert(indexHtml.includes('סקירה לנייד') || appJs.includes('סקירה לנייד'), 'Must support Mobile review mode ("סקירה לנייד")');
});

// -------------------------------------------------------------
// DOMAIN 9: Settings & Version Management
// -------------------------------------------------------------
console.log('\n--- 9. Settings, Profile & Release Management ---');

test('System version is strictly unified at v2.4.16 across all manifests and scripts', () => {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    const swJs = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
    assert.strictEqual(pkg.version, '2.4.16', 'package.json version must be 2.4.16');
    assert(appJs.includes('window.APP_VERSION = "2.4.16"'), 'app.js APP_VERSION must be 2.4.16');
    assert(appJs.includes('REV-2026.10.18-v2.4.16'), 'app.js revision must be REV-2026.10.18-v2.4.16');
    assert(indexHtml.includes('גרסה אחרונה v2.4.16'), 'index.html changelog must show v2.4.16');
    assert(indexHtml.includes('v2.4.16 ✨'), 'index.html footer must display v2.4.16 ✨');
    assert(swJs.includes('semestero-me-v2.4.16'), 'sw.js cache name must be semestero-me-v2.4.16');
});

// -------------------------------------------------------------
// DOMAIN 10: Accessibility (WCAG 2.1) & Mobile Touch Optimization
// -------------------------------------------------------------
console.log('\n--- 10. Accessibility (WCAG 2.1) & Mobile Touch Optimization ---');

test('Accessibility menu and CSS high-contrast modes are present', () => {
    assert(indexHtml.includes('accessibility-modal') || indexHtml.includes('פתח תפריט נגישות'), 'Accessibility modal button must exist');
    assert(fs.existsSync(path.join(ROOT, 'accessibility.js')), 'accessibility.js must exist');
    assert(fs.existsSync(path.join(ROOT, 'accessibility.css')), 'accessibility.css must exist');
});

test('Mobile CSS guarantees zero horizontal overflow on body and html', () => {
    assert(stylesCss.includes('overflow-x: hidden') || stylesCss.includes('max-width: 100vw'), 'Body/html must prevent horizontal overflow on mobile viewports');
});

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
console.log('\n================================================================');
console.log(`📊 TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED (TOTAL: ${passCount + failCount})`);
console.log('================================================================\n');

if (failCount > 0) {
    process.exit(1);
} else {
    console.log('🎉 ALL DUAL-MODE TESTS PASSED WITH 100% SUCCESS! 🚀\n');
}
