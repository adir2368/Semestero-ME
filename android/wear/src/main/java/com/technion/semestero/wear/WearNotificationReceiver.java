package com.technion.semestero.wear;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Listens for local or external broadcast to trigger test notifications, pre-class reminders,
 * and automatic boundary complication/tile refreshes on Galaxy Watch 8.
 */
public class WearNotificationReceiver extends BroadcastReceiver {
    public static final String ACTION_TRIGGER_TEST = "com.technion.semestero.wear.TRIGGER_TEST_NOTIF";
    public static final String ACTION_BOUNDARY_REFRESH = "com.technion.semestero.wear.BOUNDARY_REFRESH";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || context == null) return;
        String action = intent.getAction();
        if (ACTION_TRIGGER_TEST.equals(action)) {
            WearNotificationHelper.sendTestNotification(context);
        } else if (ACTION_BOUNDARY_REFRESH.equals(action)) {
            boolean sendReminder = intent.getBooleanExtra("send_reminder", false);
            if (sendReminder) {
                String title = intent.getStringExtra("course_title");
                String time = intent.getStringExtra("course_time");
                String room = intent.getStringExtra("course_room");
                if (title != null && !title.isEmpty()) {
                    WearNotificationHelper.sendClassReminder(
                        context,
                        title,
                        time != null ? time : "",
                        room != null ? room : ""
                    );
                }
            }
            WearScheduleHelper.requestComplicationAndTileRefresh(context);
            WearScheduleHelper.scheduleNextBoundaryUpdate(context);
        }
    }
}
