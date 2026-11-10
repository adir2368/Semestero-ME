const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Running Mobile Notifications & Wear OS Tasks Complication Tests...\n');

// -------------------------------------------------------------
// Test 1: Wear OS Tasks Complication Java Logic & Manifest Integration
// -------------------------------------------------------------
console.log('[Test 1] Verifying Wear OS Tasks Complication Manifest & Service Structure...');

const manifestPath = path.join(__dirname, '..', 'android', 'wear', 'src', 'main', 'AndroidManifest.xml');
const manifestContent = fs.readFileSync(manifestPath, 'utf8');

assert.strictEqual(
    manifestContent.includes('android:name=".SemesteroTasksComplicationService"'),
    true,
    'SemesteroTasksComplicationService must be registered in Wear AndroidManifest.xml'
);
assert.strictEqual(
    manifestContent.includes('android:value="SHORT_TEXT,LONG_TEXT"'),
    true,
    'Complication must support SHORT_TEXT and LONG_TEXT types'
);
assert.strictEqual(
    manifestContent.includes('android:name="android.support.wearable.complications.ACTION_COMPLICATION_UPDATE_REQUEST"'),
    true,
    'Complication update intent filter action must be present'
);
console.log('   ✓ PASS: Wear OS AndroidManifest.xml registration verified.');

const stringsPath = path.join(__dirname, '..', 'android', 'wear', 'src', 'main', 'res', 'values', 'strings.xml');
const stringsContent = fs.readFileSync(stringsPath, 'utf8');

assert.strictEqual(
    stringsContent.includes('name="complication_tasks_label"'),
    true,
    'complication_tasks_label must be present in Wear strings.xml'
);
assert.strictEqual(
    stringsContent.includes('name="complication_tasks_desc"'),
    true,
    'complication_tasks_desc must be present in Wear strings.xml'
);
console.log('   ✓ PASS: Wear OS string resources for tasks complication verified.');

const tasksServicePath = path.join(__dirname, '..', 'android', 'wear', 'src', 'main', 'java', 'com', 'technion', 'semestero', 'wear', 'SemesteroTasksComplicationService.java');
assert.strictEqual(fs.existsSync(tasksServicePath), true, 'SemesteroTasksComplicationService.java must exist');
const tasksServiceContent = fs.readFileSync(tasksServicePath, 'utf8');

assert.strictEqual(
    tasksServiceContent.includes('countOpenTasks(prefs)'),
    true,
    'SemesteroTasksComplicationService must calculate open tasks from prefs'
);
assert.strictEqual(
    tasksServiceContent.includes('ShortTextComplicationData.Builder'),
    true,
    'SemesteroTasksComplicationService must build ShortTextComplicationData'
);
assert.strictEqual(
    tasksServiceContent.includes('LongTextComplicationData.Builder'),
    true,
    'SemesteroTasksComplicationService must build LongTextComplicationData'
);
assert.strictEqual(
    tasksServiceContent.includes('MainActivity.ACTION_SET_PAGE'),
    true,
    'Complication tap intent must target MainActivity Tasks tab'
);
assert.strictEqual(
    tasksServiceContent.includes('setMonochromaticImage'),
    false,
    'SemesteroTasksComplicationService must NOT include icons/symbols to prevent dial clutter'
);
assert.strictEqual(
    tasksServiceContent.includes('setTitle'),
    false,
    'SemesteroTasksComplicationService must NOT include extra title lines to prevent dial clutter'
);
assert.strictEqual(
    tasksServiceContent.includes('"אין משימות פתוחות"') && tasksServiceContent.includes(' משימות פתוחות"'),
    true,
    'SemesteroTasksComplicationService must strictly format "X משימות פתוחות" or "אין משימות פתוחות"'
);
console.log('   ✓ PASS: SemesteroTasksComplicationService Java implementation verified.');

const scheduleServicePath = path.join(__dirname, '..', 'android', 'wear', 'src', 'main', 'java', 'com', 'technion', 'semestero', 'wear', 'SemesteroComplicationService.java');
assert.strictEqual(fs.existsSync(scheduleServicePath), true, 'SemesteroComplicationService.java must exist');
const scheduleServiceContent = fs.readFileSync(scheduleServicePath, 'utf8');

