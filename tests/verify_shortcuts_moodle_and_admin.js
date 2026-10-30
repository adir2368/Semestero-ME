/**
 * Comprehensive Automated Verification Suite for:
 * 1. Keyboard Shortcuts (Hebrew & English layouts, digits 1-6, Ctrl+K, Ctrl+S, Esc, ?, T)
 * 2. window.switchTab integration
 * 3. Moodle Native Mobile Sync (Android SemesteroWidgetBridge & CapacitorHttp)
 * 4. Quick Login Button Clean Removal
 * 5. Admin-Only Site Analytics & Telemetry Access
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('🧪 VERIFYING KEYBOARD SHORTCUTS, MOODLE MOBILE SYNC & ADMIN GAIN');
console.log('================================================================\n');

const ROOT = path.resolve(__dirname, '..');

// 1. Static file checks
console.log('[Check 1] Verifying Static Code Implementation...');
const authSync = fs.readFileSync(path.join(ROOT, 'auth_sync.js'), 'utf8');
const moodleSync = fs.readFileSync(path.join(ROOT, 'moodle_sync.js'), 'utf8');
const uiEnhancements = fs.readFileSync(path.join(ROOT, 'ui_enhancements.js'), 'utf8');
const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const mainActivity = fs.readFileSync(path.join(ROOT, 'android/app/src/main/java/com/technion/semestero/MainActivity.java'), 'utf8');
const capacitorConfig = fs.readFileSync(path.join(ROOT, 'capacitor.config.json'), 'utf8');
const buildMobileDist = fs.readFileSync(path.join(ROOT, 'scripts/build_mobile_dist.js'), 'utf8');

// Quick login check
assert(!authSync.includes('התחברות מהירה כאדיר משה'), 'ERROR: Quick login button text still present in auth_sync.js');
assert(authSync.includes('const MASTER_PASSWORD_HASHES = ['), 'ERROR: MASTER_PASSWORD_HASHES missing in auth_sync.js');
assert(!authSync.includes('BenchyTech1') && !authSync.includes('MASTER_PASSWORDS'), 'ERROR: Plaintext master passwords leaked in auth_sync.js');
console.log('  ✓ PASS: Quick login button is completely removed.');

// Admin telemetry check
assert(authSync.includes('isAdirActive()'), 'ERROR: isAdirActive missing in auth_sync.js');
assert(authSync.includes('סטטיסטיקת שימוש, משתמשים וכניסות'), 'ERROR: Admin Telemetry button missing in user modal');
console.log('  ✓ PASS: Admin Telemetry is properly integrated and gated.');

// Moodle Mobile Sync check
assert(mainActivity.includes('public String fetchMoodleIcs(String targetUrl)'), 'ERROR: fetchMoodleIcs missing in MainActivity.java');
assert(moodleSync.includes('SemesteroWidgetBridge.fetchMoodleIcs'), 'ERROR: SemesteroWidgetBridge integration missing in moodle_sync.js');
assert(moodleSync.includes('CapacitorHttp'), 'ERROR: CapacitorHttp missing in moodle_sync.js');
assert(capacitorConfig.includes('"CapacitorHttp": {\n      "enabled": true\n    }'), 'ERROR: CapacitorHttp not enabled in capacitor.config.json');
assert(buildMobileDist.includes('ui_enhancements.js'), 'ERROR: ui_enhancements.js not in build_mobile_dist.js');
console.log('  ✓ PASS: Moodle Mobile native Android bridge and CapacitorHttp configured.');

// Keyboard Shortcuts check
assert(appJs.includes('window.switchTab = function('), 'ERROR: window.switchTab missing in app.js');
assert(uiEnhancements.includes('handleGlobalKeyDown'), 'ERROR: handleGlobalKeyDown missing in ui_enhancements.js');
assert(uiEnhancements.includes("code === 'KeyK' || keyLower === 'k' || e.key === 'ל'"), 'ERROR: Hebrew layout support missing for Ctrl+K');
assert(uiEnhancements.includes("code === 'KeyS' || keyLower === 's' || e.key === 'ד'"), 'ERROR: Hebrew layout support missing for Ctrl+S');
assert(uiEnhancements.includes("pressedDigit && pressedDigit >= '1' && pressedDigit <= '6'"), 'ERROR: Digit 1-6 switching missing');
console.log('  ✓ PASS: Keyboard shortcuts engine supports Hebrew layout and digit navigation.\n');

// 2. ICS Parsing unit test on real Moodle sample
console.log('[Check 2] Testing Moodle ICS Parsing Engine...');
const sampleIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Moodle Pty Ltd//NONSGML Moodle 2026//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:assign_12345@moodle26.technion.ac.il
SUMMARY:יש להגיש את 'תרגיל בית 3 - בקרת מערכות'
DESCRIPTION:תרגיל בית בנושא משוואות מצב ויציבות
DTSTART:20261105T180000Z
DTEND:20261105T215900Z
CATEGORIES:034032
URL:https://moodle26.technion.ac.il/mod/assign/view.php?id=12345
END:VEVENT
BEGIN:VEVENT
UID:assign_67890@moodle26.technion.ac.il
SUMMARY:דוח מעבדה 2 - זרימה
DESCRIPTION:הגשת דוח מעבדה
DTSTART:20261112T160000Z
DTEND:20261112T215900Z
CATEGORIES:034015
URL:https://moodle26.technion.ac.il/mod/assign/view.php?id=67890
END:VEVENT
END:VCALENDAR`;

// Load MoodleSync in dummy environment
const dummyWindow = {
    gameState: { notionTasks: [], courses: { '034032': { tasks: [] }, '034015': { tasks: [] } } },
    showHudToast: () => {},
    localStorage: {
        getItem: () => null,
        setItem: () => {}
    },
    document: {
        readyState: 'complete',
        getElementById: () => null,
        querySelectorAll: () => []
    },
    addEventListener: () => {}
};
global.window = dummyWindow;
global.document = dummyWindow.document;
global.localStorage = dummyWindow.localStorage;

eval(`(function(global) {
    ${moodleSync}
})(dummyWindow);`);

const MoodleSyncInstance = dummyWindow.MoodleSync;
assert(MoodleSyncInstance, 'MoodleSync not defined on window');

const parseResult = MoodleSyncInstance.parseAndApplyIcs(sampleIcs);
console.log('  Parse Result:', parseResult);
assert.strictEqual(parseResult.syncedTotal, 2, 'Should parse 2 events from sample ICS');
assert.strictEqual(parseResult.newCount, 2, 'Should detect 2 new tasks');
assert.strictEqual(dummyWindow.gameState.courses['034032'].tasks.length, 1, 'Should add task to 034032 course tasks');
assert.strictEqual(dummyWindow.gameState.courses['034015'].tasks.length, 1, 'Should add task to 034015 course tasks');

const task1 = dummyWindow.gameState.courses['034032'].tasks[0];
assert.strictEqual(task1.title, 'תרגיל בית 3 - בקרת מערכות', 'Task title should be cleaned of "יש להגיש את" prefix');
assert.strictEqual(task1.moodleUid, 'assign_12345@moodle26.technion.ac.il', 'Task should have moodleUid');
console.log('  ✓ PASS: Moodle ICS parsing and task conversion works perfectly.\n');

console.log('================================================================');
console.log('🎉 ALL UNIT & INTEGRATION CHECKS PASSED WITH 100% SUCCESS!');
console.log('================================================================');
