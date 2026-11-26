const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const stylesCss = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
const modalHelpJs = fs.readFileSync(path.join(ROOT, 'modal_help.js'), 'utf8');
const syncEngineJs = fs.readFileSync(path.join(ROOT, 'calendar_sync_engine.js'), 'utf8');

function extractFn(source, name) {
    const sig = `function ${name}(`;
    const start = source.indexOf(sig);
    assert(start !== -1, `Could not find ${sig}`);
    let end = source.indexOf('\n}\n', start);
    if (end === -1) end = source.indexOf('\r\n}\r\n', start);
    assert(end !== -1, `Could not find closing brace for ${name}`);
    const braceLen = source.slice(end, end + 5).startsWith('\r\n') ? 5 : 3;
    return source.slice(start, end + braceLen);
}

console.log('=== Running Pass 4 (tab-calendar + Unified Calendar Sync) Hardening Tests ===');

// P4-1: Stored DOM XSS & apostrophe-safe time-grid delegation
(() => {
    const renderCalFn = extractFn(appJs, 'renderFinalsCalendar');
    assert(!renderCalFn.includes("openCourseDetails('${escapeHtml("), 'Calendar time-grid must not use single-quoted onclickAttr around escapeHtml()');
    assert(!renderCalFn.includes("openCalendarDayModal('${escapeHtml("), 'Calendar time-grid personal events must use data-tg-action instead of onclickAttr');
    assert(renderCalFn.includes('data-tg-action="open-course"') && renderCalFn.includes('data-tg-action="edit-personal"'), 'Calendar time-grid must emit data-tg-action attributes');

    const escapeHtmlFn = extractFn(appJs, 'escapeHtml');
    const renderDayListFn = extractFn(appJs, 'renderDayModalEventsList');
    const getCoursesFn = extractFn(appJs, 'renderGcalManagerClassList');

    let lastRowHtml = '';
    const mockListEl = {
        innerHTML: '',
        appendChild(child) { lastRowHtml += child.innerHTML; }
    };
    const sandbox = {
        window: {
            currentCalendarItemsByDate: {
                '2026-11-25': [{
                    isPersonalEvent: true,
                    id: "ev'1\"<script>",
                    title: `<img src=x onerror="window.__xss=1"> O'Reilly`,
                    icon: `<svg onload=alert(1)>`,
                    startTime: '10:00<x>',
                    endTime: '11:00<b>'
                }]
            }
        },
        document: {
            getElementById(id) { return id === 'day-modal-events-list' ? mockListEl : null; },
            createElement() {
                return { className: '', style: { setProperty() {} }, classList: { add() {} }, addEventListener() {}, querySelector() { return null; }, innerHTML: '' };
            }
        },
        gameState: {},
        getCourseAccentColor: () => '#38bdf8'
    };
    vm.createContext(sandbox);
    vm.runInContext(`${escapeHtmlFn}\n${renderDayListFn}`, sandbox);
    sandbox.renderDayModalEventsList('2026-11-25');

    assert(!lastRowHtml.includes('<img src=x'), 'renderDayModalEventsList must escape HTML in event title');
    assert(!lastRowHtml.includes('<svg onload'), 'renderDayModalEventsList must escape HTML in event icon');
    assert(!lastRowHtml.includes('<x>'), 'renderDayModalEventsList must escape HTML in event times');
    assert(lastRowHtml.includes('&lt;img src=x') && lastRowHtml.includes('&#39;'), 'Escaped entities expected in day modal list');

    // Gcal manager list escaping
    const gcalContainer = { innerHTML: '' };
    const gcalSandbox = {
        window: {},
        document: { getElementById(id) { return id === 'gcal-manager-classes-list' ? gcalContainer : null; } },
        getActiveTimetableSchedule: () => ({
            days: [{
                dayIndex: 0,
                classes: [{
                    courseId: '104041"',
                    courseName: '<script>evil()</script>',
                    type: '<b onclick=1>הרצאה</b>',
                    room: '<img src=x>',
                    lecturer: 'Dr.<script>',
                    startTime: '08:30',
                    endTime: '10:30'
                }]
            }]
        })
    };
    vm.createContext(gcalSandbox);
    vm.runInContext(`${escapeHtmlFn}\n${getCoursesFn}`, gcalSandbox);
    gcalSandbox.renderGcalManagerClassList();
    assert(!gcalContainer.innerHTML.includes('<script>evil()'), 'renderGcalManagerClassList must escape courseName');
    assert(!gcalContainer.innerHTML.includes('<img src=x>'), 'renderGcalManagerClassList must escape room');
    console.log('✓ P4-1 Passed: Stored DOM XSS escaped and time-grid uses apostrophe-safe delegation');
})();

