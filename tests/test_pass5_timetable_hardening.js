const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const appJs = read('app.js');
const attJs = read('attendance_hub.js');
const ttgJs = read('timetable_generator.js');
const helpJs = read('modal_help.js');
const indexHtml = read('index.html');
const stylesCss = read('styles.css');

console.log('🧪 Running Pass 5 Timetable, Attendance & Panopto Hardening Tests...');

// P5-1: Attendance Hub live badge syncing, safe addCustomMandatoryCourse refresh, HTML bold tags
assert.ok(attJs.includes('data-att-tab'), 'P5-1: attendance_hub tabs must expose data-att-tab attributes');
assert.ok(!attJs.includes('this.renderModalContent()'), 'P5-1: addCustomMandatoryCourse must not call non-existent renderModalContent()');
assert.ok(!attJs.includes('**להרצאות בלבד**') && !attJs.includes('**לתרגולים בלבד**'), 'P5-1: attendance_hub must not render raw Markdown bold tokens');
assert.ok(attJs.includes('<strong>להרצאות בלבד</strong>') && attJs.includes('<strong>לתרגולים בלבד</strong>'), 'P5-1: attendance_hub must use <strong> tags for mandatory mode badges');

// P5-2: Real active-schedule Canvas PNG export + empty guard + standalone Panopto option
const pngFnStart = appJs.indexOf('function exportTimetableToCanvasPNG()');
const pngFnEnd = appJs.indexOf('window.exportTimetableToCanvasPNG = exportTimetableToCanvasPNG;', pngFnStart);
const pngFnBody = appJs.slice(pngFnStart, pngFnEnd);
assert.ok(pngFnStart !== -1 && pngFnEnd > pngFnStart, 'P5-2: exportTimetableToCanvasPNG must exist');
assert.ok(pngFnBody.includes('getActiveTimetableSchedule()'), 'P5-2: Canvas PNG export must read from getActiveTimetableSchedule()');
assert.ok(!pngFnBody.includes('104019'), 'P5-2: Canvas PNG export must not use hardcoded sample courses');
assert.ok(appJs.includes('opts && opts.standalone === true'), 'P5-2: PanoptoTracker.openModal must support opts.standalone === true');

// P5-3: HTML / JS attribute escaping & no raw inline onclick injection in Pass 5 views
assert.ok(!ttgJs.includes("onclick=\"window.TimetableGenerator.studio.toggleAnchor("), 'P5-3: timetable_generator must not emit inline Yoga onclick handler');
assert.ok(ttgJs.includes('function escHtml('), 'P5-3: timetable_generator must define escHtml');
assert.ok(ttgJs.includes('ttg-btn-release-yoga'), 'P5-3: timetable_generator must bind Yoga release button via class');
assert.ok(appJs.includes('data-tt-action="open-pangea"'), 'P5-3: app.js timetable grid must delegate Pangea opens via data-tt-action');
assert.ok(!appJs.includes('const onclickAttr = c.personalId'), 'P5-3: app.js timetable grid must not build raw inline onclickAttr');
assert.ok(attJs.includes('const escHtml =') && attJs.includes('const encArg ='), 'P5-3: attendance_hub must define escHtml and encArg');

// P5-4: Zero blocking prompt/confirm/alert dialogs in Pass 5 flows
const attWithoutComments = attJs.replace(/\/\/.*$/gm, '');
assert.ok(!/\bprompt\s*\(/.test(attWithoutComments), 'P5-4: attendance_hub must not call blocking prompt()');
assert.ok(!/\bconfirm\s*\(/.test(attWithoutComments), 'P5-4: attendance_hub must not call blocking confirm()');
assert.ok(attJs.includes('att-manual-catchup-form') && attJs.includes('btn-att-confirm-clear-yes'), 'P5-4: attendance_hub must provide inline manual catchup form and 2-step clear confirmation');
assert.ok(!/alert\s*\(\s*toastMsg\s*\)/.test(ttgJs) && !/alert\s*\(\s*msg\s*\)/.test(ttgJs), 'P5-4: timetable_generator must not fall back to blocking alert()');

// P5-5 & P5-6: Bounded modals + header action containers + ModalHelp entries + CSS rules
assert.ok(indexHtml.includes('class="ttg-modal-header-actions"'), 'P5-6: #modal-timetable-generator must wrap sync & close inside .ttg-modal-header-actions');
assert.ok(helpJs.includes("'modal-timetable-generator'") && helpJs.includes("'modal-attendance-hub'") && helpJs.includes("'modal-panopto-tracker'"), 'P5-6: modal_help.js must register Pass 5 modals');
assert.ok(helpJs.includes('.ttg-modal-header-actions') && helpJs.includes('.attendance-header-actions') && helpJs.includes('.panopto-header-actions'), 'P5-6: modal_help.js must inject help buttons into Pass 5 header action containers');

// P5-5, P5-7, P5-8: CSS rules in styles.css + aria-pressed sync in app.js
assert.ok(stylesCss.includes('#modal-timetable-generator .ttg-modal-content'), 'P5-6: styles.css must bound #modal-timetable-generator height');
assert.ok(stylesCss.includes('#attendance-hub-week-navigator .week-pills-rail'), 'P5-6: styles.css must wrap attendance week pills cleanly');
assert.ok(stylesCss.includes('.timetable-grid.timetable-timegrid .cal-timegrid-scroll-x'), 'P5-7: styles.css must prevent nested scrollbox inside timetable timegrid');
assert.ok(stylesCss.includes('.day-tab-pill[data-day]:not(.active)'), 'P5-7: styles.css must clear sticky hover glow on mobile day pills');
assert.ok(stylesCss.includes('.btn-quick-course-oh') && stylesCss.includes('.oh-course-box-header'), 'P5-8: styles.css must align and nowrap OH header controls');
assert.ok(appJs.includes("setAttribute('aria-pressed'") && appJs.includes('pill.blur()'), 'P5-7: app.js must sync aria-pressed and blur tapped day pills on mobile');

console.log('✅ All Pass 5 Timetable, Attendance & Panopto hardening assertions passed!');
