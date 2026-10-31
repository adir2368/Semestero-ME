package com.technion.semestero.wear;

import android.app.Activity;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Vibrator;
import android.view.InputDevice;
import android.view.MotionEvent;
import android.view.View;
import android.widget.Button;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {

    public static final String PREFS_NAME = "semestero_wear_prefs";
    private static final int PERMISSION_REQ_NOTIF = 201;

    private ScrollView scrollView;
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

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        scrollView = findViewById(R.id.wear_scroll_view);
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
            if (vibrator != null) vibrator.vibrate(30);
            updateUIFromPrefs();
            Toast.makeText(this, "הנתונים עודכנו", Toast.LENGTH_SHORT).show();
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

        // Ensure rotary bezel events focus on the scrollview
        scrollView.requestFocus();
    }

    @Override
    protected void onResume() {
        super.onResume();
        updateUIFromPrefs();
        scrollView.requestFocus();
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

    private void updateUIFromPrefs() {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        String classTitle = prefs.getString("class_title", "אין שיעורים קרובים היום");
        String classTime = prefs.getString("class_time", "--:--");
        String classRoom = prefs.getString("class_details", "יום חופשי או שהסתיימו הלימודים 🎉");
        String classStatus = prefs.getString("class_status", "חופשי");

        String examDays = prefs.getString("exam_days", "מבחן מועד א׳");
        String tasksSummary = prefs.getString("tasks_summary", "0 משימות פתוחות");

        String gpaVal = prefs.getString("gpa_current", "86.04");
        String honors = prefs.getString("gpa_badge", "🎖️ הצטיינות (Cum Laude)");

        tvClassTitle.setText(classTitle);
        tvClassTime.setText(classTime);
        tvClassRoom.setText(classRoom);
        tvClassStatus.setText(classStatus);

        tvExamCountdown.setText(examDays);
        tvTasksSummary.setText(tasksSummary);

        tvGpaVal.setText(gpaVal);
        tvHonorsBadge.setText(honors);
    }
}
