const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Mock browser environment
global.window = global;
global.localStorage = {
    _data: {},
    getItem(k) { return this._data[k] !== undefined ? this._data[k] : null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
};
global.sessionStorage = {
    _data: {},
    getItem(k) { return this._data[k] !== undefined ? this._data[k] : null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
};
global.document = {
    getElementById(id) { return null; },
    querySelectorAll(s) { return []; }
};

// Load preloaded_user_state.js
require('../preloaded_user_state.js');

// Verify window.PRELOADED_USER_STATE loaded
assert(global.window.PRELOADED_USER_STATE, 'PRELOADED_USER_STATE must be attached to window');
assert.strictEqual(Math.round(global.window.PRELOADED_USER_STATE.gpa), 86, 'PRELOADED GPA should be ~86');

// Load auth_sync.js
require('../auth_sync.js');
const AuthSync = global.window.AuthSync;
assert(AuthSync, 'AuthSync must be attached to window');

console.log('Testing AuthSync Session Persistence & Shield...');

// Test 1: Refresh when logged in as adir_moshe MUST preserve session and developer flags
localStorage.clear();
localStorage.setItem('ast_logged_in_user', 'adir_moshe');
AuthSync.init();

assert.strictEqual(localStorage.getItem('ast_logged_in_user'), 'adir_moshe', 'Session must remain adir_moshe on refresh');
assert.strictEqual(localStorage.getItem('ast_is_developer_device'), 'true', 'ast_is_developer_device must be true');
assert.strictEqual(localStorage.getItem('ast_profile_adir_moshe'), 'true', 'ast_profile_adir_moshe must be true');
assert.strictEqual(AuthSync.isLoggedIn(), true, 'isLoggedIn() must be true');
assert.strictEqual(AuthSync.isAdirActive(), true, 'isAdirActive() must be true');
console.log('✓ Test 1 Passed: adir_moshe session preserved on refresh without demotion');

// Test 2: Clean visitor starts as guest and is NOT adir_moshe
localStorage.clear();
AuthSync.init();
assert.strictEqual(localStorage.getItem('ast_logged_in_user'), 'guest', 'Clean visitor must be guest');
assert.strictEqual(AuthSync.isLoggedIn(), false, 'Guest is not logged in');
assert.strictEqual(AuthSync.isAdirActive(), false, 'Guest is not Adir');
console.log('✓ Test 2 Passed: Clean visitor defaults to guest safely');

// Test 3: Guest state purge NEVER deletes LEGACY_SAVE_KEY (academic_skill_tree_save)
localStorage.clear();
localStorage.setItem('ast_logged_in_user', 'guest');
localStorage.setItem('academic_skill_tree_save', JSON.stringify({ gpa: 86.04, courses: { '104041': { grade: 84 } } }));
localStorage.setItem('ast_user_state_guest', JSON.stringify({ characterClass: 'סטודנט למדעי המחשב', completedCourses: 12, gpa: 90 }));

const guestLoaded = AuthSync.loadActiveUserState();
assert.strictEqual(localStorage.getItem('academic_skill_tree_save') !== null, true, 'LEGACY_SAVE_KEY must NOT be removed by guest purge');
assert.strictEqual(localStorage.getItem('ast_user_state_guest'), null, 'Contaminated guest key must be removed');
console.log('✓ Test 3 Passed: LEGACY_SAVE_KEY protected from guest contamination purge');

// Test 4: loginWithPassword identifier supports adir.m.2368@gmail.com
localStorage.clear();
AuthSync.loginWithPassword('adir.m.2368@gmail.com', 'BenchyTech1');
assert.strictEqual(localStorage.getItem('ast_logged_in_user'), 'adir_moshe', 'Must log in as adir_moshe with adir.m.2368@gmail.com');
assert.strictEqual(AuthSync.isAdirActive(), true, 'Must be active Adir');
assert.strictEqual(localStorage.getItem('ast_is_developer_device'), 'true', 'Must set developer device flag');
console.log('✓ Test 4 Passed: adir.m.2368@gmail.com recognized as Adir developer identifier');

// Test 5: syncToCloud blocks corrupted GPA 0 state for Adir
let syncAttemptedWithZero = false;
let healedStateSaved = false;
const originalSave = AuthSync.saveActiveUserState;
AuthSync.saveActiveUserState = function(s) {
    if (s.gpa > 80) healedStateSaved = true;
};
AuthSync.syncToCloud({ gpa: 0, courses: {} });
assert.strictEqual(healedStateSaved, true, 'Corrupted state must trigger auto-heal before syncing');
console.log('✓ Test 5 Passed: syncToCloud blocks GPA 0 and auto-heals Adir');

console.log('\n🎉 ALL 5 AUTH & PERSISTENCE TESTS PASSED FLAWLESSLY!');
