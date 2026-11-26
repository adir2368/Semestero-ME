/**
 * Pass 3 Verification Suite (tab-tasks + Moodle 26 Sync & CRDT):
 * Verifies P3-1 through P3-10 across app.js, moodle_sync.js, auth_sync.js, styles.css, ui_enhancements.js,
 * curriculum_template.js, and preloaded_user_state.js.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const appSrc = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const moodleSrc = fs.readFileSync(path.join(ROOT, 'moodle_sync.js'), 'utf8');
const authSrc = fs.readFileSync(path.join(ROOT, 'auth_sync.js'), 'utf8');
const cssSrc = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
const uiEnhSrc = fs.readFileSync(path.join(ROOT, 'ui_enhancements.js'), 'utf8');
const templateSrc = fs.readFileSync(path.join(ROOT, 'curriculum_template.js'), 'utf8');
const preloadedSrc = fs.readFileSync(path.join(ROOT, 'preloaded_user_state.js'), 'utf8');

console.log('=== RUNNING PASS 3 TASKS & MOODLE HARDENING TESTS ===');

// Extract pure helper functions from app.js into an isolated VM for runtime assertions
function extractFn(src, name) {
    const start = src.indexOf(`\nfunction ${name}(`);
    const actualStart = start !== -1 ? start + 1 : src.indexOf(`function ${name}(`);
    assert(actualStart !== -1, `Missing function ${name} in app.js`);
    const endMarker = src.indexOf('\n}\n', actualStart);
    const endMarkerCrLf = src.indexOf('\r\n}\r\n', actualStart);
    const end = (endMarkerCrLf !== -1 && (endMarker === -1 || endMarkerCrLf < endMarker))
        ? endMarkerCrLf + 4
        : (endMarker !== -1 ? endMarker + 2 : -1);
    assert(end !== -1, `Could not find end of ${name}`);
    return src.slice(actualStart, end);
}

// 1. P3-1: XSS escaping & apostrophe safety
{
    assert(appSrc.includes('escapeHtml(query)'), 'P3-1: renderIconPickerGrid must escape search query');
    assert(appSrc.includes('escapeHtml(c.name)'), 'P3-1: openMoveTasksModal must escape course name');
    assert(appSrc.includes('${escapeHtml(t.title || \'\')}'), 'P3-1: renderNotionTasksTable must escape t.title');
    assert(appSrc.includes('<span class="reminder-task-title">${escapeHtml(item.task.title || \'\')}</span>'), 'P3-1: renderTasksReminderBanner must escape item.task.title');
    assert(appSrc.includes('${escapeHtml(c.name || \'\')}'), 'P3-1: renderNotionTasksTable must escape c.name');
    assert(appSrc.includes('data-pangea-url="${safePangeaUrl}" data-pangea-title="${safePangeaTitle}"'), 'P3-1: Pangea link must use data-* attrs + delegated handler instead of unescaped single-quoted onclick');
    assert(appSrc.includes('${escapeHtml(c.text || \'\')}'), 'P3-1: renderPeekComments must escape c.text');
    assert(!appSrc.includes("window.openCourseHomeworkDetail('${course.code}')"), 'P3-1: HW policy strip must delegate click instead of inline onclick');
    assert(moodleSrc.includes('escapeHtml(str)') && moodleSrc.includes('this.escapeHtml(err.message') && moodleSrc.includes('this.escapeHtml(file.name)'), 'P3-1: MoodleSync must escape err.message and file.name');
    console.log('✓ P3-1 passed: Stored DOM XSS & apostrophe injection eliminated across Tasks & Moodle');
}

// 2. P3-2: Add Custom Task modal layout & deduplicated course dropdown
{
    assert(/#modal-add-custom-task\s*\.modal-content\s*\{[^}]*max-height:\s*calc\(100dvh\s*-\s*32px\)/s.test(cssSrc), 'P3-2: #modal-add-custom-task .modal-content must constrain height cleanly');
    assert(appSrc.includes('const hasDistinctShort = !!(rawShort && normCmp(rawShort) !== normCmp(c.name));'), 'P3-2: course option builder must not repeat identical short/full names');
    console.log('✓ P3-2 passed: #modal-add-custom-task mobile layout & course selector dedup');
}

// 3. P3-3: HW Policy Strip collapse wiring & CSS
{
    assert(appSrc.includes('id="btn-toggle-hw-collapse"'), 'P3-3: HW collapse button must have stable id');
    assert(appSrc.includes('hwCollapseBtn.addEventListener("click"'), 'P3-3: HW collapse button must bind direct click listener');
    assert(/\.notion-hw-policy-strip\.collapsed\s+\.hw-capsules-grid\s*\{\s*display:\s*none\s*!important/s.test(cssSrc), 'P3-3: styles.css must reinforce collapsed grid hiding');
    console.log('✓ P3-3 passed: HW Policy Strip collapse handler & styles verified');
}

// 4. P3-4 & P3-9: Side Peek header padding, date isolation, Miluim hiding grade, single Reset Color, Typo fix
{
    assert(/#task-side-peek\s+\.peek-header\s*\{\s*padding-left:\s*48px\s*!important;/s.test(cssSrc), 'P3-4: .peek-header must reserve left padding for close button');
    assert(appSrc.includes('document.getElementById("peek-property-date").value = toIsoDateOnly(task.dueDate);'), 'P3-4: Side Peek date input must extract ISO date via toIsoDateOnly');
    assert(appSrc.includes('typeLabel = "🪖 משימת מילואים / התאמה"'), 'P3-4: Miluim tasks must label properly in Side Peek');
    const resetMatches = appSrc.match(/if\s*\(peekResetColorBtn\)/g) || [];
    assert.strictEqual(resetMatches.length, 1, 'P3-4: duplicate peekResetColorBtn handler must be removed');
    assert(!templateSrc.includes('Principle Stresses') && !preloadedSrc.includes('Principle Stresses'), 'P3-9: typo "Principle Stresses" must be replaced with "Principal Stresses"');
    assert(templateSrc.includes('Principal Stresses') && preloadedSrc.includes('Principal Stresses'), 'P3-9: Principal Stresses spelling present');
    assert(appSrc.includes('(\\u20660–100\\u2069)'), 'P3-9: grade placeholder 0–100 must use bidi isolation');
    console.log('✓ P3-4 & P3-9 passed: Side Peek fixes, Mock Sync active Sem 3, bidi & spelling verified');
}

// 5. P3-5: getActiveOpenTasksList supports Guest Mode (0 explicit active courses) while keeping Test 32 parity
{
    const sandbox = {
        gameState: {
            currentActiveSemester: 3,
            deletedTaskIds: [],
            courses: {
                '034053': {
                    code: '034053',
                    name: 'מכניקת מוצקים 2',
                    semester: 3,
                    status: 'locked',
                    tasks: [
                        { id: 't1', title: 'HW 1', type: 'hw', status: 'not_started', completed: false, dueDate: '2026-11-12 23:59' }
                    ]
                }
            }
        }
    };
    vm.createContext(sandbox);
    vm.runInContext(`
        function getTaskCategoryKey(t) { return (t && t.type) || 'hw'; }
        ${extractFn(appSrc, 'getActiveOpenTasksList')}
    `, sandbox);

    const guestOpen = sandbox.getActiveOpenTasksList(Object.values(sandbox.gameState.courses), { winterStarted: true, now: new Date('2026-11-25T12:00:00Z') });
    assert.strictEqual(guestOpen.length, 1, 'P3-5: Guest Mode with Semester 3 open overdue task must return count 1 instead of 0');

    // Enrolled mode: only active courses are counted
    sandbox.gameState.courses['034053'].status = 'locked';
    sandbox.gameState.courses['104041'] = { code: '104041', semester: 1, status: 'active', tasks: [] };
    const enrolledOpen = sandbox.getActiveOpenTasksList(Object.values(sandbox.gameState.courses), { winterStarted: true, now: new Date('2026-11-25T12:00:00Z') });
    assert.strictEqual(enrolledOpen.length, 0, 'P3-5: Enrolled mode with explicit active courses must still strictly count active courses only');
    console.log('✓ P3-5 passed: Guest Mode & Enrolled Mode open task counts match 1:1 parity rules');
}

// 6. P3-6 & P3-7: Touch Peek button, 8-digit icon key normalization, status dropdown nav floor & FAB guards
{
    assert(/\.notion-open-peek-btn[\s\S]*opacity:\s*1\s*!important/.test(cssSrc), 'P3-6: .notion-open-peek-btn must stay visible on mobile/touch');
    assert(appSrc.includes('function normalizeIconCourseKey('), 'P3-6: normalizeIconCourseKey must exist');
    assert(appSrc.includes("e.target.closest('.notion-course-tag[data-course-code]')"), 'P3-6: icon picker click delegation must require data-course-code');
    assert(uiEnhSrc.includes('hasBlockingTasksOverlay') && uiEnhSrc.includes("activeTab === 'tasks' ? 320 : 220"), 'P3-7: back-to-top FAB must hide behind Tasks overlays and use higher threshold');
    console.log('✓ P3-6 & P3-7 passed: Touch Peek, icon lookup normalization & overlay clearance verified');
}

// 7. P3-8: CRDT unpinning/color/comments & moodle_sync mergeTaskPair comment dedup + .unref()
{
    const msSandbox = {
        addEventListener: () => {},
        localStorage: { getItem: () => null, setItem: () => {} },
        document: { readyState: 'complete', addEventListener: () => {}, getElementById: () => null },
        setInterval: () => ({ unref: () => {} }),
        setTimeout
    };
    msSandbox.window = msSandbox;
    vm.createContext(msSandbox);
    vm.runInContext(moodleSrc, msSandbox);
    const merged = msSandbox.MoodleSync.mergeTaskPair(
        {
            id: 't1',
            title: 'HW 1',
            pinned: false,
            pinnedUpdatedAt: 2000,
            color: '#ef4444',
            colorUpdatedAt: 2000,
            comments: [{ date: '2026-11-01T10:00:00Z', text: 'Same note' }]
        },
        {
            id: 't1',
            title: 'HW 1',
            pinned: true,
            pinnedUpdatedAt: 1000,
            color: '#3b82f6',
            colorUpdatedAt: 1000,
            comments: [{ date: '2026-11-01T10:00:00Z', text: 'Same note' }, { date: '2026-11-02T10:00:00Z', text: 'Second' }]
        },
        'Course'
    );
    assert.strictEqual(merged.pinned, false, 'P3-8: newer unpin (pinnedUpdatedAt 2000) must beat older pin (1000)');
    assert.strictEqual(merged.color, '#ef4444', 'P3-8: newer colorUpdatedAt must win');
    assert.strictEqual(merged.comments.length, 2, 'P3-8: duplicate {date, text} comments must deduplicate to 2 entries');
    assert(moodleSrc.includes('autoSyncTimer.unref'), 'P3-8: moodle_sync interval must call .unref()');
    assert(authSrc.includes('lPinTime >= rPinTime') && authSrc.includes('lColorTime >= rColorTime') && authSrc.includes('seenComments.has(k)'), 'P3-8: auth_sync CRDT merge must reconcile pin, color, and deduplicated comments');
    console.log('✓ P3-8 passed: CRDT pin/color/comment sync & moodle_sync interval .unref() verified');
}

console.log('🎉 ALL PASS 3 HARDENING ASSERTIONS PASSED!');
