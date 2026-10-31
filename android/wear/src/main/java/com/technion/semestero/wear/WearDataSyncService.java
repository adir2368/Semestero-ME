package com.technion.semestero.wear;

import android.content.Context;
import android.content.SharedPreferences;
import com.google.android.gms.wearable.DataEvent;
import com.google.android.gms.wearable.DataEventBuffer;
import com.google.android.gms.wearable.DataItem;
import com.google.android.gms.wearable.DataMap;
import com.google.android.gms.wearable.DataMapItem;
import com.google.android.gms.wearable.WearableListenerService;

public class WearDataSyncService extends WearableListenerService {

    public static final String SYNC_PATH = "/semestero/watch_sync";

    @Override
    public void onDataChanged(DataEventBuffer dataEvents) {
        for (DataEvent event : dataEvents) {
            if (event.getType() == DataEvent.TYPE_CHANGED) {
                DataItem item = event.getDataItem();
                if (item.getUri().getPath().compareTo(SYNC_PATH) == 0) {
                    DataMap dataMap = DataMapItem.fromDataItem(item).getDataMap();
                    
                    SharedPreferences prefs = getSharedPreferences(MainActivity.PREFS_NAME, Context.MODE_PRIVATE);
                    SharedPreferences.Editor editor = prefs.edit();

                    if (dataMap.containsKey("class_title")) editor.putString("class_title", dataMap.getString("class_title"));
                    if (dataMap.containsKey("class_time")) editor.putString("class_time", dataMap.getString("class_time"));
                    if (dataMap.containsKey("class_details")) editor.putString("class_details", dataMap.getString("class_details"));
                    if (dataMap.containsKey("class_status")) editor.putString("class_status", dataMap.getString("class_status"));

                    if (dataMap.containsKey("exam_days")) editor.putString("exam_days", dataMap.getString("exam_days"));
                    if (dataMap.containsKey("tasks_summary")) editor.putString("tasks_summary", dataMap.getString("tasks_summary"));

                    if (dataMap.containsKey("gpa_current")) editor.putString("gpa_current", dataMap.getString("gpa_current"));
                    if (dataMap.containsKey("gpa_badge")) editor.putString("gpa_badge", dataMap.getString("gpa_badge"));

                    editor.apply();

                    // If incoming sync indicates an imminent or active class, trigger native wrist notification
                    if (dataMap.containsKey("class_title")) {
                        String title = dataMap.getString("class_title");
                        String time = dataMap.getString("class_time", "");
                        String room = dataMap.getString("class_details", "");
                        String status = dataMap.getString("class_status", "");
                        if (status != null && (status.contains("בעוד") || status.contains("מתקיים"))) {
                            WearNotificationHelper.sendClassReminder(this, title, time, room);
                        }
                    }
                }
            }
        }
    }
}
