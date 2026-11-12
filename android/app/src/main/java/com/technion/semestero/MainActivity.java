package com.technion.semestero;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static MainActivity instance;

    public static MainActivity getInstance() {
        return instance;
    }

    public static void triggerTasksSyncFromWear(String taskId, boolean isDone) {
        if (instance != null && instance.getBridge() != null && instance.getBridge().getWebView() != null) {
            instance.runOnUiThread(() -> {
                try {
                    String js = "(function() { " +
                        "if (typeof window.markTaskCompletedById === 'function') { " +
                        "  window.markTaskCompletedById('" + taskId + "', " + isDone + "); " +
                        "} else if (typeof gameState !== 'undefined') { " +
                        "  var modified = false; " +
                        "  Object.values(gameState.courses || {}).forEach(function(c) { " +
                        "    (c.tasks || []).forEach(function(t) { " +
                        "      if (t.id === '" + taskId + "') { t.completed = " + isDone + "; t.status = " + (isDone ? "'done'" : "'todo'") + "; modified = true; } " +
                        "    }); " +
                        "  }); " +
                        "  if (modified) { " +
                        "    if (typeof saveState === 'function') saveState(); " +
                        "    if (typeof syncNativeAndroidWidgets === 'function') syncNativeAndroidWidgets(); " +
                        "  } " +
                        "} " +
                        "})();";
                    instance.getBridge().getWebView().evaluateJavascript(js, null);
                } catch (Exception ignored) {}
            });
        }
    }

    public static void requestWidgetRefreshFromWear() {
        if (instance != null && instance.getBridge() != null && instance.getBridge().getWebView() != null) {
            instance.runOnUiThread(() -> {
                try {
                    instance.getBridge().getWebView().evaluateJavascript(
                        "if (typeof syncNativeAndroidWidgets === 'function') syncNativeAndroidWidgets();",
                        null
                    );
                } catch (Exception ignored) {}
            });
        }
    }
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        instance = this;
        
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
            android.view.Window window = getWindow();
            window.addFlags(android.view.WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.setStatusBarColor(android.graphics.Color.parseColor("#020617"));
        }

        configureWebView();
        handleWidgetIntent(getIntent());
        WearSyncManager.syncAllToWatch(this);
    }

    @Override
    public void onDestroy() {
        if (instance == this) instance = null;
        super.onDestroy();
    }

    @Override
    public void onStart() {
        super.onStart();
        configureWebView();
        handleWidgetIntent(getIntent());
        WearSyncManager.syncAllToWatch(this);
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

            webView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
                try {
                    android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_VIEW);
                    intent.setData(android.net.Uri.parse(url));
                    intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(intent);
                } catch (Exception e) {
                    android.util.Log.e("SemesteroWebView", "Download listener error: " + e.getMessage());
                }
            });
        }
    }

    public static class SemesteroWidgetBridge {
        private final Context context;

        public SemesteroWidgetBridge(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public void openExternalUrl(String url) {
            if (url == null || url.trim().isEmpty()) return;
            try {
                android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_VIEW);
                intent.setData(android.net.Uri.parse(url.trim()));
                intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            } catch (Exception e) {
                android.util.Log.e("SemesteroBridge", "Error opening external URL: " + e.getMessage());
            }
        }

                @JavascriptInterface
        public void syncAllToWatch() {
            WearSyncManager.syncAllToWatch(context);
        }
        @JavascriptInterface
        public void sendTestNotificationToWatch(String title, String message) {
            WearSyncManager.sendTestNotificationToWatch(context, title, message);
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
            WearSyncManager.syncClassToWatch(context, title, time, details, lecturer, status);
        }

        @JavascriptInterface
        public void updateTasksWidget(String examDays, String examTitle, String examSub, String task1, String task1Id, String task2, String task2Id, String tasksSummary) {
            updateTasksWidget(examDays, examTitle, examSub, task1, task1Id, task2, task2Id, tasksSummary, "[]");
        }

        @JavascriptInterface
        public void updateTasksWidget(String examDays, String examTitle, String examSub, String task1, String task1Id, String task2, String task2Id, String tasksSummary, String allTasksJson) {
            SharedPreferences prefs = context.getSharedPreferences(SemesteroTasksExamWidget.PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit()
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
                .putString("all_tasks_json", (allTasksJson != null && !allTasksJson.trim().isEmpty()) ? allTasksJson : "[]");

            try {
                org.json.JSONArray arr = new org.json.JSONArray(allTasksJson);
                if (arr.length() > 2) {
                    org.json.JSONObject o3 = arr.getJSONObject(2);
                    String t3Course = o3.optString("course", "");
                    String t3Title = o3.optString("title", "");
                    String fullT3 = (!t3Course.isEmpty() && !t3Title.startsWith("[")) ? ("\uD83D\uDCCC [" + t3Course + "] " + t3Title) : t3Title;
                    editor.putString("task_3", fullT3);
                    editor.putString("task_3_id", o3.optString("id", ""));
                    editor.putBoolean("task_3_done", false);
                }
            } catch (Exception ignored) {}
            editor.apply();

            SemesteroTasksExamWidget.pushUpdate(context);
            WearSyncManager.syncTasksToWatch(context, examDays + " - " + examTitle, tasksSummary, allTasksJson);
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
            updateScheduleWidget(totalHours, sun, mon, tue, wed, thu, "[]");
        }

        @JavascriptInterface
        public void updateScheduleWidget(String totalHours, String sun, String mon, String tue, String wed, String thu, String fullTimetableJson) {
            SharedPreferences prefs = context.getSharedPreferences(SemesteroScheduleWidget.PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit()
                .putString("sched_total_hours", totalHours)
                .putString("sched_sun", sun)
                .putString("sched_mon", mon)
                .putString("sched_tue", tue)
                .putString("sched_wed", wed)
                .putString("sched_thu", thu);
            if (fullTimetableJson != null && !fullTimetableJson.trim().isEmpty() && !fullTimetableJson.equals("[]")) {
                editor.putString("full_timetable_json", fullTimetableJson);
            }
            editor.apply();
            SemesteroScheduleWidget.pushUpdate(context);
            WearSyncManager.syncAllToWatch(context);
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
            WearSyncManager.syncGpaToWatch(context, gpaCurrent, badge);
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
        public void clearWidgetData() {
            SharedPreferences prefs = context.getSharedPreferences(SemesteroNextClassWidget.PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit().clear().apply();
            refreshAllWidgets();
        }

        @JavascriptInterface
        public void updateLaunchpadCheeseForkUrl(String url) {
            SharedPreferences prefs = context.getSharedPreferences(SemesteroLaunchpadWidget.PREFS_NAME, Context.MODE_PRIVATE);
            String safeUrl = (url != null && url.trim().startsWith("http")) ? url.trim() : "https://cheesefork.cf/";
            prefs.edit().putString("launchpad_cheesefork_url", safeUrl).apply();
            SemesteroLaunchpadWidget.pushUpdate(context);
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
                conn.setRequestProperty("User-Agent", "SemesteroME-Android/2.8.8");
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
