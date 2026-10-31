// ==============================================================================
// Unit & Integration Test Suite: Technion Academic Grade Sheet & What-If Simulator
// File: tests/verify_grade_sheet_transcript.test.js
// ==============================================================================

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('🧪 Starting Academic Grade Sheet & What-If Simulator Test Suite...');

// 1. Setup mock browser environment
const mockElements = {};
const domMock = {
    document: {
        readyState: 'complete',
        addEventListener: () => {},
        removeEventListener: () => {},
        getElementById: (id) => {
            if (!mockElements[id]) {
                mockElements[id] = {
                    id,
                    style: {},
                    classList: {
                        add: () => {},
                        remove: () => {},
                        toggle: () => {},
                        contains: () => false
                    },
                    innerText: '',
                    innerHTML: '',
                    value: '85.0'
                };
            }
            return mockElements[id];
        },
        body: {
            style: {},
            classList: {
                add: () => {},
                remove: () => {},
                toggle: () => {},
                contains: () => false
            },
            appendChild: () => {},
            removeChild: () => {}
        },
        createElement: (tag) => {
            return {
                tag,
                style: {},
                classList: { add: () => {}, remove: () => {} },
                href: '',
                download: '',
                click: () => {}
            };
        }
    },
    window: {
        location: { search: '', protocol: 'http:' },
        addEventListener: () => {},
        removeEventListener: () => {},
        localStorage: {
            store: {},
            getItem(key) { return this.store[key] || null; },
            setItem(key, val) { this.store[key] = String(val); },
            removeItem(key) { delete this.store[key]; }
        },
        Blob: function(parts, opts) {
            this.parts = parts;
            this.opts = opts;
            this.content = parts.join('');
        },
        URL: {
            createObjectURL: (blob) => 'blob:mock-url',
            revokeObjectURL: () => {}
        },
        print: () => {}
    }
};

// Bind window self-reference
domMock.window.document = domMock.document;
domMock.window.window = domMock.window;

// 2. Load preloaded user state
const preloadedCode = fs.readFileSync(path.join(__dirname, '..', 'preloaded_user_state.js'), 'utf8');
const ctx = vm.createContext(domMock.window);
vm.runInContext(preloadedCode, ctx);

assert(ctx.window.PRELOADED_USER_STATE, 'PRELOADED_USER_STATE should be defined on window');
ctx.window.gameState = JSON.parse(JSON.stringify(ctx.window.PRELOADED_USER_STATE));

// 3. Load grade_sheet.js
const gradeSheetCode = fs.readFileSync(path.join(__dirname, '..', 'grade_sheet.js'), 'utf8');
vm.runInContext(gradeSheetCode, ctx);

assert(ctx.window.GradeSheet, 'GradeSheet module should be exported on window');
const GS = ctx.window.GradeSheet;

// TEST 1: Transcript Data Calculation (Semesters 1 and 2 actuals)
console.log('▶ Test 1: Verifying authentic transcript math for completed semesters...');
const data = GS.getTranscriptData();

assert(data.semesters.length >= 8, 'Should contain all degree semesters');

// Check Semester 1
const sem1 = data.semesters.find(s => s.semester === 1);
assert(sem1, 'Semester 1 must exist');
assert.strictEqual(sem1.courses.length, 5, 'Semester 1 should have 5 courses');
assert.strictEqual(sem1.earnedCredits, 19.5, 'Semester 1 earned credits should be 19.5');
assert.strictEqual(sem1.gradedCredits, 19.5, 'Semester 1 graded credits should be 19.5');
assert.strictEqual(sem1.qualityPoints, 1741, 'Semester 1 quality points should be 1741 (84*5 + 87*5 + 100*2.5 + 96*3 + 87*4)');
assert.strictEqual(Number(sem1.gpa.toFixed(2)), 89.28, 'Semester 1 GPA should be 89.28');
assert(sem1.honors, 'Semester 1 should qualify for honors');
assert.strictEqual(sem1.honors.type, 'dean', 'Semester 1 should have Dean Honors (GPA >= 84 and cr >= 18)');

// Check Semester 2
const sem2 = data.semesters.find(s => s.semester === 2);
assert(sem2, 'Semester 2 must exist');
assert.strictEqual(sem2.courses.length, 6, 'Semester 2 should have 6 courses');
assert.strictEqual(sem2.earnedCredits, 19, 'Semester 2 earned credits should be 19');
assert.strictEqual(sem2.gradedCredits, 19, 'Semester 2 graded credits should be 19');
assert.strictEqual(sem2.qualityPoints, 1571.5, 'Semester 2 quality points should be 1571.5 (70*5 + 74*2.5 + 94*0.5 + 90*3.5 + 82*4 + 99*3.5)');
assert.strictEqual(Number(sem2.gpa.toFixed(2)), 82.71, 'Semester 2 GPA should be 82.71');

// Cumulative Degree Totals
assert.strictEqual(data.totalEarnedCredits, 38.5, 'Total earned credits should be 38.5');
assert.strictEqual(data.totalGradedCredits, 38.5, 'Total graded credits should be 38.5');
assert.strictEqual(data.totalQualityPoints, 3312.5, 'Total quality points should be 3312.5');
assert.strictEqual(Number(data.cumulativeGpa.toFixed(2)), 86.04, 'Cumulative GPA should be 86.04');
assert.strictEqual(data.cumulativeStanding, 'הצטיינות (Cum Laude) 🎖️', 'Standing should be Cum Laude (GPA >= 84)');
console.log('  ✓ Test 1 passed: Exact match with Technion grading standards (38.5 cr, 3312.5 QP, 86.04 GPA).');

