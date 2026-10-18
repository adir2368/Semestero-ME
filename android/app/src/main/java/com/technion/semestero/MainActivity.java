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
        if (intent != null && intent.hasExtra("target_tab")) {
            String tab = intent.getStringExtra("target_tab");
            String tabId = "timetable".equals(tab) ? "timetable" : "tasks";
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().postDelayed(() -> {
                    getBridge().getWebView().evaluateJavascript(
                        "if (typeof window.setActiveMainTab === 'function') { window.setActiveMainTab('" + tabId + "'); }",
                        null
                    );
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
        public void updateClassWidget(String title, String time, String details, String lecturer, String status) {
            SharedPreferences prefs = context.getSharedPreferences(SemesteroNextClassWidget.PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit()
                .putString("class_title", title)
                .putString("class_time", time)
                .putString("class_details", details)
                .putString("class_lecturer", lecturer)
                .putString("class_status", status)
                .apply();

            SemesteroNextClassWidget.pushUpdate(context);
        }

        @JavascriptInterface
        public void updateTasksWidget(String examDays, String examTitle, String examSub, String task1, String task2, String tasksSummary) {
            SharedPreferences prefs = context.getSharedPreferences(SemesteroTasksExamWidget.PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit()
                .putString("exam_days", examDays)
                .putString("exam_title", examTitle)
                .putString("exam_sub", examSub)
                .putString("task_1", task1)
                .putString("task_2", task2)
                .putString("tasks_summary", tasksSummary)
                .apply();

            SemesteroTasksExamWidget.pushUpdate(context);
        }
    }
}
