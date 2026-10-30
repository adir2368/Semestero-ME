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

(async () => {
    console.log('Testing AuthSync Session Persistence, Zero-Default Guest & Cryptographic Proof Shield...');

    // Test 1a: Unverified ast_logged_in_user = 'adir_moshe' (legacy APK auto-login) MUST be evicted to 'guest'
    localStorage.clear();
    localStorage.setItem('ast_logged_in_user', 'adir_moshe');
    localStorage.setItem('ast_is_developer_device', 'true');
    AuthSync.init();

    assert.strictEqual(localStorage.getItem('ast_logged_in_user'), 'guest', 'Unverified adir_moshe session must be evicted to guest');
    assert.strictEqual(localStorage.getItem('ast_is_developer_device'), null, 'Unverified developer flag must be stripped');
    assert.strictEqual(AuthSync.isLoggedIn(), false, 'Unverified user must not be logged in');
    assert.strictEqual(AuthSync.isAdirActive(), false, 'Unverified user must not be Adir');
    console.log('✓ Test 1a Passed: Unverified adir_moshe session retroactively evicted to guest');

    // Test 1b: Password-verified adir_moshe session MUST persist across refresh (AuthSync.init())
    localStorage.clear();
    const loginOk = await AuthSync.loginWithPassword('adir_moshe', 'BenchyTech1');
    assert.strictEqual(loginOk, true, 'Password login for adir_moshe must succeed');
    assert(localStorage.getItem('ast_auth_verified_v3'), 'Cryptographic session proof must be issued');

    AuthSync.init(); // Simulate page refresh
    assert.strictEqual(localStorage.getItem('ast_logged_in_user'), 'adir_moshe', 'Verified session must remain adir_moshe on refresh');
    assert.strictEqual(localStorage.getItem('ast_is_developer_device'), 'true', 'ast_is_developer_device must remain true');
    assert.strictEqual(AuthSync.isLoggedIn(), true, 'isLoggedIn() must be true');
    assert.strictEqual(AuthSync.isAdirActive(), true, 'isAdirActive() must be true');
    console.log('✓ Test 1b Passed: Verified adir_moshe session preserved on refresh without demotion');

    // Test 2: Clean visitor starts as guest and is NOT adir_moshe
    localStorage.clear();
    AuthSync.init();
    assert.strictEqual(localStorage.getItem('ast_logged_in_user'), 'guest', 'Clean visitor must be guest');
    assert.strictEqual(AuthSync.isLoggedIn(), false, 'Guest is not logged in');
    assert.strictEqual(AuthSync.isAdirActive(), false, 'Guest is not Adir');
    console.log('✓ Test 2 Passed: Clean visitor defaults to guest safely');

    // Test 3: Guest state load returns clean empty state and removes contaminated ast_user_state_guest
    localStorage.clear();
    AuthSync.init();
    localStorage.setItem('ast_user_state_guest', JSON.stringify({ characterClass: 'סטודנט למדעי המחשב', completedCourses: 12, gpa: 90 }));

    const guestLoaded = AuthSync.loadActiveUserState();
    assert.strictEqual(guestLoaded, null, 'Contaminated guest load must return null so clean curriculum loads');
    assert.strictEqual(localStorage.getItem('ast_user_state_guest'), null, 'Contaminated guest key must be removed');
    console.log('✓ Test 3 Passed: Guest contamination purged cleanly');

    // Test 4: loginWithPassword identifier supports adir.m.2368@gmail.com
    localStorage.clear();
    const emailLoginOk = await AuthSync.loginWithPassword('adir.m.2368@gmail.com', 'BenchyTech1');
    assert.strictEqual(emailLoginOk, true, 'Email login must succeed');
    assert.strictEqual(localStorage.getItem('ast_logged_in_user'), 'adir_moshe', 'Must log in as adir_moshe with adir.m.2368@gmail.com');
    assert.strictEqual(AuthSync.isAdirActive(), true, 'Must be active Adir');
    assert.strictEqual(localStorage.getItem('ast_is_developer_device'), 'true', 'Must set developer device flag');
    console.log('✓ Test 4 Passed: adir.m.2368@gmail.com recognized as Adir developer identifier');

    // Test 5: syncToCloud blocks corrupted GPA 0 state for Adir
    let healedStateSaved = false;
    AuthSync.saveActiveUserState = function(s) {
        if (s.gpa > 80) healedStateSaved = true;
    };
    await AuthSync.syncToCloud({ gpa: 0, courses: {} });
    assert.strictEqual(healedStateSaved, true, 'Corrupted state must trigger auto-heal before syncing');
    console.log('✓ Test 5 Passed: syncToCloud blocks GPA 0 and auto-heals Adir');

    console.log('\n🎉 ALL AUTH & PERSISTENCE TESTS PASSED FLAWLESSLY!');
})().catch(err => {
    console.error(err);
    process.exit(1);
});
