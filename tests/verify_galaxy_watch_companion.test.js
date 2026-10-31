// ==============================================================================
// Unit & Integration Test Suite: Galaxy Watch 8 (Wear OS) Companion Suite
// File: tests/verify_galaxy_watch_companion.test.js
// ==============================================================================

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('🧪 Starting Galaxy Watch 8 (Wear OS) Companion Test Suite...');

const ROOT = path.join(__dirname, '..');

// TEST 1: Wear OS Android Module & Manifest Configuration
console.log('▶ Test 1: Verifying Wear OS module Gradle and Manifest declarations...');
const wearGradlePath = path.join(ROOT, 'android', 'wear', 'build.gradle');
assert(fs.existsSync(wearGradlePath), 'android/wear/build.gradle must exist');
const wearGradle = fs.readFileSync(wearGradlePath, 'utf8');
assert(wearGradle.includes('com.technion.semestero.wear'), 'Wear module must declare wear namespace');
assert(wearGradle.includes('minSdkVersion 30'), 'Wear module must target minSdk 30 for Wear OS');
assert(wearGradle.includes('androidx.wear.tiles:tiles'), 'Wear module must include Wear Tiles dependency');
assert(wearGradle.includes('play-services-wearable'), 'Wear module must include Play Services Wearable');

const wearManifestPath = path.join(ROOT, 'android', 'wear', 'src', 'main', 'AndroidManifest.xml');
assert(fs.existsSync(wearManifestPath), 'android/wear/src/main/AndroidManifest.xml must exist');
const wearManifest = fs.readFileSync(wearManifestPath, 'utf8');
assert(wearManifest.includes('android.hardware.type.watch'), 'Manifest must declare watch hardware feature');
assert(wearManifest.includes('com.google.android.wearable.standalone'), 'Manifest must declare standalone wearable capability');
assert(wearManifest.includes('SemesteroClassTileService'), 'Manifest must register SemesteroClassTileService');
assert(wearManifest.includes('androidx.wear.tiles.action.BIND_TILE_PROVIDER'), 'Tile service must bind to Wear Tiles action');
assert(wearManifest.includes('WearDataSyncService'), 'Manifest must register WearDataSyncService');
console.log('  ✓ Test 1 passed: Wear OS Gradle and AndroidManifest.xml verified.');

// TEST 2: Phone-to-Watch Sync Layer
console.log('▶ Test 2: Verifying phone WearSyncManager and settings.gradle integration...');
const settingsGradlePath = path.join(ROOT, 'android', 'settings.gradle');
const settingsGradle = fs.readFileSync(settingsGradlePath, 'utf8');
assert(settingsGradle.includes("include ':wear'"), "settings.gradle must include ':wear'");

const syncManagerPath = path.join(ROOT, 'android', 'app', 'src', 'main', 'java', 'com', 'technion', 'semestero', 'WearSyncManager.java');
assert(fs.existsSync(syncManagerPath), 'WearSyncManager.java must exist in phone app');
const syncManagerSrc = fs.readFileSync(syncManagerPath, 'utf8');
assert(syncManagerSrc.includes('syncClassToWatch'), 'WearSyncManager must implement syncClassToWatch');
assert(syncManagerSrc.includes('syncTasksToWatch'), 'WearSyncManager must implement syncTasksToWatch');
assert(syncManagerSrc.includes('syncGpaToWatch'), 'WearSyncManager must implement syncGpaToWatch');
console.log('  ✓ Test 2 passed: Phone-to-Watch WearSyncManager verified.');

// TEST 3: Watch Web Companion & Circular Chassis (`watch.html`)
console.log('▶ Test 3: Verifying circular watch layout and screen carousel in watch.html...');
const watchHtmlPath = path.join(ROOT, 'watch.html');
assert(fs.existsSync(watchHtmlPath), 'watch.html must exist');
const watchHtml = fs.readFileSync(watchHtmlPath, 'utf8');
assert(watchHtml.includes('watch-container'), 'watch.html must have watch-container');
assert(watchHtml.includes('watch-bezel-glow'), 'watch.html must feature bezel glow progress ring');
assert(watchHtml.includes('screen-radar'), 'Screen 1: Next Class Radar must exist');
assert(watchHtml.includes('screen-timeline'), 'Screen 2: Today Timeline must exist');
assert(watchHtml.includes('screen-tasks'), 'Screen 3: Tasks & Exams must exist');
assert(watchHtml.includes('screen-stats'), 'Screen 4: Academic Stats must exist');
console.log('  ✓ Test 3 passed: watch.html circular chassis and 4 carousel screens verified.');

