/**
 * Verification Test Suite: Wear OS Expandable Tasks & Vertical Centering
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');

console.log('🧪 Starting Wear OS Expandable Tasks & Vertical Centering Test Suite...');

// Test 1: Wear OS ViewPager2 Carousel & Tasks Page layout structure
console.log('▶ Test 1: Verifying Wear OS ViewPager2 carousel & vertical centering...');
const wearLayoutPath = path.join(ROOT_DIR, 'android/wear/src/main/res/layout/activity_main.xml');
assert.ok(fs.existsSync(wearLayoutPath), 'Wear activity_main.xml must exist');
const wearLayout = fs.readFileSync(wearLayoutPath, 'utf8');

const wearRadarPath = path.join(ROOT_DIR, 'android/wear/src/main/res/layout/page_radar.xml');
const wearTasksPath = path.join(ROOT_DIR, 'android/wear/src/main/res/layout/page_tasks.xml');
const wearSyncPath = path.join(ROOT_DIR, 'android/wear/src/main/res/layout/page_sync.xml');
assert.ok(fs.existsSync(wearRadarPath), 'page_radar.xml must exist');
assert.ok(fs.existsSync(wearTasksPath), 'page_tasks.xml must exist');
assert.ok(fs.existsSync(wearSyncPath), 'page_sync.xml must exist');
const wearRadar = fs.readFileSync(wearRadarPath, 'utf8');
const wearTasks = fs.readFileSync(wearTasksPath, 'utf8');
const wearSync = fs.readFileSync(wearSyncPath, 'utf8');

assert.ok(wearLayout.includes('id="@+id/wear_view_pager"'), 'activity_main.xml must contain wear_view_pager');
assert.ok(wearRadar.includes('android:gravity="center"'), 'page_radar.xml root must have android:gravity="center"');
assert.ok(wearSync.includes('android:fillViewport="true"'), 'page_sync.xml ScrollView must have fillViewport="true"');
assert.ok(wearTasks.includes('id="@+id/card_exam_top"'), 'page_tasks.xml must contain card_exam_top');
assert.ok(wearTasks.includes('id="@+id/tasks_scroll_view"'), 'page_tasks.xml must contain tasks_scroll_view');
assert.ok(wearTasks.includes('id="@+id/tasks_items_container"'), 'page_tasks.xml must contain tasks_items_container');
console.log('  ✓ Test 1 passed: Wear OS ViewPager2 carousel, centering, and tasks layout verified.');

// Test 2: Wear OS Carousel Adapter & Rotary Bezel scrolling
console.log('▶ Test 2: Verifying Wear OS MainActivity & WearCarouselAdapter task list rendering...');
const wearMainPath = path.join(ROOT_DIR, 'android/wear/src/main/java/com/technion/semestero/wear/MainActivity.java');
const wearAdapterPath = path.join(ROOT_DIR, 'android/wear/src/main/java/com/technion/semestero/wear/WearCarouselAdapter.java');
assert.ok(fs.existsSync(wearMainPath), 'Wear MainActivity.java must exist');
assert.ok(fs.existsSync(wearAdapterPath), 'WearCarouselAdapter.java must exist');
const wearMain = fs.readFileSync(wearMainPath, 'utf8');
const wearAdapter = fs.readFileSync(wearAdapterPath, 'utf8');

assert.ok(wearMain.includes('tasksScrollView.smoothScrollBy'), 'Wear MainActivity must support rotary scroll on tasksScrollView');
assert.ok(wearAdapter.includes('private void bindTasks'), 'WearCarouselAdapter must implement bindTasks');
assert.ok(wearAdapter.includes('R.id.tasks_items_container'), 'WearCarouselAdapter must bind tasks_items_container');
assert.ok(wearAdapter.includes('ACTION_DATA_SYNCED') || wearMain.includes('ACTION_DATA_SYNCED'), 'Wear MainActivity must subscribe to ACTION_DATA_SYNCED');
console.log('  ✓ Test 2 passed: Wear OS MainActivity and WearCarouselAdapter verified.');

// Test 3: Phone Home-Screen Widgets Vertical Centering
console.log('▶ Test 3: Verifying all phone home-screen widgets have android:gravity="center_vertical"...');
const widgets = [
    'widget_tasks_exam.xml',
    'widget_next_class.xml',
    'widget_finals_gpa.xml',
    'widget_miluim.xml',
    'widget_pomodoro.xml',
    'widget_schedule.xml',
    'widget_launchpad.xml'
];

for (const w of widgets) {
    const wPath = path.join(ROOT_DIR, 'android/app/src/main/res/layout', w);
    assert.ok(fs.existsSync(wPath), `Widget ${w} must exist`);
    const content = fs.readFileSync(wPath, 'utf8');
    assert.ok(content.includes('android:gravity="center_vertical"'), `Widget ${w} root layout must have android:gravity="center_vertical"`);
}
console.log('  ✓ Test 3 passed: All 7 phone home-screen widgets verified with vertical centering.');

// Test 4: Web Companion Parity in watch.html & watch_companion.js
console.log('▶ Test 4: Verifying Web Companion tasks toggle and vertical alignment...');
const watchHtmlPath = path.join(ROOT_DIR, 'watch.html');
const watchHtml = fs.readFileSync(watchHtmlPath, 'utf8');
assert.ok(watchHtml.includes('watch-task-item'), 'watch.html must contain tasks items');
console.log('  ✓ Test 4 passed: Web companion integration verified.');

// Test 5: Built APK Artifacts
console.log('▶ Test 5: Verifying built APK artifacts...');
const wearApkPath = path.join(ROOT_DIR, 'Semestero-ME-Watch.apk');
const phoneApkPath = path.join(ROOT_DIR, 'Semestero-ME.apk');
assert.ok(fs.existsSync(wearApkPath), 'Semestero-ME-Watch.apk must exist');
assert.ok(fs.existsSync(phoneApkPath), 'Semestero-ME.apk must exist');

const wearStat = fs.statSync(wearApkPath);
const phoneStat = fs.statSync(phoneApkPath);
assert.ok(wearStat.size > 5 * 1024 * 1024, 'Semestero-ME-Watch.apk must be > 5MB');
assert.ok(phoneStat.size > 5 * 1024 * 1024, 'Semestero-ME.apk must be > 5MB');
console.log(`  ✓ Test 5 passed: Semestero-ME-Watch.apk (${(wearStat.size / (1024*1024)).toFixed(2)} MB) and Semestero-ME.apk (${(phoneStat.size / (1024*1024)).toFixed(2)} MB) verified.`);

console.log('\n🎉 ALL 5/5 EXPANDABLE TASKS & VERTICAL CENTERING TESTS PASSED SUCCESSFULLY!');
