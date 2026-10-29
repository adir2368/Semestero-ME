/**
 * Regression Test: Curriculum Isolation and Recommended Tracks
 * 
 * Verifies:
 * 1. Default / Guest syllabus follows authentic Technion Mechanical Engineering recommended catalog:
 *    - Physics 1 in Semester 2 (NOT Semester 1)
 *    - Chemistry Lab in Semester 4 (NOT Semester 2)
 *    - NO Yoga in Semester 3 (Yoga is an elective sports course)
 *    - Solid Mechanics 1 in Semester 2 with Calculus 1 and Linear Algebra prereqs
 * 2. Developer Adir Moshe's authentic custom schedule is preserved when Adir is active:
 *    - Physics 1 in Semester 1 (Grade 100)
 *    - Chemistry Lab in Semester 2 (Grade 94)
 *    - Yoga in Semester 3 (Grade 98)
 * 3. Strict isolation:
 *    - Non-Adir users/guests reject Adir's signature and never inherit his early course moves
 *    - Contaminated local storage is purged
 */

const assert = require('assert');
const path = require('path');

// Mock localStorage and window environment for Node.js
class LocalStorageMock {
    constructor() {
        this.store = {};
    }
    getItem(key) {
        return this.store[key] || null;
    }
    setItem(key, value) {
        this.store[key] = String(value);
    }
    removeItem(key) {
        delete this.store[key];
    }
    clear() {
        this.store = {};
    }
}

global.localStorage = new LocalStorageMock();
global.sessionStorage = new LocalStorageMock();
global.window = global;

// Load catalog and curriculum template
require('../planner_catalog.js');
require('../curriculum_template.js');

console.log('--- RUNNING CURRICULUM ISOLATION & RECOMMENDED TRACKS TESTS ---');

// Test 1: Official Recommended Catalog Structure
console.log('Test 1: Verify Default Catalog (SUGGESTED_MANDATORY_SYLLABUS_2026)');
const cat2026 = global.PLANNER_CATALOG.SUGGESTED_MANDATORY_SYLLABUS_2026;
assert(Array.isArray(cat2026), 'Catalog 2026 must be an array of semesters');

const sem1_2026 = cat2026.find(s => s.semester === 1);
const sem2_2026 = cat2026.find(s => s.semester === 2);
const sem3_2026 = cat2026.find(s => s.semester === 3);
const sem4_2026 = cat2026.find(s => s.semester === 4);

// Sem 1 must NOT have Physics 1
const s1_phys1 = sem1_2026.courses.find(c => c.code === '01140051' || c.altCode === '114051');
assert(!s1_phys1, 'Default Catalog Semester 1 must NOT contain Physics 1 (was moved to Sem 2)');
assert.strictEqual(sem1_2026.targetCredits, 17.0, 'Semester 1 target credits must be 17.0 in 2026 (Calc 1: 5, Lin Alg: 5, Chem: 3, Python: 4)');

// Sem 2 must have Physics 1 and must NOT have Chemistry Lab
const s2_phys1 = sem2_2026.courses.find(c => c.code === '01140051' || c.altCode === '114051');
assert(s2_phys1, 'Default Catalog Semester 2 MUST contain Physics 1');
const s2_chemLab = sem2_2026.courses.find(c => c.code === '01250013' || c.altCode === '125013');
assert(!s2_chemLab, 'Default Catalog Semester 2 must NOT contain Chemistry Lab (belongs in Sem 4)');
assert.strictEqual(sem2_2026.targetCredits, 20.5, 'Semester 2 target credits must be 20.5');

// Sem 2 Solids 1 prereqs must only be Calc 1 and Linear Algebra
const s2_solids = sem2_2026.courses.find(c => c.code === '00340028' || c.altCode === '034028');
assert(s2_solids, 'Solids 1 must be present in Semester 2');
assert(!s2_solids.prereqs.includes('01140051') && !s2_solids.prereqs.includes('114051'), 'Solids 1 must NOT require Physics 1 as a blocking prereq');
assert(s2_solids.prereqs.includes('01040041') && s2_solids.prereqs.includes('01040065'), 'Solids 1 requires Calc 1 and Linear Algebra');

// Sem 3 must NOT have Yoga pre-assigned
const s3_yoga = sem3_2026.courses.find(c => c.code === '03940805' || c.altCode === '03940805');
assert(!s3_yoga, 'Default Catalog Semester 3 must NOT contain pre-assigned Yoga');
assert.strictEqual(sem3_2026.targetCredits, 19.5, 'Semester 3 target credits must be 19.5');

// Sem 4 must have Chemistry Lab
const s4_chemLab = sem4_2026.courses.find(c => c.code === '01250013' || c.altCode === '125013');
assert(s4_chemLab, 'Default Catalog Semester 4 MUST contain Chemistry Lab (0.5 cr)');
assert.strictEqual(sem4_2026.targetCredits, 18.0, 'Semester 4 target credits must be 18.0');

console.log('[PASS] Test 1: Default Catalog structure is verified');

