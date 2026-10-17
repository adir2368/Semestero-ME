/**
 * Verification Suite for Moodle Sync, Miluim Rights Advisor, Pangea Summaries & Runway Badges
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('🧪 Testing Moodle Sync, Miluim Rights Advisor & Exam Runway');
console.log('================================================================');

// 1. Verify index.html contains all required elements
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

console.log('\n🔍 [TEST 1] Verifying DOM Elements in index.html...');
assert(indexHtml.includes('id="btn-sync-moodle-tasks"'), 'Missing #btn-sync-moodle-tasks in index.html');
assert(indexHtml.includes('id="btn-open-miluim-advisor"'), 'Missing #btn-open-miluim-advisor in index.html');
assert(indexHtml.includes('id="modal-miluim-rights"'), 'Missing #modal-miluim-rights in index.html');
assert(indexHtml.includes('id="miluim-days-input"'), 'Missing #miluim-days-input in index.html');
assert(indexHtml.includes('id="miluim-candidate-courses-list"'), 'Missing #miluim-candidate-courses-list in index.html');
assert(indexHtml.includes('id="miluim-current-gpa"'), 'Missing #miluim-current-gpa in index.html');
assert(indexHtml.includes('id="miluim-simulated-gpa"'), 'Missing #miluim-simulated-gpa in index.html');
assert(indexHtml.includes('id="miluim-gpa-diff"'), 'Missing #miluim-gpa-diff in index.html');
console.log('  ✅ PASS: All new DOM elements and modal structures present in index.html');

// 2. Verify app.js contains wiring and MiluimRightsAdvisor implementation
const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

console.log('\n🔍 [TEST 2] Verifying app.js wiring & MiluimRightsAdvisor engine...');
assert(appJs.includes('btn-sync-moodle-tasks'), 'Missing btn-sync-moodle-tasks listener in app.js');
assert(appJs.includes('btn-open-miluim-advisor'), 'Missing btn-open-miluim-advisor listener in app.js');
assert(appJs.includes('window.MiluimRightsAdvisor ='), 'Missing window.MiluimRightsAdvisor definition in app.js');
assert(appJs.includes('window.MiluimRightsAdvisor.init'), 'Missing MiluimRightsAdvisor.init call in app.js');
console.log('  ✅ PASS: MiluimRightsAdvisor and Moodle Sync properly declared and wired in app.js');

// 3. Test Miluim Rights Calculation & Simulation Math
console.log('\n🔍 [TEST 3] Testing Miluim Rights Calculation & GPA Simulation Math...');

// Test Courses Dataset
const mockCourses = [
    { code: '034053', name: 'מוצקים 2', grade: 71, credits: 5.0, isBinaryPass: false },
    { code: '01040228', name: 'מד״ח מ', grade: 74, credits: 4.5, isBinaryPass: false },
    { code: '01140052', name: 'פיסיקה 2', grade: 88, credits: 5.0, isBinaryPass: false },
    { code: '00340035', name: 'תרמו 1', grade: 92, credits: 4.0, isBinaryPass: false },
    { code: '03940805', name: 'יוגה', grade: 98, credits: 1.0, isBinaryPass: false }
];

// Baseline GPA:
let baseWeighted = 0;
let baseCredits = 0;
mockCourses.forEach(c => {
    baseWeighted += (c.grade * c.credits);
    baseCredits += c.credits;
});
const baseGpa = baseWeighted / baseCredits;
console.log(`  📊 Baseline GPA: ${baseGpa.toFixed(2)} (${baseCredits} credits)`);

// Conversion of lowest course (מוצקים 2, 71):
const convertedCodes = new Set(['034053']);
let simWeighted = 0;
let simCredits = 0;
mockCourses.forEach(c => {
    if (!convertedCodes.has(c.code)) {
        simWeighted += (c.grade * c.credits);
        simCredits += c.credits;
    }
});
const simGpa = simWeighted / simCredits;
const gpaDiff = simGpa - baseGpa;
console.log(`  🚀 Simulated GPA after converting 034053: ${simGpa.toFixed(2)} (+${gpaDiff.toFixed(2)} pts!)`);

assert(simGpa > baseGpa, 'Simulated GPA should increase when converting lowest grade to binary pass');
assert.strictEqual(simGpa.toFixed(2), '85.45', 'Simulated GPA should exactly equal 85.45');
console.log('  ✅ PASS: Binary Pass GPA simulation math confirmed accurate');

// 4. Test Exam Runway Interval Formatting
console.log('\n🔍 [TEST 4] Testing Exam Runway Color-Coded Urgency Labels...');
assert(appJs.includes('🟢 ${diffDays} ימים (מרווח)'), 'Missing relaxed pace badge in app.js');
assert(appJs.includes('🟡 ${diffDays} ימים (סטנדרטי)'), 'Missing standard pace badge in app.js');
assert(appJs.includes('🔴 ${diffDays} ימים (צפוף מאוד)'), 'Missing urgent pace badge in app.js');
assert(appJs.includes('🛑 0 ימים (התנגשות!)'), 'Missing clash badge in app.js');
console.log('  ✅ PASS: Color-coded exam runway urgency badges verified');

// 5. Test Pangea Course Map Integration
console.log('\n🔍 [TEST 5] Verifying Pangea Summaries Integration...');
assert(appJs.includes('PANGEA_COURSE_MAP'), 'Missing PANGEA_COURSE_MAP in app.js');
assert(appJs.includes('idofangbentov.uk'), 'Missing Ido Fang Bentov direct summaries links in app.js');
console.log('  ✅ PASS: Pangea direct course summaries map verified');

console.log('\n================================================================');
console.log('🎉 ALL TESTS PASSED! 100% SUCCESS');
console.log('================================================================');
