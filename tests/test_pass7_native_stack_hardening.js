/**
 * Pass 7: Native Stack & Cross-Platform Hardening Test Suite
 * Verifies P7-1 through P7-13 fixes across Android Phone, Galaxy Watch 8, Electron, iOS, and Bundles.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
let passed = 0;

function test(name, fn) {
    fn();
    passed++;
    console.log(`  ✅ PASS: ${name}`);
}

console.log('🛡️ Running Pass 7 Native Stack Hardening Suite...\n');

const phoneMain = fs.readFileSync(path.join(ROOT, 'android/app/src/main/java/com/technion/semestero/MainActivity.java'), 'utf8');
const wearMain = fs.readFileSync(path.join(ROOT, 'android/wear/src/main/java/com/technion/semestero/wear/MainActivity.java'), 'utf8');
const wearManifest = fs.readFileSync(path.join(ROOT, 'android/wear/src/main/AndroidManifest.xml'), 'utf8');
const wearHelper = fs.readFileSync(path.join(ROOT, 'android/wear/src/main/java/com/technion/semestero/wear/WearScheduleHelper.java'), 'utf8');
const wearComp = fs.readFileSync(path.join(ROOT, 'android/wear/src/main/java/com/technion/semestero/wear/SemesteroComplicationService.java'), 'utf8');
const wearTasksComp = fs.readFileSync(path.join(ROOT, 'android/wear/src/main/java/com/technion/semestero/wear/SemesteroTasksComplicationService.java'), 'utf8');
const wearAdapter = fs.readFileSync(path.join(ROOT, 'android/wear/src/main/java/com/technion/semestero/wear/WearCarouselAdapter.java'), 'utf8');
const wearSyncMgr = fs.readFileSync(path.join(ROOT, 'android/app/src/main/java/com/technion/semestero/WearSyncManager.java'), 'utf8');
const finalsWidget = fs.readFileSync(path.join(ROOT, 'android/app/src/main/java/com/technion/semestero/SemesteroFinalsGpaWidget.java'), 'utf8');
const pomodoroWidget = fs.readFileSync(path.join(ROOT, 'android/app/src/main/java/com/technion/semestero/SemesteroPomodoroWidget.java'), 'utf8');
const nextClassWidget = fs.readFileSync(path.join(ROOT, 'android/app/src/main/java/com/technion/semestero/SemesteroNextClassWidget.java'), 'utf8');
const tasksWidget = fs.readFileSync(path.join(ROOT, 'android/app/src/main/java/com/technion/semestero/SemesteroTasksExamWidget.java'), 'utf8');
const electronMain = fs.readFileSync(path.join(ROOT, 'main.js'), 'utf8');
const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const swJs = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const buildMobile = fs.readFileSync(path.join(ROOT, 'scripts/build_mobile_dist.js'), 'utf8');
const pbxproj = fs.readFileSync(path.join(ROOT, 'ios/App/App.xcodeproj/project.pbxproj'), 'utf8');
const watchJs = fs.readFileSync(path.join(ROOT, 'watch_companion.js'), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

test('P7-1: Phone MainActivity escapes taskId with JSONObject.quote and enforces Moodle/scheme allowlists', () => {
    assert(phoneMain.includes('org.json.JSONObject.quote('), 'Missing JSONObject.quote in triggerTasksSyncFromWear');
    assert(phoneMain.includes('isAllowedExternalUrl('), 'Missing isAllowedExternalUrl helper');
    assert(phoneMain.includes('moodle\\\\d*\\\\.technion\\\\.ac\\\\.il/calendar/export_execute\\\\.php'), 'Missing Technion Moodle allowlist in fetchMoodleIcs');
    assert(!phoneMain.includes('SemesteroME-Android/2.8.8'), 'Stale Android User-Agent found');
});

test('P7-2: Watch Complication parses 1-digit hours safely without substring(0, 5)', () => {
    assert(!wearComp.includes('trimmed.substring(0, 5)'), 'Unsafe substring(0, 5) still present');
    assert(wearComp.includes('Pattern.compile("^(\\\\d{1,2}:\\\\d{2})")'), 'Missing regex Matcher hour extraction');
});

test('P7-3: Widget deep-links avoid broken runway/flowchart targets and consume handled extras', () => {
    assert(!finalsWidget.includes('"runway"'), 'FinalsGpaWidget still targets runway');
    assert(!pomodoroWidget.includes('"runway"'), 'PomodoroWidget still targets runway');
    assert(phoneMain.includes('intent.removeExtra("target_tab")'), 'MainActivity must consume widget intent extras');
    assert(phoneMain.includes('webViewConfigured'), 'configureWebView must be guarded against duplicate listener/bridge registration');
    assert(appJs.includes("activeTabId === 'runway'") && appJs.includes("activeTabId === 'flowchart'"), 'setActiveMainTab must normalize legacy aliases');
});

test('P7-4: build_mobile_dist.js and sw.js include watch_companion.js and widgets assets', () => {
    assert(buildMobile.includes("'watch_companion.js'"), 'build_mobile_dist.js missing watch_companion.js');
    assert(buildMobile.includes('widgetsSrcDir'), 'build_mobile_dist.js missing widgets JSON copy');
    assert(swJs.includes("'./watch_companion.js'"), 'sw.js missing ./watch_companion.js');
    assert(swJs.includes("'./widgets.html'"), 'sw.js missing ./widgets.html');
});

test('P7-5: iOS Xcode project version synced beyond legacy 1.0 / 1', () => {
    assert(!pbxproj.includes('CURRENT_PROJECT_VERSION = 1;'), 'Stale iOS CURRENT_PROJECT_VERSION = 1');
    assert(!pbxproj.includes('MARKETING_VERSION = 1.0;'), 'Stale iOS MARKETING_VERSION = 1.0');
});

test('P7-6: WearScheduleHelper preserves empty synced weekdays and dynamically resolves weekend/tomorrow', () => {
    assert(wearHelper.includes('hasAnySyncedClassAcrossWeek'), 'Missing week-wide synced check');
    assert(!wearHelper.includes('השיעור הבא ביום ראשון ב-11:30 (אולמן 506)'), 'Hardcoded weekend lecture string still present');
    assert(wearHelper.includes('pickFirstPreferredSlot'), 'Missing ditched-aware slot selector');
});

test('P7-7: Electron main.js restricts new windows and guards will-navigate', () => {
    assert(electronMain.includes("on('will-navigate'"), 'Missing will-navigate guard');
    assert(!electronMain.includes("else {\n        return { action: 'allow' };"), 'Default allow fallback still present');
    assert(electronMain.includes("return { action: 'deny' };"), 'Missing deny fallback');
});

test('P7-8: Guest GPA defaults neutralized and clearWidgetData pushes to Watch', () => {
    assert(!wearSyncMgr.includes('"86.04"'), 'Hardcoded personal GPA in WearSyncManager');
    assert(!wearAdapter.includes('"86.04"'), 'Hardcoded personal GPA in WearCarouselAdapter');
    assert(!wearMain.includes('"86.04"'), 'Hardcoded personal GPA in Wear MainActivity');
    assert(phoneMain.includes('refreshAllWidgets();\n            WearSyncManager.syncAllToWatch(context);') || phoneMain.includes('refreshAllWidgets();\r\n            WearSyncManager.syncAllToWatch(context);'), 'clearWidgetData must sync cleared state to Watch');
});

test('P7-9: SemesteroTasksComplicationService deduplicates and skips corrupted titles like Tile', () => {
    assert(wearTasksComp.includes('MainActivity.buildTaskDedupKey'), 'Tasks complication missing buildTaskDedupKey');
    assert(wearTasksComp.includes('MainActivity.isCorruptedText'), 'Tasks complication missing isCorruptedText check');
});

test('P7-10: Android widgets clamp class_index and push two-way task toggles', () => {
    assert(nextClassWidget.includes('Math.max(0, Math.min('), 'NextClassWidget missing currentIndex clamping');
    assert(tasksWidget.includes('WearSyncManager.syncAllToWatch(context)') && tasksWidget.includes('MainActivity.triggerTasksSyncFromWear'), 'TasksExamWidget must push task toggles to WebView and Watch');
});

test('P7-11: Wear weekend day switcher navigates to Sunday cleanly', () => {
    assert(wearMain.includes('inspectedDayOfWeek == -1 && todayDow > Calendar.THURSDAY'), 'Missing weekend Sunday navigation guard');
});

test('P7-12 & Hard-Ban: watch_companion.js guards querySelectorAll and Watch 8 avoids nosensor', () => {
    assert(watchJs.includes("typeof tasksList.querySelectorAll === 'function'"), 'Missing querySelectorAll function guard');
    assert(!wearManifest.includes('android:screenOrientation="nosensor"'), 'Wear Manifest must NOT contain nosensor');
    assert(!wearMain.includes('SCREEN_ORIENTATION_NOSENSOR'), 'Wear MainActivity must NOT contain SCREEN_ORIENTATION_NOSENSOR');
    assert(!wearMain.includes('uiautomator') && !phoneMain.includes('uiautomator'), 'No uiautomator usage allowed');
});

test('P7-14 (v3.2.1): Wear Physics 2 Mon/Wed schedule, GPA/hours self-heal & app.js 6-arg widget fallback', () => {
    assert(wearHelper.includes('טאוב - מדמ\\"ח 1') && wearHelper.includes('פיזיקה 1') && wearHelper.includes('שרמן - חינוך למדע וטכנולוגיה 107'),
        'WearScheduleHelper must include Monday & Wednesday Physics 2 sessions');
    assert(wearMain.includes('הצטיינות דיקן') && wearMain.includes('ש״ס השבוע'),
        'Wear MainActivity must self-heal mojibake gpa_badge and missing sched_total_hours when synced');
    assert(!appJs.includes('isSlotPerpetuallyDitched'), 'app.js must call isCoursePerpetualDitch, not undefined isSlotPerpetuallyDitched');
    assert(appJs.includes('catch (_schedBridgeErr)'), 'app.js must fall back to 6-arg updateScheduleWidget for older phone APKs');
});

console.log(`\n🎉 ALL ${passed}/13 PASS 7 NATIVE HARDENING CHECKS PASSED (version=${pkg.version})!`);
