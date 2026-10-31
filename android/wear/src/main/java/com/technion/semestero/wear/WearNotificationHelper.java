package com.technion.semestero.wear;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

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
                    channel.setVibrationPattern(new long[]{0, 300, 150, 300});
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

        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("⏰ בעוד 10 דקות: " + title)
            .setContentText("📍 " + room + " • 🕒 " + time)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setVibrate(new long[]{0, 300, 150, 300})
            .setContentIntent(pendingIntent);

        nm.notify(NOTIF_ID_CLASS, builder.build());
    }

    public static void sendTestNotification(Context context) {
        if (!hasNotificationPermission(context)) return;
        ensureNotificationChannel(context);

        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        Intent intent = new Intent(context, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("🎓 סמסטרו ME • בדיקת רטט")
            .setContentText("📍 דנציגר 101 • חדו״א 2מ׳ (10:30)")
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setVibrate(new long[]{0, 400, 200, 400})
            .setContentIntent(pendingIntent);

        nm.notify(NOTIF_ID_TEST, builder.build());
    }

    public static boolean hasNotificationPermission(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return ContextCompat.checkSelfPermission(context, "android.permission.POST_NOTIFICATIONS") == PackageManager.PERMISSION_GRANTED;
        }
        return true;
    }
}
