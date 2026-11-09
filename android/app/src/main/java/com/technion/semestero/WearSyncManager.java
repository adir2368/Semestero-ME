package com.technion.semestero;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;
import com.google.android.gms.tasks.Task;
import com.google.android.gms.wearable.DataItem;
import com.google.android.gms.wearable.Node;
import com.google.android.gms.wearable.PutDataMapRequest;
import com.google.android.gms.wearable.PutDataRequest;
import com.google.android.gms.wearable.Wearable;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;
import org.json.JSONObject;

/**
 * WearSyncManager — Synchronizes academic schedule, tasks, and GPA to Galaxy Watch 8.
 * Features resilient dual-transport synchronization:
 * 1. Persistent Google Play Wearable Data Layer (DataClient PutDataRequest)
 * 2. Instant low-latency direct RPC broadcast (MessageClient /semestero/direct_sync)
 */
public class WearSyncManager {
    private static final String TAG = "WearSyncManager";
    public static final String SYNC_PATH = "/semestero/watch_sync";
    public static final String PATH_DIRECT_SYNC = "/semestero/direct_sync";
    public static final String PATH_TRIGGER_NOTIFICATION = "/semestero/trigger_notification";

    private static final String[] HEBREW_DAYS = {
        "", "יום ראשון", "יום שני", "יום שלישי", "יום רביעי", "יום חמישי", "יום שישי", "שבת"
    };

    /**
     * Builds a comprehensive JSON representation of all academic and schedule data.
     */
    public static JSONObject buildConsolidatedPayloadJson(Context context) {
        JSONObject json = new JSONObject();
        if (context == null) return json;
        try {
            // 1. Current Day & Date Resolution
            Calendar cal = Calendar.getInstance();
            int dayOfWeek = cal.get(Calendar.DAY_OF_WEEK);
            String dayName = (dayOfWeek >= 1 && dayOfWeek <= 7) ? HEBREW_DAYS[dayOfWeek] : "יום ראשון";
            SimpleDateFormat sdf = new SimpleDateFormat("d בMMMM", new Locale("he", "IL"));
            String dateFormatted = sdf.format(cal.getTime());

            json.put("day_index", dayOfWeek - 1);
            json.put("day_name", dayName);
            json.put("date_formatted", dateFormatted);

            // 2. Class & Schedule Data from SharedPreferences
            SharedPreferences classPrefs = context.getSharedPreferences(SemesteroNextClassWidget.PREFS_NAME, Context.MODE_PRIVATE);
            json.put("class_title", classPrefs.getString("class_title", "אין שיעורים קרובים היום"));
            json.put("class_time", classPrefs.getString("class_time", "--:--"));
            json.put("class_details", classPrefs.getString("class_details", "זמן מעולה לפרויקטים ולמידה"));
            json.put("class_lecturer", classPrefs.getString("class_lecturer", "סמסטרו ME"));
            json.put("class_status", classPrefs.getString("class_status", "חופשי"));
            json.put("all_classes_json", classPrefs.getString("all_classes_json", "[]"));
            json.put("all_classes_count", classPrefs.getInt("all_classes_count", 0));

            // 3. Tasks & Exams Data
            SharedPreferences tasksPrefs = context.getSharedPreferences(SemesteroTasksExamWidget.PREFS_NAME, Context.MODE_PRIVATE);
            json.put("exam_days", tasksPrefs.getString("exam_days", "--"));
            json.put("exam_title", tasksPrefs.getString("exam_title", "אין מבחנים קרובים"));
            json.put("exam_sub", tasksPrefs.getString("exam_sub", "תקופת לימודים שוטפת"));
            json.put("task_1", tasksPrefs.getString("task_1", ""));
            json.put("task_1_id", tasksPrefs.getString("task_1_id", ""));
            json.put("task_1_done", tasksPrefs.getBoolean("task_1_done", false));
            json.put("task_2", tasksPrefs.getString("task_2", ""));
            json.put("task_2_id", tasksPrefs.getString("task_2_id", ""));
            json.put("task_2_done", tasksPrefs.getBoolean("task_2_done", false));
            json.put("task_3", tasksPrefs.getString("task_3", ""));
            json.put("task_3_id", tasksPrefs.getString("task_3_id", ""));
            json.put("task_3_done", tasksPrefs.getBoolean("task_3_done", false));
            json.put("tasks_summary", tasksPrefs.getString("tasks_summary", "כל המשימות הושלמו!"));
            json.put("all_tasks_json", tasksPrefs.getString("all_tasks_json", "[]"));

            // 4. GPA & Academic Standing
            SharedPreferences gpaPrefs = context.getSharedPreferences(SemesteroFinalsGpaWidget.PREFS_NAME, Context.MODE_PRIVATE);
            json.put("gpa_current", gpaPrefs.getString("gpa_current", "86.04"));
            json.put("gpa_badge", gpaPrefs.getString("gpa_badge", "🎖️ הצטיינות דיקן"));

            // 5. Weekly Schedule Summary
            SharedPreferences schedPrefs = context.getSharedPreferences(SemesteroScheduleWidget.PREFS_NAME, Context.MODE_PRIVATE);
            json.put("sched_total_hours", schedPrefs.getString("sched_total_hours", ""));
            json.put("sched_sun", schedPrefs.getString("sched_sun", ""));
            json.put("sched_mon", schedPrefs.getString("sched_mon", ""));
            json.put("sched_tue", schedPrefs.getString("sched_tue", ""));
            json.put("sched_wed", schedPrefs.getString("sched_wed", ""));
            json.put("sched_thu", schedPrefs.getString("sched_thu", ""));

            json.put("timestamp", System.currentTimeMillis());
        } catch (Exception e) {
            Log.e(TAG, "Error building JSON payload: ", e);
        }
        return json;
    }

