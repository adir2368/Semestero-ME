/**
 * Unit Test Suite: Moodle & Manual Tasks Auto-Sync, Canonical Matching & Completion Lock
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('🧪 TEST SUITE: MOODLE & MANUAL TASKS AUTO-SYNC & COMPLETION LOCK');
console.log('================================================================\n');

// Mock environment
global.document = {
    readyState: 'complete',
    getElementById: () => null,
    addEventListener: () => null
};

global.localStorage = {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
};

global.window = {
    document: global.document,
    localStorage: global.localStorage,
    addEventListener: () => null,
    gameState: {
        courses: {
            '034056': {
                code: '034056',
                name: 'חישוב מדעי והנדסי',
                status: 'active',
                tasks: []
            },
            '114052': {
                code: '114052',
                name: 'פיסיקה 2',
                status: 'active',
                tasks: []
            }
        },
        completedTaskRegistry: {},
        dismissedTaskRegistry: {}
    }
};

// Load moodle_sync.js
const moodleSyncCode = fs.readFileSync(path.join(__dirname, '..', 'moodle_sync.js'), 'utf8');
eval(moodleSyncCode);

const MoodleSync = global.MoodleSync || window.MoodleSync;
assert(MoodleSync, 'MoodleSync must be defined globally or on window');

// TEST 1: Canonical Task Token Matching
console.log('[Test 1] Verifying Canonical Task Token Matching across Hebrew/English variations...');
const testPairs = [
    ['תרגיל 1', "יש להגיש את 'תרגיל בית 1'", 'hw_1'],
    ['מטלה 1', 'תרגיל 1', 'hw_1'],
    ['תרגיל 1', 'תרגיל 1 - הגשה', 'hw_1'],
    ["תרגיל בית מס' 1", 'תרגיל 1', 'hw_1'],
    ['הגשת תרגיל 1', 'תרגיל 1', 'hw_1'],
    ['דוח 2', 'דוח מעבדה 2', 'lab_2'],
    ['hw 1', 'תרגיל 1', 'hw_1'],
    ['תרגיל 1', 'תרגיל 01', 'hw_1'],
    ['מטלה 2', 'הגשת מטלה 2', 'hw_2'],
    ['תרגיל בית 3 (בונוס)', "יש להגיש את 'תרגיל 3'", 'hw_3'],
    ['מטלה 4 - סופי', "תרגיל בית מס' 4", 'hw_4'],
    ["מועד א'", "חישוב מדעי והנדסי - מועד א'", 'exam_a'],
    ["דוח מכין מס' 2", 'דוח מעבדה 2', 'lab_2']
];

testPairs.forEach(([manualTitle, moodleTitle, expectedToken]) => {
    const tokenManual = MoodleSync.getCanonicalTaskToken(manualTitle);
    const tokenMoodle = MoodleSync.getCanonicalTaskToken(moodleTitle);
    assert.strictEqual(tokenManual, expectedToken, `Manual title "${manualTitle}" token should be "${expectedToken}", got "${tokenManual}"`);
    assert.strictEqual(tokenMoodle, expectedToken, `Moodle title "${moodleTitle}" token should be "${expectedToken}", got "${tokenMoodle}"`);
    const isDup = MoodleSync.areTasksDuplicates({ title: manualTitle }, { title: moodleTitle }, 'חישוב מדעי והנדסי');
    assert.strictEqual(isDup, true, `areTasksDuplicates should match "${manualTitle}" and "${moodleTitle}"`);
});
console.log('  ✅ PASS: All 13 canonical task token pairs matched accurately.\n');

// TEST 2: Protected User Copies with (העתק)
console.log('[Test 2] Verifying explicit user copies with (העתק) are NEVER deduplicated...');
const userCopyDup = MoodleSync.areTasksDuplicates(
    { id: 'orig_1', title: 'תרגיל 1' },
    { id: 'copy_1', title: 'תרגיל 1 (העתק)' },
    'חישוב מדעי והנדסי'
);
assert.strictEqual(userCopyDup, false, 'User copies with (העתק) must not be treated as duplicates');
console.log('  ✅ PASS: Explicit user copies strictly protected.\n');

// TEST 3: Reconciling Manual Task with Existing Moodle Task in Course
console.log('[Test 3] Testing reconcileManualTaskWithCourse()...');
const course56 = window.gameState.courses['034056'];
course56.tasks = [
    {
        id: 'moodle_task_43952',
        title: "יש להגיש את 'תרגיל בית 1'",
        type: 'hw',
        dueDate: '2026-11-20',
        dueTimestamp: 1795219200000,
        moodleEventId: '43952',
        moodleUid: '43952@moodle26.technion.ac.il',
        moodleUrl: 'https://moodle26.technion.ac.il/mod/assign/view.php?id=43952',
        source: 'moodle',
        completed: false,
        status: 'not_started'
    }
];

const manualTaskInput = {
    id: `task_manual_${Date.now()}`,
    title: 'תרגיל 1',
    type: 'hw',
    dueDate: '2026-11-20',
    xp: 60,
    completed: true,
    status: 'done',
    source: 'manual'
};

const merged = MoodleSync.reconcileManualTaskWithCourse(course56, manualTaskInput);
assert.strictEqual(merged, true, 'reconcileManualTaskWithCourse should return true when matching task exists');
assert.strictEqual(course56.tasks.length, 1, 'Course should still have exactly 1 task (no duplicate created)');
const reconciledTask = course56.tasks[0];
assert.strictEqual(reconciledTask.moodleEventId, '43952', 'Moodle event ID must be preserved');
assert.strictEqual(reconciledTask.completed, true, 'Manual task completed status must be preserved');
assert.strictEqual(reconciledTask.status, 'done', 'Manual task status done must be preserved');
console.log('  ✅ PASS: Manual task reconciled with Moodle task without duplicating.\n');

// TEST 4: Completion Lock - Moodle Sync Never Re-Opens Completed Tasks
console.log('[Test 4] Verifying Moodle Sync preserves completed status...');
const sampleIcsFeed = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Moodle//NONSGML Moodle 2026//EN
BEGIN:VEVENT
UID:43952@moodle26.technion.ac.il
SUMMARY:יש להגיש את 'תרגיל בית 1'
CATEGORIES:00340056.201
DTSTART:20261122T215900Z
DTEND:20261122T215900Z
DESCRIPTION:https://moodle26.technion.ac.il/mod/assign/view.php?id=43952
END:VEVENT
END:VCALENDAR`;

// Run sync on the feed
MoodleSync.parseAndApplyIcs(sampleIcsFeed);
assert.strictEqual(course56.tasks.length, 1, 'Course must still have 1 task');
assert.strictEqual(course56.tasks[0].completed, true, 'Completed status MUST NOT be overwritten to false by incoming Moodle event');
assert.strictEqual(course56.tasks[0].status, 'done', 'Status MUST remain done');
assert.strictEqual(course56.tasks[0].dueDate, '2026-11-22 21:59', 'Due date update from lecturer postponement should be applied');
console.log('  ✅ PASS: Completed task remained strictly completed after Moodle sync.\n');

// TEST 5: Completion Registry Restores Done Status even if Course Task was missing
console.log('[Test 5] Verifying Completion Registry prevents re-creating completed tasks as uncompleted...');
// Clear course tasks completely, but registry still remembers completion of 43952
course56.tasks = [];
assert.strictEqual(MoodleSync.isTaskCompletedInRegistry('034056', { moodleEventId: '43952', title: 'תרגיל 1' }), true, 'Task should be known in completed registry');

// Re-run sync
MoodleSync.parseAndApplyIcs(sampleIcsFeed);
assert.strictEqual(course56.tasks.length, 1, 'Task re-created from feed');
assert.strictEqual(course56.tasks[0].completed, true, 'Re-created task must be completed: true because it was in completedTaskRegistry');
assert.strictEqual(course56.tasks[0].status, 'done', 'Re-created task must be status: done');
console.log('  ✅ PASS: Completed registry correctly prevented resurrection of uncompleted task.\n');

// TEST 6: Explicitly Dismissed/Deleted Tasks are not resurrected by Moodle Sync
console.log('[Test 6] Verifying dismissed tasks are not resurrected by Moodle Sync...');
MoodleSync.markTaskDismissedInRegistry('034056', course56.tasks[0]);
course56.tasks = [];

MoodleSync.parseAndApplyIcs(sampleIcsFeed);
assert.strictEqual(course56.tasks.length, 0, 'Dismissed task must NOT be resurrected by Moodle Sync');
console.log('  ✅ PASS: Dismissed tasks are ignored by Moodle Sync.\n');

console.log('================================================================');
console.log('🎉 ALL MOODLE & MANUAL SYNC TESTS PASSED SUCCESSFULLY!');
console.log('================================================================');
