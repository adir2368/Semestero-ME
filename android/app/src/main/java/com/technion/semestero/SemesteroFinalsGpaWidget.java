package com.technion.semestero;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class SemesteroFinalsGpaWidget extends AppWidgetProvider {

    public static final String PREFS_NAME = "SemesteroWidgetPrefs";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        String currentGpa = prefs.getString("gpa_current", "88.4");
        String targetGpa = prefs.getString("gpa_target", "יעד סמסטר: 90.0");
        String badge = prefs.getString("gpa_badge", "🏆 מצטיין דיקן");
        String examDays = prefs.getString("finals_exam_days", "106");
        String examName = prefs.getString("finals_exam_name", "ימים לבחינה");
        String examCourse = prefs.getString("finals_exam_course", "פיסיקה 2");

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_finals_gpa);
        views.setTextViewText(R.id.widget_gpa_current, currentGpa);
        views.setTextViewText(R.id.widget_gpa_target, targetGpa);
        views.setTextViewText(R.id.widget_gpa_honors_badge, badge);
        views.setTextViewText(R.id.widget_finals_exam_days, examDays);
        views.setTextViewText(R.id.widget_finals_exam_name, examName);
        views.setTextViewText(R.id.widget_finals_exam_course, examCourse);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        // Tap root to open Runway / Analytics tab
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction(Intent.ACTION_VIEW);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("target_tab", "runway");
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 501, intent, flags);
        views.setOnClickPendingIntent(R.id.widget_finals_gpa_root, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    public static void pushUpdate(Context context) {
        AppWidgetManager man = AppWidgetManager.getInstance(context);
        ComponentName comp = new ComponentName(context, SemesteroFinalsGpaWidget.class);
        int[] ids = man.getAppWidgetIds(comp);
        if (ids != null && ids.length > 0) {
            for (int id : ids) {
                updateAppWidget(context, man, id);
            }
        }
    }
}
