const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 Starting Technion-Wide Course Catalog Planner E2E Verification...\n');

// 1. Verify syntax
console.log('1. Checking file syntax:');
require('child_process').execSync('node -c app.js', { stdio: 'inherit' });
require('child_process').execSync('node -c planner_module.js', { stdio: 'inherit' });
console.log('   ✓ Syntax check passed for app.js and planner_module.js\n');

// 2. Setup mock browser DOM environment
console.log('2. Setting up Mock Browser DOM Environment:');

const localStorageData = {};
const mockLocalStorage = {
    getItem: (k) => localStorageData[k] || null,
    setItem: (k, v) => { localStorageData[k] = String(v); },
    removeItem: (k) => { delete localStorageData[k]; },
    clear: () => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); }
};

const elements = {};
function createMockElement(id, tag = 'div') {
    return {
        id,
        tagName: tag.toUpperCase(),
        style: {},
        dataset: {},
        classList: {
            contains: () => false,
            add: () => {},
            remove: () => {},
            toggle: () => false
        },
        innerHTML: '',
        value: '',
        children: [],
        appendChild: function(c) { this.children.push(c); return c; },
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {},
        getAttribute: () => null,
        setAttribute: () => {},
        removeAttribute: () => {}
    };
}

// Elements used by planner_module.js
[
    'planner-workspace',
    'planner-available-electives-list',
    'planner-missing-mandatory-section',
    'planner-ready-electives-list',
    'planner-rules-body',
    'planner-rules-toggle-icon',
    'planner-elective-search-input',
    'planner-elective-filters',
    'planner-track-select',
    'toggle-planner-reservist',
    'recent-courses-chips-container'
].forEach(id => {
    elements[id] = createMockElement(id);
});

const mockDocument = {
    getElementById: (id) => elements[id] || null,
    querySelector: (sel) => null,
    querySelectorAll: (sel) => [],
    createElement: (tag) => createMockElement('dyn_' + Math.random(), tag),
    body: createMockElement('body'),
    addEventListener: () => {}
};

const sandbox = {
    window: {},
    global: {},
    document: mockDocument,
    localStorage: mockLocalStorage,
    console: {
        log: () => {},
        warn: () => {},
        error: () => {}
    },
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    performance: performance
};
sandbox.window = sandbox;
sandbox.global = sandbox;

// Load catalog & databases
console.log('   Loading cheesefork_database.js, planner_catalog.js, planner_module.js...');
vm.runInNewContext(fs.readFileSync('cheesefork_database.js', 'utf8'), sandbox);
vm.runInNewContext(fs.readFileSync('planner_catalog.js', 'utf8'), sandbox);

// Mock minimal gameState
sandbox.gameState = {
    userProfile: { uid: 'test_student', role: 'student' },
    courses: {
        '104003': { status: 'mastered', grade: 90 }, // Calculus 1
        '104004': { status: 'mastered', grade: 88 }  // Calculus 2
    },
    degreePlan: null
};

vm.runInNewContext(fs.readFileSync('planner_module.js', 'utf8'), sandbox);
console.log('   ✓ Modules loaded successfully in sandbox.\n');

// 3. Test Course Object Resolution for Technion-wide courses
console.log('3. Testing resolveCourseObject for Technion-wide courses:');
const csCourseCode = '234124'; // Systems Programming (מדעי המחשב)
const csCourse = sandbox.DegreePlanner.resolveCourseObject(csCourseCode);
assert(csCourse, 'Expected resolveCourseObject(234124) to find the course in CHEESEFORK_DB');
assert.strictEqual(csCourse.code, '234124');
assert.strictEqual(csCourse.name, 'מבוא לתכנות מערכות');
assert.strictEqual(csCourse.credits, 4);
assert.strictEqual(csCourse.isTechnionWide, true);
assert.strictEqual(csCourse.list, 'E');
console.log(`   ✓ CS Course resolved: [${csCourse.code}] ${csCourse.name} (${csCourse.credits} pts, list: ${csCourse.list})`);

const italianCourse = sandbox.DegreePlanner.resolveCourseObject('324630'); // Italian
assert(italianCourse, 'Expected resolveCourseObject(324630) to find Italian');
assert.strictEqual(italianCourse.name, 'איטלקית למתחילים 1');
assert.strictEqual(italianCourse.list, 'MALAG');
assert.strictEqual(italianCourse.type, 'humanities');
console.log(`   ✓ Humanities Course resolved: [${italianCourse.code}] ${italianCourse.name} (${italianCourse.credits} pts, list: ${italianCourse.list})`);

