package com.technion.semestero.wear;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.util.Log;
import androidx.wear.tiles.TileService;
import com.google.android.gms.wearable.DataEvent;
import com.google.android.gms.wearable.DataEventBuffer;
import com.google.android.gms.wearable.DataItem;
import com.google.android.gms.wearable.DataMap;
import com.google.android.gms.wearable.DataMapItem;
import com.google.android.gms.wearable.MessageEvent;
import com.google.android.gms.wearable.WearableListenerService;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;

/**
 * WearDataSyncService ? Listens for background data changes and real-time direct messages from phone companion.
 * Updates local Wear OS preferences, broadcasts refresh to MainActivity, and updates Glanceable Tiles.
 */
public class WearDataSyncService extends WearableListenerService {
    private static final String TAG = "WearDataSyncService";
    public static final String SYNC_PATH = "/semestero/watch_sync";
    public static final String PATH_DIRECT_SYNC = "/semestero/direct_sync";
    public static final String ACTION_DATA_SYNCED = "com.technion.semestero.wear.DATA_SYNCED";

    @Override
    public void onDataChanged(DataEventBuffer dataEvents) {
        for (DataEvent event : dataEvents) {
            if (event.getType() == DataEvent.TYPE_CHANGED) {
                DataItem item = event.getDataItem();
                if (item.getUri().getPath().compareTo(SYNC_PATH) == 0) {
                    DataMap dataMap = DataMapItem.fromDataItem(item).getDataMap();
                    applyDataMapToPrefs(this, dataMap);
                    notifyDataUpdated();
                    Log.d(TAG, "Wear OS SharedPreferences updated from DataClient.");
                }
            }
        }
    }

    @Override
    public void onMessageReceived(MessageEvent messageEvent) {
        if (messageEvent == null) return;
        String path = messageEvent.getPath();
        Log.d(TAG, "Wear OS message received on path: " + path);

        if (PATH_DIRECT_SYNC.equals(path)) {
            try {
                String jsonStr = new String(messageEvent.getData(), StandardCharsets.UTF_8);
                JSONObject json = new JSONObject(jsonStr);
                applyJsonToPrefs(this, json);
                notifyDataUpdated();
                Log.d(TAG, "Wear OS SharedPreferences updated instantly from direct MessageClient!");
            } catch (Exception e) {
                Log.e(TAG, "Error handling direct sync message: ", e);
            }
        }
    }

    private void notifyDataUpdated() {
        Intent updateIntent = new Intent(ACTION_DATA_SYNCED);
        updateIntent.setPackage(getPackageName());
        sendBroadcast(updateIntent);

        try {
            TileService.getUpdater(this).requestUpdate(SemesteroClassTileService.class);
        } catch (Exception ignored) {}
    }

