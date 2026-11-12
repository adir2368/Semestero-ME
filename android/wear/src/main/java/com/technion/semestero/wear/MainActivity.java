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
import android.os.Handler;
import android.os.Looper;
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
import java.util.Date;
import java.util.List;
import java.util.Locale;

/**
 * Semestero ME • Samsung Galaxy Watch 8 Native ViewPager2 Carousel
 * 4-Screen Layout:
 * Screen 0: Class Radar (Live upcoming / active lecture countdown + room + lecturer)
 * Screen 1: Interactive Weekly Timeline (Day switcher ◀ / ▶ + full authentic schedule)
 * Screen 2: Tasks & Exams (Prioritized tasks with due dates + 1-tap complete)
 * Screen 3: Academic Status & Phone Sync Bridge (GPA, Honors, Weekly Load, Instant Sync)
 */
public class MainActivity extends Activity implements MessageClient.OnMessageReceivedListener, WearCarouselAdapter.OnCarouselActionListener {

    public static final String PREFS_NAME = "semestero_wear_prefs";
    public static final String PATH_REQUEST_SYNC = "/semestero/request_sync";
    public static final String PATH_COMPLETE_TASK = "/semestero/complete_task";
    public static final String PATH_TRIGGER_NOTIFICATION = "/semestero/trigger_notification";
    public static final String ACTION_SET_PAGE = "com.technion.semestero.wear.SET_PAGE";
    private static final String TAG = "WearMainActivity";
    private static final int PERMISSION_REQ_NOTIF = 201;

    private ViewPager2 wearViewPager;
    private WearCarouselAdapter adapter;
    private ImageView ivBezelGlow;
    private View[] dotViews;
    private Vibrator vibrator;

    private float bezelAccumulatedScroll = 0f;
    private int inspectedDayOfWeek = -1; // -1 = Today (live), or Calendar.SUNDAY..Calendar.THURSDAY

    private final Handler liveTickHandler = new Handler(Looper.getMainLooper());
    private final Runnable liveTickRunnable = new Runnable() {
        @Override
        public void run() {
            updateUIFromPrefsAndSchedule();
            liveTickHandler.postDelayed(this, 30000); // Refresh live countdown every 30s
        }
    };