// TEST 2: Binary Pass / Exempt Isolation
console.log('▶ Test 2: Verifying binary pass course credit exclusion from GPA...');
// Inject a binary pass course (e.g. Sports - 1 credit with 'עובר')
ctx.window.gameState.courses['394800'] = {
    code: '394800',
    name: 'חינוך גופני - כושר כללי',
    semester: 2,
    credits: 1.0,
    grade: 'עובר',
    isBinaryPass: true,
    status: 'mastered'
};

const dataWithBinary = GS.getTranscriptData();
const sem2WithBinary = dataWithBinary.semesters.find(s => s.semester === 2);
assert.strictEqual(sem2WithBinary.earnedCredits, 20, 'Binary pass should add 1.0 credit to earned degree credits (19 + 1 = 20)');
assert.strictEqual(sem2WithBinary.gradedCredits, 19, 'Binary pass must NOT add to graded credits (stays 19)');
assert.strictEqual(sem2WithBinary.qualityPoints, 1571.5, 'Binary pass must NOT alter quality points');
assert.strictEqual(Number(sem2WithBinary.gpa.toFixed(2)), 82.71, 'GPA must remain strictly 82.71');
console.log('  ✓ Test 2 passed: Binary pass course included in degree credits but strictly excluded from GPA denominator.');

// Cleanup injected course
delete ctx.window.gameState.courses['394800'];

// TEST 3: What-If Simulator Activation & Scenario Calculation
console.log('▶ Test 3: Verifying What-If Simulator live scenario projection...');
GS.toggleSimulation(true);
assert.strictEqual(GS.isSimActive, true, 'Simulation should be active');

// Simulate a grade of 90 on a Semester 3 course (034011 - מכניקת זורמים 1, 3.5 credits)
const sem3 = data.semesters.find(s => s.semester === 3);
const course3 = sem3.courses[0]; // First course in sem 3
assert(course3, 'Course in semester 3 should exist');

GS.setSimGrade(course3.code, 90);
assert.strictEqual(GS.simGrades[course3.code], 90, 'Sim grade should be recorded');

const simData = GS.getTranscriptData();
const simSem3 = simData.semesters.find(s => s.semester === 3);
assert.strictEqual(simSem3.simGradedCredits, course3.credits, 'Sim graded credits in sem 3 should match course credits');
assert.strictEqual(simSem3.simGpa, 90, 'Sim sem 3 GPA should be 90');
assert(simData.simCumulativeGpa > data.cumulativeGpa, 'Projected cumulative GPA should rise with 90 in sem 3');

// Test Presets
GS.applyPreset(85);
const presetData = GS.getTranscriptData();
assert(presetData.totalSimulatedGradedCredits > 100, 'Preset should apply to all uncompleted courses');

// Reset simulation
GS.resetSimulation();
assert.strictEqual(Object.keys(GS.simGrades).length, 0, 'Reset should clear simulated grades');
GS.toggleSimulation(false);
console.log('  ✓ Test 3 passed: What-If simulator scenario projections and presets operate reliably.');

// TEST 4: CSV Export Formatting & UTF-8 BOM
console.log('▶ Test 4: Verifying CSV export generation and structure...');
let exportedBlob = null;
domMock.window.Blob = function(parts, opts) {
    this.parts = parts;
    this.opts = opts;
    exportedBlob = this;
};

GS.exportCSV();
assert(exportedBlob, 'CSV Blob should be created');
const csvText = exportedBlob.parts.join('');
assert(csvText.startsWith('\uFEFF'), 'CSV must start with UTF-8 BOM for Hebrew Excel compatibility');
assert(csvText.includes('גיליון ציונים אקדמי רשמי - הטכניון מכון טכנולוגי לישראל'), 'CSV must contain Technion header');
assert(csvText.includes('104041'), 'CSV must contain Calculus 1M1 code');
assert(csvText.includes('3312.5'), 'CSV must contain total Quality Points');
assert(csvText.includes('86.04'), 'CSV must contain cumulative GPA');
console.log('  ✓ Test 4 passed: CSV formatted with UTF-8 BOM and verified data rows.');

// TEST 5: Student Info Persistence
console.log('▶ Test 5: Verifying student info loading and localStorage persistence...');
const nameEl = domMock.document.getElementById('grade-sheet-student-name');
const idEl = domMock.document.getElementById('grade-sheet-student-id');
if (nameEl) nameEl.innerText = 'ישראל ישראלי';
if (idEl) idEl.innerText = '123456789';

GS.saveStudentInfo();

const savedStr = domMock.window.localStorage.getItem('ast_grade_sheet_student_info');
assert(savedStr, 'Student info should be saved in localStorage');
const savedObj = JSON.parse(savedStr);
assert.strictEqual(savedObj.name, 'ישראל ישראלי');
assert.strictEqual(savedObj.id, '123456789');
console.log('  ✓ Test 5 passed: Student profile info persists cleanly.');

console.log('\n🎉 ALL 5/5 GRADE SHEET & WHAT-IF SIMULATOR UNIT TESTS PASSED SUCCESSFULLY!\n');
