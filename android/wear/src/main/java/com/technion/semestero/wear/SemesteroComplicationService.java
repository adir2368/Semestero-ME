package com.technion.semestero.wear;

import android.app.PendingIntent;
import android.content.Intent;
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
import java.util.Calendar;

/**
 * Semestero ME • Galaxy Watch 8 Corner / Quadrant Complication Provider.
 * Allows the user to add a glanceable Semestero slot to any corner of their watch face
 * (alongside battery %, step counter, etc.).
 * 
 * Supports:
 * - SHORT_TEXT (corner quadrants, circular dials, modular watch face slots)
 * - LONG_TEXT (horizontal banner slots)
 * 
 * Direct tap navigates to MainActivity on the watch.
 */
public class SemesteroComplicationService extends ComplicationDataSourceService {

    private static final String TAG = "SemesteroComplication";

    @Nullable
    @Override
    public ComplicationData getPreviewData(@NonNull ComplicationType type) {
        PendingIntent tapIntent = getLaunchIntent();
        PlainComplicationText text = new PlainComplicationText.Builder("12:30").build();
        PlainComplicationText title = new PlainComplicationText.Builder("מד״ח מ׳").build();
        Icon icon = Icon.createWithResource(this, R.drawable.ic_stat_notification);
        MonochromaticImage mono = new MonochromaticImage.Builder(icon).build();

        if (type == ComplicationType.SHORT_TEXT) {
            return new ShortTextComplicationData.Builder(text, new PlainComplicationText.Builder("סמסטרו ME").build())
                .setTitle(title)
                .setMonochromaticImage(mono)
                .setTapAction(tapIntent)
                .build();
        } else if (type == ComplicationType.LONG_TEXT) {
            return new LongTextComplicationData.Builder(
                new PlainComplicationText.Builder("12:30 משוואות דיפרנציאליות").build(),
                new PlainComplicationText.Builder("סמסטרו ME").build()
            )
            .setTitle(new PlainComplicationText.Builder("📍 אולמן 506").build())
            .setMonochromaticImage(mono)
            .setTapAction(tapIntent)
            .build();
        }
        return null;
    }

    @Override
    public void onComplicationRequest(@NonNull ComplicationRequest request, @NonNull ComplicationRequestListener listener) {
        Calendar now = Calendar.getInstance();
        WearScheduleHelper.ScheduleResolution res = WearScheduleHelper.resolve(this, now);

        PendingIntent tapIntent = getLaunchIntent();
        Icon icon = Icon.createWithResource(this, R.drawable.ic_stat_notification);
        MonochromaticImage mono = new MonochromaticImage.Builder(icon).build();

        String mainText;
        String titleText;
        String longText;

        String shortName = getShortCourseName(res.courseTitle);
        String shortRoom = getShortRoomName(res.roomText);

        if (res.isActive) {
            mainText = "פעיל";
            titleText = shortName;
            longText = "🟢 " + shortName + " (" + res.timeText + ")";
        } else if (res.isStartingSoon) {
            // e.g. "15ד׳"
            mainText = res.statusText.replace("⏰ מתחיל בעוד ", "").replace(" דקות", "ד׳");
            titleText = shortName;
            longText = "⏳ " + shortName + " • " + shortRoom;
        } else if (!res.isTomorrow && !res.isFreeDay) {
            mainText = res.timeText.split(" - ")[0]; // e.g. "14:30"
            titleText = shortName;
            longText = shortName + " • " + res.timeText;
        } else if (res.isTomorrow) {
            mainText = "מחר";
            titleText = shortName;
            longText = "מחר: " + shortName + " (" + res.timeText.split(" - ")[0] + ")";
        } else {
            mainText = "חופשי";
            titleText = "סמסטרו";
            longText = "חופשי • אין שיעורים";
        }

        ComplicationData data = null;
        ComplicationType type = request.getComplicationType();

        if (type == ComplicationType.SHORT_TEXT) {
            data = new ShortTextComplicationData.Builder(
                new PlainComplicationText.Builder(mainText).build(),
                new PlainComplicationText.Builder("סמסטרו ME").build()
            )
            .setTitle(new PlainComplicationText.Builder(titleText).build())
            .setMonochromaticImage(mono)
            .setTapAction(tapIntent)
            .build();
        } else if (type == ComplicationType.LONG_TEXT) {
            data = new LongTextComplicationData.Builder(
                new PlainComplicationText.Builder(longText).build(),
                new PlainComplicationText.Builder("סמסטרו ME").build()
            )
            .setTitle(new PlainComplicationText.Builder(shortRoom).build())
            .setMonochromaticImage(mono)
            .setTapAction(tapIntent)
            .build();
        }

        try {
            listener.onComplicationData(data);
        } catch (RemoteException e) {
            Log.e(TAG, "Error returning complication data: ", e);
        }
    }

    private PendingIntent getLaunchIntent() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(
            this,
            1201,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private String getShortCourseName(String title) {
        if (title == null) return "סמסטרו";
        if (title.contains("דיפרנציאליות") || title.contains("מד״ח") || title.contains("מד\"ח") || title.contains("מדר")) return "מד״ח מ׳";
        if (title.contains("חדוא") || title.contains("חדו״א")) return "חדו״א";
        if (title.contains("מוצקים")) return "מוצקים";
        if (title.contains("חישוב") || title.contains("מדעי והנדסי") || title.contains("מלמו") || title.contains("מלמ״ו")) return "מלמ״ו";
        if (title.contains("תרמודינמיקה")) return "תרמו 1";
        if (title.contains("פיסיקה")) return "פיסיקה 2";
        if (title.contains("אתלטיקה") || title.contains("יוגה") || title.contains("ספורט")) return "אתלטיקה";
        if (title.contains("גרפיקה")) return "גרפיקה";
        if (title.contains("כימיה")) return "כימיה";
        if (title.length() > 6) return title.substring(0, 6);
        return title;
    }

    private String getShortRoomName(String room) {
        if (room == null) return "";
        String r = room.replace("📍", "").trim();
        if (r.contains("הנדסה כימית")) return "כימית 1";
        if (r.contains("טאוב")) return "טאוב 1";
        if (r.contains("ספורט") || r.contains("אתלטיקה")) return "ספורט";
        if (r.contains("שרמן")) return "שרמן 107";
        if (r.contains("אולמן")) {
            // Keep room number, e.g. "אולמן 506"
            return r;
        }
        return r;
    }
}