    private final BroadcastReceiver syncReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent != null && ACTION_SET_PAGE.equals(intent.getAction())) {
                int page = intent.getIntExtra("page", 0);
                if (wearViewPager != null && page >= 0 && page <= 3) {
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

        for (int i = 0; i < dotViews.length; i++) {
            final int targetPage = i;
            if (dotViews[i] != null) {
                dotViews[i].setOnClickListener(v -> {
                    if (vibrator != null) vibrator.vibrate(15);
                    wearViewPager.setCurrentItem(targetPage, true);
                });
            }
        }

        WearNotificationHelper.ensureNotificationChannel(this);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, PERMISSION_REQ_NOTIF);
            }
        }

        requestSyncFromPhone();
        updateUIFromPrefsAndSchedule();
        WearScheduleHelper.requestComplicationAndTileRefresh(this);
        WearScheduleHelper.scheduleNextBoundaryUpdate(this);

        handleIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    private void handleIntent(Intent intent) {
        if (intent == null) return;
        int targetPage = intent.getIntExtra("page", -1);
        if (targetPage >= 0 && targetPage <= 3 && wearViewPager != null) {
            wearViewPager.setCurrentItem(targetPage, false);
        }
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
    public void onTimelineDayChanged(int delta) {
        if (vibrator != null) vibrator.vibrate(15);
        int todayDow = Calendar.getInstance().get(Calendar.DAY_OF_WEEK);
        if (delta == 0) {
            inspectedDayOfWeek = -1;
        } else {
            int base = (inspectedDayOfWeek >= 1 && inspectedDayOfWeek <= 7) ? inspectedDayOfWeek : todayDow;
            if (base > Calendar.THURSDAY) base = Calendar.SUNDAY;
            // Cycle Sunday (1) .. Thursday (5)
            int next = base + delta;
            if (next < Calendar.SUNDAY) next = Calendar.THURSDAY;
            if (next > Calendar.THURSDAY) next = Calendar.SUNDAY;
            inspectedDayOfWeek = (next == todayDow) ? -1 : next;
        }
        updateUIFromPrefsAndSchedule();
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

        try {
            androidx.wear.watchface.complications.datasource.ComplicationDataSourceUpdateRequester
                .create(this, new android.content.ComponentName(this, SemesteroTasksComplicationService.class))
                .requestUpdateAll();
        } catch (Exception ignored) {}
        WearScheduleHelper.requestComplicationAndTileRefresh(this);
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
        WearScheduleHelper.requestComplicationAndTileRefresh(this);
        updateUIFromPrefsAndSchedule();
        Toast.makeText(this, "מבקש סנכרון מהטלפון... 🔄", Toast.LENGTH_SHORT).show();
    }

    @Override
    public void onTestNotificationRequested() {
        if (vibrator != null) vibrator.vibrate(50);
        WearNotificationHelper.sendTestNotification(this);
        Toast.makeText(this, "התראת שיעור נשלחה 🔔", Toast.LENGTH_SHORT).show();
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
        requestSyncFromPhone();
        updateUIFromPrefsAndSchedule();
        WearScheduleHelper.requestComplicationAndTileRefresh(this);
        liveTickHandler.removeCallbacks(liveTickRunnable);
        liveTickHandler.postDelayed(liveTickRunnable, 30000);
    }

    @Override
    protected void onPause() {
        super.onPause();
        liveTickHandler.removeCallbacks(liveTickRunnable);
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
                WearScheduleHelper.requestComplicationAndTileRefresh(this);
                WearScheduleHelper.scheduleNextBoundaryUpdate(this);
                runOnUiThread(() -> {
                    if (adapter != null) {
                        adapter.isSyncing = false;
                        SimpleDateFormat sdf = new SimpleDateFormat("HH:mm", Locale.getDefault());
                        adapter.syncLastTime = "סונכרן: היום ב-" + sdf.format(new Date());
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
                String title = json.optString("title", "");
                String message = json.optString("message", "");
                runOnUiThread(() -> {
                    if (!title.isEmpty() && !message.isEmpty()) {
                        WearNotificationHelper.sendClassReminder(this, title, "", message);
                    } else {
                        WearNotificationHelper.sendTestNotification(this);
                    }
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
                } else {
                    if (adapter != null) {
                        adapter.isSyncing = false;
                        adapter.notifyItemChanged(WearCarouselAdapter.TYPE_SYNC);
                    }
                }
            });
        } catch (Exception ignored) {}
    }

    /**
     * Evaluates schedule from live clock + synced 7-day phone schedule (or authentic Semester 3 default).
     * Never overwrites live clock resolution with stale point-in-time snapshots from previous hours/days.
     */
    public void updateUIFromPrefsAndSchedule() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        Calendar now = Calendar.getInstance();
        int todayDow = now.get(Calendar.DAY_OF_WEEK);
        int curTotalMin = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE);

        WearScheduleHelper.ScheduleResolution res = WearScheduleHelper.resolve(this, now);

        // Apply live clock-resolved radar data to adapter
        adapter.radarDay = res.dayHeader;
        adapter.radarStatus = res.statusText;
        adapter.radarCourse = res.courseTitle;
        adapter.radarTime = res.timeText;
        adapter.radarRoom = WearScheduleHelper.formatRoom(res.roomText);
        adapter.radarLecturer = res.lecturerText;
        adapter.radarIsActive = res.isActive;
        adapter.radarIsStartingSoon = res.isStartingSoon;

        // Apply timeline data for either Today or the user-inspected day of week (◀ / ▶)
        int timelineDow = (inspectedDayOfWeek >= 1 && inspectedDayOfWeek <= 7) ? inspectedDayOfWeek : todayDow;
        if (timelineDow == todayDow) {
            adapter.timelineHeader = "לו״ז " + res.dayHeader;
            adapter.timelineClasses = new ArrayList<>(res.timelineItems);
        } else {
            String dayLabel = WearScheduleHelper.HEBREW_DAYS[timelineDow];
            adapter.timelineHeader = "לו״ז " + dayLabel + " (הקש להיום)";
            adapter.timelineClasses = WearScheduleHelper.buildTimelineForDay(this, timelineDow, todayDow, curTotalMin);
        }

        // Screen 3: Academic Status & Sync Timestamp
        String gpaCurrent = prefs.getString("gpa_current", "86.04");
        if (gpaCurrent == null || gpaCurrent.trim().isEmpty() || gpaCurrent.equals("0.0") || isCorruptedText(gpaCurrent)) {
            gpaCurrent = "86.04";
        }
        String gpaBadge = prefs.getString("gpa_badge", "🎖️ הצטיינות דיקן");
        if (gpaBadge == null || gpaBadge.trim().isEmpty() || isCorruptedText(gpaBadge)) {
            gpaBadge = "🎖️ הצטיינות דיקן";
        }
        adapter.gpaSummaryText = "🎓 ממוצע: " + gpaCurrent + " • " + gpaBadge;

        String schedHours = prefs.getString("sched_total_hours", "");
        if (schedHours != null && !schedHours.trim().isEmpty() && !schedHours.startsWith("0") && !isCorruptedText(schedHours)) {
            adapter.schedSummaryText = "📅 " + schedHours;
        } else {
            adapter.schedSummaryText = "📅 5 קורסים • 16 ש״ס השבוע";
        }

        long lastSyncMs = prefs.getLong("last_sync_timestamp", 0L);
        if (lastSyncMs > 0) {
            SimpleDateFormat sdf = new SimpleDateFormat("dd/MM HH:mm", Locale.getDefault());
            adapter.syncLastTime = "סנכרון אחרון: " + sdf.format(new Date(lastSyncMs));
        }

        try {
            Wearable.getNodeClient(this).getConnectedNodes().addOnSuccessListener(nodes -> {
                if (nodes != null && !nodes.isEmpty()) {
                    String nodeName = nodes.get(0).getDisplayName();
                    adapter.syncStatusText = (nodeName != null && !nodeName.isEmpty()) ? ("מחובר: " + nodeName) : "טלפון מחובר ופעיל";
                } else {
                    adapter.syncStatusText = "פועל עצמאית (ממתין לטלפון)";
                }
                adapter.notifyItemChanged(WearCarouselAdapter.TYPE_SYNC);
            });
        } catch (Exception ignored) {}

        // Screen 2: Tasks & Exams
        String examDays = prefs.getString("exam_days", "");
        String examTitle = prefs.getString("exam_title", "");
        String examSub = prefs.getString("exam_sub", "");
        if (examDays != null && !examDays.trim().isEmpty() && !examDays.equals("--") && !isCorruptedText(examDays)) {
            if (examDays.matches("^\\d+$")) {
                adapter.examBannerTitle = "📝 בחינה קרובה בעוד " + examDays + " ימים";
            } else {
                adapter.examBannerTitle = examDays;
            }
        } else {
            adapter.examBannerTitle = "📝 תקופת לימודים • סמסטר חורף";
        }

        if (examTitle != null && !examTitle.trim().isEmpty() && !isCorruptedText(examTitle)) {
            adapter.examBannerSub = (!examSub.isEmpty() && !isCorruptedText(examSub)) ? (examTitle + " (" + examSub + ")") : examTitle;
        } else {
            adapter.examBannerSub = "104228 - מד״ח מ' • 034053 - מוצקים 2מ'";
        }

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
                if (t != null && !t.trim().isEmpty() && !isCorruptedText(t) && !t.contains("אין משימות")) {
                    boolean done = prefs.getBoolean("wear_task_" + i + "_done", false);
                    tasks.add(new WearCarouselAdapter.TaskItem(t, "⏳ מודל טכניון", done));
                }
            }
        }

        if (tasks.isEmpty()) {
            tasks.add(new WearCarouselAdapter.TaskItem("[מד״ח מ׳] גיליון WebWork 2", "⏳ מערכת WebWork", prefs.getBoolean("wear_task_1_done", false)));
            tasks.add(new WearCarouselAdapter.TaskItem("[מוצקים 2מ׳] תרגיל בית 2 (דיגיטלי + כתב)", "⏳ מודל טכניון", prefs.getBoolean("wear_task_2_done", false)));
            tasks.add(new WearCarouselAdapter.TaskItem("[פיסיקה 2] גיליון תרגיל 2: שדה ופוטנציאל", "⏳ מערכת WebWork", prefs.getBoolean("wear_task_3_done", false)));
            tasks.add(new WearCarouselAdapter.TaskItem("[תרמו 1] תרגיל בית 2: חוק ראשון ותהליכים", "⏳ מודל טכניון", prefs.getBoolean("wear_task_4_done", false)));
            tasks.add(new WearCarouselAdapter.TaskItem("[חישוב הנדסי] תרגיל בית 2 ב-MATLAB", "⏳ מודל טכניון", prefs.getBoolean("wear_task_5_done", false)));
        }
        adapter.tasksList = tasks;

        adapter.notifyDataSetChanged();
    }

    public static boolean isCorruptedText(String s) {
        if (s == null || s.trim().isEmpty()) return false;
        return s.contains("?") && !s.matches(".*[\\u0590-\\u05FF].*");
    }
}
