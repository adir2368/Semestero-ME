package com.technion.semestero.wear;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import java.util.Calendar;

/**
 * Semestero ME • Wear OS Notification Engine
 * High-priority heads-up reminders with custom vibration patterns for Galaxy Watch 8.
 */
public class WearNotificationHelper {

    public static final String CHANNEL_ID = "semestero_watch_alerts";
    public static final String CHANNEL_NAME = "התראות סמסטרו לשעון";
    public static final int NOTIF_ID_TEST = 1001;
    public static final int NOTIF_ID_CLASS = 1002;

    public static void ensureNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                NotificationChannel channel = nm.getNotificationChannel(CHANNEL_ID);
                if (channel == null) {
                    channel = new NotificationChannel(
                        CHANNEL_ID,
                        CHANNEL_NAME,
                        NotificationManager.IMPORTANCE_HIGH
                    );
                    channel.setDescription("התראות על שיעורים קרובים, חדרים ומבחנים");
                    channel.enableVibration(true);
                    channel.setVibrationPattern(new long[]{0, 350, 150, 350, 150, 350});
                    nm.createNotificationChannel(channel);
                }
            }
        }
    }

    public static void sendClassReminder(Context context, String title, String time, String room) {
        if (!hasNotificationPermission(context)) return;
        ensureNotificationChannel(context);

        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        // Physical haptic trigger
        triggerHaptic(context);

        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        NotificationCompat.WearableExtender wearableExtender = new NotificationCompat.WearableExtender()
            .setHintShowBackgroundOnly(false);

        String cleanRoom = room != null && room.startsWith("📍") ? room : ("📍 " + (room != null ? room : ""));
        String bodyText = cleanRoom + (time != null && !time.isEmpty() ? (" • 🕒 " + time) : "");

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_notification)
            .setContentTitle("⏰ בעוד 10 דקות: " + title)
            .setContentText(bodyText)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(bodyText))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setVibrate(new long[]{0, 350, 150, 350, 150, 350})
            .extend(wearableExtender)
            .setContentIntent(pendingIntent);

        nm.notify(NOTIF_ID_CLASS, builder.build());
    }

    public static void sendTestNotification(Context context) {
        if (!hasNotificationPermission(context)) return;
        ensureNotificationChannel(context);

        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        // Physical haptic trigger
        triggerHaptic(context);

        WearScheduleHelper.ScheduleResolution res = WearScheduleHelper.resolve(context, Calendar.getInstance());
        String notifTitle = "🎓 סמסטרו ME • " + (res.courseTitle != null && !res.courseTitle.isEmpty() ? res.courseTitle : "בדיקת התראה");
        String notifBody = "📍 " + (res.roomText != null ? res.roomText : "אולמן 506")
            + " • 🕒 " + (res.timeText != null ? res.timeText : "11:30")
            + (res.lecturerText != null && !res.lecturerText.isEmpty() ? ("\n" + res.lecturerText) : "");

        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        NotificationCompat.WearableExtender wearableExtender = new NotificationCompat.WearableExtender()
            .setHintShowBackgroundOnly(false);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_stat_notification)
            .setContentTitle(notifTitle)
            .setContentText(notifBody)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(notifBody))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setVibrate(new long[]{0, 400, 200, 400, 200, 400})
            .extend(wearableExtender)
            .setContentIntent(pendingIntent);

        nm.notify(NOTIF_ID_TEST, builder.build());
    }

    private static void triggerHaptic(Context context) {
        try {
            Vibrator v = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            if (v != null && v.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    v.vibrate(VibrationEffect.createWaveform(new long[]{0, 350, 150, 350}, -1));
                } else {
                    v.vibrate(new long[]{0, 350, 150, 350}, -1);
                }
            }
        } catch (Exception ignored) {}
    }

    public static boolean hasNotificationPermission(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return ContextCompat.checkSelfPermission(context, "android.permission.POST_NOTIFICATIONS") == PackageManager.PERMISSION_GRANTED;
        }
        return true;
    }
}
