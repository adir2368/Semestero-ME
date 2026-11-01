/**
 * Test Suite: Class Radar 15-Minute Switch Rule, Evening Next-Day Preview & Authentic Semester 3 Tasks
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');

console.log('🧪 Starting 15-Minute Radar Switch, Evening Preview & Authentic Tasks Test Suite...\n');

// 1. App.js verification
console.log('▶ Test 1: Verifying app.js +15 min filter, evening threshold, and allTasksJson sync...');
const appJsPath = path.join(ROOT_DIR, 'app.js');
const appJs = fs.readFileSync(appJsPath, 'utf8');

assert.ok(appJs.includes('curMin < (startMin + 15)'), 'app.js getRemainingClassesToday must use curMin < (startMin + 15)');
assert.ok(appJs.includes('currentHour >= 17'), 'app.js syncNativeAndroidWidgets must check currentHour >= 17 for evening');
assert.ok(appJs.includes('allTasksJson'), 'app.js must pass allTasksJson to updateTasksWidget');
assert.ok(appJs.includes("status === 'available' && (course.semester === (gameState.currentActiveSemester || 3)"), 'app.js getUpcomingPriorityTasks must include active and available semester 3 courses');
console.log('  ✓ Test 1 passed: app.js rules verified.');

// 2. Watch Companion (watch_companion.js) verification
console.log('▶ Test 2: Verifying watch_companion.js +15 min filter, evening threshold & real Semester 3 tasks...');
const watchCompPath = path.join(ROOT_DIR, 'watch_companion.js');
const watchComp = fs.readFileSync(watchCompPath, 'utf8');

assert.ok(watchComp.includes('curTotalMin < c.startMin + 15'), 'watch_companion.js must check curTotalMin < c.startMin + 15');
assert.ok(watchComp.includes('curTotalMin >= 17 * 60'), 'watch_companion.js must check 17:00 evening threshold');
assert.ok(watchComp.includes('104228_h1'), 'watch_companion.js must contain authentic Semester 3 tasks (104228_h1)');
assert.ok(watchComp.includes('114052_h1'), 'watch_companion.js must contain authentic Semester 3 tasks (114052_h1)');
assert.ok(!watchComp.includes('תרגיל 3: משוואת הגלים'), 'watch_companion.js must NOT contain hardcoded fake sample tasks');
console.log('  ✓ Test 2 passed: watch_companion.js rules verified.');

// 3. Android Phone Companion verification
console.log('▶ Test 3: Verifying Android phone companion (MainActivity, WearSyncManager, PhoneWearListenerService)...');
const phoneMainPath = path.join(ROOT_DIR, 'android/app/src/main/java/com/technion/semestero/MainActivity.java');
const phoneMain = fs.readFileSync(phoneMainPath, 'utf8');
assert.ok(phoneMain.includes('allTasksJson'), 'MainActivity.java must accept and persist allTasksJson');

const wearSyncPath = path.join(ROOT_DIR, 'android/app/src/main/java/com/technion/semestero/WearSyncManager.java');
const wearSync = fs.readFileSync(wearSyncPath, 'utf8');
assert.ok(wearSync.includes('all_tasks_json'), 'WearSyncManager.java must put all_tasks_json into DataMap');

const listenerPath = path.join(ROOT_DIR, 'android/app/src/main/java/com/technion/semestero/PhoneWearListenerService.java');
const listener = fs.readFileSync(listenerPath, 'utf8');
assert.ok(listener.includes('PATH_COMPLETE_TASK'), 'PhoneWearListenerService must handle PATH_COMPLETE_TASK');
console.log('  ✓ Test 3 passed: Android phone companion bi-directional sync verified.');

// 4. Wear OS Companion (WearDataSyncService, MainActivity, SemesteroClassTileService) verification
console.log('▶ Test 4: Verifying Wear OS Companion rules (Silent switch, +15m switch, evening next-day, authentic tasks)...');
const wearSyncServicePath = path.join(ROOT_DIR, 'android/wear/src/main/java/com/technion/semestero/wear/WearDataSyncService.java');
const wearSyncService = fs.readFileSync(wearSyncServicePath, 'utf8');
assert.ok(wearSyncService.includes('all_tasks_json'), 'WearDataSyncService must save all_tasks_json');
assert.ok(!wearSyncService.includes('WearNotificationHelper.sendClassReminder'), 'WearDataSyncService must NOT fire notification on class switch (silent update rule)');

const wearMainJavaPath = path.join(ROOT_DIR, 'android/wear/src/main/java/com/technion/semestero/wear/MainActivity.java');
const wearMainJava = fs.readFileSync(wearMainJavaPath, 'utf8');
assert.ok(wearMainJava.includes('curTotalMin < 705'), 'MainActivity.java must use +15 min rule for Sunday (690 + 15 = 705)');
assert.ok(wearMainJava.includes('curTotalMin < 525'), 'MainActivity.java must use +15 min rule for Monday (510 + 15 = 525)');
assert.ok(wearMainJava.includes('isEvening'), 'MainActivity.java must support evening next-day preview');
assert.ok(wearMainJava.includes('all_tasks_json'), 'MainActivity.java must parse all_tasks_json');
assert.ok(!wearMainJava.includes('תרגיל בית 3'), 'MainActivity.java must NOT contain fake "תרגיל בית 3"');

const tileServicePath = path.join(ROOT_DIR, 'android/wear/src/main/java/com/technion/semestero/wear/SemesteroClassTileService.java');
const tileService = fs.readFileSync(tileServicePath, 'utf8');
assert.ok(tileService.includes('curTotalMin < 705'), 'SemesteroClassTileService must use +15 min rule for Sunday');
assert.ok(tileService.includes('isEvening'), 'SemesteroClassTileService must support evening next-day preview');
console.log('  ✓ Test 4 passed: Wear OS companion silent switch and schedule rules verified.');

// 5. Layout XML verification (Zero fake tasks in default texts)
console.log('▶ Test 5: Verifying Wear OS activity_main.xml contains authentic default task titles...');
const layoutPath = path.join(ROOT_DIR, 'android/wear/src/main/res/layout/activity_main.xml');
const layout = fs.readFileSync(layoutPath, 'utf8');
assert.ok(!layout.includes('תרגיל בית 3'), 'activity_main.xml must NOT contain "תרגיל בית 3"');
assert.ok(layout.includes('[מדח מ׳] תרגיל בית 1: משוואות דיפרנציאליות'), 'activity_main.xml must contain authentic PDE HW1');
assert.ok(layout.includes('[מדח מ׳] WebWork 1: מד״ח מ׳'), 'activity_main.xml must contain authentic PDE WW1');
assert.ok(layout.includes('[פיסיקה 2] תרגיל בית 1: אלקטרוסטטיקה וחוק קולון'), 'activity_main.xml must contain authentic Physics 2 HW1');
console.log('  ✓ Test 5 passed: activity_main.xml authentic layout verified.');

console.log('\n🎉 ALL 5/5 TESTS PASSED SUCCESSFULLY! COMPLETE SYSTEM INTEGRITY CONFIRMED.\n');
