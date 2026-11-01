package com.technion.semestero;

import android.util.Log;
import com.google.android.gms.wearable.MessageEvent;
import com.google.android.gms.wearable.WearableListenerService;

/**
 * PhoneWearListenerService • Listens for sync requests and actions dispatched from Galaxy Watch.
 */
public class PhoneWearListenerService extends WearableListenerService {
    private static final String TAG = "PhoneWearListener";
    public static final String PATH_REQUEST_SYNC = "/semestero/request_sync";
    public static final String PATH_COMPLETE_TASK = "/semestero/complete_task";

    @Override
    public void onMessageReceived(MessageEvent messageEvent) {
        if (messageEvent == null) return;
        String path = messageEvent.getPath();
        Log.d(TAG, "Wear OS message received on path: " + path);

        if (PATH_REQUEST_SYNC.equals(path)) {
            Log.d(TAG, "Galaxy Watch requested immediate data sync. Pushing full dataset to watch...");
            WearSyncManager.syncAllToWatch(this);
        } else if (PATH_COMPLETE_TASK.equals(path)) {
            try {
                String payload = new String(messageEvent.getData(), java.nio.charset.StandardCharsets.UTF_8);
                Log.d(TAG, "Galaxy Watch toggled task: " + payload);
                String[] parts = payload.split(":");
                if (parts.length >= 2) {
                    int taskIndex = Integer.parseInt(parts[0]);
                    boolean isDone = "1".equals(parts[1]);

                    android.content.SharedPreferences prefs = getSharedPreferences(SemesteroTasksExamWidget.PREFS_NAME, android.content.Context.MODE_PRIVATE);
                    if (taskIndex == 1) {
                        prefs.edit().putBoolean("task_1_done", isDone).apply();
                    } else if (taskIndex == 2) {
                        prefs.edit().putBoolean("task_2_done", isDone).apply();
                    }
                    SemesteroTasksExamWidget.pushUpdate(this);
                }
            } catch (Exception e) {
                Log.w(TAG, "Error handling PATH_COMPLETE_TASK: " + e.getMessage());
            }
        }
    }
}
