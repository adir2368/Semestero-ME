package com.technion.semestero.wear;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.RemoteException;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.wear.watchface.complications.data.ComplicationData;
import androidx.wear.watchface.complications.data.ComplicationType;
import androidx.wear.watchface.complications.data.LongTextComplicationData;
import androidx.wear.watchface.complications.data.PlainComplicationText;
import androidx.wear.watchface.complications.data.ShortTextComplicationData;
import androidx.wear.watchface.complications.datasource.ComplicationDataSourceService;
import androidx.wear.watchface.complications.datasource.ComplicationRequest;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Semestero ME • Galaxy Watch 8 Corner / Watch Face Open Tasks Complication Provider.
 * Displays purely: "X משימות פתוחות" or "אין משימות פתוחות" in dial corners without any extra
 * icons, hours, titles, or branding symbols.
 * One tap anywhere on the complication opens MainActivity directly into the Tasks tab.
 */
public class SemesteroTasksComplicationService extends ComplicationDataSourceService {

    private static final String TAG = "SemesteroTasksCompl";

    @Nullable
    @Override
    public ComplicationData getPreviewData(@NonNull ComplicationType type) {
        PendingIntent tapIntent = getLaunchIntent();
        PlainComplicationText text = new PlainComplicationText.Builder("3 משימות פתוחות").build();

        if (type == ComplicationType.SHORT_TEXT) {
            return new ShortTextComplicationData.Builder(text, text)
                .setTapAction(tapIntent)
                .build();
        } else if (type == ComplicationType.LONG_TEXT) {
            return new LongTextComplicationData.Builder(text, text)
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

        // Strictly: "X משימות פתוחות" or "אין משימות פתוחות" - nothing else!
        String exactText;
        if (openTasksCount <= 0) {
            exactText = "אין משימות פתוחות";
        } else {
            exactText = openTasksCount + " משימות פתוחות";
        }

        PlainComplicationText complicationText = new PlainComplicationText.Builder(exactText).build();

        ComplicationData data = null;
        ComplicationType type = request.getComplicationType();

        if (type == ComplicationType.SHORT_TEXT) {
            data = new ShortTextComplicationData.Builder(
                complicationText,
                complicationText
            )
            .setTapAction(tapIntent)
            .build();
        } else if (type == ComplicationType.LONG_TEXT) {
            data = new LongTextComplicationData.Builder(
                complicationText,
                complicationText
            )
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
                        // Check if checked off directly on the wrist
                        if (i < 5 && prefs.getBoolean("wear_task_" + (i + 1) + "_done", false)) {
                            isDone = true;
                        }
                        if (!isDone) {
                            count++;
                        }
                    }
                }
            } catch (Exception e) {
                Log.w(TAG, "Failed parsing all_tasks_json: " + e.getMessage());
            }
        }

        // Fallback: check legacy task slots if all_tasks_json was not present
        if (!calculatedFromJson) {
            for (int i = 1; i <= 3; i++) {
                String taskText = prefs.getString("task_" + i, "");
                boolean isDone = prefs.getBoolean("wear_task_" + i + "_done", false)
                        || prefs.getBoolean("task_" + i + "_done", false);
                if (!taskText.isEmpty() && !isDone && !taskText.contains("אין משימות")) {
                    count++;
                }
            }
        }

        return count;
    }

    /**
     * PendingIntent targeting MainActivity with direct action to open Tasks carousel tab (index 2).
     */
    private PendingIntent getLaunchIntent() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.setAction(MainActivity.ACTION_SET_PAGE);
        intent.putExtra("page", 2); // Page 2 = Tasks
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        return PendingIntent.getActivity(
            this,
            201,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }
}