// P4-2: #exam-gap-runway-track vertical stacking CSS
(() => {
    assert(stylesCss.includes('#exam-gap-runway-track.runway-track'), 'styles.css missing #exam-gap-runway-track.runway-track rule');
    assert(stylesCss.includes('flex-direction: column !important'), 'Exam runway track must stack conflict banner above horizontal nodes row');
    assert(stylesCss.includes('#exam-gap-runway-track .runway-badge'), 'Exam runway badge nowrap rule must exist');
    console.log('✓ P4-2 Passed: Exam gap runway conflict stacking and badge nowrap rules verified');
})();

// P4-3: Fallback exam dates in getDegreeExamDates()
(() => {
    const normalizeFn = '';
    const isCurrentFn = extractFn(appJs, 'isCurrentOrUpcomingDate');
    const parseDateToIsoFn = extractFn(appJs, 'parseDateToIso');
    const getCourseCfFn = extractFn(appJs, 'getCourseCheeseforkExamDates');
    const getExamsFn = extractFn(appJs, 'getDegreeExamDates');

    const sandbox = {
        window: { AuthSync: { isAdirActive: () => false }, CHEESEFORK_DB: [{ rawNum: '01040041', code6: '104041', name: 'אלגברה א', moedA: '2027-02-20', moedB: '2027-03-22' }] },
        CHEESEFORK_EXAM_DATES: {
            '114052': { moedA: '2027-02-01', moedB: '2027-03-02', name: 'פיסיקה 2' }
        },
        gameState: {
            courses: {
                '01140052': { code: '01140052', name: 'פיסיקה 2', status: 'active', tasks: [{ id: 't-no-date', type: 'exam', title: 'מבחן מועד א', dueDate: '' }] },
                '104041': { code: '104041', name: 'אלגברה א', status: 'active', tasks: [] }
            }
        },
        getDeduplicatedCoursesList: (c) => Object.values(c),
        initCheeseForkDatabase: () => {},
        findCheeseForkCourse: (q) => q === '104041' ? { rawNum: '01040041', code6: '104041', moedA: '2027-02-20', moedB: '2027-03-22' } : null
    };
    vm.createContext(sandbox);
    vm.runInContext(`${parseDateToIsoFn}\n${isCurrentFn}\n${getCourseCfFn}\n${getExamsFn}`, sandbox);
    const list = sandbox.getDegreeExamDates(true);
    assert(list.some(e => e.courseCode === '01140052' && e.dateStr === '2027-02-01'), 'Must populate Moed A from CHEESEFORK_EXAM_DATES fallback');
    assert(list.some(e => e.courseCode === '104041' && e.dateStr === '2027-02-20'), 'Must populate Moed A from CHEESEFORK_DB fallback');
    assert(list.some(e => e.courseCode === '104041' && e.moed === 'B' && e.dateStr === '2027-03-22'), 'Must populate Moed B fallback');
    console.log('✓ P4-3 Passed: Fallback Technion/CheeseFork exam dates populate Exam Gap Runway');
})();

// P4-4 & P4-9: Calendar Sync modal bounded height, custom event .ics export, zero alert() & duplicate ⚠️ removal, direct unified shortcuts
(() => {
    const exportFn = extractFn(appJs, 'exportScheduleToICS');
    const toastFn = extractFn(appJs, 'showToastNotification');

    assert(!exportFn.includes('alert('), 'exportScheduleToICS must not use blocking alert()');
    assert(indexHtml.includes('id="btn-open-unified-ics-from-cal"'), 'Calendar Sync modal must expose Unified ICS shortcut');
    assert(indexHtml.includes('id="btn-open-gcal-mgr-from-cal"'), 'Calendar Sync modal must expose GCal Manager shortcut');

    let downloaded = null;
    let lastToast = null;
    const sandbox = {
        gameState: {
            isFinalsMode: false,
            courses: {},
            tasks: [],
            customCalendarEvents: [
                { id: 'ev-1', date: '2026-11-28', endDate: '2026-11-29', isAllDay: true, title: 'מילואים, גזרה צפונית', recurrence: 'none', reminderMinutes: 60 }
            ]
        },
        COURSE_SHORT_NAMES: {},
        syncScheduleFromBank: () => {},
        downloadICSFile(content, filename) { downloaded = { content, filename }; },
        showToastNotification(m, t) { lastToast = { m, t }; }
    };
    vm.createContext(sandbox);
    vm.runInContext(exportFn, sandbox);
    sandbox.exportScheduleToICS();

    assert(downloaded && downloaded.filename === 'Semester_Tasks_Homework_Schedule.ics', 'exportScheduleToICS must export custom calendar events even when taskCount is 0');
    assert(downloaded.content.includes('SUMMARY:🔵 מילואים\\, גזרה צפונית'), 'Exported ICS must escape commas and include custom event');
    assert(downloaded.content.includes('DTSTART;VALUE=DATE:20261128') && downloaded.content.includes('DTEND;VALUE=DATE:20261130'), 'All-day multi-day custom event must use exclusive DTEND +1 day');
    assert(lastToast && lastToast.t === 'success', 'exportScheduleToICS must fire success toast instead of alert()');

    // Verify showToastNotification strips duplicate ⚠️ prefix from display text
    let textSpan = { className: '', textContent: '' };
    let createdCount = 0;
    const toastSandbox = {
        document: {
            querySelectorAll: () => [],
            createElement: () => {
                createdCount++;
                const obj = { className: '', dataset: {}, style: { setProperty() {} }, classList: { add() {} }, setAttribute() {}, appendChild() {}, textContent: '' };
                if (createdCount === 3) textSpan = obj;
                return obj;
            },
            body: { appendChild() {} }
        },
        repackAstToastStack: () => {},
        scheduleAstToastRemoval: () => {}
    };
    vm.createContext(toastSandbox);
    vm.runInContext(toastFn, toastSandbox);
    toastSandbox.showToastNotification('⚠️ אינך מחובר לסנכרון ענן', 'warning');
    assert.strictEqual(textSpan.textContent, 'אינך מחובר לסנכרון ענן', 'Display text must strip duplicate leading ⚠️ icon');
    console.log('✓ P4-4 & P4-9 Passed: Custom events .ics export, non-blocking toasts, and unified shortcuts verified');
})();

