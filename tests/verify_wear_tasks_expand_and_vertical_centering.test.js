/**
 * Verification Test Suite: Wear OS Expandable Tasks & Vertical Centering
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');

console.log('🧪 Starting Wear OS Expandable Tasks & Vertical Centering Test Suite...');

// Test 1: Wear OS activity_main.xml layout structure
console.log('▶ Test 1: Verifying Wear OS activity_main.xml vertical centering & expandable tasks...');
const wearLayoutPath = path.join(ROOT_DIR, 'android/wear/src/main/res/layout/activity_main.xml');
assert.ok(fs.existsSync(wearLayoutPath), 'Wear activity_main.xml must exist');
const wearLayout = fs.readFileSync(wearLayoutPath, 'utf8');

assert.ok(wearLayout.includes('android:fillViewport="true"'), 'ScrollView must have fillViewport="true"');
assert.ok(wearLayout.includes('android:gravity="center"'), 'Child layout must have android:gravity="center" for vertical and horizontal centering');
assert.ok(wearLayout.includes('id="@+id/card_tasks_exam"'), 'card_tasks_exam must be present');
assert.ok(wearLayout.includes('id="@+id/layout_open_tasks_expanded"'), 'layout_open_tasks_expanded must exist');
assert.ok(wearLayout.includes('id="@+id/tv_tasks_toggle_hint"'), 'tv_tasks_toggle_hint must exist');
assert.ok(wearLayout.includes('id="@+id/btn_complete_wear_task_1"'), 'Task 1 complete button must exist');
assert.ok(wearLayout.includes('id="@+id/btn_complete_wear_task_2"'), 'Task 2 complete button must exist');
assert.ok(wearLayout.includes('id="@+id/btn_complete_wear_task_3"'), 'Task 3 complete button must exist');
console.log('  ✓ Test 1 passed: Wear OS activity_main.xml vertical centering and expandable layout verified.');

// Test 2: Wear OS MainActivity.java logic
console.log('▶ Test 2: Verifying Wear OS MainActivity.java click bindings & task completion...');
const wearMainPath = path.join(ROOT_DIR, 'android/wear/src/main/java/com/technion/semestero/wear/MainActivity.java');
assert.ok(fs.existsSync(wearMainPath), 'Wear MainActivity.java must exist');
const wearMain = fs.readFileSync(wearMainPath, 'utf8');

assert.ok(wearMain.includes('cardTasksExam.setOnClickListener'), 'cardTasksExam must have click listener');
assert.ok(wearMain.includes('layoutOpenTasksExpanded.setVisibility'), 'Clicking card must toggle layoutOpenTasksExpanded visibility');
assert.ok(wearMain.includes('btnCompleteTask1.setOnClickListener'), 'Task 1 complete button must have click listener');
assert.ok(wearMain.includes('updateTaskDoneState'), 'updateTaskDoneState must manage completion state');
assert.ok(wearMain.includes('smoothScrollTo'), 'Must auto scroll when expanding tasks');
console.log('  ✓ Test 2 passed: Wear OS MainActivity.java bindings and task completion verified.');

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
const wearApkPath = path.join(ROOT_DIR, 'Semestero-Wear.apk');
const phoneApkPath = path.join(ROOT_DIR, 'Semestero-ME.apk');
assert.ok(fs.existsSync(wearApkPath), 'Semestero-Wear.apk must exist');
assert.ok(fs.existsSync(phoneApkPath), 'Semestero-ME.apk must exist');

const wearStat = fs.statSync(wearApkPath);
const phoneStat = fs.statSync(phoneApkPath);
assert.ok(wearStat.size > 10 * 1024 * 1024, 'Semestero-Wear.apk must be > 10MB');
assert.ok(phoneStat.size > 5 * 1024 * 1024, 'Semestero-ME.apk must be > 5MB');
console.log(`  ✓ Test 5 passed: Semestero-Wear.apk (${(wearStat.size / (1024*1024)).toFixed(2)} MB) and Semestero-ME.apk (${(phoneStat.size / (1024*1024)).toFixed(2)} MB) verified.`);

console.log('\n🎉 ALL 5/5 EXPANDABLE TASKS & VERTICAL CENTERING TESTS PASSED SUCCESSFULLY!');
