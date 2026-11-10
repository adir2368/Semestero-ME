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
 * Semestero ME • Galaxy Watch 8 Corner / Watch Face Complication Provider.
 * Provides concise abbreviations for watch complications so names never cut off:
 * מד"ר ח, חדו"א, מוצקים, חישוב הנדסי, תרמו 1, פיסיקה 2, יוגה.
 */
public class SemesteroComplicationService extends ComplicationDataSourceService {

    private static final String TAG = "SemesteroComplication";

    @Nullable
    @Override
    public ComplicationData getPreviewData(@NonNull ComplicationType type) {
        PendingIntent tapIntent = getLaunchIntent();
        PlainComplicationText text = new PlainComplicationText.Builder("11:30").build();
        PlainComplicationText title = new PlainComplicationText.Builder("מד\"ר ח").build();
        Icon icon = Icon.createWithResource(this, R.drawable.ic_stat_notification);
        MonochromaticImage mono = new MonochromaticImage.Builder(icon).build();

        if (type == ComplicationType.SHORT_TEXT) {
            return new ShortTextComplicationData.Builder(text, new PlainComplicationText.Builder("שיעור קרוב").build())
                .setTitle(title)
                .setMonochromaticImage(mono)
                .setTapAction(tapIntent)
                .build();
        } else if (type == ComplicationType.LONG_TEXT) {
            return new LongTextComplicationData.Builder(
                new PlainComplicationText.Builder("11:30 מד\"ר ח").build(),
                new PlainComplicationText.Builder("שיעור קרוב").build()
            )
            .setTitle(new PlainComplicationText.Builder("אולמן 506").build())
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

        String shortName = getShortCourseName(res.courseTitle);
        String shortRoom = getShortRoomName(res.roomText);

        String mainText;
        String titleText = shortName;
        String longText;

        if (res.isActive) {
            mainText = "פעיל";
            longText = "🟢 " + shortName + " (" + res.timeText + ")";
        } else if (res.isStartingSoon) {
            mainText = res.statusText.replace("מתחיל בעוד ", "").replace(" דקות", "ד'");
            longText = "⏳ " + shortName + " ב-" + shortRoom;
        } else if (!res.isTomorrow && !res.isFreeDay && !res.timeText.isEmpty()) {
            mainText = res.timeText.split(" - ")[0];
            longText = shortName + " ב-" + res.timeText;
        } else if (res.isTomorrow) {
            mainText = "מחר";
            longText = "מחר: " + shortName + " (" + (res.timeText.contains(" - ") ? res.timeText.split(" - ")[0] : res.timeText) + ")";
        } else {
            mainText = "חופשי";
            titleText = "לו״ז";
            longText = "יום חופשי מלימודים";
        }

        ComplicationData data = null;
        ComplicationType type = request.getComplicationType();

        if (type == ComplicationType.SHORT_TEXT) {
            data = new ShortTextComplicationData.Builder(
                new PlainComplicationText.Builder(mainText).build(),
                new PlainComplicationText.Builder("שיעור קרוב").build()
            )
            .setTitle(new PlainComplicationText.Builder(titleText).build())
            .setMonochromaticImage(mono)
            .setTapAction(tapIntent)
            .build();
        } else if (type == ComplicationType.LONG_TEXT) {
            data = new LongTextComplicationData.Builder(
                new PlainComplicationText.Builder(longText).build(),
                new PlainComplicationText.Builder("שיעור קרוב").build()
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

    /**
     * Translates long Technion course titles to ultra-concise watch complication names
     * to prevent truncation on Samsung Galaxy Watch 8 corner dial widgets.
     */
    private String getShortCourseName(String title) {
        if (title == null || title.trim().isEmpty()) return "לו״ז";
        String t = title.toLowerCase();

        if (t.contains("דיפרנציאליות חלקיות") || t.contains("מד\"ר ח") || t.contains("מד\"ח") || t.contains("מדח") || t.contains("104228")) {
            return "מד\"ר ח";
        }
        if (t.contains("מוצקים") || t.contains("034053") || t.contains("34053")) {
            return "מוצקים";
        }
        if (t.contains("חישוב") || t.contains("מדעי והנדסי") || t.contains("מלמ\"ה") || t.contains("מלמה") || t.contains("034056") || t.contains("34056")) {
            return "חישוב הנדסי";
        }
        if (t.contains("תרמו") || t.contains("תרמודינמיקה") || t.contains("034035") || t.contains("34035")) {
            return "תרמו 1";
        }
        if (t.contains("פיסיקה") || t.contains("פיזיקה") || t.contains("114052")) {
            return "פיסיקה 2";
        }
        if (t.contains("יוגה") || t.contains("אתלטיקה") || t.contains("גופני") || t.contains("03940805") || t.contains("3940805")) {
            return "יוגה";
        }
        if (t.contains("חדו\"א") || t.contains("חדוא") || t.contains("104043") || t.contains("104041")) {
            return "חדו\"א";
        }
        if (t.contains("כימיה") || t.contains("125013") || t.contains("125001")) {
            return "כימיה";
        }

        if (title.length() > 8) {
            return title.substring(0, 8);
        }
        return title;
    }

    private String getShortRoomName(String room) {
        if (room == null || room.trim().isEmpty()) return "טכניון";
        String r = room.replace("חדר:", "").replace("חדר", "").trim();
        if (r.contains("הנדסה כימית 1") || r.contains("כימית 1")) return "כימית 1";
        if (r.contains("דן קאהן") || r.contains("מכונות 6")) return "קאהן 6";
        if (r.contains("טאוב") || r.contains("מדמ\"ח 1")) return "טאוב 1";
        if (r.contains("אולמן 506")) return "אולמן 506";
        if (r.contains("אולמן 602")) return "אולמן 602";
        if (r.contains("אולמן 606")) return "אולמן 606";
        if (r.contains("אולמן 705")) return "אולמן 705";
        if (r.contains("אולמן 101")) return "אולמן 101";
        if (r.contains("אולמן 103")) return "אולמן 103";
        if (r.contains("אתלטיקה קלה") || r.contains("חינוך גופני")) return "אתלטיקה";
        if (r.contains("פיזיקה 1") || r.contains("פיסיקה 1")) return "פיסיקה 1";
        return r;
    }
}
