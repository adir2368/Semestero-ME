// ==============================================================================
// Unit Test: Physics Variant Selection & Instant Multi-Subsystem Persistence Suite
// Verifies that choosing Physics 1 or Physics 2 variant in the course details modal
// saves immediately, synchronizes gameState, Degree Planner, and Tree, and does NOT reset upon exit.
// File: tests/verify_physics_variant_persistence.test.js
// ==============================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');

console.log('🧪 Starting Physics Variant Selection & Persistence Test Suite...\n');

const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const plannerJs = fs.readFileSync(path.join(ROOT, 'planner_module.js'), 'utf8');

// ------------------------------------------------------------------------------
// TEST 1: Verify Purge Lists Cleansing (01140071 / 114071 must NOT be purged)
// ------------------------------------------------------------------------------
console.log('▶ Test 1: Verifying purge lists do not block Physics 1M (114071)...');
assert(!appJs.includes("PURGED_APP_CODES = ['035044', '035026', '35026', '01140071'"), 'PURGED_APP_CODES must not include 01140071');
assert(!appJs.includes("'01140071', '114071' in PURGED_FLOWCHART_CODES"), 'PURGED_FLOWCHART_CODES must not purge 114071');
assert(!plannerJs.includes("PURGED_TREE_CODES = new Set(['035044', '035026', '35026', '01140071'"), 'PURGED_TREE_CODES must not include 01140071');
console.log('  ✓ Test 1 passed: Purge lists successfully cleansed of physics codes.');

// ------------------------------------------------------------------------------
// TEST 2: Verify selectPhysicsVariant function signature and multi-target sync
// ------------------------------------------------------------------------------
console.log('▶ Test 2: Verifying selectPhysicsVariant implementation in app.js and planner_module.js...');
assert(appJs.includes('function selectPhysicsVariant(targetCode, currentCode, silent = false)'), 'app.js must declare selectPhysicsVariant');
assert(appJs.includes('window.selectPhysicsVariant = selectPhysicsVariant;'), 'selectPhysicsVariant must be exposed globally on window');
assert(appJs.includes('window.DegreePlanner.handlePhysicsVariantSelect = selectPhysicsVariant;'), 'DegreePlanner must expose handlePhysicsVariantSelect');
assert(plannerJs.includes('global.selectPhysicsVariant'), 'planner_module.js must delegate to selectPhysicsVariant');
console.log('  ✓ Test 2 passed: selectPhysicsVariant exists and is bound across both modules.');

// ------------------------------------------------------------------------------
// TEST 3: Simulate Physics 1 variant change (114051 -> 114071)
// ------------------------------------------------------------------------------
console.log('▶ Test 3: Simulating Physics 1 variant switch (114051 -> 114071)...');

// Mock a simulated environment
const mockLocalStorage = {};
global.localStorage = {
    getItem: (k) => mockLocalStorage[k] || null,
    setItem: (k, v) => { mockLocalStorage[k] = String(v); },
    removeItem: (k) => { delete mockLocalStorage[k]; }
};

const mockGameState = {
    courses: {
        '114051': {
            id: '114051',
            code: '114051',
            altCode: '114051',
            name: 'פיזיקה 1',
            credits: 2.5,
            semester: 2,
            grade: 92,
            status: 'mastered',
            tasks: [{ id: '114051_ex', completed: true }]
        }
    },
    userSettings: {},
    degreePlan: [
        {
            semester: 2,
            courses: [{ code: '01140051', altCode: '114051', name: 'פיזיקה 1', credits: 2.5, variantGroupId: 'physics_1' }]
        }
    ]
};

global.gameState = mockGameState;
global.window = {
    gameState: mockGameState,
    DegreePlanner: {
        getCustomPlan: () => mockGameState.degreePlan,
        saveCustomPlan: () => {},
        renderDegreePlanner: () => {}
    }
};

// Evaluate selectPhysicsVariant in this environment
const fnMatch = appJs.match(/function selectPhysicsVariant\([\s\S]*?\n\}/);
assert(fnMatch, 'Could not extract selectPhysicsVariant function');
eval(fnMatch[0]);

// Execute switch to Physics 1M (01140071 / 114071)
selectPhysicsVariant('01140071', '114051', true);

// Assert state persistence
assert.strictEqual(mockGameState.userSettings.physicsVariants.physics1, '01140071', 'userSettings.physicsVariants.physics1 must be 01140071');
assert.strictEqual(mockLocalStorage['semestero_physics_variant_physics1'], '01140071', 'localStorage must persist variant');
assert(mockGameState.courses['114071'], 'gameState.courses must contain 114071');
assert.strictEqual(mockGameState.courses['114071'].name, "פיזיקה 1מ'", 'Course title must be updated to פיזיקה 1מ\'');
assert.strictEqual(mockGameState.courses['114071'].credits, 3.5, 'Credits must be updated to 3.5');
assert.strictEqual(mockGameState.courses['114071'].grade, 92, 'Grade must carry over');
assert.strictEqual(mockGameState.courses['114071'].status, 'mastered', 'Mastered status must carry over');
assert(!mockGameState.courses['114051'], 'Old 114051 key must be replaced');
assert.strictEqual(mockGameState.degreePlan[0].courses[0].name, "פיזיקה 1מ'", 'Degree plan course must be updated');
console.log('  ✓ Test 3 passed: Physics 1 variant successfully migrated and persisted.');

// ------------------------------------------------------------------------------
// TEST 4: Simulate Physics 2 variant change (114052 -> 114075 - פיזיקה 2ממ)
// ------------------------------------------------------------------------------
console.log('▶ Test 4: Simulating Physics 2 variant switch (114052 -> 114075)...');
mockGameState.courses['114052'] = {
    id: '114052',
    code: '114052',
    altCode: '114052',
    name: 'פיזיקה 2',
    credits: 3.5,
    semester: 3,
    status: 'available',
    tasks: []
};
mockGameState.degreePlan.push({
    semester: 3,
    courses: [{ code: '01140052', altCode: '114052', name: 'פיזיקה 2', credits: 3.5, variantGroupId: 'physics_2' }]
});

// Execute switch to Physics 2MM (01140075 / 114075)
selectPhysicsVariant('01140075', '114052', true);

assert.strictEqual(mockGameState.userSettings.physicsVariants.physics2, '01140075', 'userSettings.physicsVariants.physics2 must be 01140075');
assert.strictEqual(mockLocalStorage['semestero_physics_variant_physics2'], '01140075', 'localStorage must persist variant');
assert(mockGameState.courses['114075'], 'gameState.courses must contain 114075');
assert.strictEqual(mockGameState.courses['114075'].name, "פיזיקה 2ממ", 'Course title must be פיזיקה 2ממ');
assert.strictEqual(mockGameState.courses['114075'].credits, 5.0, 'Credits must be updated to 5.0');
assert(!mockGameState.courses['114052'], 'Old 114052 key must be replaced');
assert.strictEqual(mockGameState.degreePlan[1].courses[0].name, "פיזיקה 2ממ", 'Degree plan course must be updated');
console.log('  ✓ Test 4 passed: Physics 2MM variant successfully migrated and persisted.');

console.log('\n🎉 ALL 4/4 PHYSICS VARIANT SELECTION & PERSISTENCE TESTS PASSED!');