    /**
     * Pushes a complete, consolidated synchronization payload to all paired Wear OS devices.
     * Uses dual-channel dispatch: DataClient + MessageClient direct messaging.
     */
    public static void syncAllToWatch(Context context) {
        if (context == null) return;
        try {
            JSONObject json = buildConsolidatedPayloadJson(context);

            // Channel 1: Google Play Wearable Data Layer (DataClient PutDataRequest)
            PutDataMapRequest mapRequest = PutDataMapRequest.create(SYNC_PATH);
            java.util.Iterator<String> keys = json.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                Object val = json.get(key);
                if (val instanceof String) {
                    mapRequest.getDataMap().putString(key, (String) val);
                } else if (val instanceof Integer) {
                    mapRequest.getDataMap().putInt(key, (Integer) val);
                } else if (val instanceof Long) {
                    mapRequest.getDataMap().putLong(key, (Long) val);
                } else if (val instanceof Boolean) {
                    mapRequest.getDataMap().putBoolean(key, (Boolean) val);
                }
            }

            PutDataRequest request = mapRequest.asPutDataRequest();
            request.setUrgent();

            Wearable.getDataClient(context).putDataItem(request)
                .addOnSuccessListener(dataItem -> Log.d(TAG, "DataClient putDataItem successful"))
                .addOnFailureListener(e -> Log.w(TAG, "DataClient putDataItem failed: " + e.getMessage()));

            // Channel 2: High-speed direct RPC dispatch via MessageClient (sub-200ms latency)
            byte[] directBytes = json.toString().getBytes(StandardCharsets.UTF_8);
            Wearable.getNodeClient(context).getConnectedNodes().addOnSuccessListener(nodes -> {
                if (nodes != null && !nodes.isEmpty()) {
                    for (Node node : nodes) {
                        Wearable.getMessageClient(context).sendMessage(
                            node.getId(),
                            PATH_DIRECT_SYNC,
                            directBytes
                        ).addOnSuccessListener(res -> Log.d(TAG, "Direct MessageClient sent to node: " + node.getDisplayName()))
                         .addOnFailureListener(e -> Log.w(TAG, "Direct MessageClient failed for node " + node.getDisplayName() + ": " + e.getMessage()));
                    }
                }
            }).addOnFailureListener(e -> Log.w(TAG, "Failed discovering connected nodes: " + e.getMessage()));

        } catch (Exception e) {
            Log.e(TAG, "Error syncing to Wear OS: ", e);
        }
    }

    public static void syncClassToWatch(Context context, String title, String time, String details, String lecturer, String status) {
        if (context == null) return;
        syncAllToWatch(context);
    }

    public static void syncTasksToWatch(Context context, String examDays, String tasksSummary) {
        if (context == null) return;
        syncAllToWatch(context);
    }

    public static void syncTasksToWatch(Context context, String examDays, String tasksSummary, String allTasksJson) {
        if (context == null) return;
        syncAllToWatch(context);
    }

    public static void syncGpaToWatch(Context context, String gpaCurrent, String gpaBadge) {
        if (context == null) return;
        syncAllToWatch(context);
    }

    public static void sendTestNotificationToWatch(Context context, String title, String message) {
        if (context == null) return;
        try {
            JSONObject notifJson = new JSONObject();
            notifJson.put("title", (title != null && !title.isEmpty()) ? title : "🎓 סמסטרו ME • בדיקת התראה");
            notifJson.put("message", (message != null && !message.isEmpty()) ? message : "📍 אולמן 506 • משוואות דיפרנציאליות (בעוד 10 דק׳)");
            byte[] directBytes = notifJson.toString().getBytes(StandardCharsets.UTF_8);

            Wearable.getNodeClient(context).getConnectedNodes().addOnSuccessListener(nodes -> {
                if (nodes != null && !nodes.isEmpty()) {
                    for (Node node : nodes) {
                        Wearable.getMessageClient(context).sendMessage(
                            node.getId(),
                            PATH_TRIGGER_NOTIFICATION,
                            directBytes
                        ).addOnSuccessListener(res -> Log.d(TAG, "Sent test notif to watch node: " + node.getDisplayName()))
                         .addOnFailureListener(e -> Log.w(TAG, "Failed sending test notif to watch: " + e.getMessage()));
                    }
                }
            }).addOnFailureListener(e -> Log.w(TAG, "Failed querying nodes for test notif: " + e.getMessage()));
        } catch (Exception e) {
            Log.e(TAG, "Error sending test notif to watch: ", e);
        }
    }

}