    public static void applyDataMapToPrefs(Context context, DataMap dataMap) {
        if (context == null || dataMap == null) return;
        SharedPreferences prefs = context.getSharedPreferences(MainActivity.PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();

        // 1. Day of Week & Date
        if (dataMap.containsKey("day_name")) editor.putString("day_name", dataMap.getString("day_name"));
        if (dataMap.containsKey("date_formatted")) editor.putString("date_formatted", dataMap.getString("date_formatted"));
        if (dataMap.containsKey("day_index")) editor.putInt("day_index", dataMap.getInt("day_index"));

        // 2. Class & Schedule
        if (dataMap.containsKey("class_title")) editor.putString("class_title", dataMap.getString("class_title"));
        if (dataMap.containsKey("class_time")) editor.putString("class_time", dataMap.getString("class_time"));
        if (dataMap.containsKey("class_details")) editor.putString("class_details", dataMap.getString("class_details"));
        if (dataMap.containsKey("class_lecturer")) editor.putString("class_lecturer", dataMap.getString("class_lecturer"));
        if (dataMap.containsKey("class_status")) editor.putString("class_status", dataMap.getString("class_status"));
        if (dataMap.containsKey("all_classes_json")) editor.putString("all_classes_json", dataMap.getString("all_classes_json"));
        if (dataMap.containsKey("all_classes_count")) editor.putInt("all_classes_count", dataMap.getInt("all_classes_count"));

        // 3. Tasks & Exams
        if (dataMap.containsKey("exam_days")) editor.putString("exam_days", dataMap.getString("exam_days"));
        if (dataMap.containsKey("exam_title")) editor.putString("exam_title", dataMap.getString("exam_title"));
        if (dataMap.containsKey("exam_sub")) editor.putString("exam_sub", dataMap.getString("exam_sub"));
        if (dataMap.containsKey("task_1")) editor.putString("task_1", dataMap.getString("task_1"));
        if (dataMap.containsKey("task_1_id")) editor.putString("wear_task_1_id", dataMap.getString("task_1_id"));
        if (dataMap.containsKey("task_2")) editor.putString("task_2", dataMap.getString("task_2"));
        if (dataMap.containsKey("task_2_id")) editor.putString("wear_task_2_id", dataMap.getString("task_2_id"));
        if (dataMap.containsKey("task_3")) editor.putString("task_3", dataMap.getString("task_3"));
        if (dataMap.containsKey("task_3_id")) editor.putString("wear_task_3_id", dataMap.getString("task_3_id"));
        if (dataMap.containsKey("tasks_summary")) editor.putString("tasks_summary", dataMap.getString("tasks_summary"));
        if (dataMap.containsKey("all_tasks_json")) editor.putString("all_tasks_json", dataMap.getString("all_tasks_json"));

        // 4. GPA & Standing
        if (dataMap.containsKey("gpa_current")) editor.putString("gpa_current", dataMap.getString("gpa_current"));
        if (dataMap.containsKey("gpa_badge")) editor.putString("gpa_badge", dataMap.getString("gpa_badge"));

        // 5. Weekly Schedule
        if (dataMap.containsKey("sched_total_hours")) editor.putString("sched_total_hours", dataMap.getString("sched_total_hours"));
        if (dataMap.containsKey("sched_sun")) editor.putString("sched_sun", dataMap.getString("sched_sun"));
        if (dataMap.containsKey("sched_mon")) editor.putString("sched_mon", dataMap.getString("sched_mon"));
        if (dataMap.containsKey("sched_tue")) editor.putString("sched_tue", dataMap.getString("sched_tue"));
        if (dataMap.containsKey("sched_wed")) editor.putString("sched_wed", dataMap.getString("sched_wed"));
        if (dataMap.containsKey("sched_thu")) editor.putString("sched_thu", dataMap.getString("sched_thu"));

        editor.putLong("last_sync_timestamp", System.currentTimeMillis());
        editor.apply();
    }

    public static void applyJsonToPrefs(Context context, JSONObject json) {
        if (context == null || json == null) return;
        SharedPreferences prefs = context.getSharedPreferences(MainActivity.PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();

        // 1. Day of Week & Date
        if (json.has("day_name")) editor.putString("day_name", json.optString("day_name"));
        if (json.has("date_formatted")) editor.putString("date_formatted", json.optString("date_formatted"));
        if (json.has("day_index")) editor.putInt("day_index", json.optInt("day_index"));

        // 2. Class & Schedule
        if (json.has("class_title")) editor.putString("class_title", json.optString("class_title"));
        if (json.has("class_time")) editor.putString("class_time", json.optString("class_time"));
        if (json.has("class_details")) editor.putString("class_details", json.optString("class_details"));
        if (json.has("class_lecturer")) editor.putString("class_lecturer", json.optString("class_lecturer"));
        if (json.has("class_status")) editor.putString("class_status", json.optString("class_status"));
        if (json.has("all_classes_json")) editor.putString("all_classes_json", json.optString("all_classes_json"));
        if (json.has("all_classes_count")) editor.putInt("all_classes_count", json.optInt("all_classes_count"));

        // 3. Tasks & Exams
        if (json.has("exam_days")) editor.putString("exam_days", json.optString("exam_days"));
        if (json.has("exam_title")) editor.putString("exam_title", json.optString("exam_title"));
        if (json.has("exam_sub")) editor.putString("exam_sub", json.optString("exam_sub"));
        if (json.has("task_1")) editor.putString("task_1", json.optString("task_1"));
        if (json.has("task_1_id")) editor.putString("wear_task_1_id", json.optString("task_1_id"));
        if (json.has("task_2")) editor.putString("task_2", json.optString("task_2"));
        if (json.has("task_2_id")) editor.putString("wear_task_2_id", json.optString("task_2_id"));
        if (json.has("task_3")) editor.putString("task_3", json.optString("task_3"));
        if (json.has("task_3_id")) editor.putString("wear_task_3_id", json.optString("task_3_id"));
        if (json.has("tasks_summary")) editor.putString("tasks_summary", json.optString("tasks_summary"));
        if (json.has("all_tasks_json")) editor.putString("all_tasks_json", json.optString("all_tasks_json"));

        // 4. GPA & Standing
        if (json.has("gpa_current")) editor.putString("gpa_current", json.optString("gpa_current"));
        if (json.has("gpa_badge")) editor.putString("gpa_badge", json.optString("gpa_badge"));

        // 5. Weekly Schedule
        if (json.has("sched_total_hours")) editor.putString("sched_total_hours", json.optString("sched_total_hours"));
        if (json.has("sched_sun")) editor.putString("sched_sun", json.optString("sched_sun"));
        if (json.has("sched_mon")) editor.putString("sched_mon", json.optString("sched_mon"));
        if (json.has("sched_tue")) editor.putString("sched_tue", json.optString("sched_tue"));
        if (json.has("sched_wed")) editor.putString("sched_wed", json.optString("sched_wed"));
        if (json.has("sched_thu")) editor.putString("sched_thu", json.optString("sched_thu"));

        editor.putLong("last_sync_timestamp", System.currentTimeMillis());
        editor.apply();
    }
}