const sportsCourse = sandbox.DegreePlanner.resolveCourseObject('394800'); // Sports
assert(sportsCourse, 'Expected resolveCourseObject(394800) to find Sports');
assert.strictEqual(sportsCourse.list, 'SPORTS');
assert.strictEqual(sportsCourse.type, 'sports');
console.log(`   ✓ Sports Course resolved: [${sportsCourse.code}] ${sportsCourse.name} (${sportsCourse.credits} pts, list: ${sportsCourse.list})\n`);

// 4. Test Course Pool Search
console.log('4. Testing Degree Planner Course Pool Search Behavior:');

// Test 4A: When search query is empty -> NO Technion-wide courses should be present in the pool
sandbox.DegreePlanner.init(true);
sandbox.DegreePlanner.setSearchQuery('');
sandbox.DegreePlanner.renderAddElectivesSection(sandbox.DegreePlanner.getCustomPlan(), {});

const poolContainer = elements['planner-available-electives-list'];
assert(poolContainer.innerHTML.length > 0, 'Pool container should have initial curated electives');
assert(!poolContainer.innerHTML.includes('234124'), 'Empty search must NOT include CS 234124 in pool (avoids cluttering)');
assert(!poolContainer.innerHTML.includes('איטלקית למתחילים 1'), 'Empty search must NOT include Italian in pool');
console.log('   ✓ Empty search query correctly keeps the pool clean and non-overloaded (curated ME electives only).');

// Test 4B: When searching for "מדעי המחשב" -> CS courses appear
sandbox.DegreePlanner.setSearchQuery('מדעי המחשב');
sandbox.DegreePlanner.renderAddElectivesSection(sandbox.DegreePlanner.getCustomPlan(), {});
assert(poolContainer.innerHTML.includes('מבוא למדעי המחשב') || poolContainer.innerHTML.includes('דרכי הוראת מדעי המחשב'), 'Search for "מדעי המחשב" should display CS courses');
assert(poolContainer.innerHTML.includes('tag-technion-wide') || poolContainer.innerHTML.includes('בחירה חופשית'), 'Technion-wide course should have free elective tag');
console.log('   ✓ Query "מדעי המחשב" returned Technion-wide CS courses with proper free elective badges.');

// Test 4C: When searching for "234124"
sandbox.DegreePlanner.setSearchQuery('234124');
sandbox.DegreePlanner.renderAddElectivesSection(sandbox.DegreePlanner.getCustomPlan(), {});
assert(poolContainer.innerHTML.includes('234124'), 'Search for "234124" should display CS 234124');
assert(poolContainer.innerHTML.includes('מבוא לתכנות מערכות'), 'Course name "מבוא לתכנות מערכות" must be visible');
console.log('   ✓ Query "234124" successfully rendered course card with + button and full metadata.');

// 5. Test Adding Technion-wide course to degree plan & graduation rules audit
console.log('\n5. Testing Placement & Degree Rules Evaluation:');
const plan = sandbox.DegreePlanner.getCustomPlan();
assert(Array.isArray(plan) && plan.length >= 8, 'Degree plan must have 8 semesters');

const targetSem = plan.find(s => s.semester === 5);
targetSem.courses.push({
    code: csCourse.code,
    altCode: csCourse.altCode,
    name: csCourse.name,
    credits: csCourse.credits,
    list: csCourse.list,
    isTechnionWide: true
});

const rulesEval = sandbox.DegreePlanner.evaluateDegreeRules(plan);
assert(rulesEval.totalDegreeCredits > 0, 'Total degree credits must be calculated');
assert(rulesEval.totalElectiveCredits >= 4, 'Free elective credits should include the 4.0 pts from CS course');
console.log(`   ✓ Rules evaluated cleanly: Total Credits = ${rulesEval.totalDegreeCredits}, Elective Credits = ${rulesEval.totalElectiveCredits}`);

console.log('\n🎉 ALL TECHNION-WIDE PLANNER SEARCH VERIFICATIONS PASSED SUCCESSFULLY!');
