// Test script to verify clean state isolation for guests and new users
const fs = require('fs');
const path = require('path');

// Mock localStorage
const storage = {};
global.localStorage = {
    getItem: (k) => storage[k] || null,
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: (k) => { delete storage[k]; },
    clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};
global.document = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
};
global.window = global;

// Load modules
const currTemplateCode = fs.readFileSync(path.join(__dirname, '../../curriculum_template.js'), 'utf8');
eval(currTemplateCode);

const authSyncCode = fs.readFileSync(path.join(__dirname, '../../auth_sync.js'), 'utf8');
eval(authSyncCode);

// Test 1: Clean visitor initialization
global.AuthSync.init();
const user = global.AuthSync.getActiveUser();
console.log('Test 1 - Active User:', user);
console.assert(user.role === 'guest', 'User should be guest');
console.assert(user.id === 'guest', 'User id should be guest');

const guestState = global.AuthSync.loadActiveUserState();
console.log('Test 1 - Guest State completedCourses:', guestState.completedCourses);
console.log('Test 1 - Guest State credits:', guestState.credits);
console.log('Test 1 - Guest State gpa:', guestState.gpa);
console.log('Test 1 - Guest State characterClass:', guestState.characterClass);

console.assert(guestState.completedCourses === 0, 'Guest completedCourses must be 0');
console.assert(guestState.credits === 0, 'Guest credits must be 0');
console.assert(guestState.gpa === 0, 'Guest gpa must be 0');
console.assert(!guestState.characterClass.includes('מדעי המחשב'), 'Guest characterClass must not be CS');

const courseKeys = Object.keys(guestState.courses);
const anyGrade = courseKeys.some(k => guestState.courses[k].grade !== null);
console.assert(!anyGrade, 'No course should have a preloaded grade in clean guest state');

// Test 2: Contaminated storage self-healing
storage['ast_user_state_guest'] = JSON.stringify({
    characterClass: 'סטודנט למדעי המחשב',
    completedCourses: 11,
    gpa: 86.04,
    credits: 38.5,
    courses: { '104041': { code: '104041', grade: 84, status: 'mastered' } }
});
const healedState = global.AuthSync.loadActiveUserState();
console.log('Test 2 - Healed State completedCourses:', healedState.completedCourses);
console.log('Test 2 - Healed State gpa:', healedState.gpa);
console.assert(healedState.completedCourses === 0, 'Contaminated guest state must be purged to 0 completed courses');
console.assert(healedState.gpa === 0, 'Contaminated guest state must be purged to 0 GPA');
console.assert(storage['ast_user_state_guest'] === undefined, 'Contaminated key should be removed');

console.log('\n>>> ALL CLEAN STATE ISOLATION TESTS PASSED SUCCESSFULLY! <<<');
