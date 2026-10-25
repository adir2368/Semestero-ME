package com.technion.semestero;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
            android.view.Window window = getWindow();
            window.addFlags(android.view.WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.setStatusBarColor(android.graphics.Color.parseColor("#020617"));
        }

        configureWebView();
        handleWidgetIntent(getIntent());
    }

    @Override
    public void onStart() {
        super.onStart();
        configureWebView();
        handleWidgetIntent(getIntent());
    }

    @Override
    public void onNewIntent(android.content.Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleWidgetIntent(intent);
    }

    private void handleWidgetIntent(android.content.Intent intent) {
        if (intent != null) {
            String action = intent.getStringExtra("widget_action");
            String tab = intent.getStringExtra("target_tab");
            String filter = intent.getStringExtra("filter");
            boolean pomodoroActive = intent.getBooleanExtra("pomodoro_active", false);
            String tabId = "timetable".equals(tab) ? "timetable" : ("tasks".equals(tab) ? "tasks" : ("runway".equals(tab) ? "runway" : ("flowchart".equals(tab) ? "flowchart" : null)));

            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().postDelayed(() -> {
                    if ("add_task".equals(action)) {
                        getBridge().getWebView().evaluateJavascript(
                            "if (typeof window.setActiveMainTab === 'function') { window.setActiveMainTab('tasks'); } if (typeof window.openAddCustomTaskModal === 'function') { window.openAddCustomTaskModal('', 'course'); }",
                            null
                        );
                    } else if ("miluim".equals(filter)) {
                        getBridge().getWebView().evaluateJavascript(
                            "if (typeof window.setActiveMainTab === 'function') { window.setActiveMainTab('tasks'); } setTimeout(() => { const pill = document.querySelector('.organit-pill[data-category=\"miluim\"]'); if (pill) pill.click(); }, 150);",
                            null
                        );
                    } else if (pomodoroActive) {
                        getBridge().getWebView().evaluateJavascript(
                            "if (typeof window.setActiveMainTab === 'function') { window.setActiveMainTab('runway'); }",
                            null
                        );
                    } else if (tabId != null) {
                        getBridge().getWebView().evaluateJavascript(
                            "if (typeof window.setActiveMainTab === 'function') { window.setActiveMainTab('" + tabId + "'); }",
                            null
                        );
                    }
                }, 450);
            }
        }
    }

    private void configureWebView() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            WebSettings settings = webView.getSettings();
            settings.setTextZoom(100);
            webView.setBackgroundColor(android.graphics.Color.parseColor("#020617"));
            webView.addJavascriptInterface(new SemesteroWidgetBridge(this), "SemesteroWidgetBridge");
        }
    }

    public static class SemesteroWidgetBridge {
        private final Context context;

        public SemesteroWidgetBridge(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public void updateClassWidget(String title, String time, String details, String lecturer, String status, int totalClasses, String classesJson) {
            SharedPreferences prefs = context.getSharedPreferences(SemesteroNextClassWidget.PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit()
                .putString("class_title", title)
                .putString("class_time", time)
                .putString("class_details", details)
                .putString("class_lecturer", lecturer)
                .putString("class_status", status)
                .putInt("all_classes_count", Math.max(1, totalClasses))
                .putString("all_classes_json", classesJson != null ? classesJson : "")
                .apply();

            SemesteroNextClassWidget.pushUpdate(context);
        }

        @JavascriptInterface
        public void updateTasksWidget(String examDays, String examTitle, String examSub, String task1, String task1Id, String task2, String task2Id, String tasksSummary) {
            SharedPreferences prefs = context.getSharedPreferences(SemesteroTasksExamWidget.PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit()
                .putString("exam_days", examDays)
                .putString("exam_title", examTitle)
                .putString("exam_sub", examSub)
                .putString("task_1", task1)
                .putString("task_1_id", task1Id != null ? task1Id : "")
                .putBoolean("task_1_done", false)
                .putString("task_2", task2)
                .putString("task_2_id", task2Id != null ? task2Id : "")
                .putBoolean("task_2_done", false)
                .putString("tasks_summary", tasksSummary)
                .apply();

            SemesteroTasksExamWidget.pushUpdate(context);
        }

        @JavascriptInterface
        public String getPendingCompletedTaskIds() {
            SharedPreferences prefs = context.getSharedPreferences(SemesteroTasksExamWidget.PREFS_NAME, Context.MODE_PRIVATE);
            String completed = prefs.getString("completed_from_widget_ids", "");
            if (!completed.isEmpty()) {
                prefs.edit().remove("completed_from_widget_ids").apply();
            }
            return completed;
        }

        @JavascriptInterface
        public int getPendingMiluimDays() {
            SharedPreferences prefs = context.getSharedPreferences(SemesteroMiluimWidget.PREFS_NAME, Context.MODE_PRIVATE);
            int days = prefs.getInt("pending_miluim_days_sync", -1);
            if (days >= 0) {
                prefs.edit().remove("pending_miluim_days_sync").apply();
            }
            return days;
        }

        @JavascriptInterface
        public void updateMiluimWidget(String days, String badge, String right1, String right2, String right3) {
            SharedPreferences prefs = context.getSharedPreferences(SemesteroMiluimWidget.PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit()
                .putString("miluim_days", days)
                .putString("miluim_badge", badge)
                .putString("miluim_right_1", right1)
                .putString("miluim_right_2", right2)
                .putString("miluim_right_3", right3)
                .apply();
            SemesteroMiluimWidget.pushUpdate(context);
        }

        @JavascriptInterface
        public void updateScheduleWidget(String totalHours, String sun, String mon, String tue, String wed, String thu) {
            SharedPreferences prefs = context.getSharedPreferences(SemesteroScheduleWidget.PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit()
                .putString("sched_total_hours", totalHours)
                .putString("sched_sun", sun)
                .putString("sched_mon", mon)
                .putString("sched_tue", tue)
                .putString("sched_wed", wed)
                .putString("sched_thu", thu)
                .apply();
            SemesteroScheduleWidget.pushUpdate(context);
        }

        @JavascriptInterface
        public void updateFinalsGpaWidget(String gpaCurrent, String gpaTarget, String badge, String examDays, String examName, String examCourse) {
            SharedPreferences prefs = context.getSharedPreferences(SemesteroFinalsGpaWidget.PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit()
                .putString("gpa_current", gpaCurrent)
                .putString("gpa_target", gpaTarget)
                .putString("gpa_badge", badge)
                .putString("finals_exam_days", examDays)
                .putString("finals_exam_name", examName)
                .putString("finals_exam_course", examCourse)
                .apply();
            SemesteroFinalsGpaWidget.pushUpdate(context);
        }

        @JavascriptInterface
        public void updatePomodoroWidget(String time, String mode, String task, String goal, boolean isRunning) {
            SharedPreferences prefs = context.getSharedPreferences(SemesteroPomodoroWidget.PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit()
                .putString("pomodoro_time", time)
                .putString("pomodoro_mode", mode)
                .putString("pomodoro_task", task)
                .putString("pomodoro_goal", goal)
                .putBoolean("pomodoro_running", isRunning)
                .apply();
            SemesteroPomodoroWidget.pushUpdate(context);
        }

        @JavascriptInterface
        public void refreshAllWidgets() {
            SemesteroNextClassWidget.pushUpdate(context);
            SemesteroTasksExamWidget.pushUpdate(context);
            SemesteroLaunchpadWidget.pushUpdate(context);
            SemesteroMiluimWidget.pushUpdate(context);
            SemesteroScheduleWidget.pushUpdate(context);
            SemesteroFinalsGpaWidget.pushUpdate(context);
            SemesteroPomodoroWidget.pushUpdate(context);
        }

        @JavascriptInterface
        public String fetchMoodleIcs(String targetUrl) {
            java.net.HttpURLConnection conn = null;
            java.io.BufferedReader reader = null;
            try {
                java.net.URL url = new java.net.URL(targetUrl);
                conn = (java.net.HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(20000);
                conn.setRequestProperty("Accept", "text/calendar, text/plain, */*");
                conn.setRequestProperty("User-Agent", "SemesteroME-Android/2.6.4");
                conn.setInstanceFollowRedirects(true);
                int code = conn.getResponseCode();
                if (code >= 200 && code < 300) {
                    reader = new java.io.BufferedReader(new java.io.InputStreamReader(conn.getInputStream(), java.nio.charset.StandardCharsets.UTF_8));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        sb.append(line).append("\n");
                    }
                    return sb.toString();
                } else {
                    return "ERROR: HTTP " + code;
                }
            } catch (Exception e) {
                return "ERROR: " + e.getMessage();
            } finally {
                if (reader != null) {
                    try { reader.close(); } catch (Exception ignored) {}
                }
                if (conn != null) {
                    try { conn.disconnect(); } catch (Exception ignored) {}
                }
            }
        }
    }
}
