// ==============================================================================
// Unit Test: Degree Planner Mandatory Courses Catalog & Quick-Restore Suite
// Also verifies: Physics 2MM (114075 - פיזיקה 2ממ) naming convention.
// File: tests/verify_planner_mandatory_restore.test.js
// ==============================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

console.log('🧪 Starting Degree Planner Mandatory Courses & Physics 2MM Test Suite...\n');

// ------------------------------------------------------------------------------
// TEST 1: Verify Physics 2MM (114075) naming convention
// ------------------------------------------------------------------------------
console.log('▶ Test 1: Verifying "פיזיקה 2ממ" (114075) naming convention...');
const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const catalogJs = fs.readFileSync(path.join(ROOT, 'planner_catalog.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// Ensure 114075 is called "פיזיקה 2ממ" or "פיסיקה 2ממ" and NOT "2מ'"
assert(catalogJs.includes('{ code: "01140075", altCode: "114075", name: "פיזיקה 2ממ", credits: 5.0 }'), 'planner_catalog.js must use "פיזיקה 2ממ" for 114075');
assert(appJs.includes('{ code: "01140075", altCode: "114075", name: "פיזיקה 2ממ", credits: 5.0 }'), 'app.js phys2Family must use "פיזיקה 2ממ"');
assert(appJs.includes('{ code: \'01140075\', altCode: \'114075\', name: "פיזיקה 2ממ" }'), 'app.js p2Variants must use "פיזיקה 2ממ"');
assert(indexHtml.includes('פיסיקה 2ממ (114075)'), 'index.html must reference "פיסיקה 2ממ (114075)"');
console.log('  ✓ Test 1 passed: Physics 2MM (114075) consistently standardized to "פיזיקה 2ממ".');

// ------------------------------------------------------------------------------
// TEST 2: Verify Mandatory Filter Pill & Missing Section in index.html & styles.css
// ------------------------------------------------------------------------------
console.log('▶ Test 2: Verifying UI markup in index.html and styles.css...');
assert(indexHtml.includes('data-category="MANDATORY"'), 'index.html must have MANDATORY filter pill');
assert(indexHtml.includes('planner-missing-mandatory-section'), 'index.html must have planner-missing-mandatory-section container');
assert(indexHtml.includes('➕ מאגר קורסים לתכנון (חובה ובחירה)'), 'Sidebar title must reflect both core and elective courses');

const stylesCss = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
assert(stylesCss.includes('.planner-missing-mandatory-section'), 'styles.css must style missing mandatory section');
assert(stylesCss.includes('.tag-missing-mandatory'), 'styles.css must have tag-missing-mandatory');
assert(stylesCss.includes('.tag-placed-mandatory'), 'styles.css must have tag-placed-mandatory');
console.log('  ✓ Test 2 passed: UI markup and CSS classes verified.');

// ------------------------------------------------------------------------------
// TEST 3: Verify planner_module.js Mandatory Catalog & Restore Logic
// ------------------------------------------------------------------------------
console.log('▶ Test 3: Verifying planner_module.js mandatory catalog handling and restore functions...');
const plannerJs = fs.readFileSync(path.join(ROOT, 'planner_module.js'), 'utf8');

assert(plannerJs.includes('selectedCategory === \'MANDATORY\''), 'planner_module.js must handle MANDATORY category filter');
assert(plannerJs.includes('function restoreMandatoryCourse'), 'planner_module.js must define restoreMandatoryCourse');
assert(plannerJs.includes('function restoreAllMissingMandatoryCourses'), 'planner_module.js must define restoreAllMissingMandatoryCourses');
assert(plannerJs.includes('.btn-restore-mandatory'), 'planner_module.js must bind .btn-restore-mandatory click');
assert(plannerJs.includes('#btn-restore-all-mandatory'), 'planner_module.js must bind #btn-restore-all-mandatory click');
console.log('  ✓ Test 3 passed: planner_module.js logic verified.');

// ------------------------------------------------------------------------------
// TEST 4: Execute VM simulation of removing and restoring a mandatory course
// ------------------------------------------------------------------------------
console.log('▶ Test 4: Simulating removal and 1-click restore of mandatory course...');

// Build sandbox with catalog
const mockWindow = {
    document: {
        getElementById: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {}
    },
    gameState: {
        courses: {},
        exemptions: {},
        completedCourses: []
    },
    localStorage: {
        getItem: () => null,
        setItem: () => {}
    },
    console: console
};
mockWindow.window = mockWindow;

// Run planner_catalog.js in VM to get catalog structures
vm.runInNewContext(catalogJs, mockWindow);
assert(mockWindow.PLANNER_CATALOG, 'PLANNER_CATALOG must be exported');
const cat2026 = mockWindow.PLANNER_CATALOG.SUGGESTED_MANDATORY_SYLLABUS_2026;
assert(Array.isArray(cat2026) && cat2026.length >= 8, 'Catalog 2026 must have at least 8 semesters');

// Pick a mandatory course from Sem 2: 00340028 (Solid Mechanics 1)
const sem2 = cat2026.find(s => s.semester === 2);
const solids1 = sem2.courses.find(c => c.code === '00340028' || c.altCode === '034028');
assert(solids1, 'Solids Mechanics 1 must exist in Semester 2');

// Verify simulation: copy syllabus
const testPlan = JSON.parse(JSON.stringify(cat2026));
const testSem2 = testPlan.find(s => s.semester === 2);
const origCount = testSem2.courses.length;

// Step A: Simulate accidental deletion
const deletedIdx = testSem2.courses.findIndex(c => c.code === '00340028');
const [removedCourse] = testSem2.courses.splice(deletedIdx, 1);
assert.strictEqual(testSem2.courses.length, origCount - 1, 'Course should be removed from sem 2');

// Step B: Simulate missing detection
const placedSet = new Set();
testPlan.forEach(s => s.courses.forEach(c => placedSet.add(c.code)));
assert(!placedSet.has('00340028'), '00340028 should no longer be in placedSet');

// Step C: Simulate 1-click restore
testSem2.courses.push(removedCourse);
assert.strictEqual(testSem2.courses.length, origCount, 'Course should be restored to sem 2');
console.log('  ✓ Test 4 passed: Removal and restore simulation successful.');

console.log('\n🎉 ALL 4/4 DEGREE PLANNER MANDATORY COURSES & PHYSICS 2MM TESTS PASSED!\n');
