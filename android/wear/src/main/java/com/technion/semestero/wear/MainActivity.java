package com.technion.semestero.wear;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Paint;
import android.os.Build;
import android.os.Bundle;
import android.os.Vibrator;
import android.util.Log;
import android.view.InputDevice;
import android.view.MotionEvent;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
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
    public static final String PATH_COMPLETE_TASK = "/semestero/complete_task";
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
    private TextView tvTasksToggleHint;
    private LinearLayout cardTasksExam;
    private LinearLayout layoutOpenTasksExpanded;

    // Task 1
    private LinearLayout taskItemView1;
    private TextView tvTask1Title;
    private TextView tvTask1Due;
    private TextView btnCompleteTask1;
    private boolean task1Done = false;

    // Task 2
    private LinearLayout taskItemView2;
    private TextView tvTask2Title;
    private TextView tvTask2Due;
    private TextView btnCompleteTask2;
    private boolean task2Done = false;

    // Task 3
    private LinearLayout taskItemView3;
    private TextView tvTask3Title;
    private TextView tvTask3Due;
    private TextView btnCompleteTask3;
    private boolean task3Done = false;

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
        tvTasksToggleHint = findViewById(R.id.tv_tasks_toggle_hint);
        cardTasksExam = findViewById(R.id.card_tasks_exam);
        layoutOpenTasksExpanded = findViewById(R.id.layout_open_tasks_expanded);

        // Task 1 views
        taskItemView1 = findViewById(R.id.task_item_view_1);
        tvTask1Title = findViewById(R.id.tv_task_1_title);
        tvTask1Due = findViewById(R.id.tv_task_1_due);
        btnCompleteTask1 = findViewById(R.id.btn_complete_wear_task_1);

        // Task 2 views
        taskItemView2 = findViewById(R.id.task_item_view_2);
        tvTask2Title = findViewById(R.id.tv_task_2_title);
        tvTask2Due = findViewById(R.id.tv_task_2_due);
        btnCompleteTask2 = findViewById(R.id.btn_complete_wear_task_2);

        // Task 3 views
        taskItemView3 = findViewById(R.id.task_item_view_3);
        tvTask3Title = findViewById(R.id.tv_task_3_title);
        tvTask3Due = findViewById(R.id.tv_task_3_due);
        btnCompleteTask3 = findViewById(R.id.btn_complete_wear_task_3);

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

        // Tap on Card 2 (Tasks) to inspect and reveal open tasks
        if (cardTasksExam != null) {
            cardTasksExam.setOnClickListener(v -> {
                if (vibrator != null) vibrator.vibrate(25);
                boolean currentlyExpanded = (layoutOpenTasksExpanded != null && layoutOpenTasksExpanded.getVisibility() == View.VISIBLE);
                if (currentlyExpanded) {
                    if (layoutOpenTasksExpanded != null) layoutOpenTasksExpanded.setVisibility(View.GONE);
                    if (tvTasksToggleHint != null) tvTasksToggleHint.setText("👇 לחץ לצפייה במשימות הפתוחות");
                } else {
                    if (layoutOpenTasksExpanded != null) layoutOpenTasksExpanded.setVisibility(View.VISIBLE);
                    if (tvTasksToggleHint != null) tvTasksToggleHint.setText("▲ לחץ לצמצום הרשימה");
                    // Smoothly scroll down so the full open tasks list is centered in the round screen
                    if (scrollView != null) {
                        scrollView.postDelayed(() -> {
                            int targetY = cardTasksExam.getTop() - 20;
                            scrollView.smoothScrollTo(0, Math.max(0, targetY));
                        }, 80);
                    }
                }
            });
        }

        // Task 1 interactive completion button
        if (btnCompleteTask1 != null) {
            btnCompleteTask1.setOnClickListener(v -> {
                task1Done = !task1Done;
                updateTaskDoneState(1, task1Done);
            });
        }

        // Task 2 interactive completion button
        if (btnCompleteTask2 != null) {
            btnCompleteTask2.setOnClickListener(v -> {
                task2Done = !task2Done;
                updateTaskDoneState(2, task2Done);
            });
        }

        // Task 3 interactive completion button
        if (btnCompleteTask3 != null) {
            btnCompleteTask3.setOnClickListener(v -> {
                task3Done = !task3Done;
                updateTaskDoneState(3, task3Done);
            });
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

    private void updateTaskDoneState(int taskIndex, boolean isDone) {
        if (vibrator != null) {
            if (isDone) {
                vibrator.vibrate(40);
            } else {
                vibrator.vibrate(20);
            }
        }

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putBoolean("wear_task_" + taskIndex + "_done", isDone).apply();

        TextView titleView = (taskIndex == 1) ? tvTask1Title : ((taskIndex == 2) ? tvTask2Title : tvTask3Title);
        TextView btnView = (taskIndex == 1) ? btnCompleteTask1 : ((taskIndex == 2) ? btnCompleteTask2 : btnCompleteTask3);

        if (titleView != null) {
            if (isDone) {
                titleView.setPaintFlags(titleView.getPaintFlags() | Paint.STRIKE_THRU_TEXT_FLAG);
                titleView.setTextColor(getColor(R.color.text_secondary));
            } else {
                titleView.setPaintFlags(titleView.getPaintFlags() & (~Paint.STRIKE_THRU_TEXT_FLAG));
                titleView.setTextColor(getColor(R.color.text_primary));
            }
        }

        if (btnView != null) {
            if (isDone) {
                btnView.setText("🎉 בוצע!");
                btnView.setTextColor(getColor(R.color.emerald_green));
            } else {
                btnView.setText("✓ סמן כבוצע");
                btnView.setTextColor(getColor(R.color.emerald_green));
            }
        }

        // Recompute open tasks summary count
        int openCount = (task1Done ? 0 : 1) + (task2Done ? 0 : 1) + (task3Done ? 0 : 1);
        if (tvTasksSummary != null) {
            if (openCount == 0) {
                tvTasksSummary.setText("🎉 כל המשימות בוצעו!");
            } else if (openCount == 1) {
                tvTasksSummary.setText("משימה אחת פתוחה להגשה");
            } else {
                tvTasksSummary.setText(openCount + " משימות פתוחות להגשה");
            }
        }

        // Send task completion message to phone companion
        notifyPhoneTaskStatus(taskIndex, isDone);
    }

    private void notifyPhoneTaskStatus(int taskIndex, boolean isDone) {
        try {
            Wearable.getNodeClient(this).getConnectedNodes().addOnSuccessListener(nodes -> {
                if (nodes != null) {
                    for (Node node : nodes) {
                        String payload = taskIndex + ":" + (isDone ? "1" : "0");
                        Wearable.getMessageClient(this).sendMessage(
                            node.getId(),
                            PATH_COMPLETE_TASK,
                            payload.getBytes(StandardCharsets.UTF_8)
                        );
                    }
                }
            });
        } catch (Exception ignored) {}
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
        int curHour = now.get(Calendar.HOUR_OF_DAY);
        int curMin = now.get(Calendar.MINUTE);
        int curTotalMin = curHour * 60 + curMin;
        boolean isEvening = (curHour >= 17);

        // If prefs contains synced data for today and it's not evening without next-day data, use it.
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
            // Rules:
            // 1) 15 minutes after start of previous class (startMin + 15), switch silently to next class!
            // 2) In the evening (>= 17:00) or once today's classes finish, preview tomorrow / next school day!
            switch (dayOfWeek) {
                case Calendar.SUNDAY: // יום ראשון
                    // Class: 11:30 - 13:30 (startMin = 690)
                    if (!isEvening && curTotalMin < 690) { // Before 11:30
                        classTitle = "משוואות דיפרנציאליות חלקיות מ׳";
                        classTime = "11:30 - 13:30";
                        classRoom = "📍 אולמן 506 • ד״ר רחל כהן";
                        int diff = 690 - curTotalMin;
                        classStatus = "⏳ השיעור מתחיל בעוד " + diff + " דק׳";
                    } else if (!isEvening && curTotalMin < 705) { // 11:30 - 11:45 (first 15 min of class)
                        classTitle = "משוואות דיפרנציאליות חלקיות מ׳";
                        classTime = "11:30 - 13:30";
                        classRoom = "📍 אולמן 506 • הרצאה פעילה";
                        classStatus = "🟢 מתקיים כעת!";
                    } else { // 11:45 onwards OR evening: switch to tomorrow (Monday)
                        classTitle = "פיסיקה 2";
                        classTime = "08:30 - 10:30";
                        classRoom = "📍 טאוב 1 • מרצה: פרופ׳ כץ";
                        classStatus = isEvening ? "מערכת מחר (יום שני) • שיעור ראשון" : "השיעור הבא מחר (יום שני) ב-08:30";
                    }
                    break;

                case Calendar.MONDAY: // יום שני
                    // Classes:
                    // 1) 08:30 - 10:30 (startMin = 510) - Physics 2
                    // 2) 10:30 - 14:30 (startMin = 630) - Solids 2M
                    if (!isEvening && curTotalMin < 510) { // Before 08:30
                        classTitle = "פיסיקה 2";
                        classTime = "08:30 - 10:30";
                        classRoom = "📍 טאוב 1 • מרצה: פרופ׳ כץ";
                        classStatus = "⏳ מתחיל בעוד " + (510 - curTotalMin) + " דק׳";
                    } else if (!isEvening && curTotalMin < 525) { // 08:30 - 08:45
                        classTitle = "פיסיקה 2";
                        classTime = "08:30 - 10:30";
                        classRoom = "📍 טאוב 1 • הרצאה פעילה";
                        classStatus = "🟢 מתקיים כעת!";
                    } else if (!isEvening && curTotalMin < 630) { // 08:45 - 10:30 (switched to Solids 2M!)
                        classTitle = "מכניקת מוצקים 2מ׳";
                        classTime = "10:30 - 14:30";
                        classRoom = "📍 דנציגר אודיטוריום 1";
                        classStatus = "⏳ השיעור הבא היום (10:30)";
                    } else if (!isEvening && curTotalMin < 645) { // 10:30 - 10:45
                        classTitle = "מכניקת מוצקים 2מ׳";
                        classTime = "10:30 - 14:30";
                        classRoom = "📍 דנציגר אודיטוריום 1 • הרצאה פעילה";
                        classStatus = "🟢 מתקיים כעת!";
                    } else { // 10:45 onwards OR evening: switch to tomorrow (Tuesday)
                        classTitle = "תרמודינמיקה 1";
                        classTime = "08:30 - 11:30";
                        classRoom = "📍 דנציגר אודיטוריום 1";
                        classStatus = isEvening ? "מערכת מחר (יום שלישי) • שיעור ראשון" : "השיעור הבא מחר (יום שלישי) ב-08:30";
                    }
                    break;

                case Calendar.TUESDAY: // יום שלישי
                    // Class: 08:30 - 11:30 (startMin = 510) - Thermo 1
                    if (!isEvening && curTotalMin < 510) {
                        classTitle = "תרמודינמיקה 1";
                        classTime = "08:30 - 11:30";
                        classRoom = "📍 דנציגר אודיטוריום 1";
                        classStatus = "⏳ מתחיל בעוד " + (510 - curTotalMin) + " דק׳";
                    } else if (!isEvening && curTotalMin < 525) { // 08:30 - 08:45
                        classTitle = "תרמודינמיקה 1";
                        classTime = "08:30 - 11:30";
                        classRoom = "📍 דנציגר אודיטוריום 1 • הרצאה פעילה";
                        classStatus = "🟢 מתקיים כעת!";
                    } else { // 08:45 onwards OR evening: switch to tomorrow (Wednesday)
                        classTitle = "מכניקת מוצקים 2מ׳";
                        classTime = "12:30 - 14:30";
                        classRoom = "📍 ליידי דייוויס 240";
                        classStatus = isEvening ? "מערכת מחר (יום רביעי) • שיעור ראשון" : "השיעור הבא מחר (יום רביעי) ב-12:30";
                    }
                    break;

                case Calendar.WEDNESDAY: // יום רביעי
                    // Class: 12:30 - 14:30 (startMin = 750) - Solids 2M
                    if (!isEvening && curTotalMin < 750) {
                        classTitle = "מכניקת מוצקים 2מ׳";
                        classTime = "12:30 - 14:30";
                        classRoom = "📍 ליידי דייוויס 240";
                        classStatus = "⏳ מתחיל בעוד " + (750 - curTotalMin) + " דק׳";
                    } else if (!isEvening && curTotalMin < 765) { // 12:30 - 12:45
                        classTitle = "מכניקת מוצקים 2מ׳";
                        classTime = "12:30 - 14:30";
                        classRoom = "📍 ליידי דייוויס 240 • תרגול פעיל";
                        classStatus = "🟢 מתקיים כעת!";
                    } else { // 12:45 onwards OR evening: switch to tomorrow (Thursday)
                        classTitle = "גרפיקה הנדסית ומבוא לתיב״ם";
                        classTime = "09:30 - 11:30";
                        classRoom = "📍 בניין מכונות • מעבדה 10";
                        classStatus = isEvening ? "מערכת מחר (יום חמישי) • שיעור ראשון" : "השיעור הבא מחר (יום חמישי) ב-09:30";
                    }
                    break;

                case Calendar.THURSDAY: // יום חמישי
                    // Class: 09:30 - 11:30 (startMin = 570) - Graphics & CAD
                    if (!isEvening && curTotalMin < 570) {
                        classTitle = "גרפיקה הנדסית ומבוא לתיב״ם";
                        classTime = "09:30 - 11:30";
                        classRoom = "📍 בניין מכונות • מעבדה 10";
                        classStatus = "⏳ מתחיל בעוד " + (570 - curTotalMin) + " דק׳";
                    } else if (!isEvening && curTotalMin < 585) { // 09:30 - 09:45
                        classTitle = "גרפיקה הנדסית ומבוא לתיב״ם";
                        classTime = "09:30 - 11:30";
                        classRoom = "📍 בניין מכונות • כיתת מחשבים";
                        classStatus = "🟢 מתקיים כעת!";
                    } else { // 09:45 onwards OR evening: weekend starts -> next school day: Sunday
                        classTitle = "משוואות דיפרנציאליות חלקיות מ׳";
                        classTime = "11:30 - 13:30";
                        classRoom = "📍 אולמן 506 • ד״ר רחל כהן";
                        classStatus = "מערכת יום ראשון • שיעור ראשון (סופ״ש נעים! 🎉)";
                    }
                    break;

                case Calendar.FRIDAY: // יום שישי
                    classTitle = "משוואות דיפרנציאליות חלקיות מ׳";
                    classTime = "11:30 - 13:30";
                    classRoom = "📍 אולמן 506 • ד״ר רחל כהן";
                    classStatus = "מערכת יום ראשון • שיעור ראשון (סופ״ש 🏖️)";
                    break;

                case Calendar.SATURDAY: // שבת
                default:
                    classTitle = "משוואות דיפרנציאליות חלקיות מ׳";
                    classTime = "11:30 - 13:30";
                    classRoom = "📍 אולמן 506 • ד״ר רחל כהן";
                    classStatus = isEvening ? "מערכת מחר (יום ראשון) • 11:30" : "שבוע חדש מתחיל מחר (ראשון) ב-11:30";
                    break;
            }
        }

        if (tvClassTitle != null) tvClassTitle.setText(classTitle);
        if (tvClassTime != null) tvClassTime.setText(classTime);
        if (tvClassRoom != null) tvClassRoom.setText(classRoom);
        if (tvClassStatus != null) tvClassStatus.setText(classStatus);

        // 4. Tasks & Exam Countdown
        String examDays = prefs.getString("exam_days", "📝 מבחן מועד א׳ בעוד 14 יום");
        String tasksSummary = prefs.getString("tasks_summary", "משימות פתוחות במודל");
        if (tvExamCountdown != null) tvExamCountdown.setText(examDays);

        // Populate Individual Open Tasks from Semestero synced JSON
        task1Done = prefs.getBoolean("wear_task_1_done", false);
        task2Done = prefs.getBoolean("wear_task_2_done", false);
        task3Done = prefs.getBoolean("wear_task_3_done", false);

        String allTasksJson = prefs.getString("all_tasks_json", "[]");
        String t1Title = "";
        String t1Due = "";
        String t2Title = "";
        String t2Due = "";
        String t3Title = "";
        String t3Due = "";
        int openTasksCount = 0;

        try {
            org.json.JSONArray arr = new org.json.JSONArray(allTasksJson);
            if (arr.length() > 0) {
                openTasksCount = arr.length();
                org.json.JSONObject o1 = arr.getJSONObject(0);
                t1Title = o1.optString("title", "");
                t1Due = o1.optString("dueFormatted", "⏳ מודל טכניון • שבוע 2");
            }
            if (arr.length() > 1) {
                org.json.JSONObject o2 = arr.getJSONObject(1);
                t2Title = o2.optString("title", "");
                t2Due = o2.optString("dueFormatted", "⏳ מודל טכניון • שבוע 2");
            }
            if (arr.length() > 2) {
                org.json.JSONObject o3 = arr.getJSONObject(2);
                t3Title = o3.optString("title", "");
                t3Due = o3.optString("dueFormatted", "⏳ מודל טכניון • שבוע 2");
            }
        } catch (Exception ignored) {}

        // Fallbacks: authentic Semester 3 Technion Mechanical Engineering tasks only (no fake tasks)
        if (t1Title.isEmpty()) {
            t1Title = prefs.getString("task_1", "[מדח מ׳] תרגיל בית 1: משוואות דיפרנציאליות");
            t1Due = "⏳ מודל טכניון • שבוע 2";
        }
        if (t2Title.isEmpty()) {
            t2Title = prefs.getString("task_2", "[מדח מ׳] WebWork 1: מד״ח מ׳");
            t2Due = "⏳ מערכת WebWork • שבוע 2";
        }
        if (t3Title.isEmpty()) {
            t3Title = "[פיסיקה 2] תרגיל בית 1: אלקטרוסטטיקה וחוק קולון";
            t3Due = "⏳ מודל טכניון • שבוע 2";
        }

        if (tvTasksSummary != null) {
            if (openTasksCount > 0) {
                tvTasksSummary.setText(openTasksCount + " משימות פתוחות במודל");
            } else {
                tvTasksSummary.setText(tasksSummary);
            }
        }

        if (tvTask1Title != null) {
            tvTask1Title.setText(t1Title);
            if (tvTask1Due != null) tvTask1Due.setText(t1Due);
            if (task1Done) {
                tvTask1Title.setPaintFlags(tvTask1Title.getPaintFlags() | Paint.STRIKE_THRU_TEXT_FLAG);
                tvTask1Title.setTextColor(getColor(R.color.text_secondary));
            } else {
                tvTask1Title.setPaintFlags(tvTask1Title.getPaintFlags() & (~Paint.STRIKE_THRU_TEXT_FLAG));
                tvTask1Title.setTextColor(getColor(R.color.text_primary));
            }
        }
        if (btnCompleteTask1 != null) {
            btnCompleteTask1.setText(task1Done ? "🎉 בוצע!" : "✓ סמן כבוצע");
        }

        if (tvTask2Title != null) {
            tvTask2Title.setText(t2Title);
            if (tvTask2Due != null) tvTask2Due.setText(t2Due);
            if (task2Done) {
                tvTask2Title.setPaintFlags(tvTask2Title.getPaintFlags() | Paint.STRIKE_THRU_TEXT_FLAG);
                tvTask2Title.setTextColor(getColor(R.color.text_secondary));
            } else {
                tvTask2Title.setPaintFlags(tvTask2Title.getPaintFlags() & (~Paint.STRIKE_THRU_TEXT_FLAG));
                tvTask2Title.setTextColor(getColor(R.color.text_primary));
            }
        }
        if (btnCompleteTask2 != null) {
            btnCompleteTask2.setText(task2Done ? "🎉 בוצע!" : "✓ סמן כבוצע");
        }

        if (tvTask3Title != null) {
            tvTask3Title.setText(t3Title);
            if (tvTask3Due != null) tvTask3Due.setText(t3Due);
            if (task3Done) {
                tvTask3Title.setPaintFlags(tvTask3Title.getPaintFlags() | Paint.STRIKE_THRU_TEXT_FLAG);
                tvTask3Title.setTextColor(getColor(R.color.text_secondary));
            } else {
                tvTask3Title.setPaintFlags(tvTask3Title.getPaintFlags() & (~Paint.STRIKE_THRU_TEXT_FLAG));
                tvTask3Title.setTextColor(getColor(R.color.text_primary));
            }
        }
        if (btnCompleteTask3 != null) {
            btnCompleteTask3.setText(task3Done ? "🎉 בוצע!" : "✓ סמן כבוצע");
        }

        // 5. GPA & Academic Standing
        String gpaVal = prefs.getString("gpa_current", "86.04");
        String honors = prefs.getString("gpa_badge", "🎖️ הצטיינות דיקן");
        if (tvGpaVal != null) tvGpaVal.setText(gpaVal);
        if (tvHonorsBadge != null) tvHonorsBadge.setText(honors);
    }
}
