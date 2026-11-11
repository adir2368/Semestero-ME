const fs = require('fs');
const assert = require('assert');

// Mock browser globals
global.window = global;
window.addEventListener = () => {};
window.removeEventListener = () => {};

let capturedInnerHTML = '';
const mockEl = {
    style: {},
    innerText: '',
    value: '',
    dataset: {},
    scrollIntoView: () => {},
    focus: () => {},
    setAttribute: () => {},
    getAttribute: () => '',
    querySelector: () => mockEl,
    querySelectorAll: () => [mockEl],
    appendChild: () => {},
    removeChild: () => {},
    remove: () => {},
    classList: { add: () => {}, remove: () => {}, contains: () => false, toggle: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
    set innerHTML(val) { capturedInnerHTML = val; },
    get innerHTML() { return capturedInnerHTML; }
};

global.document = {
    getElementById: (id) => mockEl,
    querySelector: () => mockEl,
    querySelectorAll: () => [mockEl],
    addEventListener: () => {},
    removeEventListener: () => {},
    createElement: () => mockEl,
    createElementNS: () => mockEl,
    documentElement: { style: {}, classList: { contains: () => false, add: () => {}, remove: () => {} } },
    body: mockEl
};

const storageMap = {};
global.localStorage = {
    getItem: (k) => storageMap[k] !== undefined ? storageMap[k] : null,
    setItem: (k, v) => { storageMap[k] = String(v); },
    removeItem: (k) => { delete storageMap[k]; }
};

// Mock showToastNotification
window.showToastNotification = function(msg, type) {
    console.log(`[Toast] [${type}]: ${msg}`);
};

// Set Adir session for schedule access
window.AuthSync = {
    isAdirActive: () => true,
    isLoggedIn: () => true,
    getActiveUser: () => ({ id: 'adir', username: 'adir' })
};

// Load attendance_hub.js and app.js
require('../attendance_hub.js');
require('../app.js');

if (window.CHEESEFORK_SEMESTER_SCHEDULE) {
    window.gameState.timetable = JSON.parse(JSON.stringify(window.CHEESEFORK_SEMESTER_SCHEDULE));
}

console.log('Testing Physics Attendance Marking and Perpetual Ditch Self-Study Mode...');

// 1. Verify window.handleTimetableAttendance exists
assert.strictEqual(typeof window.handleTimetableAttendance, 'function', 'handleTimetableAttendance must be defined');

// 2. Verify window.isCoursePerpetualDitch and toggleCoursePerpetualDitch exist
assert.strictEqual(typeof window.isCoursePerpetualDitch, 'function', 'isCoursePerpetualDitch must be defined');
assert.strictEqual(typeof window.toggleCoursePerpetualDitch, 'function', 'toggleCoursePerpetualDitch must be defined');

// 3. Test that no courses default to Perpetual Ditch (must NOT be default)
assert.strictEqual(window.isCoursePerpetualDitch('034056'), false, '034056 must NOT default to perpetual ditch');
assert.strictEqual(window.isCoursePerpetualDitch('34056'), false, '34056 (clean) must also default to false');

// 4. Test toggling another course (e.g. Physics 2 114052)
assert.strictEqual(window.isCoursePerpetualDitch('114052'), false, '114052 initially not perpetual ditch');
window.toggleCoursePerpetualDitch('114052', true);
assert.strictEqual(window.isCoursePerpetualDitch('114052'), true, '114052 is now perpetual ditch');
window.toggleCoursePerpetualDitch('114052', false);
assert.strictEqual(window.isCoursePerpetualDitch('114052'), false, '114052 toggled back to normal');

// 5. Test renderTimetableGrid for Physics 2 Monday lecture in טאוב - מדמ"ח 1
window.renderTimetableGrid();
const containerHtml = capturedInnerHTML;
console.log('containerHtml length:', containerHtml.length);
if (containerHtml.length < 500) {
    console.log('containerHtml:', containerHtml);
}

// Verify that the HTML does NOT contain the broken unescaped onclick syntax
assert.ok(!containerHtml.includes("טאוב - מדמ\"ח 1', 'attended')"), 'Must not have raw unescaped double quotes inside onclick');

// Verify that handleTimetableAttendance is rendered on the attendance buttons
assert.ok(containerHtml.includes('handleTimetableAttendance(this, 1,'), 'Must use handleTimetableAttendance for Monday classes');

// Verify that individual timetable cards do NOT contain ambiguous perpetual ditch quick buttons
assert.ok(!containerHtml.includes('btn-perpetual-quick'), 'Timetable cards must not contain ambiguous btn-perpetual-quick button');

// 6. Test clicking attendance for Physics 2 on Monday
// Physics 2 is class 0 on Monday in CHEESEFORK_SEMESTER_SCHEDULE
window.handleTimetableAttendance(null, 1, 0, 'attended');
const record = window.AttendanceHub.getRecord('114052', 1, '08:30');
assert.ok(record, 'Attendance record for 114052 on Monday 08:30 must be saved');
assert.strictEqual(record.status, 'attended', 'Record status must be attended');

// Test toggling off (clicking again unmarks)
window.handleTimetableAttendance(null, 1, 0, 'attended');
const unmarkRecord = window.AttendanceHub.getRecord('114052', 1, '08:30');
assert.strictEqual(unmarkRecord, null, 'Clicking attended again should unmark record');

// Test marking missed
window.handleTimetableAttendance(null, 1, 0, 'missed');
const missedRecord = window.AttendanceHub.getRecord('114052', 1, '08:30');
assert.ok(missedRecord, 'Missed record must be saved');
assert.strictEqual(missedRecord.status, 'missed', 'Record status must be missed');

// Clean up
window.handleTimetableAttendance(null, 1, 0, 'missed');

// 7. Test Perpetual Ditch card rendering when activated for 034056 (from course page)
window.toggleCoursePerpetualDitch('034056', true);
assert.strictEqual(window.isCoursePerpetualDitch('034056'), true, '034056 is now perpetual ditch');
window.renderTimetableGrid();
const perpetualHtml = capturedInnerHTML;

assert.ok(perpetualHtml.includes('is-perpetual-ditch'), 'Container HTML must contain is-perpetual-ditch class');
assert.ok(perpetualHtml.includes('🚀 למידה עצמית'), 'Container HTML must contain 🚀 למידה עצמית badge');
assert.ok(perpetualHtml.includes('btn-perpetual-panopto'), 'Container HTML must contain direct Panopto quick link');
assert.ok(perpetualHtml.includes('btn-perpetual-pangea'), 'Container HTML must contain direct Pangea quick link');
assert.ok(perpetualHtml.includes('btn-perpetual-revert'), 'Container HTML must contain btn-perpetual-revert class');
assert.ok(perpetualHtml.includes('⚙️ דף הקורס'), 'Container HTML must contain ⚙️ דף הקורס button');

// Revert 034056 back
window.toggleCoursePerpetualDitch('034056', false);
assert.strictEqual(window.isCoursePerpetualDitch('034056'), false, '034056 reverted back to in-person');

console.log('✅ ALL TESTS PASSED: Physics attendance click and Perpetual Ditch verified successfully!');
process.exit(0);
