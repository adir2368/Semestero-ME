package com.technion.semestero;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;
import com.google.android.gms.tasks.Task;
import com.google.android.gms.wearable.DataItem;
import com.google.android.gms.wearable.PutDataMapRequest;
import com.google.android.gms.wearable.PutDataRequest;
import com.google.android.gms.wearable.Wearable;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

/**
 * WearSyncManager • Synchronizes academic schedule, tasks, and GPA to Galaxy Watch 8.
 * Supports consolidated atomic payloads and bidirectional request-response triggers.
 */
public class WearSyncManager {
    private static final String TAG = "WearSyncManager";
    public static final String SYNC_PATH = "/semestero/watch_sync";

    private static final String[] HEBREW_DAYS = {
        "", "יום ראשון", "יום שני", "יום שלישי", "יום רביעי", "יום חמישי", "יום שישי", "שבת"
    };

    /**
     * Pushes a complete, consolidated synchronization payload to all paired Wear OS devices.
     */
    public static void syncAllToWatch(Context context) {
        if (context == null) return;
        try {
            PutDataMapRequest mapRequest = PutDataMapRequest.create(SYNC_PATH);

            // 1. Current Day & Date Resolution
            Calendar cal = Calendar.getInstance();
            int dayOfWeek = cal.get(Calendar.DAY_OF_WEEK); // 1 = Sunday, ..., 7 = Saturday
            String dayName = (dayOfWeek >= 1 && dayOfWeek <= 7) ? HEBREW_DAYS[dayOfWeek] : "יום ראשון";
            SimpleDateFormat sdf = new SimpleDateFormat("d בMMMM", new Locale("he", "IL"));
            String dateFormatted = sdf.format(cal.getTime());

            mapRequest.getDataMap().putInt("day_index", dayOfWeek - 1);
            mapRequest.getDataMap().putString("day_name", dayName);
            mapRequest.getDataMap().putString("date_formatted", dateFormatted);

            // 2. Class & Schedule Data from SharedPreferences
            SharedPreferences classPrefs = context.getSharedPreferences(SemesteroNextClassWidget.PREFS_NAME, Context.MODE_PRIVATE);
            String title = classPrefs.getString("class_title", "אין שיעורים קרובים היום");
            String time = classPrefs.getString("class_time", "--:--");
            String details = classPrefs.getString("class_details", "יום חופשי או שהסתיימו הלימודים 🎉");
            String lecturer = classPrefs.getString("class_lecturer", "טכניון • סמסטר חורף");
            String status = classPrefs.getString("class_status", "חופשי");
            String classesJson = classPrefs.getString("all_classes_json", "[]");
            int classesCount = classPrefs.getInt("all_classes_count", 0);

            mapRequest.getDataMap().putString("class_title", title);
            mapRequest.getDataMap().putString("class_time", time);
            mapRequest.getDataMap().putString("class_details", details);
            mapRequest.getDataMap().putString("class_lecturer", lecturer);
            mapRequest.getDataMap().putString("class_status", status);
            mapRequest.getDataMap().putString("all_classes_json", classesJson);
            mapRequest.getDataMap().putInt("all_classes_count", classesCount);

            // 3. Tasks & Exams Data
            SharedPreferences tasksPrefs = context.getSharedPreferences(SemesteroTasksExamWidget.PREFS_NAME, Context.MODE_PRIVATE);
            String examDays = tasksPrefs.getString("exam_days", "--");
            String examTitle = tasksPrefs.getString("exam_title", "אין בחינות קרובות");
            String examSub = tasksPrefs.getString("exam_sub", "סמסטר חורף תשפ״ז");
            String task1 = tasksPrefs.getString("task_1", "");
            String task2 = tasksPrefs.getString("task_2", "");
            String tasksSummary = tasksPrefs.getString("tasks_summary", "0 משימות פתוחות");
            String allTasksJson = tasksPrefs.getString("all_tasks_json", "[]");

            mapRequest.getDataMap().putString("exam_days", examDays);
            mapRequest.getDataMap().putString("exam_title", examTitle);
            mapRequest.getDataMap().putString("exam_sub", examSub);
            mapRequest.getDataMap().putString("task_1", task1);
            mapRequest.getDataMap().putString("task_2", task2);
            mapRequest.getDataMap().putString("tasks_summary", tasksSummary);
            mapRequest.getDataMap().putString("all_tasks_json", allTasksJson);

            // 4. GPA & Academic Standing
            SharedPreferences gpaPrefs = context.getSharedPreferences(SemesteroFinalsGpaWidget.PREFS_NAME, Context.MODE_PRIVATE);
            String gpaCurrent = gpaPrefs.getString("gpa_current", "86.04");
            String gpaBadge = gpaPrefs.getString("gpa_badge", "🎖️ הצטיינות דיקן");

            mapRequest.getDataMap().putString("gpa_current", gpaCurrent);
            mapRequest.getDataMap().putString("gpa_badge", gpaBadge);

            // 5. Weekly Schedule Summary
            SharedPreferences schedPrefs = context.getSharedPreferences(SemesteroScheduleWidget.PREFS_NAME, Context.MODE_PRIVATE);
            mapRequest.getDataMap().putString("sched_total_hours", schedPrefs.getString("sched_total_hours", ""));
            mapRequest.getDataMap().putString("sched_sun", schedPrefs.getString("sched_sun", ""));
            mapRequest.getDataMap().putString("sched_mon", schedPrefs.getString("sched_mon", ""));
            mapRequest.getDataMap().putString("sched_tue", schedPrefs.getString("sched_tue", ""));
            mapRequest.getDataMap().putString("sched_wed", schedPrefs.getString("sched_wed", ""));
            mapRequest.getDataMap().putString("sched_thu", schedPrefs.getString("sched_thu", ""));

            mapRequest.getDataMap().putLong("timestamp", System.currentTimeMillis());

            PutDataRequest request = mapRequest.asPutDataRequest();
            request.setUrgent();

            Task<DataItem> dataItemTask = Wearable.getDataClient(context).putDataItem(request);
            dataItemTask.addOnSuccessListener(dataItem -> Log.d(TAG, "Successfully synced consolidated data to Galaxy Watch: " + dayName + " (" + title + ")"))
                        .addOnFailureListener(e -> Log.w(TAG, "Failed to sync consolidated data to Galaxy Watch: " + e.getMessage()));
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
}
