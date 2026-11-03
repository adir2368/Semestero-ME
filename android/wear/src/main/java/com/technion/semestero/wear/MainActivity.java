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
import android.widget.TextView;
import android.widget.Toast;

import androidx.viewpager2.widget.ViewPager2;

import com.google.android.gms.wearable.MessageClient;
import com.google.android.gms.wearable.MessageEvent;
import com.google.android.gms.wearable.Node;
import com.google.android.gms.wearable.Wearable;

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
 * Screen 0: Class Radar
 * Screen 1: Today's Timeline
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
            findViewById(R.id.dot_2)
        };

        adapter = new WearCarouselAdapter(this, this);
        wearViewPager.setUserInputEnabled(true);
        wearViewPager.setAdapter(adapter);

        wearViewPager.registerOnPageChangeCallback(new ViewPager2.OnPageChangeCallback() {
            @Override
            public void onPageScrolled(int position, float positionOffset, int positionOffsetPixels) {
                super.onPageScrolled(position, positionOffset, positionOffsetPixels);
                if (ivBezelGlow != null) {
                    // 3 screens: 120 degrees per screen (0°, 120°, 240°)
                    ivBezelGlow.setRotation(position * 120f + positionOffset * 120f);
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
        requestSyncFromPhone();
        updateUIFromPrefsAndSchedule();
        Toast.makeText(this, "מבקש סנכרון מהטלפון... 🔄", Toast.LENGTH_SHORT).show();
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
                String message = json.optString("message", "📍 אולמן 506 • משוואות דיפרנציאליות (בעוד 10 דק׳)");
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
            } else {
                bezelAccumulatedScroll += delta;
                if (bezelAccumulatedScroll > 0.8f && currentItem < 2) {
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
     * Evaluates schedule, authentic Technion ME syllabus, and binds data across 3 screens.
     */
    public void updateUIFromPrefsAndSchedule() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        // 1. Current Day & Date
        Calendar now = Calendar.getInstance();
        int dayOfWeek = now.get(Calendar.DAY_OF_WEEK); // 1 = Sunday, 7 = Saturday
        String curDayName = (dayOfWeek >= 1 && dayOfWeek <= 7) ? HEBREW_DAYS[dayOfWeek] : "יום שלישי";

        SimpleDateFormat sdf = new SimpleDateFormat("d בMMMM", new Locale("he", "IL"));
        String formattedDate = sdf.format(now.getTime());

        int curHour = now.get(Calendar.HOUR_OF_DAY);
        int curMin = now.get(Calendar.MINUTE);
        int curTotalMin = curHour * 60 + curMin;
        boolean isEvening = (curHour >= 17);

        // Screen 0: Class Radar
        String classTitle;
        String classTime;
        String classRoom;
        String classStatus;
        String classLecturer;

        List<WearCarouselAdapter.ClassItem> timelineClasses = new ArrayList<>();

        switch (dayOfWeek) {
            case Calendar.SUNDAY: // יום ראשון
                timelineClasses.add(new WearCarouselAdapter.ClassItem(
                    "משוואות דיפרנציאליות חלקיות מ׳",
                    "11:30 - 13:30",
                    "📍 אולמן 506",
                    (!isEvening && curTotalMin >= 690 && curTotalMin < 810)
                ));

                if (!isEvening && curTotalMin < 690) {
                    classTitle = "משוואות דיפרנציאליות חלקיות מ׳";
                    classTime = "11:30 - 13:30";
                    classRoom = "📍 אולמן 506";
                    classLecturer = "👨‍🏫 ד״ר רחל כהן • הרצאה";
                    int diff = 690 - curTotalMin;
                    classStatus = "⏳ השיעור מתחיל בעוד " + diff + " דק׳";
                } else if (!isEvening && curTotalMin < 705) {
                    classTitle = "משוואות דיפרנציאליות חלקיות מ׳";
                    classTime = "11:30 - 13:30";
                    classRoom = "📍 אולמן 506";
                    classLecturer = "👨‍🏫 ד״ר רחל כהן • הרצאה פעילה";
                    classStatus = "🟢 מתקיים כעת!";
                } else {
                    classTitle = "פיסיקה 2";
                    classTime = "08:30 - 10:30";
                    classRoom = "📍 טאוב 1";
                    classLecturer = "👨‍🏫 ד״ר גדעון אלון • הרצאה 10";
                    classStatus = isEvening ? "מערכת מחר (יום שני) • שיעור ראשון" : "השיעור הבא מחר (שני) ב-08:30";
                }
                break;

            case Calendar.MONDAY: // יום שני
                boolean physActive = (!isEvening && curTotalMin >= 510 && curTotalMin < 630);
                boolean solidsActive = (!isEvening && curTotalMin >= 630 && curTotalMin < 870);

                timelineClasses.add(new WearCarouselAdapter.ClassItem(
                    "פיסיקה 2",
                    "08:30 - 10:30",
                    "📍 טאוב 1",
                    physActive
                ));
                timelineClasses.add(new WearCarouselAdapter.ClassItem(
                    "מכניקת מוצקים 2מ׳",
                    "10:30 - 14:30",
                    "📍 הנדסה כימית 1",
                    solidsActive
                ));

                if (!isEvening && curTotalMin < 510) {
                    classTitle = "פיסיקה 2";
                    classTime = "08:30 - 10:30";
                    classRoom = "📍 טאוב 1";
                    classLecturer = "👨‍🏫 ד״ר גדעון אלון • הרצאה 10";
                    classStatus = "⏳ מתחיל בעוד " + (510 - curTotalMin) + " דק׳";
                } else if (!isEvening && curTotalMin < 525) {
                    classTitle = "פיסיקה 2";
                    classTime = "08:30 - 10:30";
                    classRoom = "📍 טאוב 1";
                    classLecturer = "👨‍🏫 ד״ר גדעון אלון • הרצאה פעילה";
                    classStatus = "🟢 מתקיים כעת!";
                } else if (!isEvening && curTotalMin < 630) {
                    classTitle = "מכניקת מוצקים 2מ׳";
                    classTime = "10:30 - 14:30";
                    classRoom = "📍 הנדסה כימית 1";
                    classLecturer = "👨‍🏫 פרופ׳ יוסף גבלי • הרצאה 10";
                    classStatus = "⏳ השיעור הבא היום (10:30)";
                } else if (!isEvening && curTotalMin < 645) {
                    classTitle = "מכניקת מוצקים 2מ׳";
                    classTime = "10:30 - 14:30";
                    classRoom = "📍 הנדסה כימית 1";
                    classLecturer = "👨‍🏫 פרופ׳ יוסף גבלי • הרצאה פעילה";
                    classStatus = "🟢 מתקיים כעת!";
                } else {
                    classTitle = "תרמודינמיקה 1";
                    classTime = "08:30 - 11:30";
                    classRoom = "📍 הנדסה כימית 1";
                    classLecturer = "👨‍🏫 פרופ׳ טרטקובסקי • הרצאה 10";
                    classStatus = isEvening ? "מערכת מחר (יום שלישי) • שיעור ראשון" : "השיעור הבא מחר (שלישי) ב-08:30";
                }
                break;

            case Calendar.TUESDAY: // יום שלישי - Exact match with Screenshots 2 & 4!
            default:
                boolean t1Active = (!isEvening && curTotalMin >= 510 && curTotalMin < 690);
                boolean t2Active = (!isEvening && curTotalMin >= 750 && curTotalMin < 870);
                boolean t3Active = (!isEvening && curTotalMin >= 870 && curTotalMin < 990);

                timelineClasses.add(new WearCarouselAdapter.ClassItem(
                    "תרמודינמיקה 1",
                    "08:30 - 11:30",
                    "📍 הנדסה כימית 1",
                    t1Active
                ));
                timelineClasses.add(new WearCarouselAdapter.ClassItem(
                    "משוואות דיפרנציאליות חלקיות מ׳",
                    "12:30 - 14:30",
                    "📍 אולמן 506",
                    t2Active
                ));
                timelineClasses.add(new WearCarouselAdapter.ClassItem(
                    "פיסיקה 2",
                    "14:30 - 16:30",
                    "📍 טאוב",
                    t3Active
                ));

                // Radar logic for Tuesday
                if (!isEvening && curTotalMin < 510) {
                    classTitle = "תרמודינמיקה 1";
                    classTime = "08:30 - 11:30";
                    classRoom = "📍 הנדסה כימית 1";
                    classLecturer = "👨‍🏫 פרופ׳ טרטקובסקי • הרצאה 10";
                    classStatus = "⏰ מתחיל בעוד " + (510 - curTotalMin) + " דקות";
                } else if (!isEvening && curTotalMin < 525) {
                    classTitle = "תרמודינמיקה 1";
                    classTime = "08:30 - 11:30";
                    classRoom = "📍 הנדסה כימית 1";
                    classLecturer = "👨‍🏫 פרופ׳ טרטקובסקי • הרצאה פעילה";
                    classStatus = "🟢 מתקיים כעת!";
                } else if (!isEvening && curTotalMin < 750) { // Switched to PDE (12:30)
                    classTitle = "משוואות דיפרנציאליות חלקיות מ׳";
                    classTime = "12:30 - 14:30";
                    classRoom = "📍 אולמן 506";
                    classLecturer = "👨‍🏫 אמתי אלפרין • הרצאה";
                    int diff = 750 - curTotalMin;
                    classStatus = "מתחיל בעוד " + diff + " דקות ⏰";
                } else if (!isEvening && curTotalMin < 765) {
                    classTitle = "משוואות דיפרנציאליות חלקיות מ׳";
                    classTime = "12:30 - 14:30";
                    classRoom = "📍 אולמן 506";
                    classLecturer = "👨‍🏫 אמתי אלפרין • הרצאה פעילה";
                    classStatus = "🟢 מתקיים כעת!";
                } else if (!isEvening && curTotalMin < 870) { // Switched to Physics 2 (14:30)
                    classTitle = "פיסיקה 2";
                    classTime = "14:30 - 16:30";
                    classRoom = "📍 טאוב";
                    classLecturer = "👨‍🏫 צוות פיסיקה • תרגול";
                    int diff = 870 - curTotalMin;
                    classStatus = "מתחיל בעוד " + diff + " דקות ⏰";
                } else if (!isEvening && curTotalMin < 885) {
                    classTitle = "פיסיקה 2";
                    classTime = "14:30 - 16:30";
                    classRoom = "📍 טאוב";
                    classLecturer = "👨‍🏫 צוות פיסיקה • תרגול פעיל";
                    classStatus = "🟢 מתקיים כעת!";
                } else {
                    classTitle = "מכניקת מוצקים 2מ׳";
                    classTime = "12:30 - 14:30";
                    classRoom = "📍 ליידי דייוויס 240";
                    classLecturer = "👨‍🏫 מתרגל • תרגול כיתה";
                    classStatus = isEvening ? "מערכת מחר (יום רביעי) • שיעור ראשון" : "השיעור הבא מחר (רביעי) ב-12:30";
                }
                break;

            case Calendar.WEDNESDAY: // יום רביעי
                boolean solidsWedActive = (!isEvening && curTotalMin >= 750 && curTotalMin < 870);
                boolean cadWedActive = (!isEvening && curTotalMin >= 870 && curTotalMin < 1050);

                timelineClasses.add(new WearCarouselAdapter.ClassItem(
                    "מכניקת מוצקים 2מ׳",
                    "12:30 - 14:30",
                    "📍 ליידי דייוויס 240",
                    solidsWedActive
                ));
                timelineClasses.add(new WearCarouselAdapter.ClassItem(
                    "גרפיקה הנדסית וכתיבה טכנית",
                    "14:30 - 17:30",
                    "📍 דנציגר",
                    cadWedActive
                ));

                if (!isEvening && curTotalMin < 750) {
                    classTitle = "מכניקת מוצקים 2מ׳";
                    classTime = "12:30 - 14:30";
                    classRoom = "📍 ליידי דייוויס 240";
                    classLecturer = "👨‍🏫 מתרגל • תרגול כיתה";
                    classStatus = "מתחיל בעוד " + (750 - curTotalMin) + " דקות ⏰";
                } else if (!isEvening && curTotalMin < 765) {
                    classTitle = "מכניקת מוצקים 2מ׳";
                    classTime = "12:30 - 14:30";
                    classRoom = "📍 ליידי דייוויס 240";
                    classLecturer = "👨‍🏫 מתרגל • תרגול פעיל";
                    classStatus = "🟢 מתקיים כעת!";
                } else {
                    classTitle = "גרפיקה הנדסית וכתיבה טכנית";
                    classTime = "09:30 - 11:30";
                    classRoom = "📍 דנציגר";
                    classLecturer = "👨‍🏫 מרצה • הרצאה 10";
                    classStatus = isEvening ? "מערכת מחר (יום חמישי) • שיעור ראשון" : "השיעור הבא מחר (חמישי) ב-09:30";
                }
                break;

            case Calendar.THURSDAY: // יום חמישי
                boolean cadThuActive = (!isEvening && curTotalMin >= 570 && curTotalMin < 690);
                boolean physLabActive = (!isEvening && curTotalMin >= 750 && curTotalMin < 930);

                timelineClasses.add(new WearCarouselAdapter.ClassItem(
                    "גרפיקה הנדסית וכתיבה טכנית",
                    "09:30 - 11:30",
                    "📍 דנציגר",
                    cadThuActive
                ));
                timelineClasses.add(new WearCarouselAdapter.ClassItem(
                    "מעבדת פיסיקה 2",
                    "12:30 - 15:30",
                    "📍 פיסיקה 200",
                    physLabActive
                ));

                if (!isEvening && curTotalMin < 570) {
                    classTitle = "גרפיקה הנדסית וכתיבה טכנית";
                    classTime = "09:30 - 11:30";
                    classRoom = "📍 דנציגר";
                    classLecturer = "👨‍🏫 מרצה • הרצאה 10";
                    classStatus = "מתחיל בעוד " + (570 - curTotalMin) + " דקות ⏰";
                } else if (!isEvening && curTotalMin < 585) {
                    classTitle = "גרפיקה הנדסית וכתיבה טכנית";
                    classTime = "09:30 - 11:30";
                    classRoom = "📍 דנציגר";
                    classLecturer = "👨‍🏫 מעבדה פעילה";
                    classStatus = "🟢 מתקיים כעת!";
                } else {
                    classTitle = "משוואות דיפרנציאליות חלקיות מ׳";
                    classTime = "11:30 - 13:30";
                    classRoom = "📍 אולמן 506";
                    classLecturer = "👨‍🏫 אמתי אלפרין • תרגול 22";
                    classStatus = "סופ״ש נעים! 🎉 השיעור הבא ביום ראשון";
                }
                break;

            case Calendar.FRIDAY:
            case Calendar.SATURDAY:
                classTitle = "משוואות דיפרנציאליות חלקיות מ׳";
                classTime = "11:30 - 13:30";
                classRoom = "📍 אולמן 506";
                classLecturer = "👨‍🏫 אמתי אלפרין • תרגול 22";
                classStatus = "שבוע חדש מתחיל ביום ראשון ב-11:30";
                break;
        }

        // Apply radar data to adapter
        adapter.radarDay = curDayName + " • " + formattedDate;
        adapter.radarStatus = classStatus;
        adapter.radarCourse = classTitle;
        adapter.radarTime = classTime;
        adapter.radarRoom = classRoom;
        adapter.radarLecturer = classLecturer;

        // Apply timeline data to adapter
        adapter.timelineHeader = "לו״ז " + curDayName + " (" + formattedDate + ")";
        adapter.timelineClasses = timelineClasses;

        // Screen 2: Tasks & Exams (Matches Screenshot 1 with Sanitized Clean Hebrew)
        String examDays = prefs.getString("exam_days", "📝 מועד א׳ בעוד 14 ימים");
        if (examDays == null || examDays.contains("?") || examDays.equals("--") || examDays.trim().isEmpty()) {
            examDays = "📝 מועד א׳ בעוד 14 ימים";
        }
        String examTitle = prefs.getString("exam_title", "104228 - מד״ח מ'");
        if (examTitle == null || examTitle.contains("?") || examTitle.trim().isEmpty()) {
            examTitle = "104228 - מד״ח מ'";
        }
        adapter.examBannerTitle = examDays;
        adapter.examBannerSub = examTitle;

        List<WearCarouselAdapter.TaskItem> tasks = new ArrayList<>();
        tasks.add(new WearCarouselAdapter.TaskItem(
            "[מדח מ׳] תרגיל בית 1: משוואו...",
            "⏳ מודל טכניון",
            prefs.getBoolean("wear_task_1_done", false)
        ));
        tasks.add(new WearCarouselAdapter.TaskItem(
            "[מדח מ׳] WebWork 1: מד״ח מ׳",
            "⏳ מערכת WebWork",
            prefs.getBoolean("wear_task_2_done", false)
        ));
        tasks.add(new WearCarouselAdapter.TaskItem(
            "[פיסיקה 2] תרגיל בית 1: אלקט...",
            "⏳ מודל טכניון",
            prefs.getBoolean("wear_task_3_done", false)
        ));
        tasks.add(new WearCarouselAdapter.TaskItem(
            "[פיסיקה 2] WebWork 1: פיסיק...",
            "⏳ מערכת WebWork",
            prefs.getBoolean("wear_task_4_done", false)
        ));
        tasks.add(new WearCarouselAdapter.TaskItem(
            "[תרמו 1] תרגיל בית 1: חוק רא...",
            "⏳ מודל טכניון",
            prefs.getBoolean("wear_task_5_done", false)
        ));
        adapter.tasksList = tasks;

        adapter.notifyDataSetChanged();
    }
}
