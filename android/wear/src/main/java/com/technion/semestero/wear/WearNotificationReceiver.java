package com.technion.semestero.wear;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Listens for local or external broadcast to trigger test notifications and reminders on Galaxy Watch 8.
 */
public class WearNotificationReceiver extends BroadcastReceiver {
    public static final String ACTION_TRIGGER_TEST = "com.technion.semestero.wear.TRIGGER_TEST_NOTIF";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent != null && ACTION_TRIGGER_TEST.equals(intent.getAction())) {
            WearNotificationHelper.sendTestNotification(context);
        }
    }
}