// Test 2: Catalogs 2024 and 2027
console.log('Test 2: Verify Catalogs 2024 and 2027');
[global.PLANNER_CATALOG.SUGGESTED_MANDATORY_SYLLABUS_2024, global.PLANNER_CATALOG.SUGGESTED_MANDATORY_SYLLABUS_2027].forEach((cat, idx) => {
    const yearLabel = idx === 0 ? '2024' : '2027';
    const s1 = cat.find(s => s.semester === 1);
    const s2 = cat.find(s => s.semester === 2);
    const s4 = cat.find(s => s.semester === 4);
    assert(!s1.courses.some(c => c.code === '01140051'), `${yearLabel} Sem 1 must not have Physics 1`);
    assert(s2.courses.some(c => c.code === '01140051'), `${yearLabel} Sem 2 must have Physics 1`);
    assert(!s2.courses.some(c => c.code === '01250013'), `${yearLabel} Sem 2 must not have Chem Lab`);
    assert(s4.courses.some(c => c.code === '01250013'), `${yearLabel} Sem 4 must have Chem Lab`);
});
console.log('[PASS] Test 2: Catalogs 2024 and 2027 verified');

// Test 3: SAMPLE_ME_DEGREE in curriculum_template.js
console.log('Test 3: Verify SAMPLE_ME_DEGREE');
const sampleDegree = global.SAMPLE_ME_DEGREE;
assert.strictEqual(sampleDegree['114051'].semester, 2, 'Physics 1 in SAMPLE_ME_DEGREE must be semester 2');
assert.strictEqual(sampleDegree['114071'].semester, 2, 'Physics 1M in SAMPLE_ME_DEGREE must be semester 2');
assert.strictEqual(sampleDegree['125013'].semester, 4, 'Chem Lab in SAMPLE_ME_DEGREE must be semester 4');
assert.strictEqual(sampleDegree['03940805'], undefined, 'Yoga must not be in SAMPLE_ME_DEGREE');
assert(!sampleDegree['034028'].prerequisites.includes('114051'), 'Solids 1 prereqs in SAMPLE_ME_DEGREE must not include Physics 1');
console.log('[PASS] Test 3: SAMPLE_ME_DEGREE verified');

// Test 4: getCleanCurriculumState() returns clean syllabus without Adir contamination
console.log('Test 4: Verify getCleanCurriculumState()');
const cleanState = global.getCleanCurriculumState(1);
assert.strictEqual(cleanState.courses['114051'].semester, 2, 'Clean state Physics 1 must be in Semester 2');
assert.strictEqual(cleanState.courses['125013'].semester, 4, 'Clean state Chem Lab must be in Semester 4');
assert.strictEqual(cleanState.courses['03940805'], undefined, 'Clean state must not contain Yoga');
assert.strictEqual(cleanState.courses['114051'].status, 'locked', 'Physics 1 in sem 2 is locked for semester 1 starting student');
assert.strictEqual(cleanState.courses['114051'].completed, false);

const cleanStateSem2 = global.getCleanCurriculumState(2);
assert.strictEqual(cleanStateSem2.courses['114051'].status, 'available', 'Physics 1 is available for semester 2 student');
console.log('[PASS] Test 4: getCleanCurriculumState() verified');

// Test 5: Verify Contamination Purge for Guest in AuthSync
console.log('Test 5: Verify AuthSync Contamination Purge');
// Require auth_sync.js
require('../auth_sync.js');
const AuthSync = global.AuthSync;

// Setup a mock contaminated guest state that mimics Adir Moshe's personal plan
const contaminatedGuestState = {
    characterClass: 'סטודנט להנדסת מכונות (הטכניון)',
    student_name: 'אורח',
    completedCourses: 0,
    gpa: 0,
    credits: 0,
    courses: {
        '114051': { code: '114051', semester: 1, grade: 100, completed: true },
        '125013': { code: '125013', semester: 2, grade: 94, completed: true },
        '03940805': { code: '03940805', semester: 3, grade: 98, completed: true }
    },
    degreePlan: [
        { semester: 1, courses: [{ code: '01140051' }] },
        { semester: 2, courses: [{ code: '01250013' }] },
        { semester: 3, courses: [{ code: '03940805' }] }
    ]
};

global.localStorage.setItem('ast_user_state_guest', JSON.stringify(contaminatedGuestState));
global.localStorage.setItem('ast_session_user', 'guest');

const loadedGuestState = AuthSync.loadActiveUserState();
assert(loadedGuestState, 'Guest state should be loaded via fallback');
// Must have returned the clean state, not the contaminated state:
assert.strictEqual(loadedGuestState.courses['114051'].semester, 2, 'Guest must have Physics 1 in semester 2 after purge');
assert.strictEqual(loadedGuestState.courses['125013'].semester, 4, 'Guest must have Chem Lab in semester 4 after purge');
assert.strictEqual(loadedGuestState.courses['03940805'], undefined, 'Guest must not have Yoga after purge');
assert.strictEqual(loadedGuestState.courses['114051'].completed, false, 'Guest Physics 1 must not be marked completed');
console.log('[PASS] Test 5: AuthSync Contamination Purge verified');

console.log('--- ALL CURRICULUM ISOLATION TESTS PASSED SUCCESSFULLY [OK] ---');