// TEST 4: Watch Companion Rotary Bezel & Controller Engine (`watch_companion.js`)
console.log('▶ Test 4: Verifying watch_companion.js logic and event bindings...');
const watchJsPath = path.join(ROOT, 'watch_companion.js');
assert(fs.existsSync(watchJsPath), 'watch_companion.js must exist');
const watchJs = fs.readFileSync(watchJsPath, 'utf8');

// Mock browser environment for watch_companion.js
const mockElements = {
    'screen-radar': { classList: { toggle: () => {} } },
    'screen-timeline': { classList: { toggle: () => {} } },
    'screen-tasks': { classList: { toggle: () => {} } },
    'screen-stats': { classList: { toggle: () => {} } },
    'bezel-glow': { style: {} },
    'watch-clock': { innerText: '' },
    'watch-container': { classList: { add: () => {}, remove: () => {} } },
    'w-class-title': { innerText: '' },
    'w-class-time': { innerText: '' },
    'w-class-room': { innerText: '' },
    'w-class-status': { innerText: '' },
    'w-class-lecturer': { innerText: '' },
    'w-timeline-list': { innerHTML: '' },
    'w-exam-title': { innerText: '' },
    'w-exam-course': { innerText: '' },
    'w-tasks-list': { innerHTML: '' },
    'w-gpa-val': { innerText: '' },
    'w-credits-text': { innerText: '' },
    'w-honors-pill': { innerText: '' },
    'w-gpa-ring-bar': { style: {} }
};

const domMock = {
    document: {
        readyState: 'complete',
        getElementById: (id) => mockElements[id] || null,
        querySelectorAll: (sel) => [
            { classList: { toggle: () => {} } },
            { classList: { toggle: () => {} } },
            { classList: { toggle: () => {} } },
            { classList: { toggle: () => {} } }
        ],
        addEventListener: () => {}
    },
    window: {
        addEventListener: () => {},
        localStorage: {
            getItem: () => null,
            setItem: () => {}
        },
        navigator: {
            vibrate: () => true
        },
        PRELOADED_USER_STATE: {
            gpa: 86.04
        },
        setInterval: () => {},
        clearInterval: () => {},
        setTimeout: () => {},
        clearTimeout: () => {},
        console: console
    }
};

domMock.window.document = domMock.document;
domMock.window.window = domMock.window;

const ctx = vm.createContext(domMock.window);
vm.runInContext(watchJs, ctx);

assert(typeof ctx.window.toggleWatchTask === 'function', 'toggleWatchTask must be exposed globally');
assert(typeof ctx.window.refreshWatchData === 'function', 'refreshWatchData must be exposed globally');

// Check rotary bezel support in code
assert(watchJs.includes('rotarydetent'), 'Must support Samsung rotarydetent event');
assert(watchJs.includes('wheel'), 'Must support rotating bezel wheel event');
assert(watchJs.includes('touchstart'), 'Must support touch swipe navigation');
assert(watchJs.includes('ambient-mode'), 'Must support Always-On Display ambient mode');
console.log('  ✓ Test 4 passed: Rotary bezel, gestures, AOD ambient mode, and task toggle verified.');

// TEST 5: Direct Download & Hub Integration
console.log('▶ Test 5: Verifying direct download card and Command Palette shortcut...');
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
assert(indexHtml.includes('Galaxy Watch 8 (Wear OS)'), 'index.html must feature Galaxy Watch 8 card');
assert(indexHtml.includes('watch.html'), 'index.html must link to watch.html');

const uiEnhancements = fs.readFileSync(path.join(ROOT, 'ui_enhancements.js'), 'utf8');
assert(uiEnhancements.includes('act-watch'), 'ui_enhancements.js must register act-watch command');
assert(uiEnhancements.includes('Ctrl+Shift+W'), 'ui_enhancements.js must bind Ctrl+Shift+W shortcut');
console.log('  ✓ Test 5 passed: Direct download and Command Palette integration verified.');

console.log('\n🎉 ALL 5/5 GALAXY WATCH 8 COMPANION UNIT TESTS PASSED SUCCESSFULLY!\n');
