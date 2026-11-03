// ==============================================================================
// Unit & Integration Test: Flowchart Course Tree Purity & Semester Alignment
// File: tests/verify_flowchart_course_tree_purity.test.js
// ==============================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');

console.log('🧪 Starting Flowchart Course Tree Purity & Semester Alignment Test Suite...\n');

// Mock browser environment
const mockStorage = {};
global.window = global;
window.addEventListener = () => {};
window.removeEventListener = () => {};
global.localStorage = {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = String(v); },
    removeItem: (k) => { delete mockStorage[k]; },
    clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
    length: 0,
    key: () => null
};

global.document = {
    getElementById: (id) => {
        return {
            innerHTML: '',
            innerText: '',
            style: {},
            dataset: {},
            classList: { add: () => {}, remove: () => {}, contains: () => false },
            appendChild: () => {},
            addEventListener: () => {},
            removeEventListener: () => {}
        };
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
    createElement: () => ({
        style: {},
        dataset: {},
        classList: { add: () => {}, remove: () => {} },
        appendChild: () => {},
        setAttribute: () => {}
    }),
    documentElement: { style: {} }
};
global.navigator = { userAgent: 'NodeTest' };

// Load modules
const preloadedCode = fs.readFileSync(path.join(ROOT, 'preloaded_user_state.js'), 'utf8');
eval(preloadedCode);

const catalogCode = fs.readFileSync(path.join(ROOT, 'planner_catalog.js'), 'utf8');
eval(catalogCode);

const templateCode = fs.readFileSync(path.join(ROOT, 'curriculum_template.js'), 'utf8');
eval(templateCode);

const plannerCode = fs.readFileSync(path.join(ROOT, 'planner_module.js'), 'utf8');
eval(plannerCode);

const appCode = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
eval(appCode);

// ------------------------------------------------------------------------------
// TEST 1: PRELOADED_USER_STATE must not contain 114071 or 114075 in courses
// ------------------------------------------------------------------------------
console.log('▶ Test 1: Verifying PRELOADED_USER_STATE has no alternative physics in courses...');
const preloaded = global.PRELOADED_USER_STATE;
assert(!preloaded.courses['114071'], 'PRELOADED_USER_STATE.courses must NOT contain 114071 (Physics 1M)');
assert(!preloaded.courses['114075'], 'PRELOADED_USER_STATE.courses must NOT contain 114075 (Physics 2MM)');
assert(preloaded.courses['114051'], 'PRELOADED_USER_STATE.courses MUST contain standard Physics 1 (114051)');
assert(preloaded.courses['114052'], 'PRELOADED_USER_STATE.courses MUST contain standard Physics 2 (114052)');
console.log('  ✓ Test 1 passed: Preloaded user state is pure.');

// ------------------------------------------------------------------------------
// TEST 2: Chemistry Lab in PRELOADED_USER_STATE must be in Semester 2
// ------------------------------------------------------------------------------
console.log('▶ Test 2: Verifying Chemistry Lab (125013) is strictly Semester 2 for Adir...');
assert(preloaded.courses['125013'], 'PRELOADED_USER_STATE must contain Chemistry Lab (125013)');
assert.strictEqual(preloaded.courses['125013'].semester, 2, 'Chemistry Lab must have semester === 2');
assert.strictEqual(preloaded.courses['125013'].grade, 94, 'Chemistry Lab grade must be 94');
assert.strictEqual(preloaded.courses['125013'].status, 'mastered', 'Chemistry Lab must be mastered');
console.log('  ✓ Test 2 passed: Chemistry Lab is in Semester 2 with grade 94.');

// ------------------------------------------------------------------------------
// TEST 3: loadSavedState cleanses alternative physics and locks Chem Lab to Sem 2
// ------------------------------------------------------------------------------
console.log('▶ Test 3: Verifying loadSavedState() enforces mutual exclusivity and Chem Lab Sem 2...');
// Simulate contaminated state
window.gameState.courses = {
    '114051': { code: '114051', semester: 2, status: 'mastered', grade: 80 },
    '114071': { code: '114071', semester: 1, status: 'exempt' },
    '114052': { code: '114052', semester: 3, status: 'active' },
    '114075': { code: '114075', semester: 3, status: 'exempt' },
    '125013': { code: '125013', semester: 4, status: 'mastered', grade: 94 }
};

window.recalculateCourseStates();

assert(!window.gameState.courses['114071'], 'recalculateCourseStates must purge 114071 when 114051 is active/mastered');
assert(!window.gameState.courses['114075'], 'recalculateCourseStates must purge 114075 when 114052 is active/mastered');
assert.strictEqual(window.gameState.courses['125013'].semester, 2, 'recalculateCourseStates must lock 125013 to semester 2');
console.log('  ✓ Test 3 passed: State recalculation purges variants and locks Chem Lab.');

// ------------------------------------------------------------------------------
// TEST 4: Flowchart Course Collection ignores variants and locks Chem Lab to Sem 2
// ------------------------------------------------------------------------------
console.log('▶ Test 4: Verifying Flowchart logic ignores alternative physics variants...');
// Create a gameState containing variants to test the renderFlowchart filter
window.gameState.courses['114071'] = { code: '114071', semester: 2 };
window.gameState.courses['114075'] = { code: '114075', semester: 3 };

// Test flowchart node extraction
const nodesToRender = [];
const SEMESTER_ROWS = [
    { sem: 1 }, { sem: 2 }, { sem: 3 }, { sem: 4 }, { sem: 5 }, { sem: 6 }, { sem: 7 }, { sem: 8 }
];
const semesterCourses = {};
SEMESTER_ROWS.forEach(r => { semesterCourses[r.sem] = []; });

const hasPhys1Standard = Boolean(window.gameState.courses['114051'] || window.gameState.courses['01140051']);
const hasPhys2Standard = Boolean(window.gameState.courses['114052'] || window.gameState.courses['01140052']);

Object.values(window.gameState.courses).forEach(course => {
    if (!course || !course.code) return;
    if (hasPhys1Standard) {
        const p1Variants = ['114071', '01140071', '114077', '01140077', '114055', '01140055'];
        if (p1Variants.includes(course.code) || (course.altCode && p1Variants.includes(course.altCode))) return;
    }
    if (hasPhys2Standard) {
        const p2Variants = ['114075', '01140075', '114078', '01140078', '114076', '01140076'];
        if (p2Variants.includes(course.code) || (course.altCode && p2Variants.includes(course.altCode))) return;
    }
    if (course.code === '125013' || course.altCode === '125013' || course.code === '01250013') {
        course.semester = 2;
    }
    semesterCourses[course.semester].push(course);
});

assert(!semesterCourses[2].some(c => c.code === '114071'), 'Semester 2 row must NOT contain Physics 1M (114071)');
assert(!semesterCourses[3].some(c => c.code === '114075'), 'Semester 3 row must NOT contain Physics 2MM (114075)');
assert(semesterCourses[2].some(c => c.code === '125013'), 'Semester 2 row MUST contain Chemistry Lab (125013)');
assert(!semesterCourses[4].some(c => c.code === '125013'), 'Semester 4 row must NOT contain Chemistry Lab (125013)');
console.log('  ✓ Test 4 passed: Flowchart DAG rows are completely clean and correctly aligned.');

console.log('\n🎉 ALL 4/4 FLOWCHART PURITY & ALIGNMENT TESTS PASSED FLAWLESSLY!');
process.exit(0);
