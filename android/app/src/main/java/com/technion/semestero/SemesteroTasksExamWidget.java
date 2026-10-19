package com.technion.semestero;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class SemesteroTasksExamWidget extends AppWidgetProvider {

    public static final String PREFS_NAME = "SemesteroWidgetPrefs";
    public static final String ACTION_COMPLETE_TASK_1 = "com.technion.semestero.ACTION_COMPLETE_TASK_1";
    public static final String ACTION_COMPLETE_TASK_2 = "com.technion.semestero.ACTION_COMPLETE_TASK_2";

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        String action = intent != null ? intent.getAction() : null;
        if (ACTION_COMPLETE_TASK_1.equals(action)) {
            markTaskComplete(context, 1);
        } else if (ACTION_COMPLETE_TASK_2.equals(action)) {
            markTaskComplete(context, 2);
        }
    }

    private void markTaskComplete(Context context, int taskNum) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String taskIdKey = taskNum == 1 ? "task_1_id" : "task_2_id";
        String taskKey = taskNum == 1 ? "task_1" : "task_2";
        String doneKey = taskNum == 1 ? "task_1_done" : "task_2_done";
        String taskId = prefs.getString(taskIdKey, "");

        if (!taskId.isEmpty()) {
            String pending = prefs.getString("completed_from_widget_ids", "");
            String updatedPending = pending.isEmpty() ? taskId : pending + "," + taskId;
            prefs.edit()
                .putString("completed_from_widget_ids", updatedPending)
                .putBoolean(doneKey, true)
                .putString(taskKey, "✓ הושלם בהצלחה!")
                .apply();
        } else {
            prefs.edit()
                .putBoolean(doneKey, true)
                .putString(taskKey, "✓ סומן כהושלם!")
                .apply();
        }

        pushUpdate(context);
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        String examDays = prefs.getString("exam_days", "115");
        String examTitle = prefs.getString("exam_title", "מכניקת מוצקים 1");
        String examSub = prefs.getString("exam_sub", "מועד א' • 02/02/2027");
        String task1 = prefs.getString("task_1", "🔥 [פיזיקה 2מ] תרגיל בית 3 (נותר יום)");
        String task2 = prefs.getString("task_2", "⚡ [מכונות 1] דו״ח מעבדה 2 - הגשה (3 ימים)");
        String tasksSummary = prefs.getString("tasks_summary", "עוד 4 משימות פתוחות בלוח");
        boolean task1Done = prefs.getBoolean("task_1_done", false);
        boolean task2Done = prefs.getBoolean("task_2_done", false);

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_tasks_exam);
        views.setTextViewText(R.id.widget_exam_huge_days, examDays);
        views.setTextViewText(R.id.widget_exam_title, examTitle);
        views.setTextViewText(R.id.widget_exam_sub, examSub);
        views.setTextViewText(R.id.widget_task_item_1, (task1 != null && !task1.isEmpty()) ? task1 : "אין משימות פתוחות 🎉");

        views.setTextViewText(R.id.btn_complete_task_1, task1Done ? "✓" : "○");
        views.setTextColor(R.id.btn_complete_task_1, task1Done ? android.graphics.Color.parseColor("#34d399") : android.graphics.Color.parseColor("#94a3b8"));

        if (task2 != null && !task2.trim().isEmpty()) {
            views.setTextViewText(R.id.widget_task_item_2, task2);
            views.setViewVisibility(R.id.widget_task_row_2, android.view.View.VISIBLE);
            views.setTextViewText(R.id.btn_complete_task_2, task2Done ? "✓" : "○");
            views.setTextColor(R.id.btn_complete_task_2, task2Done ? android.graphics.Color.parseColor("#34d399") : android.graphics.Color.parseColor("#94a3b8"));
        } else {
            views.setViewVisibility(R.id.widget_task_row_2, android.view.View.GONE);
        }
        views.setTextViewText(R.id.widget_tasks_count_summary, tasksSummary);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        // Tap root to open Tasks tab
        Intent openTasksIntent = new Intent(context, MainActivity.class);
        openTasksIntent.setAction(Intent.ACTION_VIEW);
        openTasksIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        openTasksIntent.putExtra("target_tab", "tasks");
        PendingIntent pendingOpenTasks = PendingIntent.getActivity(context, 102, openTasksIntent, flags);
        views.setOnClickPendingIntent(R.id.widget_tasks_root, pendingOpenTasks);

        // Tap "+ הוסף משימה" to open app directly into Add Task modal
        Intent addTaskIntent = new Intent(context, MainActivity.class);
        addTaskIntent.setAction(Intent.ACTION_VIEW);
        addTaskIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        addTaskIntent.putExtra("target_tab", "tasks");
        addTaskIntent.putExtra("widget_action", "add_task");
        PendingIntent pendingAddTask = PendingIntent.getActivity(context, 103, addTaskIntent, flags);
        views.setOnClickPendingIntent(R.id.btn_widget_add_task, pendingAddTask);

        // Tap checkmark 1 to complete task 1 directly from home screen
        Intent complete1Intent = new Intent(context, SemesteroTasksExamWidget.class);
        complete1Intent.setAction(ACTION_COMPLETE_TASK_1);
        PendingIntent pendingComplete1 = PendingIntent.getBroadcast(context, 104, complete1Intent, flags);
        views.setOnClickPendingIntent(R.id.btn_complete_task_1, pendingComplete1);

        // Tap checkmark 2 to complete task 2 directly from home screen
        Intent complete2Intent = new Intent(context, SemesteroTasksExamWidget.class);
        complete2Intent.setAction(ACTION_COMPLETE_TASK_2);
        PendingIntent pendingComplete2 = PendingIntent.getBroadcast(context, 105, complete2Intent, flags);
        views.setOnClickPendingIntent(R.id.btn_complete_task_2, pendingComplete2);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    public static void pushUpdate(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName component = new ComponentName(context, SemesteroTasksExamWidget.class);
        int[] ids = manager.getAppWidgetIds(component);
        if (ids != null && ids.length > 0) {
            for (int id : ids) {
                updateAppWidget(context, manager, id);
            }
        }
    }
}
