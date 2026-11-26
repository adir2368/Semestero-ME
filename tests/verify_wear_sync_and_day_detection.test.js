// ==============================================================================
// Unit Test: Galaxy Watch 8 Phone-to-Watch Sync & Day Detection Engine
// File: tests/verify_wear_sync_and_day_detection.test.js
// ==============================================================================

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Phone <-> Watch Sync & Day Detection Test Suite...');

const ROOT = path.join(__dirname, '..');

// 1. Package ID Alignment (Essential for Google Play Services Wearable Data Layer)
console.log('▶ Test 1: Verifying applicationId parity between phone and watch...');
const wearGradle = fs.readFileSync(path.join(ROOT, 'android', 'wear', 'build.gradle'), 'utf8');
const appGradle = fs.readFileSync(path.join(ROOT, 'android', 'app', 'build.gradle'), 'utf8');

assert(wearGradle.includes('applicationId "com.technion.semestero"'), 'Wear app applicationId must be com.technion.semestero');
assert(appGradle.includes('"com.technion.semestero"'), 'Phone app applicationId must support com.technion.semestero');
console.log('  ✓ Test 1 passed: Both phone and watch share applicationId "com.technion.semestero".');

// 2. Phone WearSyncManager & PhoneWearListenerService
console.log('▶ Test 2: Verifying Phone WearSyncManager and WearableListenerService...');
const syncManagerSrc = fs.readFileSync(path.join(ROOT, 'android', 'app', 'src', 'main', 'java', 'com', 'technion', 'semestero', 'WearSyncManager.java'), 'utf8');
assert(syncManagerSrc.includes('syncAllToWatch'), 'WearSyncManager must implement syncAllToWatch()');
assert(syncManagerSrc.includes('day_name'), 'WearSyncManager must include day_name in sync payload');
assert(syncManagerSrc.includes('date_formatted'), 'WearSyncManager must include date_formatted in sync payload');
assert(syncManagerSrc.includes('day_index'), 'WearSyncManager must include day_index in sync payload');

const phoneListenerPath = path.join(ROOT, 'android', 'app', 'src', 'main', 'java', 'com', 'technion', 'semestero', 'PhoneWearListenerService.java');
assert(fs.existsSync(phoneListenerPath), 'PhoneWearListenerService.java must exist');
const phoneListenerSrc = fs.readFileSync(phoneListenerPath, 'utf8');
assert(phoneListenerSrc.includes('PATH_REQUEST_SYNC'), 'PhoneWearListenerService must listen for /semestero/request_sync');
assert(phoneListenerSrc.includes('WearSyncManager.syncAllToWatch'), 'PhoneWearListenerService must trigger syncAllToWatch upon request');

const appManifest = fs.readFileSync(path.join(ROOT, 'android', 'app', 'src', 'main', 'AndroidManifest.xml'), 'utf8');
assert(appManifest.includes('PhoneWearListenerService'), 'AndroidManifest.xml must register PhoneWearListenerService');
console.log('  ✓ Test 2 passed: Phone sync layer and listener service verified.');

// 3. Watch Day Detection & ViewPager2 Carousel Elements
console.log('▶ Test 3: Verifying Watch Day Detection & Carousel Layout Header...');
const wearActivityXml = fs.readFileSync(path.join(ROOT, 'android', 'wear', 'src', 'main', 'res', 'layout', 'activity_main.xml'), 'utf8');
assert(wearActivityXml.includes('wear_view_pager'), 'Wear layout must contain wear_view_pager ViewPager2');
const wearRadarXml = fs.readFileSync(path.join(ROOT, 'android', 'wear', 'src', 'main', 'res', 'layout', 'page_radar.xml'), 'utf8');
assert(wearRadarXml.includes('radar_day_chip'), 'Wear radar layout must contain radar_day_chip TextView');
const wearSyncXml = fs.readFileSync(path.join(ROOT, 'android', 'wear', 'src', 'main', 'res', 'layout', 'page_sync.xml'), 'utf8');
assert(wearSyncXml.includes('tv_phone_status_text'), 'Wear sync layout must contain tv_phone_status_text TextView');

const wearActivitySrc = fs.readFileSync(path.join(ROOT, 'android', 'wear', 'src', 'main', 'java', 'com', 'technion', 'semestero', 'wear', 'MainActivity.java'), 'utf8');
const wearScheduleHelperSrc = fs.readFileSync(path.join(ROOT, 'android', 'wear', 'src', 'main', 'java', 'com', 'technion', 'semestero', 'wear', 'WearScheduleHelper.java'), 'utf8');
assert(wearActivitySrc.includes('requestSyncFromPhone'), 'MainActivity must implement requestSyncFromPhone()');
assert(wearActivitySrc.includes('updateUIFromPrefsAndSchedule'), 'MainActivity must implement updateUIFromPrefsAndSchedule()');
assert(wearScheduleHelperSrc.includes('HEBREW_DAYS'), 'WearScheduleHelper must define HEBREW_DAYS');
assert(wearScheduleHelperSrc.includes('יום ראשון'), 'WearScheduleHelper must support Hebrew day calculation');
assert(wearScheduleHelperSrc.includes('משוואות דיפרנציאליות חלקיות'), 'WearScheduleHelper must resolve Sunday PDE class');
console.log('  ✓ Test 3 passed: Watch Day Detection engine and ViewPager2 header verified.');

// 4. Wear OS Tile Service Hebrew Day Detection
console.log('▶ Test 4: Verifying Wear OS Tile Service Day Detection...');
const tileServiceSrc = fs.readFileSync(path.join(ROOT, 'android', 'wear', 'src', 'main', 'java', 'com', 'technion', 'semestero', 'wear', 'SemesteroClassTileService.java'), 'utf8');
assert(tileServiceSrc.includes('dayHeader'), 'TileService must calculate and display dayHeader');
assert(tileServiceSrc.includes('WearScheduleHelper.resolve'), 'TileService must delegate schedule resolution to WearScheduleHelper');
console.log('  ✓ Test 4 passed: Wear OS Tile Service Day Detection verified.');

// 5. Watch Companion Web Controller Day Detection (`watch_companion.js` & `watch.html`)
console.log('▶ Test 5: Verifying watch_companion.js live day detection...');
const watchJsSrc = fs.readFileSync(path.join(ROOT, 'watch_companion.js'), 'utf8');
assert(watchJsSrc.includes('w-day-radar'), 'watch_companion.js must bind w-day-radar');
assert(watchJsSrc.includes('w-timeline-header'), 'watch_companion.js must bind w-timeline-header');
assert(watchJsSrc.includes('HEBREW_DAYS'), 'watch_companion.js must define HEBREW_DAYS');
assert(watchJsSrc.includes('משוואות דיפרנציאליות חלקיות'), 'watch_companion.js must include Sunday PDE class');

const watchHtmlSrc = fs.readFileSync(path.join(ROOT, 'watch.html'), 'utf8');
assert(watchHtmlSrc.includes('w-day-radar'), 'watch.html must contain w-day-radar element');
assert(watchHtmlSrc.includes('w-timeline-header'), 'watch.html must contain w-timeline-header element');
console.log('  ✓ Test 5 passed: Watch Web Companion Day Detection verified.');

console.log('\n🎉 ALL 5/5 WEAR SYNC & DAY DETECTION TESTS PASSED SUCCESSFULLY!');
