package com.technion.semestero;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;

public class SemesteroLaunchpadWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_launchpad);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        // Tap root to open Semestero ME
        Intent appIntent = new Intent(context, MainActivity.class);
        appIntent.setAction(Intent.ACTION_VIEW);
        appIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingApp = PendingIntent.getActivity(context, 200, appIntent, flags);
        views.setOnClickPendingIntent(R.id.widget_launchpad_root, pendingApp);

        // 1. Moodle 26 Quick Jump
        Intent moodleIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://moodle26.technion.ac.il/"));
        moodleIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        views.setOnClickPendingIntent(R.id.btn_launch_moodle, PendingIntent.getActivity(context, 201, moodleIntent, flags));

        // 2. Panopto Quick Jump
        Intent panoptoIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://panopto.technion.ac.il/"));
        panoptoIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        views.setOnClickPendingIntent(R.id.btn_launch_panopto, PendingIntent.getActivity(context, 202, panoptoIntent, flags));

        // 3. CheeseFork Quick Jump
        Intent cheeseIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://cheesefork.cf/"));
        cheeseIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        views.setOnClickPendingIntent(R.id.btn_launch_cheesefork, PendingIntent.getActivity(context, 203, cheeseIntent, flags));

        // 4. Campus SAP Quick Jump
        Intent campusIntent = new Intent(Intent.ACTION_VIEW, Uri.parse("https://campus.technion.ac.il/"));
        campusIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        views.setOnClickPendingIntent(R.id.btn_launch_campus, PendingIntent.getActivity(context, 204, campusIntent, flags));

        // 5. Drive & Summaries Quick Jump
        Intent driveIntent = new Intent(context, MainActivity.class);
        driveIntent.setAction(Intent.ACTION_VIEW);
        driveIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        driveIntent.putExtra("target_tab", "flowchart");
        driveIntent.putExtra("open_drive", true);
        views.setOnClickPendingIntent(R.id.btn_launch_drive, PendingIntent.getActivity(context, 205, driveIntent, flags));

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    public static void pushUpdate(Context context) {
        AppWidgetManager man = AppWidgetManager.getInstance(context);
        ComponentName comp = new ComponentName(context, SemesteroLaunchpadWidget.class);
        int[] ids = man.getAppWidgetIds(comp);
        if (ids != null && ids.length > 0) {
            for (int id : ids) {
                updateAppWidget(context, man, id);
            }
        }
    }
}
