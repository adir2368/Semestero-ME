const assert = require('assert');
const fs = require('fs');

const moodleSyncCode = fs.readFileSync('moodle_sync.js', 'utf8').replace(/\r\n/g, '\n');
const appJsCode = fs.readFileSync('app.js', 'utf8').replace(/\r\n/g, '\n');

// 1. Verify token separation
const localStorage = { getItem: () => null, setItem: () => {} };
const document = { readyState: 'loading', addEventListener: () => {}, getElementById: () => null, querySelectorAll: () => [] };
const window = { gameState: { completedTaskRegistry: {} }, localStorage, document };
eval(moodleSyncCode);
const MoodleSync = window.MoodleSync;

const tWritten = { id: '104228_h1', title: 'תרגיל בית 1: משוואות מסדר ראשון', type: 'hw' };
const tDigital = { id: 'task-12345', title: 'תרגיל אלקטרוני 1 - סיווג מד"ח', type: 'hw', source: 'manual' };

const tokenWritten = MoodleSync.getCanonicalTaskToken(tWritten.title, 'מד"ח');
const tokenDigital = MoodleSync.getCanonicalTaskToken(tDigital.title, 'מד"ח');

console.log('tokenWritten:', tokenWritten);
console.log('tokenDigital:', tokenDigital);

assert.strictEqual(tokenWritten, 'hw_1', 'Written task should be hw_1');
assert.strictEqual(tokenDigital, 'hw_digital_1', 'Digital task should be hw_digital_1');
assert.strictEqual(MoodleSync.areTasksDuplicates(tWritten, tDigital, 'מד"ח'), false, 'Written and digital tasks must NOT be duplicates');

// 2. Test course deduplication preserves both
const course = {
    code: '104228',
    name: 'משוואות דיפרנציאליות חלקיות',
    tasks: [
        { id: '104228_h1', title: 'תרגיל בית 1: משוואות מסדר ראשון', type: 'hw', completed: false, status: 'not_started' },
        { id: 'task-12345', title: 'תרגיל אלקטרוני 1 - סיווג מד"ח', type: 'hw', source: 'manual', dueDate: '2026-11-09', completed: false, status: 'not_started' }
    ]
};

const dedupRes = MoodleSync.deduplicateCourseTasks(course);
assert.strictEqual(course.tasks.length, 2, 'Course must retain both distinct tasks');
assert.strictEqual(dedupRes.removedCount, 0, 'Zero duplicates should be removed between written and digital');
console.log('✓ Course deduplication correctly preserves both written and digital tasks');

console.log('🎉 ALL MANUAL TASK TOKEN & DEDUPLICATION TESTS PASSED!');
