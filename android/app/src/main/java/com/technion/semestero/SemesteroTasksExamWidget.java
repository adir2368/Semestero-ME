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

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_tasks_exam);
        views.setTextViewText(R.id.widget_exam_huge_days, examDays);
        views.setTextViewText(R.id.widget_exam_title, examTitle);
        views.setTextViewText(R.id.widget_exam_sub, examSub);
        views.setTextViewText(R.id.widget_task_item_1, (task1 != null && !task1.isEmpty()) ? task1 : "אין משימות פתוחות 🎉");
        if (task2 != null && !task2.trim().isEmpty()) {
            views.setTextViewText(R.id.widget_task_item_2, task2);
            views.setViewVisibility(R.id.widget_task_item_2, android.view.View.VISIBLE);
        } else {
            views.setViewVisibility(R.id.widget_task_item_2, android.view.View.GONE);
        }
        views.setTextViewText(R.id.widget_tasks_count_summary, tasksSummary);

        // Tap to open application in Tasks tab
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction(Intent.ACTION_VIEW);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("target_tab", "tasks");

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(context, 102, intent, flags);
        views.setOnClickPendingIntent(R.id.widget_tasks_root, pendingIntent);

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
