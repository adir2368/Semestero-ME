const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

// Mock minimal browser environment for auth_sync.js
global.window = global;
global.localStorage = {
    _data: {},
    getItem(k) { return Object.prototype.hasOwnProperty.call(this._data, k) ? this._data[k] : null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
};
global.sessionStorage = {
    _data: {},
    getItem(k) { return Object.prototype.hasOwnProperty.call(this._data, k) ? this._data[k] : null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
};

const modalContainer = { innerHTML: '' };
const domElements = {
    'auth-modal-content-container': modalContainer
};
global.document = {
    getElementById(id) { return domElements[id] || null; },
    querySelectorAll() { return []; },
    addEventListener() {}
};
global.alert = () => {};
global.navigator = { userAgent: 'node-vibe-security-test' };
global.window.renderUI = () => {};
global.window.saveState = () => {};
global.window.showToastNotification = () => {};
global.window.setGlobalGameState = (nextState) => { global.window.gameState = nextState; };
global.window.getGlobalGameState = () => global.window.gameState;
global.window.gameState = {
    courses: {},
    currentActiveSemester: 1,
    userProfile: { name: 'Guest' },
    completedCourses: 0
};

require('../preloaded_user_state.js');
require('../auth_sync.js');

const AuthSync = global.window.AuthSync;
assert(AuthSync, 'AuthSync must be attached to window');
assert.strictEqual(typeof AuthSync.escapeAuthHtml, 'function', 'escapeAuthHtml must be exposed on AuthSync');
assert.strictEqual(typeof AuthSync.sanitizeAvatarSymbol, 'function', 'sanitizeAvatarSymbol must be exposed on AuthSync');
assert.strictEqual(typeof AuthSync.sanitizePostgrestLiteral, 'function', 'sanitizePostgrestLiteral must be exposed on AuthSync');
assert.strictEqual(typeof AuthSync.checkAuthRateLimit, 'function', 'checkAuthRateLimit must be exposed on AuthSync');
assert.strictEqual(typeof AuthSync.recordAuthFailure, 'function', 'recordAuthFailure must be exposed on AuthSync');
assert.strictEqual(typeof AuthSync.clearAuthFailures, 'function', 'clearAuthFailures must be exposed on AuthSync');

// Extract validateAndSanitizeImportedRevision and its direct helpers cleanly from app.js into an isolated VM sandbox
const appSource = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const fnStart = appSource.indexOf('function sanitizeImportedCourseText(');
const fnEnd = appSource.indexOf('function setupSettingsPageButtons(', fnStart);
assert(fnStart !== -1 && fnEnd > fnStart, 'Could not locate validateAndSanitizeImportedRevision block in app.js');

const appWindow = {};
const importSandbox = vm.createContext({
    window: appWindow,
    parseInt,
    Number,
    Object,
    Array,
    String,
    Error,
    JSON,
    Math
});
vm.runInContext(appSource.slice(fnStart, fnEnd), importSandbox);
const validateAndSanitizeImportedRevision = appWindow.validateAndSanitizeImportedRevision;
assert.strictEqual(typeof validateAndSanitizeImportedRevision, 'function', 'validateAndSanitizeImportedRevision must be exposed on window');

(async () => {
    console.log('Running Vibe Security Hardening Suite (@softwarebyjoe 15-point checklist)...');

    // #1 Stored XSS Protection
    const escaped = AuthSync.escapeAuthHtml('<script>steal()</script>"\'&');
    assert(!escaped.includes('<script>'), 'escapeAuthHtml must escape <script>');
    assert(escaped.includes('&lt;script&gt;'), 'escapeAuthHtml must HTML-encode < and >');
    assert(escaped.includes('&quot;') && escaped.includes('&#39;') && escaped.includes('&amp;'), 'escapeAuthHtml must encode quotes and ampersand');

    const safeAvatar = AuthSync.sanitizeAvatarSymbol('<svg onload=steal()>');
    assert(!safeAvatar.includes('<') && !safeAvatar.includes('>') && !safeAvatar.includes('svg'), 'sanitizeAvatarSymbol must strip tags/markup');

    // Verify DOM rendering via renderAuthModal escapes untrusted profile fields
    localStorage.clear();
    AuthSync.init();
    await AuthSync.registerStudent({
        name: '<img src=x onerror=steal()>',
        password: 'TestPassword123',
        startingSemester: 2,
        email: 'xss@technion.ac.il'
    });
    // Also attempt quote breakout payload that bypasses simple <> stripping
    await AuthSync.updateUserProfile({
        name: '" onfocus="steal()',
        avatar: '<svg onload=steal()>',
        semester: 2
    });
    AuthSync.renderAuthModal('profile');
    assert(!modalContainer.innerHTML.includes('<svg'), 'Rendered modal HTML must never contain unescaped <svg>');
    assert(!modalContainer.innerHTML.includes('<img src=x onerror=steal()>'), 'Rendered modal HTML must never contain raw <img onerror=...>');
    assert(!modalContainer.innerHTML.includes('value="" onfocus="'), 'Rendered modal HTML must HTML-encode quotes inside value attributes');
    console.log('✓ #1 Stored XSS escaping & avatar sanitization verified');

    // #15 PostgREST Filter & Wildcard Injection Protection
    assert.strictEqual(AuthSync.sanitizePostgrestLiteral('%,user_id.neq.null'), 'user_id.neq.null', 'Must strip %, delimiters used for PostgREST OR-branch breakout');
    assert.strictEqual(AuthSync.sanitizePostgrestLiteral('%%%'), '', 'Must strip wildcard-only LIKE patterns');
    assert.strictEqual(AuthSync.sanitizePostgrestLiteral('student+me_1@campus.technion.ac.il'), 'student+me_1@campus.technion.ac.il', 'Must preserve legitimate email characters');
    console.log('✓ #15 PostgREST filter/wildcard injection protection verified');

    // #11 Brute-Force Rate Limit & Lockout
    localStorage.clear();
    AuthSync.clearAuthFailures();
    assert.strictEqual(AuthSync.checkAuthRateLimit().allowed, true, 'Rate limit must start unlocked');

    for (let i = 0; i < 5; i++) {
        const failed = await AuthSync.loginWithPassword('adir_moshe', 'WrongPassword_' + i);
        assert.strictEqual(failed, false, 'Wrong password attempt must return false');
    }
    const lockedStatus = AuthSync.checkAuthRateLimit();
    assert.strictEqual(lockedStatus.allowed, false, '5 consecutive failed logins must engage lockout');
    assert(lockedStatus.remainingSec >= 14 && lockedStatus.remainingSec <= 16, `Initial 5-failure lockout must be ~15s (got ${lockedStatus.remainingSec}s)`);

    const blockedValidAttempt = await AuthSync.loginWithPassword('adir_moshe', 'BenchyTech1');
    assert.strictEqual(blockedValidAttempt, false, 'Even the valid password must be blocked while lockout is active');

    AuthSync.clearAuthFailures();
    assert.strictEqual(AuthSync.checkAuthRateLimit().allowed, true, 'clearAuthFailures must clear lockout');
    const unlockedValidAttempt = await AuthSync.loginWithPassword('adir_moshe', 'BenchyTech1');
    assert.strictEqual(unlockedValidAttempt, true, 'Valid login must succeed once lockout is cleared');
    console.log('✓ #11 Brute-force rate limit & lockout verified');

    // #6 & #10 Server/Logic Semester Bounds Clamping (1..12)
    localStorage.clear();
    AuthSync.clearAuthFailures();
    AuthSync.init();
    await AuthSync.registerStudent({
        name: 'Bounds Student Low',
        password: 'Password123',
        startingSemester: -3,
        email: 'low@technion.ac.il'
    });
    assert.strictEqual(AuthSync.getActiveUser().startingSemester, 1, 'registerStudent must clamp negative semester (-3) to 1');

    await AuthSync.updateUserProfile({ name: 'Bounds Student Low', semester: 0 });
    assert.strictEqual(AuthSync.getActiveUser().startingSemester, 1, 'updateUserProfile must clamp 0 semester to 1');

    await AuthSync.updateUserProfile({ name: 'Bounds Student High', semester: 99 });
    assert.strictEqual(AuthSync.getActiveUser().startingSemester, 12, 'updateUserProfile must clamp high semester (99) to 12');

    await AuthSync.registerStudent({
        name: 'Bounds Student Max',
        password: 'Password123',
        startingSemester: 99,
        email: 'high@technion.ac.il'
    });
    assert.strictEqual(AuthSync.getActiveUser().startingSemester, 12, 'registerStudent must clamp semester 99 to 12');
    console.log('✓ #6 & #10 Semester bounds validation (1..12) verified');

    // #10 & #12 JSON File Import Validation, Prototype Pollution Guard & Sanitization
    assert.throws(
        () => validateAndSanitizeImportedRevision('{"courses":{}}', { name: 'malicious.svg', size: 120 }),
        /JSON/,
        'Must reject non-.json extension (.svg)'
    );
    assert.throws(
        () => validateAndSanitizeImportedRevision('{"courses":{}}', { name: 'huge.json', size: 6 * 1024 * 1024 }),
        /5MB/,
        'Must reject imports larger than 5MB'
    );
    assert.throws(
        () => validateAndSanitizeImportedRevision('<svg onload=steal()>', { name: 'evil.json', size: 40 }),
        /HTML\/SVG/,
        'Must reject HTML/SVG payload before parsing'
    );

    const pollutedJson = '{"__proto__":{"polluted":"yes"},"constructor":{"evil":1},"currentActiveSemester":99,"courses":{"034001":{"name":"Mechanics <script>steal()</script> onload=bad()","credits":-5,"grade":150},"034002":{"name":"Lab","credits":99,"grade":-10}}}';
    const importedClean = validateAndSanitizeImportedRevision(pollutedJson, { name: 'backup.json', size: pollutedJson.length });
    assert.strictEqual(({}).polluted, undefined, 'Prototype must never be polluted by __proto__ in imported JSON');
    assert(!Object.prototype.hasOwnProperty.call(importedClean, '__proto__'), '__proto__ key must be stripped');
    assert(!Object.prototype.hasOwnProperty.call(importedClean, 'constructor'), 'constructor key must be stripped');
    assert(!Object.prototype.hasOwnProperty.call(importedClean, 'prototype'), 'prototype key must be stripped');
    assert.strictEqual(importedClean.currentActiveSemester, 12, 'Imported currentActiveSemester must clamp to 12');
    assert.strictEqual(importedClean.courses['034001'].credits, 0, 'Negative course credits (-5) must clamp to 0');
    assert.strictEqual(importedClean.courses['034001'].grade, 100, 'Over-limit numeric grade (150) must clamp to 100');
    assert.strictEqual(importedClean.courses['034002'].credits, 30, 'Over-limit course credits (99) must clamp to 30');
    assert.strictEqual(importedClean.courses['034002'].grade, 0, 'Negative numeric grade (-10) must clamp to 0');
    assert(!importedClean.courses['034001'].name.includes('<script>'), '<script> must be stripped from imported course names');
    assert(!/onload\s*=/i.test(importedClean.courses['034001'].name), 'Inline event handler attributes must be stripped from imported course names');
    console.log('✓ #10 & #12 Revision JSON import guard, prototype pollution strip, clamping & XSS strip verified');

    console.log('\n🎉 All Vibe Security Hardening checks passed!');
})().catch(err => {
    console.error('❌ Security hardening test failed:', err);
    process.exit(1);
});
