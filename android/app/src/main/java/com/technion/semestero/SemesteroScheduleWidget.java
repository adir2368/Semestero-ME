package com.technion.semestero;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class SemesteroScheduleWidget extends AppWidgetProvider {

    public static final String PREFS_NAME = "SemesteroWidgetPrefs";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        String totalHours = prefs.getString("sched_total_hours", "0 ש״ס • טרם הוגדרה מערכת");
        String sun = prefs.getString("sched_sun", "אין שיעורים מתוזמנים");
        String mon = prefs.getString("sched_mon", "אין שיעורים מתוזמנים");
        String tue = prefs.getString("sched_tue", "אין שיעורים מתוזמנים");
        String wed = prefs.getString("sched_wed", "אין שיעורים מתוזמנים");
        String thu = prefs.getString("sched_thu", "אין שיעורים מתוזמנים");

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_schedule);
        views.setTextViewText(R.id.widget_schedule_total_hours, totalHours);
        views.setTextViewText(R.id.widget_sched_day_sun, sun);
        views.setTextViewText(R.id.widget_sched_day_mon, mon);
        views.setTextViewText(R.id.widget_sched_day_tue, tue);
        views.setTextViewText(R.id.widget_sched_day_wed, wed);
        views.setTextViewText(R.id.widget_sched_day_thu, thu);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        // Tap root to open Timetable tab
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction(Intent.ACTION_VIEW);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("target_tab", "timetable");
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 401, intent, flags);
        views.setOnClickPendingIntent(R.id.widget_schedule_root, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    public static void pushUpdate(Context context) {
        AppWidgetManager man = AppWidgetManager.getInstance(context);
        ComponentName comp = new ComponentName(context, SemesteroScheduleWidget.class);
        int[] ids = man.getAppWidgetIds(comp);
        if (ids != null && ids.length > 0) {
            for (int id : ids) {
                updateAppWidget(context, man, id);
            }
        }
    }
}
