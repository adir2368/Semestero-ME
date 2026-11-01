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
import com.google.android.gms.wearable.WearableListenerService;

public class WearDataSyncService extends WearableListenerService {
    private static final String TAG = "WearDataSyncService";
    public static final String SYNC_PATH = "/semestero/watch_sync";
    public static final String ACTION_DATA_SYNCED = "com.technion.semestero.wear.DATA_SYNCED";

    @Override
    public void onDataChanged(DataEventBuffer dataEvents) {
        for (DataEvent event : dataEvents) {
            if (event.getType() == DataEvent.TYPE_CHANGED) {
                DataItem item = event.getDataItem();
                if (item.getUri().getPath().compareTo(SYNC_PATH) == 0) {
                    DataMap dataMap = DataMapItem.fromDataItem(item).getDataMap();
                    
                    SharedPreferences prefs = getSharedPreferences(MainActivity.PREFS_NAME, Context.MODE_PRIVATE);
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
                    if (dataMap.containsKey("task_2")) editor.putString("task_2", dataMap.getString("task_2"));
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

                    Log.d(TAG, "Wear OS SharedPreferences updated from DataClient.");

                    // Broadcast to MainActivity if active
                    Intent updateIntent = new Intent(ACTION_DATA_SYNCED);
                    updateIntent.setPackage(getPackageName());
                    sendBroadcast(updateIntent);

                    // Request Tile Refresh
                    try {
                        TileService.getUpdater(this).requestUpdate(SemesteroClassTileService.class);
                    } catch (Exception ignored) {}

                    // User directive: Silent radar updates without buzzing/alerts ("בלי התראה")
                    // Routine class transitions update silently on the watch display.
                }
            }
        }
    }
}
