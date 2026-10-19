package com.technion.semestero;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import org.json.JSONArray;
import org.json.JSONObject;

public class SemesteroNextClassWidget extends AppWidgetProvider {

    public static final String PREFS_NAME = "SemesteroWidgetPrefs";
    public static final String ACTION_CLASS_NEXT = "com.technion.semestero.ACTION_CLASS_NEXT";
    public static final String ACTION_CLASS_PREV = "com.technion.semestero.ACTION_CLASS_PREV";
    public static final String ACTION_REFRESH = "com.technion.semestero.ACTION_REFRESH";

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        String action = intent != null ? intent.getAction() : null;
        if (ACTION_CLASS_NEXT.equals(action)) {
            cycleClass(context, 1);
        } else if (ACTION_CLASS_PREV.equals(action)) {
            cycleClass(context, -1);
        } else if (ACTION_REFRESH.equals(action)) {
            pushUpdate(context);
        }
    }

    private void cycleClass(Context context, int direction) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        int total = prefs.getInt("all_classes_count", 1);
        if (total <= 1) return;

        int current = prefs.getInt("class_index", 0);
        int next = (current + direction) % total;
        if (next < 0) next += total;

        prefs.edit().putInt("class_index", next).apply();
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

        String title = prefs.getString("class_title", "מכניקת מוצקים 2");
        String time = prefs.getString("class_time", "10:30 - 12:30");
        String details = prefs.getString("class_details", "📍 דנציגר 102 • הרצאה");
        String lecturer = prefs.getString("class_lecturer", "👨‍🏫 דניאל אורנשטיין");
        String status = prefs.getString("class_status", "⏰ מתחיל בעוד 10 דקות");
        int totalClasses = prefs.getInt("all_classes_count", 1);
        int currentIndex = prefs.getInt("class_index", 0);

        String classesJson = prefs.getString("all_classes_json", "");
        if (!classesJson.isEmpty() && totalClasses > 1) {
            try {
                JSONArray arr = new JSONArray(classesJson);
                if (currentIndex >= 0 && currentIndex < arr.length()) {
                    JSONObject c = arr.getJSONObject(currentIndex);
                    title = c.optString("title", title);
                    time = c.optString("time", time);
                    details = c.optString("details", details);
                    lecturer = c.optString("lecturer", lecturer);
                    status = c.optString("status", status);
                }
            } catch (Exception ignored) {}
        }

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_next_class);
        views.setTextViewText(R.id.widget_course_title, title);
        views.setTextViewText(R.id.widget_time_badge, time);
        views.setTextViewText(R.id.widget_class_details, details);
        views.setTextViewText(R.id.widget_class_lecturer, lecturer);
        views.setTextViewText(R.id.widget_status_text, status);
        views.setTextViewText(R.id.widget_class_page, (currentIndex + 1) + "/" + totalClasses);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        // Tap to open application in Timetable tab
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction(Intent.ACTION_VIEW);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("target_tab", "timetable");
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 101, intent, flags);
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

        // Previous Class Button
        Intent prevIntent = new Intent(context, SemesteroNextClassWidget.class);
        prevIntent.setAction(ACTION_CLASS_PREV);
        PendingIntent pendingPrev = PendingIntent.getBroadcast(context, 106, prevIntent, flags);
        views.setOnClickPendingIntent(R.id.btn_prev_class, pendingPrev);

        // Next Class Button
        Intent nextIntent = new Intent(context, SemesteroNextClassWidget.class);
        nextIntent.setAction(ACTION_CLASS_NEXT);
        PendingIntent pendingNext = PendingIntent.getBroadcast(context, 107, nextIntent, flags);
        views.setOnClickPendingIntent(R.id.btn_next_class, pendingNext);

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
