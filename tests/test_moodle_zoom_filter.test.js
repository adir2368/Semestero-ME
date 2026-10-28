/**
 * Unit Test Suite: Moodle Zoom Links Filtering & Opening Notices Rejection
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('Testing Moodle Zoom Links Filtering & Opening Notices Rejection...');

// Mock environment
global.document = {
    readyState: 'complete',
    getElementById: () => null,
    addEventListener: () => null
};

global.localStorage = {
    getItem: () => null,
    setItem: () => null
};

global.window = {
    document: global.document,
    localStorage: global.localStorage,
    addEventListener: () => null,
    gameState: {
        courses: {
            '114052': {
                code: '114052',
                name: 'פיסיקה 2',
                status: 'active',
                tasks: [
                    { id: 't1', title: 'קישור זום להרצאות של גידי', moodleUrl: 'https://moodle26.technion.ac.il/calendar/view.php?view=event&id=17944' },
                    { id: 't2', title: 'תרגיל בית 1', dueDate: '2026-11-10 23:59', moodleUrl: 'https://moodle26.technion.ac.il/calendar/view.php?view=event&id=1234' }
                ]
            },
            '034056': {
                code: '034056',
                name: 'מבוא לחישוב מדעי והנדסי',
                status: 'active',
                tasks: []
            }
        }
    }
};

// Load moodle_sync.js
const moodleSyncCode = fs.readFileSync(path.join(__dirname, '..', 'moodle_sync.js'), 'utf8');
eval(moodleSyncCode);

const MoodleSync = global.MoodleSync || window.MoodleSync;
assert(MoodleSync, 'MoodleSync must be defined');

// 1. Test Deduplication Purges Existing Zoom Tasks
const physCourse = window.gameState.courses['114052'];
const dedupResult = MoodleSync.deduplicateCourseTasks(physCourse);
assert.strictEqual(physCourse.tasks.length, 1, 'Zoom task must be purged by deduplicateCourseTasks');
assert.strictEqual(physCourse.tasks[0].title, 'תרגיל בית 1', 'Real task must be preserved');
console.log('✓ Test 1 Passed: Existing Zoom tasks automatically purged from course');

// 2. Test Realistic Sample with Zoom and Opening Events
const testIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Moodle Technion//NONSGML//HE
BEGIN:VEVENT
UID:17944@moodle26.technion.ac.il
SUMMARY:קישור זום להרצאות של גידי
CATEGORIES:01140052.200
DTSTART:20261110T080000Z
DTEND:20261110T100000Z
DESCRIPTION:https://technion.zoom.us/j/123456789
END:VEVENT
BEGIN:VEVENT
UID:15246@moodle26.technion.ac.il
SUMMARY:שאלון מילואים (תאריך תחילת שאלון)
CATEGORIES:00340056.200
DTSTART:20261105T100000Z
DTEND:20261105T100000Z
DESCRIPTION:שאלון מילואים נפתח
END:VEVENT
BEGIN:VEVENT
UID:9376@moodle26.technion.ac.il
SUMMARY:נפתח ב תרגיל בית 0 - איך עובדים עם מודל?
CATEGORIES:01140052.200
DTSTART:20261105T100000Z
DTEND:20261105T100000Z
DESCRIPTION:הודעת פתיחה
END:VEVENT
BEGIN:VEVENT
UID:9032@moodle26.technion.ac.il
SUMMARY:יש להגיש את 'לומדת MATLAB'
CATEGORIES:00340056.200
DTSTART:20261119T215900Z
DTEND:20261119T215900Z
DESCRIPTION:
END:VEVENT
BEGIN:VEVENT
UID:9593@moodle26.technion.ac.il
SUMMARY:תאריך הגשה תרגיל בית 0 - איך עובדים עם מודל? (לא נחשב לציון)
CATEGORIES:01140052.200
DTSTART:20261125T215900Z
DTEND:20261125T215900Z
DESCRIPTION:
END:VEVENT
END:VCALENDAR`;

const parseResult = MoodleSync.parseAndApplyIcs(testIcs);

// Check tasks in 114052
const pTasks = window.gameState.courses['114052'].tasks;
const titles114052 = pTasks.map(t => t.title);
assert(!titles114052.some(t => t.includes('זום')), 'No Zoom event should be added');
assert(!titles114052.some(t => t.startsWith('נפתח ב')), 'No opening event should be added');
assert(titles114052.some(t => t.includes('איך עובדים עם מודל')), 'Actual deadline task must be added');
console.log('✓ Test 2 Passed: Zoom sessions and opening announcements strictly rejected in iCal import');

// Check tasks in 034056
const mTasks = window.gameState.courses['034056'].tasks;
const titles034056 = mTasks.map(t => t.title);
assert(!titles034056.some(t => t.includes('תאריך תחילת')), 'Opening questionnaire announcement must be skipped');
assert(titles034056.includes('לומדת MATLAB'), 'Actual deadline task "לומדת MATLAB" must be added with cleaned title');
console.log('✓ Test 3 Passed: Title cleaning removes boilerplate "יש להגיש את" and isolates assignment name');

console.log('\n🎉 ALL MOODLE ZOOM & FILTERING TESTS PASSED FLAWLESSLY!');
