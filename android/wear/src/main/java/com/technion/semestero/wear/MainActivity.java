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
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.Toast;

import androidx.viewpager2.widget.ViewPager2;

import com.google.android.gms.wearable.MessageClient;
import com.google.android.gms.wearable.MessageEvent;
import com.google.android.gms.wearable.Node;
import com.google.android.gms.wearable.Wearable;

import org.json.JSONArray;
import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;

/**
 * Semestero ME • Samsung Galaxy Watch 8 Native ViewPager2 Carousel
 * Focused 3-Screen Layout:
 * Screen 0: Class Radar (Live upcoming / active lecture countdown)
 * Screen 1: Today's Timeline (Full authentic daily schedule from CheeseFork & phone companion)
 * Screen 2: Tasks & Exams (5 Tasks with 1-tap complete)
 */
public class MainActivity extends Activity implements MessageClient.OnMessageReceivedListener, WearCarouselAdapter.OnCarouselActionListener {

    public static final String PREFS_NAME = "semestero_wear_prefs";
    public static final String PATH_REQUEST_SYNC = "/semestero/request_sync";
    public static final String PATH_COMPLETE_TASK = "/semestero/complete_task";
    public static final String PATH_TRIGGER_NOTIFICATION = "/semestero/trigger_notification";
    public static final String ACTION_SET_PAGE = "com.technion.semestero.wear.SET_PAGE";
    private static final String TAG = "WearMainActivity";
    private static final int PERMISSION_REQ_NOTIF = 201;

    private static final String[] HEBREW_DAYS = {
        "", "יום ראשון", "יום שני", "יום שלישי", "יום רביעי", "יום חמישי", "יום שישי", "שבת"
    };

    private ViewPager2 wearViewPager;
    private WearCarouselAdapter adapter;
    private ImageView ivBezelGlow;
    private View[] dotViews;
    private Vibrator vibrator;

    private float bezelAccumulatedScroll = 0f;

