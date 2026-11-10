package com.technion.semestero.wear;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.drawable.Icon;
import android.os.RemoteException;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.wear.watchface.complications.data.ComplicationData;
import androidx.wear.watchface.complications.data.ComplicationType;
import androidx.wear.watchface.complications.data.LongTextComplicationData;
import androidx.wear.watchface.complications.data.MonochromaticImage;
import androidx.wear.watchface.complications.data.PlainComplicationText;
import androidx.wear.watchface.complications.data.ShortTextComplicationData;
import androidx.wear.watchface.complications.datasource.ComplicationDataSourceService;
import androidx.wear.watchface.complications.datasource.ComplicationRequest;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Semestero ME • Galaxy Watch 8 Corner / Watch Face Open Tasks Complication Provider.
 * Displays real-time count of open assignments, homework, and tasks in dial corners.
 * One tap anywhere on the complication opens MainActivity directly into the Tasks tab.
 */
public class SemesteroTasksComplicationService extends ComplicationDataSourceService {

    private static final String TAG = "SemesteroTasksCompl";

    @Nullable
    @Override
    public ComplicationData getPreviewData(@NonNull ComplicationType type) {
        PendingIntent tapIntent = getLaunchIntent();
        PlainComplicationText text = new PlainComplicationText.Builder("3").build();
        PlainComplicationText title = new PlainComplicationText.Builder("משימות").build();
        Icon icon = Icon.createWithResource(this, R.drawable.ic_stat_notification);
        MonochromaticImage mono = new MonochromaticImage.Builder(icon).build();

        if (type == ComplicationType.SHORT_TEXT) {
            return new ShortTextComplicationData.Builder(text, new PlainComplicationText.Builder("3 משימות פתוחות").build())
                .setTitle(title)
                .setMonochromaticImage(mono)
                .setTapAction(tapIntent)
                .build();
        } else if (type == ComplicationType.LONG_TEXT) {
            return new LongTextComplicationData.Builder(
                new PlainComplicationText.Builder("3 משימות פתוחות").build(),
                new PlainComplicationText.Builder("3 משימות פתוחות").build()
            )
            .setTitle(new PlainComplicationText.Builder("משימות").build())
            .setMonochromaticImage(mono)
            .setTapAction(tapIntent)
            .build();
        }
        return null;
    }

    @Override
    public void onComplicationRequest(@NonNull ComplicationRequest request, @NonNull ComplicationRequestListener listener) {
        SharedPreferences prefs = getSharedPreferences(MainActivity.PREFS_NAME, Context.MODE_PRIVATE);
        int openTasksCount = countOpenTasks(prefs);

        PendingIntent tapIntent = getLaunchIntent();
        Icon icon = Icon.createWithResource(this, R.drawable.ic_stat_notification);
        MonochromaticImage mono = new MonochromaticImage.Builder(icon).build();

        String shortTextStr = String.valueOf(openTasksCount);
        String shortTitleStr = "משימות";
        String longTextStr;
        String contentDesc;

        if (openTasksCount == 0) {
            longTextStr = "אין משימות פתוחות 🎉";
            contentDesc = "כל המשימות הושלמו";
        } else if (openTasksCount == 1) {
            longTextStr = "משימה 1 פתוחה";
            contentDesc = "משימה אחת פתוחה";
        } else {
            longTextStr = openTasksCount + " משימות פתוחות";
            contentDesc = openTasksCount + " משימות פתוחות";
        }

        ComplicationData data = null;
        ComplicationType type = request.getComplicationType();

        if (type == ComplicationType.SHORT_TEXT) {
            data = new ShortTextComplicationData.Builder(
                new PlainComplicationText.Builder(shortTextStr).build(),
                new PlainComplicationText.Builder(contentDesc).build()
            )
            .setTitle(new PlainComplicationText.Builder(shortTitleStr).build())
            .setMonochromaticImage(mono)
            .setTapAction(tapIntent)
            .build();
        } else if (type == ComplicationType.LONG_TEXT) {
            data = new LongTextComplicationData.Builder(
                new PlainComplicationText.Builder(longTextStr).build(),
                new PlainComplicationText.Builder(contentDesc).build()
            )
            .setTitle(new PlainComplicationText.Builder("משימות").build())
            .setMonochromaticImage(mono)
            .setTapAction(tapIntent)
            .build();
        }

        try {
            listener.onComplicationData(data);
        } catch (RemoteException e) {
            Log.e(TAG, "Error returning tasks complication data: ", e);
        }
    }

    /**
     * Resolves the exact count of active, uncompleted tasks across synchronized payload
     * and local watch toggles.
     */
    public static int countOpenTasks(SharedPreferences prefs) {
        if (prefs == null) return 0;
        int count = 0;
        boolean calculatedFromJson = false;

        String allTasksJson = prefs.getString("all_tasks_json", "");
        if (allTasksJson != null && !allTasksJson.trim().isEmpty() && !allTasksJson.trim().equals("[]")) {
            try {
                JSONArray arr = new JSONArray(allTasksJson);
                if (arr.length() > 0) {
                    calculatedFromJson = true;
                    for (int i = 0; i < arr.length(); i++) {
                        JSONObject obj = arr.getJSONObject(i);
                        boolean isDone = obj.optBoolean("completed", false);
                        // Check local watch toggle overrides for displayed tasks
                        if (i < 5 && prefs.getBoolean("wear_task_" + (i + 1) + "_done", false)) {
                            isDone = true;
                        }
                        if (!isDone) {
                            count++;
                        }
                    }
                }
            } catch (Exception e) {
                Log.w(TAG, "Failed parsing all_tasks_json, falling back: " + e.getMessage());
            }
        }

        if (!calculatedFromJson) {
            // Fallback: examine task_1, task_2, task_3 keys
            for (int i = 1; i <= 3; i++) {
                String taskText = prefs.getString("task_" + i, "");
                boolean isDone = prefs.getBoolean("wear_task_" + i + "_done", false)
                    || prefs.getBoolean("task_" + i + "_done", false);
                if (taskText != null && !taskText.trim().isEmpty() && !isDone && !taskText.contains("אין משימות")) {
                    count++;
                }
            }
        }

        return count;
    }

    private PendingIntent getLaunchIntent() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.setAction(MainActivity.ACTION_SET_PAGE);
        intent.putExtra("page", 2); // 2 = WearCarouselAdapter.TYPE_TASKS
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(
            this,
            1202,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }
}
