package com.technion.semestero;

import android.content.Context;
import android.util.Log;
import com.google.android.gms.tasks.Task;
import com.google.android.gms.wearable.DataItem;
import com.google.android.gms.wearable.PutDataMapRequest;
import com.google.android.gms.wearable.PutDataRequest;
import com.google.android.gms.wearable.Wearable;

public class WearSyncManager {
    private static final String TAG = "WearSyncManager";
    public static final String SYNC_PATH = "/semestero/watch_sync";

    public static void syncClassToWatch(Context context, String title, String time, String details, String lecturer, String status) {
        try {
            PutDataMapRequest mapRequest = PutDataMapRequest.create(SYNC_PATH);
            mapRequest.getDataMap().putString("class_title", title != null ? title : "");
            mapRequest.getDataMap().putString("class_time", time != null ? time : "--:--");
            mapRequest.getDataMap().putString("class_details", details != null ? details : "");
            mapRequest.getDataMap().putString("class_lecturer", lecturer != null ? lecturer : "");
            mapRequest.getDataMap().putString("class_status", status != null ? status : "");
            mapRequest.getDataMap().putLong("timestamp", System.currentTimeMillis());

            PutDataRequest request = mapRequest.asPutDataRequest();
            request.setUrgent();

            Task<DataItem> dataItemTask = Wearable.getDataClient(context).putDataItem(request);
            dataItemTask.addOnSuccessListener(dataItem -> Log.d(TAG, "Successfully synced class data to Galaxy Watch: " + title))
                        .addOnFailureListener(e -> Log.w(TAG, "Failed to sync class data to Galaxy Watch: " + e.getMessage()));
        } catch (Exception e) {
            Log.e(TAG, "Error syncing to Wear OS: ", e);
        }
    }

    public static void syncTasksToWatch(Context context, String examDays, String tasksSummary) {
        try {
            PutDataMapRequest mapRequest = PutDataMapRequest.create(SYNC_PATH);
            mapRequest.getDataMap().putString("exam_days", examDays != null ? examDays : "");
            mapRequest.getDataMap().putString("tasks_summary", tasksSummary != null ? tasksSummary : "");
            mapRequest.getDataMap().putLong("timestamp", System.currentTimeMillis());

            PutDataRequest request = mapRequest.asPutDataRequest();
            request.setUrgent();

            Wearable.getDataClient(context).putDataItem(request);
        } catch (Exception e) {
            Log.e(TAG, "Error syncing tasks to Wear OS: ", e);
        }
    }

    public static void syncGpaToWatch(Context context, String gpaCurrent, String gpaBadge) {
        try {
            PutDataMapRequest mapRequest = PutDataMapRequest.create(SYNC_PATH);
            mapRequest.getDataMap().putString("gpa_current", gpaCurrent != null ? gpaCurrent : "86.04");
            mapRequest.getDataMap().putString("gpa_badge", gpaBadge != null ? gpaBadge : "🎖️ הצטיינות");
            mapRequest.getDataMap().putLong("timestamp", System.currentTimeMillis());

            PutDataRequest request = mapRequest.asPutDataRequest();
            request.setUrgent();

            Wearable.getDataClient(context).putDataItem(request);
        } catch (Exception e) {
            Log.e(TAG, "Error syncing GPA to Wear OS: ", e);
        }
    }
}
