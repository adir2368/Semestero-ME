package com.technion.semestero;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;
import com.google.android.gms.wearable.MessageEvent;
import com.google.android.gms.wearable.Wearable;
import com.google.android.gms.wearable.WearableListenerService;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;

/**
 * PhoneWearListenerService ? Listens for real-time requests and actions dispatched from Galaxy Watch 8.
 * Provides instant direct-message replies and bidirectional task status persistence.
 */
public class PhoneWearListenerService extends WearableListenerService {
    private static final String TAG = "PhoneWearListener";
    public static final String PATH_REQUEST_SYNC = "/semestero/request_sync";
    public static final String PATH_COMPLETE_TASK = "/semestero/complete_task";

    @Override
    public void onMessageReceived(MessageEvent messageEvent) {
        if (messageEvent == null) return;
        String path = messageEvent.getPath();
        String sourceNodeId = messageEvent.getSourceNodeId();
        Log.d(TAG, "Wear OS message received on path: " + path + " from node: " + sourceNodeId);

        if (PATH_REQUEST_SYNC.equals(path)) {
            Log.d(TAG, "Galaxy Watch requested immediate data sync. Pushing full dataset to watch...");

            // 1. Request latest webview state refresh if phone app is active
            MainActivity.requestWidgetRefreshFromWear();

            // 2. Build consolidated payload and reply instantly via MessageClient
            try {
                JSONObject json = WearSyncManager.buildConsolidatedPayloadJson(this);
                byte[] payloadBytes = json.toString().getBytes(StandardCharsets.UTF_8);

                Wearable.getMessageClient(this).sendMessage(
                    sourceNodeId,
                    WearSyncManager.PATH_DIRECT_SYNC,
                    payloadBytes
                ).addOnSuccessListener(res -> Log.d(TAG, "Successfully replied with direct sync message to watch node: " + sourceNodeId))
                 .addOnFailureListener(e -> Log.w(TAG, "Failed sending direct sync response: " + e.getMessage()));
            } catch (Exception e) {
                Log.e(TAG, "Error building direct sync response: ", e);
            }

            // 3. Also trigger standard DataClient synchronization
            WearSyncManager.syncAllToWatch(this);

        } else if (PATH_COMPLETE_TASK.equals(path)) {
            try {
                String payload = new String(messageEvent.getData(), StandardCharsets.UTF_8);
                Log.d(TAG, "Galaxy Watch toggled task: " + payload);
                String taskId = "";
                boolean isDone = false;
                int taskIndex = 1;

                int lastColon = payload.lastIndexOf(':');
                int prevColon = (lastColon > 0) ? payload.lastIndexOf(':', lastColon - 1) : -1;
                if (prevColon >= 0 && lastColon > prevColon) {
                    taskId = payload.substring(0, prevColon);
                    isDone = "1".equals(payload.substring(prevColon + 1, lastColon));
                    try { taskIndex = Integer.parseInt(payload.substring(lastColon + 1)); } catch (Exception ignored) {}
                } else if (lastColon > 0) {
                    String left = payload.substring(0, lastColon);
                    String right = payload.substring(lastColon + 1);
                    if (left.length() <= 2 && left.matches("\\d+")) {
                        taskIndex = Integer.parseInt(left);
                        isDone = "1".equals(right);
                        SharedPreferences tasksPrefs = getSharedPreferences(SemesteroTasksExamWidget.PREFS_NAME, Context.MODE_PRIVATE);
                        taskId = tasksPrefs.getString("task_" + taskIndex + "_id", "");
                    } else {
                        taskId = left;
                        isDone = "1".equals(right);
                    }
                }

                SharedPreferences prefs = getSharedPreferences(SemesteroTasksExamWidget.PREFS_NAME, Context.MODE_PRIVATE);
                SharedPreferences.Editor editor = prefs.edit();
                if (taskIndex == 1) {
                    editor.putBoolean("task_1_done", isDone);
                } else if (taskIndex == 2) {
                    editor.putBoolean("task_2_done", isDone);
                } else if (taskIndex == 3) {
                    editor.putBoolean("task_3_done", isDone);
                }

                // Also update cached all_tasks_json so background syncs stay consistent before WebView opens
                if (taskId != null && !taskId.isEmpty()) {
                    try {
                        String existingJson = prefs.getString("all_tasks_json", "[]");
                        org.json.JSONArray arr = new org.json.JSONArray(existingJson);
                        boolean updatedJson = false;
                        for (int i = 0; i < arr.length(); i++) {
                            org.json.JSONObject obj = arr.getJSONObject(i);
                            if (taskId.equals(obj.optString("id", ""))) {
                                obj.put("completed", isDone);
                                updatedJson = true;
                            }
                        }
                        if (updatedJson) {
                            editor.putString("all_tasks_json", arr.toString());
                        }
                    } catch (Exception ignored) {}
                }

                // Manage completed_from_widget_ids for two-way sync with phone web app (gameState)
                if (taskId != null && !taskId.isEmpty()) {
                    String pending = prefs.getString("completed_from_widget_ids", "");
                    if (isDone) {
                        String updated = pending.isEmpty() ? taskId : (pending + "," + taskId);
                        editor.putString("completed_from_widget_ids", updated);
                    } else {
                        String[] partsP = pending.split(",");
                        StringBuilder sb = new StringBuilder();
                        for (String p : partsP) {
                            if (!p.trim().isEmpty() && !p.equals(taskId)) {
                                if (sb.length() > 0) sb.append(",");
                                sb.append(p);
                            }
                        }
                        editor.putString("completed_from_widget_ids", sb.toString());
                    }
                }
                editor.apply();

                // If phone MainActivity is active in foreground, evaluate JS immediately
                if (taskId != null && !taskId.isEmpty()) {
                    MainActivity.triggerTasksSyncFromWear(taskId, isDone);
                }

                // Push update to home screen widgets
                SemesteroTasksExamWidget.pushUpdate(this);

                // Push updated dataset back to watch
                WearSyncManager.syncAllToWatch(this);

            } catch (Exception e) {
                Log.w(TAG, "Error handling PATH_COMPLETE_TASK: " + e.getMessage());
            }
        }
    }
}
