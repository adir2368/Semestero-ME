package com.technion.semestero;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class SemesteroMiluimWidget extends AppWidgetProvider {

    public static final String PREFS_NAME = "SemesteroWidgetPrefs";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        String days = prefs.getString("miluim_days", "21");
        String badge = prefs.getString("miluim_badge", "🎖️ פעיל תשפ״ז");
        String right1 = prefs.getString("miluim_right_1", "✓ 2 נ״ז פטור אקדמי (מאושר)");
        String right2 = prefs.getString("miluim_right_2", "✓ זכאות למועד ג׳ בכל הקורסים");
        String right3 = prefs.getString("miluim_right_3", "✓ הקלטות פנופטו וסיוע חונכות");

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_miluim);
        views.setTextViewText(R.id.widget_miluim_days_count, days);
        views.setTextViewText(R.id.widget_miluim_status_badge, badge);
        views.setTextViewText(R.id.widget_miluim_right_1, right1);
        views.setTextViewText(R.id.widget_miluim_right_2, right2);
        views.setTextViewText(R.id.widget_miluim_right_3, right3);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        // Tap root to open Tasks tab with Miluim filter
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction(Intent.ACTION_VIEW);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("target_tab", "tasks");
        intent.putExtra("filter", "miluim");
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 301, intent, flags);
        views.setOnClickPendingIntent(R.id.widget_miluim_root, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    public static void pushUpdate(Context context) {
        AppWidgetManager man = AppWidgetManager.getInstance(context);
        ComponentName comp = new ComponentName(context, SemesteroMiluimWidget.class);
        int[] ids = man.getAppWidgetIds(comp);
        if (ids != null && ids.length > 0) {
            for (int id : ids) {
                updateAppWidget(context, man, id);
            }
        }
    }
}