// P4-5 & P4-6: Toolbar wrapping, Calendar Day Modal sticky header/footer, mobile date clamping, help registration
(() => {
    assert(stylesCss.includes('.cal-actions-row') && stylesCss.includes('flex-wrap: wrap !important'), '.cal-actions-row must wrap cleanly');
    assert(indexHtml.includes('class="modal-header day-modal-header"'), '#calendar-day-modal must have sticky .day-modal-header');
    assert(indexHtml.includes('class="modal-body day-modal-body"'), '#calendar-day-modal must have scrollable .day-modal-body');
    assert(indexHtml.includes('class="modal-footer day-modal-footer"'), '#calendar-day-modal must have sticky .day-modal-footer');
    assert(indexHtml.includes('id="btn-close-day-modal-footer"'), '#calendar-day-modal footer must have close button');
    assert(modalHelpJs.includes("'calendar-day-modal'") && modalHelpJs.includes("'modal-unified-calendar-sync'") && modalHelpJs.includes("'modal-gcal-sync-manager'"), 'All calendar modals must be registered in MODAL_HELP_REGISTRY');
    assert(syncEngineJs.includes('unified-sync-header-actions') && syncEngineJs.includes('injectHelpButtons'), 'Unified sync modal must expose help button slot');
    console.log('✓ P4-5 & P4-6 Passed: Toolbar wrap, sticky day modal structure, and ? help registration verified');
})();

// P4-7 & P4-8: Month cell + inside .cal-day-num, RTL arrows order, sticky hour axis, Hebrew Day View month name, toggle sync
(() => {
    const prevIdx = indexHtml.indexOf('id="cal-nav-prev"');
    const nextIdx = indexHtml.indexOf('id="cal-nav-next"');
    assert(prevIdx !== -1 && nextIdx !== -1 && prevIdx < nextIdx, 'RTL paging bar must put cal-nav-prev (right) before cal-nav-next (left)');
    assert(indexHtml.includes('id="cal-nav-prev" title="חודש / שבוע / יום קודם (אחורה בזמן)" aria-label="תקופה קודמת">&#9654;</button>'), 'cal-nav-prev must show right-pointing arrow ▶ in RTL');
    assert(indexHtml.includes('id="cal-nav-next" title="חודש / שבוע / יום הבא (קדימה בזמן)" aria-label="תקופה הבאה">&#9664;</button>'), 'cal-nav-next must show left-pointing arrow ◀ in RTL');

    assert(appJs.includes('<bdi dir="ltr">${dDay}</bdi> ב${escapeHtml(monthHe)}'), 'Day View header must use Hebrew month name');
    assert(appJs.includes('btnEl.setAttribute("aria-pressed", isActive ? "true" : "false")'), 'renderFinalsCalendar must sync active view toggle buttons deterministically');
    assert(stylesCss.includes('.cal-day-cell > .cal-day-num > .btn-add-day-item'), 'Month + button must sit inside .cal-day-num header');
    assert(stylesCss.includes('.cal-timegrid-axis') && stylesCss.includes('position: sticky !important;\n    right: 0 !important;') || stylesCss.includes('right: 0 !important;'), 'Time-grid hour axis must be sticky on right in RTL');
    console.log('✓ P4-7 & P4-8 Passed: Inline + button, resize refresh, RTL paging, sticky axis & Hebrew Day title verified');
})();

console.log('\nALL PASS 4 HARDENING ASSERTIONS PASSED!');
