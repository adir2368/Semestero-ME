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
    public static final String ACTION_MILUIM_INCREMENT = "com.technion.semestero.ACTION_MILUIM_INCREMENT";
    public static final String ACTION_MILUIM_DECREMENT = "com.technion.semestero.ACTION_MILUIM_DECREMENT";

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent != null ? intent.getAction() : null;
        if (ACTION_MILUIM_INCREMENT.equals(action) || ACTION_MILUIM_DECREMENT.equals(action)) {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String daysStr = prefs.getString("miluim_days", "21");
            int days = 21;
            try {
                days = Integer.parseInt(daysStr.trim());
            } catch (Exception ignored) {}

            if (ACTION_MILUIM_INCREMENT.equals(action)) {
                days = Math.min(365, days + 1);
            } else {
                days = Math.max(0, days - 1);
            }

            String badge = days > 0 ? "🎖️ פעיל תשפ״ז" : "💤 ללא שמ״פ";
            String r1, r2, r3;
            if (days >= 21) {
                r1 = "✓ 2 נ״ז פטור אקדמי (מאושר)";
                r2 = "✓ זכאות למועד ג׳ בכל הקורסים";
                r3 = "✓ הקלטות פנופטו וסיוע חונכות";
            } else if (days >= 14) {
                r1 = "✓ 1 נ״ז פטור אקדמי (מאושר)";
                r2 = "✓ זכאות למועד ג׳ בכל הקורסים";
                r3 = "✓ הקלטות פנופטו וסיוע חונכות";
            } else if (days >= 10) {
                r1 = "✓ זכאות למועד ג׳ בכל הקורסים";
                r2 = "✓ דחיית מטלות והתאמות הגשה";
                r3 = "✓ פנופטו פתוח וסיוע אקדמי";
            } else if (days > 0) {
                r1 = "✓ דחיית מועדי הגשת תרגילים";
                r2 = "✓ פנופטו פתוח לקורסי הסמסטר";
                r3 = "✓ התאמות היעדרות פרטניות";
            } else {
                r1 = "• 0 ימי שמ״פ פעילים";
                r2 = "• ניתן לעדכן ב- + / -";
                r3 = "• זכויות יחושבו אוטומטית";
            }

            prefs.edit()
                .putString("miluim_days", String.valueOf(days))
                .putString("miluim_badge", badge)
                .putString("miluim_right_1", r1)
                .putString("miluim_right_2", r2)
                .putString("miluim_right_3", r3)
                .putInt("pending_miluim_days_sync", days)
                .putLong("pending_miluim_sync_ts", System.currentTimeMillis())
                .apply();

            pushUpdate(context);
        }
    }

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

        // Interactive + / - PendingIntents
        Intent plusIntent = new Intent(context, SemesteroMiluimWidget.class);
        plusIntent.setAction(ACTION_MILUIM_INCREMENT);
        PendingIntent plusPi = PendingIntent.getBroadcast(context, 302, plusIntent, flags);
        views.setOnClickPendingIntent(R.id.btn_miluim_plus, plusPi);

        Intent minusIntent = new Intent(context, SemesteroMiluimWidget.class);
        minusIntent.setAction(ACTION_MILUIM_DECREMENT);
        PendingIntent minusPi = PendingIntent.getBroadcast(context, 303, minusIntent, flags);
        views.setOnClickPendingIntent(R.id.btn_miluim_minus, minusPi);

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