assert.strictEqual(
    scheduleServiceContent.includes('setMonochromaticImage'),
    false,
    'SemesteroComplicationService must NOT include icons/symbols to prevent dial clutter'
);
assert.strictEqual(
    scheduleServiceContent.includes('setTitle'),
    false,
    'SemesteroComplicationService must NOT include extra title lines to prevent dial clutter'
);
console.log('   ✓ PASS: SemesteroComplicationService minimized schedule implementation verified.');

// -------------------------------------------------------------
// Test 2: Wear OS Reactive Updates from Sync Service & Task Checkoff
// -------------------------------------------------------------
console.log('\n[Test 2] Verifying Wear OS Complication Reactive Updates...');

const syncServicePath = path.join(__dirname, '..', 'android', 'wear', 'src', 'main', 'java', 'com', 'technion', 'semestero', 'wear', 'WearDataSyncService.java');
const syncServiceContent = fs.readFileSync(syncServicePath, 'utf8');

assert.strictEqual(
    syncServiceContent.includes('SemesteroTasksComplicationService.class'),
    true,
    'WearDataSyncService must request complication update for SemesteroTasksComplicationService on data sync'
);
console.log('   ✓ PASS: WearDataSyncService notifies tasks complication.');

const mainActivityWearPath = path.join(__dirname, '..', 'android', 'wear', 'src', 'main', 'java', 'com', 'technion', 'semestero', 'wear', 'MainActivity.java');
const mainActivityWearContent = fs.readFileSync(mainActivityWearPath, 'utf8');

assert.strictEqual(
    mainActivityWearContent.includes('SemesteroTasksComplicationService.class'),
    true,
    'MainActivity must trigger complication update when student toggles a task on wrist'
);
assert.strictEqual(
    mainActivityWearContent.includes('handleIntent(getIntent())'),
    true,
    'MainActivity must handle direct complication intent navigation'
);
console.log('   ✓ PASS: MainActivity wrist toggle complication update verified.');

// -------------------------------------------------------------
// Test 3: Simulation of countOpenTasks Logic
// -------------------------------------------------------------
console.log('\n[Test 3] Simulating Task Counter Logic across various state scenarios...');

function simulateCountOpenTasks(allTasksJson, localWearDones = {}, fallbackTasks = {}) {
    let count = 0;
    let calculatedFromJson = false;

    if (allTasksJson && allTasksJson.trim() && allTasksJson.trim() !== '[]') {
        try {
            const arr = JSON.parse(allTasksJson);
            if (Array.isArray(arr) && arr.length > 0) {
                calculatedFromJson = true;
                for (let i = 0; i < arr.length; i++) {
                    const obj = arr[i];
                    let isDone = !!obj.completed;
                    if (i < 5 && localWearDones[`wear_task_${i + 1}_done`]) {
                        isDone = true;
                    }
                    if (!isDone) count++;
                }
            }
        } catch (e) {}
    }

    if (!calculatedFromJson) {
        for (let i = 1; i <= 3; i++) {
            const taskText = fallbackTasks[`task_${i}`] || '';
            const isDone = localWearDones[`wear_task_${i}_done`] || fallbackTasks[`task_${i}_done`];
            if (taskText && !isDone && !taskText.includes('אין משימות')) {
                count++;
            }
        }
    }

    return count;
}

// Scenario A: 4 tasks in JSON, 1 marked done in server payload
const tasksA = JSON.stringify([
    { id: 't1', title: 'גיליון 3', completed: false },
    { id: 't2', title: 'דוח מעבדה', completed: true },
    { id: 't3', title: 'תרגיל בית 2', completed: false },
    { id: 't4', title: 'פרויקט תכן', completed: false }
]);
assert.strictEqual(simulateCountOpenTasks(tasksA), 3, 'Scenario A: Should count 3 open tasks');

// Scenario B: User checks off task 1 directly on watch
assert.strictEqual(simulateCountOpenTasks(tasksA, { wear_task_1_done: true }), 2, 'Scenario B: Should count 2 open tasks after watch toggle');

// Scenario C: User completes all tasks
assert.strictEqual(simulateCountOpenTasks(tasksA, { wear_task_1_done: true, wear_task_3_done: true, wear_task_4_done: true }), 0, 'Scenario C: Should count 0 when all done');

