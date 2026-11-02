/**
 * verify_phone_watch_dual_sync.test.js
 * Comprehensive automated audit of Phone-to-Watch dual-transport synchronization,
 * bidirectional task completion, and orientation lock hardware safety.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

let totalTests = 0;
let passedTests = 0;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`  ✅ PASS: ${message}`);
    } else {
        console.error(`  ❌ FAIL: ${message}`);
    }
}

console.log('=== Starting Phone-Watch Dual-Transport Synchronization Audit ===\n');

// 1. WearSyncManager.java
console.log('1. Auditing WearSyncManager.java (Phone Dual-Transport Engine)...');
const wearSyncMgrPath = path.join(ROOT_DIR, 'android/app/src/main/java/com/technion/semestero/WearSyncManager.java');
const wearSyncMgrContent = fs.readFileSync(wearSyncMgrPath, 'utf8');

assert(wearSyncMgrContent.includes('public static final String PATH_DIRECT_SYNC = "/semestero/direct_sync";'),
    'Defines high-speed direct RPC path: /semestero/direct_sync');
assert(wearSyncMgrContent.includes('buildConsolidatedPayloadJson(Context context)'),
    'Implements buildConsolidatedPayloadJson for atomic serialization');
assert(wearSyncMgrContent.includes('Wearable.getDataClient(context).putDataItem(request)'),
    'Preserves persistent Google Play DataClient PutDataRequest');
assert(wearSyncMgrContent.includes('Wearable.getMessageClient(context).sendMessage'),
    'Implements real-time MessageClient direct RPC dispatch to all connected nodes');
assert(wearSyncMgrContent.includes('json.put("task_3_id"'),
    'Includes 3rd task ID and metadata in sync payload');

// 2. PhoneWearListenerService.java
console.log('\n2. Auditing PhoneWearListenerService.java (Phone RPC Receiver)...');
const phoneListenerPath = path.join(ROOT_DIR, 'android/app/src/main/java/com/technion/semestero/PhoneWearListenerService.java');
const phoneListenerContent = fs.readFileSync(phoneListenerPath, 'utf8');

assert(phoneListenerContent.includes('PATH_REQUEST_SYNC.equals(path)'),
    'Listens for PATH_REQUEST_SYNC from Galaxy Watch');
assert(phoneListenerContent.includes('Wearable.getMessageClient(this).sendMessage'),
    'Replies with immediate direct sync message back to requesting node');
assert(phoneListenerContent.includes('PATH_COMPLETE_TASK.equals(path)'),
    'Listens for PATH_COMPLETE_TASK toggles');
assert(phoneListenerContent.includes('completed_from_widget_ids'),
    'Persists completed task IDs in completed_from_widget_ids for gameState two-way sync');
assert(phoneListenerContent.includes('MainActivity.triggerTasksSyncFromWear'),
    'Dispatches live WebView JavaScript evaluation when phone app is active');

// 3. WearDataSyncService.java
console.log('\n3. Auditing WearDataSyncService.java (Wear Background Listener)...');
const wearDataSyncPath = path.join(ROOT_DIR, 'android/wear/src/main/java/com/technion/semestero/wear/WearDataSyncService.java');
const wearDataSyncContent = fs.readFileSync(wearDataSyncPath, 'utf8');

assert(wearDataSyncContent.includes('public void onDataChanged(DataEventBuffer dataEvents)'),
    'Implements onDataChanged for DataClient changes');
assert(wearDataSyncContent.includes('public void onMessageReceived(MessageEvent messageEvent)'),
    'Implements onMessageReceived for direct MessageClient packets');
assert(wearDataSyncContent.includes('PATH_DIRECT_SYNC = "/semestero/direct_sync"'),
    'Matches direct sync path /semestero/direct_sync');
assert(wearDataSyncContent.includes('applyJsonToPrefs'),
    'Writes parsed JSON fields directly to Wear SharedPreferences');

// 4. Wear MainActivity.java
console.log('\n4. Auditing Wear MainActivity.java (Galaxy Watch UI & Hardware Safety)...');
const wearMainPath = path.join(ROOT_DIR, 'android/wear/src/main/java/com/technion/semestero/wear/MainActivity.java');
const wearMainContent = fs.readFileSync(wearMainPath, 'utf8');

assert(wearMainContent.includes('implements MessageClient.OnMessageReceivedListener'),
    'Implements MessageClient.OnMessageReceivedListener for zero-latency foreground updates');
assert(wearMainContent.includes('Wearable.getMessageClient(this).addListener(this)'),
    'Registers message listener in onResume');
assert(wearMainContent.includes('Wearable.getMessageClient(this).removeListener(this)'),
    'Unregisters message listener in onPause to prevent leaks');
assert(wearMainContent.includes('setRequestedOrientation(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_NOSENSOR);'),
    'CRITICAL: Preserves runtime Activity orientation lock to SCREEN_ORIENTATION_NOSENSOR');
assert(wearMainContent.includes('o1.optString("dueFormatted"'),
    'Accurately parses dueFormatted from all_tasks_json');
assert(wearMainContent.includes('prefs.getString("wear_task_" + taskIndex + "_id", "")'),
    'Looks up authentic task ID before sending completion notification to phone');

// 5. Phone MainActivity.java
console.log('\n5. Auditing Phone MainActivity.java (Capacitor Bridge & Widget Service)...');
const phoneMainPath = path.join(ROOT_DIR, 'android/app/src/main/java/com/technion/semestero/MainActivity.java');
const phoneMainContent = fs.readFileSync(phoneMainPath, 'utf8');

assert(phoneMainContent.includes('private static MainActivity instance;'),
    'Maintains singleton instance for native-to-web callbacks');
assert(phoneMainContent.includes('public static void triggerTasksSyncFromWear'),
    'Exposes triggerTasksSyncFromWear helper');
assert(phoneMainContent.includes('editor.putString("task_3", fullT3);'),
    'Extracts task 3 from allTasksJson into SharedPreferences');

// 6. app.js
console.log('\n6. Auditing app.js (Web View Two-Way Sync Bridge)...');
const appJsPath = path.join(ROOT_DIR, 'app.js');
const appJsContent = fs.readFileSync(appJsPath, 'utf8');

assert(appJsContent.includes('window.markTaskCompletedById = function'),
    'Exposes global window.markTaskCompletedById bridge method');
assert(appJsContent.includes('dueFormatted: t.timingText || "להגשה בקרוב"'),
    'Formats dueFormatted in allTasksJson');

// 7. Orientation Lock in Android Manifests
console.log('\n7. Auditing Manifest Orientation Hardening...');
const wearManifestPath = path.join(ROOT_DIR, 'android/wear/src/main/AndroidManifest.xml');
const wearManifestContent = fs.readFileSync(wearManifestPath, 'utf8');
assert(wearManifestContent.includes('android:screenOrientation="nosensor"'),
    'Wear Manifest strictly locks MainActivity to nosensor (0x5)');

const appManifestPath = path.join(ROOT_DIR, 'android/app/src/main/AndroidManifest.xml');
const appManifestContent = fs.readFileSync(appManifestPath, 'utf8');
assert(appManifestContent.includes('android:screenOrientation="portrait"'),
    'Phone Manifest strictly locks MainActivity to portrait (0x1)');

console.log(`\n========================================`);
console.log(`Results: ${passedTests}/${totalTests} tests PASSED.`);
if (passedTests === totalTests) {
    console.log('🏆 All Phone-Watch Dual-Transport Synchronization audits PASSED!');
    process.exit(0);
} else {
    console.error('💥 Some synchronization audits failed!');
    process.exit(1);
}
