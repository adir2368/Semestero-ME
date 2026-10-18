package com.technion.semestero;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class SemesteroNextClassWidget extends AppWidgetProvider {

    public static final String PREFS_NAME = "SemesteroWidgetPrefs";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        String title = prefs.getString("class_title", "מכניקת מוצקים 2");
        String time = prefs.getString("class_time", "10:30 - 12:30");
        String details = prefs.getString("class_details", "📍 דנציגר 102 • הרצאה");
        String lecturer = prefs.getString("class_lecturer", "👨‍🏫 דניאל אורנשטיין");
        String status = prefs.getString("class_status", "⏰ מתחיל בעוד 10 דקות");

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_next_class);
        views.setTextViewText(R.id.widget_course_title, title);
        views.setTextViewText(R.id.widget_time_badge, time);
        views.setTextViewText(R.id.widget_class_details, details);
        views.setTextViewText(R.id.widget_class_lecturer, lecturer);
        views.setTextViewText(R.id.widget_status_text, status);

        // Tap to open application in Timetable tab
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction(Intent.ACTION_VIEW);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("target_tab", "timetable");

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(context, 101, intent, flags);
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    public static void pushUpdate(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName component = new ComponentName(context, SemesteroNextClassWidget.class);
        int[] ids = manager.getAppWidgetIds(component);
        if (ids != null && ids.length > 0) {
            for (int id : ids) {
                updateAppWidget(context, manager, id);
            }
        }
    }
}