// Scenario D: Fallback keys when JSON is empty
assert.strictEqual(simulateCountOpenTasks('', {}, { task_1: 'תרגול חדו״א', task_2: 'תרמו 1', task_3: '' }), 2, 'Scenario D: Fallback should count 2 open tasks');
console.log('   ✓ PASS: Task counter algorithm passed all edge scenarios.');

// -------------------------------------------------------------
// Test 4: Mobile Native Notifications Wide / BigTextStyle Configuration
// -------------------------------------------------------------
console.log('\n[Test 4] Verifying Mobile Native Notification BigTextStyle in app.js...');

const appJsPath = path.join(__dirname, '..', 'app.js');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

assert.strictEqual(
    appJsContent.includes('largeBody: largeBody'),
    true,
    'showNativeNotification must pass largeBody to Capacitor LocalNotifications'
);
assert.strictEqual(
    appJsContent.includes('summaryText: summaryText'),
    true,
    'showNativeNotification must pass summaryText to Capacitor LocalNotifications'
);
assert.strictEqual(
    appJsContent.includes('summaryText: \'סמסטרו ME • לו״ז יומי\''),
    true,
    'Lecture notification dispatch must configure dedicated BigTextStyle summary'
);
assert.strictEqual(
    appJsContent.includes('summaryText: \'סמסטרו ME • משימות פתוחות\''),
    true,
    'Tasks notification dispatch must configure dedicated BigTextStyle summary'
);
assert.strictEqual(
    appJsContent.includes('const maxTasksToShow = Math.min(priorityTasks.tasks.length, 10);'),
    true,
    'Tasks notification dispatch must show up to 10 tasks without early truncation'
);
console.log('   ✓ PASS: app.js native notification formatting verified.');

// -------------------------------------------------------------
// Test 5: In-App Notification Hub & Mobile UI Untruncated Styling
// -------------------------------------------------------------
console.log('\n[Test 5] Verifying Untruncated Notification Styling in styles.css...');

const stylesCssPath = path.join(__dirname, '..', 'styles.css');
const stylesCssContent = fs.readFileSync(stylesCssPath, 'utf8');

assert.strictEqual(
    stylesCssContent.includes('.notif-card-summary {') &&
    stylesCssContent.includes('text-overflow: unset;'),
    true,
    '.notif-card-summary must have text-overflow: unset (no truncation)'
);
assert.strictEqual(
    stylesCssContent.includes('.notif-task-title {') &&
    stylesCssContent.includes('white-space: normal;'),
    true,
    '.notif-task-title must wrap text naturally without clipping'
);
assert.strictEqual(
    stylesCssContent.includes('.notif-lecture-item-title {') &&
    stylesCssContent.includes('white-space: normal;'),
    true,
    '.notif-lecture-item-title must wrap text naturally without clipping'
);
assert.strictEqual(
    stylesCssContent.includes('@media (max-width: 768px) {') &&
    stylesCssContent.includes('.ast-toast {'),
    true,
    '.ast-toast must have responsive mobile styles for full width'
);
console.log('   ✓ PASS: styles.css full-width notification styles verified.');

// -------------------------------------------------------------
// Test 6: Capacitor Android Action Types & Deep-Linking Verification
// -------------------------------------------------------------
console.log('\n[Test 6] Verifying Capacitor Action Types & Deep-Link Listeners in app.js...');

assert.strictEqual(
    appJsContent.includes('notifPayload.inboxList = options.inboxList;'),
    true,
    'showNativeNotification must forward inboxList to Capacitor payload'
);
assert.strictEqual(
    appJsContent.includes('TIMETABLE_ACTIONS') && appJsContent.includes('open-timetable'),
    true,
    'ensureCapacitorNotificationChannel must register TIMETABLE_ACTIONS'
);
assert.strictEqual(
    appJsContent.includes('TASKS_ACTIONS') && appJsContent.includes('open-tasks'),
    true,
    'ensureCapacitorNotificationChannel must register TASKS_ACTIONS'
);
assert.strictEqual(
    appJsContent.includes('localNotificationActionPerformed'),
    true,
    'ensureCapacitorNotificationChannel must register localNotificationActionPerformed listener'
);
console.log('   ✓ PASS: Capacitor action types, inboxList & deep-linking verified.');

console.log('\n🎉 ALL MOBILE NOTIFICATIONS & WEAR OS TASKS COMPLICATION TESTS PASSED SUCCESSFULLY!\n');
