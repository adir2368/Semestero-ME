package com.technion.semestero;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

public class SemesteroPomodoroWidget extends AppWidgetProvider {

    public static final String PREFS_NAME = "SemesteroWidgetPrefs";
    public static final String ACTION_POMODORO_TOGGLE = "com.technion.semestero.ACTION_POMODORO_TOGGLE";
    public static final String ACTION_POMODORO_MODE = "com.technion.semestero.ACTION_POMODORO_MODE";

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);

        String action = intent != null ? intent.getAction() : null;
        if (ACTION_POMODORO_TOGGLE.equals(action)) {
            toggleTimer(context);
        } else if (ACTION_POMODORO_MODE.equals(action)) {
            cycleMode(context);
        }
    }

    private void toggleTimer(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean isRunning = prefs.getBoolean("pomodoro_running", false);
        prefs.edit().putBoolean("pomodoro_running", !isRunning).apply();
        pushUpdate(context);
    }

    private void cycleMode(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String currentMode = prefs.getString("pomodoro_mode", "25m");
        String nextMode = "25m";
        String nextTime = "25:00";

        if ("25m".equals(currentMode)) {
            nextMode = "50m";
            nextTime = "50:00";
        } else if ("50m".equals(currentMode)) {
            nextMode = "90m";
            nextTime = "90:00";
        } else {
            nextMode = "25m";
            nextTime = "25:00";
        }

        prefs.edit()
            .putString("pomodoro_mode", nextMode)
            .putString("pomodoro_time", nextTime)
            .putBoolean("pomodoro_running", false)
            .apply();
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

        boolean isRunning = prefs.getBoolean("pomodoro_running", false);
        String timeDisplay = prefs.getString("pomodoro_time", "25:00");
        String mode = prefs.getString("pomodoro_mode", "25m");
        String taskTitle = prefs.getString("pomodoro_task", "🎯 פוקוס: פיסיקה 2מ • תרגיל בית 3");
        String dailyGoal = prefs.getString("pomodoro_goal", "🔥 3.5 / 5.0 שעות (70%)");

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_pomodoro);
        views.setTextViewText(R.id.widget_pomodoro_time, timeDisplay);
        views.setTextViewText(R.id.btn_pomodoro_mode, mode);
        views.setTextViewText(R.id.widget_pomodoro_task_title, taskTitle);
        views.setTextViewText(R.id.widget_pomodoro_daily_goal, dailyGoal);
        views.setTextViewText(R.id.btn_pomodoro_toggle, isRunning ? "⏸️ השהה" : "▶️ התחל");

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        // Tap root to open Runway / Timer in app
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction(Intent.ACTION_VIEW);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("target_tab", "runway");
        intent.putExtra("pomodoro_active", true);
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 601, intent, flags);
        views.setOnClickPendingIntent(R.id.widget_pomodoro_root, pendingIntent);

        // Play/Pause Action
        Intent toggleIntent = new Intent(context, SemesteroPomodoroWidget.class);
        toggleIntent.setAction(ACTION_POMODORO_TOGGLE);
        PendingIntent pendingToggle = PendingIntent.getBroadcast(context, 602, toggleIntent, flags);
        views.setOnClickPendingIntent(R.id.btn_pomodoro_toggle, pendingToggle);

        // Mode Cycle Action
        Intent modeIntent = new Intent(context, SemesteroPomodoroWidget.class);
        modeIntent.setAction(ACTION_POMODORO_MODE);
        PendingIntent pendingMode = PendingIntent.getBroadcast(context, 603, modeIntent, flags);
        views.setOnClickPendingIntent(R.id.btn_pomodoro_mode, pendingMode);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    public static void pushUpdate(Context context) {
        AppWidgetManager man = AppWidgetManager.getInstance(context);
        ComponentName comp = new ComponentName(context, SemesteroPomodoroWidget.class);
        int[] ids = man.getAppWidgetIds(comp);
        if (ids != null && ids.length > 0) {
            for (int id : ids) {
                updateAppWidget(context, man, id);
            }
        }
    }
}