    private final BroadcastReceiver syncReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent != null && ACTION_SET_PAGE.equals(intent.getAction())) {
                int page = intent.getIntExtra("page", 0);
                if (wearViewPager != null && page >= 0 && page <= 2) {
                    wearViewPager.setCurrentItem(page, true);
                }
                return;
            }
            updateUIFromPrefsAndSchedule();
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setRequestedOrientation(android.content.pm.ActivityInfo.SCREEN_ORIENTATION_NOSENSOR);
        setContentView(R.layout.activity_main);

        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        ivBezelGlow = findViewById(R.id.iv_bezel_glow);
        wearViewPager = findViewById(R.id.wear_view_pager);

        dotViews = new View[] {
            findViewById(R.id.dot_0),
            findViewById(R.id.dot_1),
            findViewById(R.id.dot_2),
            findViewById(R.id.dot_3)
        };

        adapter = new WearCarouselAdapter(this, this);
        wearViewPager.setUserInputEnabled(true);
        wearViewPager.setAdapter(adapter);

        wearViewPager.registerOnPageChangeCallback(new ViewPager2.OnPageChangeCallback() {
            @Override
            public void onPageScrolled(int position, float positionOffset, int positionOffsetPixels) {
                super.onPageScrolled(position, positionOffset, positionOffsetPixels);
                if (ivBezelGlow != null) {
                    // 4 screens: 90 degrees per screen (0°, 90°, 180°, 270°)
                    ivBezelGlow.setRotation(position * 90f + positionOffset * 90f);
                }
            }

            @Override
            public void onPageSelected(int position) {
                super.onPageSelected(position);
                updatePaginationDots(position);
                if (vibrator != null) vibrator.vibrate(12);
            }
        });

        // Direct dot tapping to switch screens
        for (int i = 0; i < dotViews.length; i++) {
            final int targetPage = i;
            if (dotViews[i] != null) {
                dotViews[i].setOnClickListener(v -> {
                    if (vibrator != null) vibrator.vibrate(15);
                    wearViewPager.setCurrentItem(targetPage, true);
                });
            }
        }

        // Initialize Notification Channels
        WearNotificationHelper.ensureNotificationChannel(this);

        // Request POST_NOTIFICATIONS permission on Wear OS 4/5 (Android 13+)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, PERMISSION_REQ_NOTIF);
            }
        }

        // Request sync from phone on launch
        requestSyncFromPhone();

        // Populate initial UI
        updateUIFromPrefsAndSchedule();
    }

    private void updatePaginationDots(int activeIndex) {
        if (dotViews == null) return;
        int activeWidth = dpToPx(14);
        int inactiveWidth = dpToPx(5);
        int height = dpToPx(5);

        for (int i = 0; i < dotViews.length; i++) {
            View dot = dotViews[i];
            if (dot == null) continue;
            ViewGroup.LayoutParams lp = dot.getLayoutParams();
            if (i == activeIndex) {
                dot.setBackgroundResource(R.drawable.dot_active);
                lp.width = activeWidth;
            } else {
                dot.setBackgroundResource(R.drawable.dot_inactive);
                lp.width = inactiveWidth;
            }
            lp.height = height;
            dot.setLayoutParams(lp);
        }
    }

    private int dpToPx(int dp) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round(dp * density);
    }

    @Override
    public void onTaskToggled(int taskIndex) {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        boolean currentDone = prefs.getBoolean("wear_task_" + taskIndex + "_done", false);
        boolean newDone = !currentDone;
        prefs.edit().putBoolean("wear_task_" + taskIndex + "_done", newDone).apply();

        if (vibrator != null) {
            vibrator.vibrate(newDone ? 45 : 20);
        }

        String taskId = prefs.getString("wear_task_" + taskIndex + "_id", "task_" + taskIndex);
        notifyPhoneTaskStatus(taskId, taskIndex, newDone);

        updateUIFromPrefsAndSchedule();
    }

    @Override
    public void onRefreshRequested() {
        if (vibrator != null) vibrator.vibrate(35);
        if (adapter != null) {
            adapter.isSyncing = true;
            adapter.notifyItemChanged(WearCarouselAdapter.TYPE_SYNC);
        }
        requestSyncFromPhone();
        updateUIFromPrefsAndSchedule();
        Toast.makeText(this, "מבקש סנכרון מהטלפון... 🔄", Toast.LENGTH_SHORT).show();
    }

    @Override
    public void onTestNotificationRequested() {
        if (vibrator != null) vibrator.vibrate(50);
        WearNotificationHelper.sendTestNotification(this);
        Toast.makeText(this, "התראת בדיקה נשלחה 🔔", Toast.LENGTH_SHORT).show();
    }

    private void notifyPhoneTaskStatus(String taskId, int taskIndex, boolean isDone) {
        try {
            Wearable.getNodeClient(this).getConnectedNodes().addOnSuccessListener(nodes -> {
                if (nodes != null) {
                    for (Node node : nodes) {
                        String payload = (taskId != null ? taskId : "") + ":" + (isDone ? "1" : "0") + ":" + taskIndex;
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
        Wearable.getMessageClient(this).addListener(this);
        IntentFilter filter = new IntentFilter();
        filter.addAction(WearDataSyncService.ACTION_DATA_SYNCED);
        filter.addAction(ACTION_SET_PAGE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(syncReceiver, filter, RECEIVER_EXPORTED);
        } else {
            registerReceiver(syncReceiver, filter);
        }
        updateUIFromPrefsAndSchedule();
    }

    @Override
    protected void onPause() {
        super.onPause();
        try {
            Wearable.getMessageClient(this).removeListener(this);
            unregisterReceiver(syncReceiver);
        } catch (Exception ignored) {}
    }

    @Override
    public void onMessageReceived(MessageEvent messageEvent) {
        if (messageEvent == null) return;
        String path = messageEvent.getPath();
        Log.d(TAG, "MainActivity onMessageReceived: " + path);
        if (WearDataSyncService.PATH_DIRECT_SYNC.equals(path)) {
            try {
                String jsonStr = new String(messageEvent.getData(), StandardCharsets.UTF_8);
                JSONObject json = new JSONObject(jsonStr);
                WearDataSyncService.applyJsonToPrefs(this, json);
                runOnUiThread(() -> {
                    if (adapter != null) {
                        adapter.isSyncing = false;
                        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("HH:mm", java.util.Locale.getDefault());
                        adapter.syncLastTime = "סונכרן: היום ב-" + sdf.format(new java.util.Date());
                        adapter.syncStatusText = "טלפון מחובר ופעיל";
                    }
                    updateUIFromPrefsAndSchedule();
                    Toast.makeText(this, "⚡ סונכרן בהצלחה מהטלפון!", Toast.LENGTH_SHORT).show();
                    if (vibrator != null) vibrator.vibrate(35);
                });
            } catch (Exception e) {
                Log.e(TAG, "Error handling direct sync message: ", e);
            }
        } else if (PATH_TRIGGER_NOTIFICATION.equals(path)) {
            try {
                String jsonStr = new String(messageEvent.getData(), StandardCharsets.UTF_8);
                JSONObject json = new JSONObject(jsonStr);
                String title = json.optString("title", "🎓 סמסטרו ME • בדיקת התראה");
                String message = json.optString("message", "📍 אולמן 101 • תרמודינמיקה 1 (תרגול)");
                runOnUiThread(() -> {
                    WearNotificationHelper.sendClassReminder(this, title, "12:30", message);
                    if (vibrator != null) vibrator.vibrate(new long[]{0, 300, 150, 300}, -1);
                });
            } catch (Exception e) {
                runOnUiThread(() -> WearNotificationHelper.sendTestNotification(this));
            }
        }
    }

    /**
     * Samsung Galaxy Watch 8 Physical / Virtual Rotating Bezel Support.
     */
    @Override
    public boolean onGenericMotionEvent(MotionEvent event) {
        if (event.getAction() == MotionEvent.ACTION_SCROLL && 
            (event.isFromSource(InputDevice.SOURCE_ROTARY_ENCODER) || event.isFromSource(InputDevice.SOURCE_CLASS_POINTER))) {
            
            float delta = -event.getAxisValue(MotionEvent.AXIS_SCROLL);
            int currentItem = wearViewPager.getCurrentItem();

            if (currentItem == WearCarouselAdapter.TYPE_TIMELINE && adapter.timelineScrollView != null) {
                int scrollAmount = Math.round(delta * 40);
                adapter.timelineScrollView.smoothScrollBy(0, scrollAmount);
                if (vibrator != null) vibrator.vibrate(8);
                return true;
            } else if (currentItem == WearCarouselAdapter.TYPE_TASKS && adapter.tasksScrollView != null) {
                int scrollAmount = Math.round(delta * 40);
                adapter.tasksScrollView.smoothScrollBy(0, scrollAmount);
                if (vibrator != null) vibrator.vibrate(8);
                return true;
            } else if (currentItem == WearCarouselAdapter.TYPE_SYNC && adapter.syncScrollView != null) {
                int scrollAmount = Math.round(delta * 40);
                adapter.syncScrollView.smoothScrollBy(0, scrollAmount);
                if (vibrator != null) vibrator.vibrate(8);
                return true;
            } else {
                bezelAccumulatedScroll += delta;
                if (bezelAccumulatedScroll > 0.8f && currentItem < 3) {
                    wearViewPager.setCurrentItem(currentItem + 1, true);
                    bezelAccumulatedScroll = 0f;
                    if (vibrator != null) vibrator.vibrate(12);
                } else if (bezelAccumulatedScroll < -0.8f && currentItem > 0) {
                    wearViewPager.setCurrentItem(currentItem - 1, true);
                    bezelAccumulatedScroll = 0f;
                    if (vibrator != null) vibrator.vibrate(12);
                }
                return true;
            }
        }
        return super.onGenericMotionEvent(event);
    }

    public void requestSyncFromPhone() {
        try {
            Wearable.getNodeClient(this).getConnectedNodes().addOnSuccessListener(nodes -> {
                if (nodes != null && !nodes.isEmpty()) {
                    for (Node node : nodes) {
                        Wearable.getMessageClient(this).sendMessage(
                            node.getId(),
                            PATH_REQUEST_SYNC,
                            "SYNC".getBytes(StandardCharsets.UTF_8)
                        );
                    }
                }
            });
        } catch (Exception ignored) {}
    }

    /**
     * Evaluates schedule from phone companion (CheeseFork) and authentic Technion ME syllabus.
     * 100% Alignment with the User's Phone Application:
     * - Sunday: PDE Exercise (11:30-13:30) [Ullmann 506]
     * - Monday: Physics 2 Lecture (08:30-10:30) [Taub 1], Solids 2 Lecture (10:30-14:30) [ChemEng 1]
     * - Tuesday: Thermo 1 Lecture (08:30-11:30) [ChemEng 1], Thermo 1 Exercise (12:30-14:30) [Ullmann 101], Solids 2 Exercise (14:30-16:30) [Ullmann 602]
     * - Wednesday: Physics 2 Lecture (08:30-09:30) [Physics 1], Physics 2 Exercise (09:30-10:30) [Sherman 107], Scientific Computing (14:30-17:30) [ChemEng 1]
     * - Thursday: Sports/Yoga (07:30-09:00) [Sports Center], PDE Lecture (10:30-12:30) [Sherman 107], Scientific Computing Exercise (12:30-14:30) [Ullmann 501]
     */
    public void updateUIFromPrefsAndSchedule() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        Calendar now = Calendar.getInstance();
        WearScheduleHelper.ScheduleResolution res = WearScheduleHelper.resolve(this, now);

        String classTitle = res.courseTitle;
        String classTime = res.timeText;
        String classRoom = res.roomText;
        String classStatus = res.statusText;
        String classLecturer = res.lecturerText;
        List<WearCarouselAdapter.ClassItem> timelineClasses = new ArrayList<>(res.timelineItems);

        // If phone companion has synced live class data via SharedPreferences, prioritize it ONLY if clean & valid
        String syncedClassesJson = prefs.getString("all_classes_json", "");
        if (syncedClassesJson != null && !syncedClassesJson.trim().isEmpty() && !syncedClassesJson.equals("[]") && !syncedClassesJson.contains("?")) {
            try {
                JSONArray arr = new JSONArray(syncedClassesJson);
                if (arr.length() > 0) {
                    List<WearCarouselAdapter.ClassItem> syncedList = new ArrayList<>();
                    for (int i = 0; i < arr.length(); i++) {
                        JSONObject obj = arr.getJSONObject(i);
                        String title = obj.optString("title", "");
                        String time = obj.optString("time", "");
                        String details = obj.optString("details", "");
                        boolean active = (classTime.equals(time) && classStatus.contains("מתקיים כעת"));
                        syncedList.add(new WearCarouselAdapter.ClassItem(title, time, details, active));
                    }
                    if (!syncedList.isEmpty()) {
                        timelineClasses = syncedList;
                    }
                }
            } catch (Exception ignored) {}
        }

        // If phone synced a specific active next class ONLY if clean and free of corruption
        String syncedTitle = prefs.getString("class_title", "");
        if (syncedTitle != null && !syncedTitle.trim().isEmpty() && !syncedTitle.contains("אין שיעורים קרובים") && !syncedTitle.contains("?")) {
            classTitle = syncedTitle;
            String syncedTime = prefs.getString("class_time", "");
            if (!syncedTime.isEmpty() && !syncedTime.contains("?")) classTime = syncedTime;
            String syncedRoom = prefs.getString("class_details", "");
            if (!syncedRoom.isEmpty() && !syncedRoom.contains("?")) classRoom = syncedRoom;
            String syncedLec = prefs.getString("class_lecturer", "");
            if (!syncedLec.isEmpty() && !syncedLec.contains("?")) classLecturer = syncedLec;
            String syncedStat = prefs.getString("class_status", "");
            if (!syncedStat.isEmpty() && !syncedStat.contains("?")) classStatus = syncedStat;
        }

        // Apply radar data to adapter
        adapter.radarDay = res.dayHeader;
        adapter.radarStatus = classStatus;
        adapter.radarCourse = classTitle;
        adapter.radarTime = classTime;
        adapter.radarRoom = WearScheduleHelper.formatRoom(classRoom);
        adapter.radarLecturer = classLecturer;

        // Check connected nodes for sync status
        try {
            com.google.android.gms.wearable.Wearable.getNodeClient(this).getConnectedNodes().addOnSuccessListener(nodes -> {
                if (nodes != null && !nodes.isEmpty()) {
                    String nodeName = nodes.get(0).getDisplayName();
                    adapter.syncStatusText = (nodeName != null && !nodeName.isEmpty()) ? nodeName : "טלפון מחובר";
                } else {
                    adapter.syncStatusText = "ממתין לחיבור טלפון...";
                }
                adapter.notifyItemChanged(WearCarouselAdapter.TYPE_SYNC);
            });
        } catch (Exception ignored) {}

        // Apply timeline data to adapter
        adapter.timelineHeader = "לו״ז " + res.dayHeader;
        adapter.timelineClasses = timelineClasses;

        // Screen 2: Tasks & Exams
        String examDays = prefs.getString("exam_days", "📝 מועד א׳ בעוד 14 ימים");
        if (examDays == null || isCorruptedText(examDays) || examDays.equals("--") || examDays.trim().isEmpty()) {
            examDays = "📝 מועד א׳ בעוד 14 ימים";
        }
        String examTitle = prefs.getString("exam_title", "104228 - מד״ח מ'");
        if (examTitle == null || isCorruptedText(examTitle) || examTitle.trim().isEmpty()) {
            examTitle = "104228 - מד״ח מ'";
        }
        adapter.examBannerTitle = examDays;
        adapter.examBannerSub = examTitle;

        List<WearCarouselAdapter.TaskItem> tasks = new ArrayList<>();
        String allTasksJson = prefs.getString("all_tasks_json", "[]");
        try {
            JSONArray arr = new JSONArray(allTasksJson);
            for (int i = 0; i < arr.length(); i++) {
                JSONObject obj = arr.getJSONObject(i);
                String course = obj.optString("course", "");
                String title = obj.optString("title", "");
                if (title.isEmpty() || isCorruptedText(title)) {
                    continue;
                }
                String fullTitle = (!course.isEmpty() && !title.startsWith("[")) ? ("[" + course + "] " + title) : title;
                String due = obj.optString("dueFormatted", obj.optString("due", "להגשה בקרוב"));
                if (isCorruptedText(due)) due = "להגשה בקרוב";
                boolean done = prefs.getBoolean("wear_task_" + (i + 1) + "_done", obj.optBoolean("completed", false));
                tasks.add(new WearCarouselAdapter.TaskItem(fullTitle, "⏳ " + due, done));
            }
        } catch (Exception ignored) {}

        if (tasks.isEmpty()) {
            for (int i = 1; i <= 3; i++) {
                String t = prefs.getString("task_" + i, "");
                if (t != null && !t.trim().isEmpty() && !isCorruptedText(t)) {
                    boolean done = prefs.getBoolean("wear_task_" + i + "_done", false);
                    tasks.add(new WearCarouselAdapter.TaskItem(t, "⏳ מודל טכניון", done));
                }
            }
        }

        if (tasks.isEmpty()) {
            tasks.add(new WearCarouselAdapter.TaskItem("[מדח מ׳] תרגיל בית 1: משוואות", "⏳ מודל טכניון", prefs.getBoolean("wear_task_1_done", false)));
            tasks.add(new WearCarouselAdapter.TaskItem("[מדח מ׳] WebWork 1: מד״ח מ׳", "⏳ מערכת WebWork", prefs.getBoolean("wear_task_2_done", false)));
            tasks.add(new WearCarouselAdapter.TaskItem("[פיסיקה 2] תרגיל בית 1: אלקטרו...", "⏳ מודל טכניון", prefs.getBoolean("wear_task_3_done", false)));
            tasks.add(new WearCarouselAdapter.TaskItem("[פיסיקה 2] WebWork 1: פיסיק...", "⏳ מערכת WebWork", prefs.getBoolean("wear_task_4_done", false)));
            tasks.add(new WearCarouselAdapter.TaskItem("[תרמו 1] תרגיל בית 1: חוק רא...", "⏳ מודל טכניון", prefs.getBoolean("wear_task_5_done", false)));
        }
        adapter.tasksList = tasks;

        adapter.notifyDataSetChanged();
    }

    public static boolean isCorruptedText(String s) {
        if (s == null || s.trim().isEmpty()) return false;
        return s.contains("?") && !s.matches(".*[\\u0590-\\u05FF].*");
    }
}
