package com.technion.semestero.wear;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Vibrator;
import android.util.Log;
import android.view.InputDevice;
import android.view.MotionEvent;
import android.widget.Button;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import com.google.android.gms.wearable.Node;
import com.google.android.gms.wearable.Wearable;

import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

public class MainActivity extends Activity {

    public static final String PREFS_NAME = "semestero_wear_prefs";
    public static final String PATH_REQUEST_SYNC = "/semestero/request_sync";
    private static final String TAG = "WearMainActivity";
    private static final int PERMISSION_REQ_NOTIF = 201;

    private static final String[] HEBREW_DAYS = {
        "", "יום ראשון", "יום שני", "יום שלישי", "יום רביעי", "יום חמישי", "יום שישי", "שבת"
    };

    private ScrollView scrollView;
    private TextView tvCurrentDay;
    private TextView tvSyncStatus;
    private TextView tvClassStatus;
    private TextView tvClassTitle;
    private TextView tvClassTime;
    private TextView tvClassRoom;
    private TextView tvExamCountdown;
    private TextView tvTasksSummary;
    private TextView tvGpaVal;
    private TextView tvHonorsBadge;
    private Button btnRefresh;
    private Button btnTestNotif;
    private Vibrator vibrator;

    private final BroadcastReceiver syncReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            updateUIFromPrefsAndSchedule();
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        scrollView = findViewById(R.id.wear_scroll_view);
        tvCurrentDay = findViewById(R.id.tv_current_day);
        tvSyncStatus = findViewById(R.id.tv_sync_status);
        tvClassStatus = findViewById(R.id.tv_class_status);
        tvClassTitle = findViewById(R.id.tv_class_title);
        tvClassTime = findViewById(R.id.tv_class_time);
        tvClassRoom = findViewById(R.id.tv_class_room);
        tvExamCountdown = findViewById(R.id.tv_exam_countdown);
        tvTasksSummary = findViewById(R.id.tv_tasks_summary);
        tvGpaVal = findViewById(R.id.tv_gpa_val);
        tvHonorsBadge = findViewById(R.id.tv_honors_badge);
        btnRefresh = findViewById(R.id.btn_refresh_watch);
        btnTestNotif = findViewById(R.id.btn_test_notif);

        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);

        // Ensure notification channel is initialized on watch
        WearNotificationHelper.ensureNotificationChannel(this);

        // Request POST_NOTIFICATIONS permission on Wear OS 4/5 (Android 13+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, PERMISSION_REQ_NOTIF);
            }
        }

        btnRefresh.setOnClickListener(v -> {
            if (vibrator != null) vibrator.vibrate(35);
            requestSyncFromPhone();
            updateUIFromPrefsAndSchedule();
            Toast.makeText(this, "מבקש סנכרון מהטלפון... 🔄", Toast.LENGTH_SHORT).show();
        });

        if (btnTestNotif != null) {
            btnTestNotif.setOnClickListener(v -> {
                if (vibrator != null) vibrator.vibrate(50);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                    checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, PERMISSION_REQ_NOTIF);
                } else {
                    WearNotificationHelper.sendTestNotification(this);
                    Toast.makeText(this, "התראה נשלחה לשעון!", Toast.LENGTH_SHORT).show();
                }
            });
        }

        // Auto-request sync on startup
        requestSyncFromPhone();

        // Ensure rotary bezel events focus on the scrollview
        scrollView.requestFocus();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(syncReceiver, new IntentFilter(WearDataSyncService.ACTION_DATA_SYNCED), RECEIVER_EXPORTED);
        } else {
            registerReceiver(syncReceiver, new IntentFilter(WearDataSyncService.ACTION_DATA_SYNCED));
        }
        updateUIFromPrefsAndSchedule();
        scrollView.requestFocus();
    }

    @Override
    protected void onPause() {
        super.onPause();
        try {
            unregisterReceiver(syncReceiver);
        } catch (Exception ignored) {}
    }

    /**
     * Samsung Galaxy Watch 8 Physical / Virtual Rotating Bezel Support.
     * Captures rotary encoder delta and scrolls the layout with haptic feedback.
     */
    @Override
    public boolean onGenericMotionEvent(MotionEvent event) {
        if (event.getAction() == MotionEvent.ACTION_SCROLL && 
            (event.isFromSource(InputDevice.SOURCE_ROTARY_ENCODER) || event.isFromSource(InputDevice.SOURCE_CLASS_POINTER))) {
            
            float delta = -event.getAxisValue(MotionEvent.AXIS_SCROLL);
            int scrollAmount = Math.round(delta * 45); // Scaled for smooth Wear OS scrolling
            scrollView.smoothScrollBy(0, scrollAmount);
            
            if (vibrator != null && Math.abs(scrollAmount) > 10) {
                vibrator.vibrate(10); // Subtle haptic tick per detent
            }
            return true;
        }
        return super.onGenericMotionEvent(event);
    }

    /**
     * Sends an immediate message to the phone companion requesting fresh sync data.
     */
    public void requestSyncFromPhone() {
        try {
            Wearable.getNodeClient(this).getConnectedNodes().addOnSuccessListener(nodes -> {
                if (nodes != null && !nodes.isEmpty()) {
                    for (Node node : nodes) {
                        Wearable.getMessageClient(this).sendMessage(
                            node.getId(),
                            PATH_REQUEST_SYNC,
                            "SYNC".getBytes(StandardCharsets.UTF_8)
                        ).addOnSuccessListener(res -> Log.d(TAG, "Sent sync request to phone node: " + node.getDisplayName()))
                         .addOnFailureListener(e -> Log.w(TAG, "Failed sending sync request to node: " + e.getMessage()));
                    }
                } else {
                    Log.d(TAG, "No connected phone nodes currently reachable; evaluating standalone schedule.");
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Error querying connected nodes: ", e);
        }
    }

    /**
     * Evaluates current Hebrew day, date, and resolves the class radar.
     * Guaranteed to accurately show today's day even if offline/unsynced!
     */
    public void updateUIFromPrefsAndSchedule() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        // 1. Calculate authentic current day and formatted date
        Calendar now = Calendar.getInstance();
        int dayOfWeek = now.get(Calendar.DAY_OF_WEEK); // 1 = Sunday, ..., 7 = Saturday
        String curDayName = (dayOfWeek >= 1 && dayOfWeek <= 7) ? HEBREW_DAYS[dayOfWeek] : "יום ראשון";

        SimpleDateFormat sdf = new SimpleDateFormat("d בMMMM", new Locale("he", "IL"));
        String formattedDate = sdf.format(now.getTime());

        if (tvCurrentDay != null) {
            tvCurrentDay.setText(curDayName + " • " + formattedDate);
        }

        // 2. Sync Status indicator
        long lastSync = prefs.getLong("last_sync_timestamp", 0);
        long nowMs = System.currentTimeMillis();
        boolean isFreshSync = (lastSync > 0) && ((nowMs - lastSync) < 24 * 3600 * 1000);

        if (tvSyncStatus != null) {
            if (isFreshSync) {
                tvSyncStatus.setText("⚡ מסונכרן עם הטלפון");
                tvSyncStatus.setTextColor(getColor(R.color.cyan_accent));
            } else {
                tvSyncStatus.setText("🕒 שעון עצמאי (Technion Radar)");
                tvSyncStatus.setTextColor(getColor(R.color.text_secondary));
            }
        }

        // 3. Resolve class data:
        // If prefs contains synced data for today, use it. Otherwise, compute from Technion timetable.
        String syncedDay = prefs.getString("day_name", "");
        boolean hasMatchingDaySync = isFreshSync && (curDayName.equals(syncedDay) || (prefs.getInt("day_index", -1) == (dayOfWeek - 1)));

        String classTitle;
        String classTime;
        String classRoom;
        String classStatus;

        if (hasMatchingDaySync && prefs.contains("class_title")) {
            classTitle = prefs.getString("class_title", "אין שיעורים קרובים היום");
            classTime = prefs.getString("class_time", "--:--");
            classRoom = prefs.getString("class_details", "יום חופשי או שהסתיימו הלימודים 🎉");
            classStatus = prefs.getString("class_status", "חופשי");
        } else {
            // Built-in authentic Technion Mechanical Engineering Schedule (Winter 2026/2027)
            int curHour = now.get(Calendar.HOUR_OF_DAY);
            int curMin = now.get(Calendar.MINUTE);
            int curTotalMin = curHour * 60 + curMin;

            switch (dayOfWeek) {
                case Calendar.SUNDAY: // יום ראשון
                    classTitle = "משוואות דיפרנציאליות חלקיות מ'";
                    classTime = "11:30 - 13:30";
                    classRoom = "📍 אולמן 506 • תרגול 22 (אמתי אלפרין)";
                    if (curTotalMin >= 690 && curTotalMin <= 810) {
                        classStatus = "🟢 מתקיים כעת!";
                    } else if (curTotalMin < 690) {
                        int diff = 690 - curTotalMin;
                        classStatus = diff <= 60 ? "⏰ מתחיל בעוד " + diff + " דק'" : "⏳ השיעור הבא היום";
                    } else {
                        classStatus = "🎉 הסתיימו הלימודים להיום";
                        classRoom = "השיעור הבא מחר: פיסיקה 2 ב-08:30 (טאוב)";
                    }
                    break;

                case Calendar.MONDAY: // יום שני
                    if (curTotalMin < 630) {
                        classTitle = "פיסיקה 2";
                        classTime = "08:30 - 10:30";
                        classRoom = "📍 טאוב 1 • הרצאה 10 (ד\"ר גדעון אלון)";
                        classStatus = curTotalMin >= 510 ? "🟢 מתקיים כעת!" : "⏳ השיעור הבא היום";
                    } else if (curTotalMin <= 870) {
                        classTitle = "מכניקת מוצקים 2מ'";
                        classTime = "10:30 - 14:30";
                        classRoom = "📍 הנדסה כימית 1 • הרצאה 10";
                        classStatus = curTotalMin >= 630 ? "🟢 מתקיים כעת!" : "⏳ השיעור הבא היום";
                    } else {
                        classTitle = "מכניקת מוצקים 2מ'";
                        classTime = "10:30 - 14:30";
                        classRoom = "השיעור הבא מחר: תרמודינמיקה 1 ב-08:30";
                        classStatus = "🎉 הסתיימו הלימודים להיום";
                    }
                    break;

                case Calendar.TUESDAY: // יום שלישי
                    classTitle = "תרמודינמיקה 1";
                    classTime = "08:30 - 11:30";
                    classRoom = "📍 הנדסה כימית 1 • הרצאה 10";
                    classStatus = (curTotalMin >= 510 && curTotalMin <= 690) ? "🟢 מתקיים כעת!" : (curTotalMin < 510 ? "⏳ השיעור הבא היום" : "🎉 הסתיימו הלימודים להיום");
                    break;

                case Calendar.WEDNESDAY: // יום רביעי
                    classTitle = "מכניקת מוצקים 2מ'";
                    classTime = "12:30 - 14:30";
                    classRoom = "📍 ליידי דייוויס 240 • תרגול";
                    classStatus = (curTotalMin >= 750 && curTotalMin <= 870) ? "🟢 מתקיים כעת!" : (curTotalMin < 750 ? "⏳ השיעור הבא היום" : "🎉 הסתיימו הלימודים להיום");
                    break;

                case Calendar.THURSDAY: // יום חמישי
                    classTitle = "גרפיקה הנדסית וכתיבה טכנית";
                    classTime = "09:30 - 11:30";
                    classRoom = "📍 דנציגר • הרצאה 10";
                    classStatus = (curTotalMin >= 570 && curTotalMin <= 690) ? "🟢 מתקיים כעת!" : (curTotalMin < 570 ? "⏳ השיעור הבא היום" : "🎉 סופ״ש מתחיל!");
                    break;

                case Calendar.FRIDAY: // יום שישי
                    classTitle = "יום שישי - יום חופשי";
                    classTime = "סופ״ש נעים 🏖️";
                    classRoom = "ללא שיעורים פרונטליים. זמן מעולה לפרויקטים";
                    classStatus = "🏖️ יום חופשי";
                    break;

                case Calendar.SATURDAY: // שבת
                default:
                    classTitle = "שבת שלום ומנוחה! 🕯️";
                    classTime = "סופ״ש";
                    classRoom = "שבוע חדש מתחיל מחר (יום ראשון) ב-11:30";
                    classStatus = "🕯️ שבת שלום";
                    break;
            }
        }

        tvClassTitle.setText(classTitle);
        tvClassTime.setText(classTime);
        tvClassRoom.setText(classRoom);
        tvClassStatus.setText(classStatus);

        // 4. Tasks & Exam Countdown
        String examDays = prefs.getString("exam_days", "מבחן מועד א׳ בעוד 14 יום");
        String tasksSummary = prefs.getString("tasks_summary", "2 משימות פתוחות במודל");
        tvExamCountdown.setText(examDays);
        tvTasksSummary.setText(tasksSummary);

        // 5. GPA & Academic Standing
        String gpaVal = prefs.getString("gpa_current", "86.04");
        String honors = prefs.getString("gpa_badge", "🎖️ הצטיינות דיקן");
        tvGpaVal.setText(gpaVal);
        tvHonorsBadge.setText(honors);
    }
}
