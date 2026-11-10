package com.technion.semestero.wear;

import android.app.PendingIntent;
import android.content.Intent;
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
import java.util.Calendar;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Semestero ME • Galaxy Watch 8 Corner / Watch Face Complication Provider.
 * Ultra-minimalist next lecture/recitation provider:
 * Strictly: [Location] [Course] [Hour]
 * Zero status words ("פעיל", "מחר", "הבא"), zero countdown minutes,
 * zero symbols/icons/bullets ("•"), only the essentials.
 * e.g. "אולמן 506 מד\"ר ח 11:30" or "אין שיעורים".
 */
public class SemesteroComplicationService extends ComplicationDataSourceService {

    private static final String TAG = "SemesteroComplication";

    @Nullable
    @Override
    public ComplicationData getPreviewData(@NonNull ComplicationType type) {
        PendingIntent tapIntent = getLaunchIntent();
        PlainComplicationText text = new PlainComplicationText.Builder("אולמן 506 מד\"ר ח 11:30").build();

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
        Calendar now = Calendar.getInstance();
        WearScheduleHelper.ScheduleResolution res = WearScheduleHelper.resolve(this, now);

        PendingIntent tapIntent = getLaunchIntent();

        String shortName = getShortCourseName(res.courseTitle);
        String shortRoom = getShortRoomName(res.roomText);

        String timeStart = "";
        if (res.timeText != null && !res.timeText.trim().isEmpty()) {
            String trimmed = res.timeText.trim();
            if (trimmed.contains(" - ")) {
                timeStart = trimmed.split(" - ")[0].trim();
            } else if (trimmed.matches("^\\d{1,2}:\\d{2}.*")) {
                timeStart = trimmed.substring(0, 5).trim();
            }
        }

        boolean hasValidClass = !res.isFreeDay 
            && !timeStart.isEmpty() 
            && !timeStart.equals("--:--")
            && (res.courseTitle != null)
            && !res.courseTitle.contains("שבת")
            && !res.courseTitle.contains("סיום")
            && !res.courseTitle.contains("סוף שבוע")
            && !res.courseTitle.contains("חופשי");

        String text;
        if (hasValidClass) {
            if (!shortRoom.isEmpty()) {
                text = shortRoom + " " + shortName + " " + timeStart;
            } else {
                text = shortName + " " + timeStart;
            }
        } else {
            text = "אין שיעורים";
        }

        ComplicationData data = null;
        ComplicationType type = request.getComplicationType();

        PlainComplicationText compText = new PlainComplicationText.Builder(text).build();

        if (type == ComplicationType.SHORT_TEXT) {
            data = new ShortTextComplicationData.Builder(compText, compText)
                .setTapAction(tapIntent)
                .build();
        } else if (type == ComplicationType.LONG_TEXT) {
            data = new LongTextComplicationData.Builder(compText, compText)
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
    public static String getShortCourseName(String title) {
        if (title == null || title.trim().isEmpty()) return "שיעור";
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
        if (t.contains("חומרים") || t.contains("034028") || t.contains("34028")) {
            return "חומרים";
        }
        if (t.contains("זורמים") || t.contains("זרימה") || t.contains("034055") || t.contains("34055")) {
            return "זרימה 1";
        }

        if (title.length() > 8) {
            return title.substring(0, 8);
        }
        return title;
    }

    /**
     * Translates and compresses Technion classroom and building names to ultra-short
     * formats for Samsung Galaxy Watch 8 complications, handling both established and new locations.
     */
    public static String getShortRoomName(String room) {
        if (room == null || room.trim().isEmpty()) return "";
        String r = room.replace("חדר:", "").replace("חדר", "")
                       .replace("בניין:", "").replace("בניין", "")
                       .replace("אולם:", "").replace("אולם", "")
                       .replace("\"", "").replace("'", "")
                       .replace("-", " ").trim().replaceAll("\\s+", " ");

        if (r.isEmpty() || r.equals("טכניון") || r.equalsIgnoreCase("technion") 
            || r.contains("אין שיעורים") || r.contains("יום חופשי") || r.equals("כללי")) {
            return "";
        }

        // 1. Ullmann
        if (r.contains("אולמן")) {
            Matcher m = Pattern.compile("\\d+").matcher(r);
            if (m.find()) return "אולמן " + m.group();
            return "אולמן";
        }

        // 2. Dan Kahn / Mechanical
        if (r.contains("קאהן") || r.contains("מכונות")) {
            Matcher m = Pattern.compile("\\d+").matcher(r);
            if (m.find()) return "קאהן " + m.group();
            return "קאהן";
        }

        // 3. Chemical Engineering
        if (r.contains("כימית")) {
            Matcher m = Pattern.compile("\\d+").matcher(r);
            if (m.find()) {
                try {
                    int num = Integer.parseInt(m.group());
                    return "כימית " + num;
                } catch (NumberFormatException ignored) {
                    return "כימית " + m.group();
                }
            }
            return "כימית";
        }

        // 4. Taub / CS
        if (r.contains("טאוב") || r.contains("מדמ\"ח") || r.contains("מדמח")) {
            Matcher m = Pattern.compile("\\d+").matcher(r);
            if (m.find()) return "טאוב " + m.group();
            return "טאוב";
        }

        // 5. Sego
        if (r.contains("סגו")) {
            Matcher m = Pattern.compile("\\d+").matcher(r);
            if (m.find()) return "סגו " + m.group();
            return "סגו";
        }

        // 6. Lady Davis
        if (r.contains("דיוויס") || r.contains("דייויס")) {
            Matcher m = Pattern.compile("\\d+").matcher(r);
            if (m.find()) return "דייויס " + m.group();
            return "דייויס";
        }

        // 7. Physics
        if (r.contains("פיסיקה") || r.contains("פיזיקה")) {
            Matcher m = Pattern.compile("\\d+").matcher(r);
            if (m.find()) return "פיסיקה " + m.group();
            return "פיסיקה";
        }

        // 8. Sports / Athletics / Pool / Gym
        if (r.contains("אתלטיקה") || r.contains("חינוך גופני") || r.contains("גופני")) {
            return "אתלטיקה";
        }
        if (r.contains("בריכה")) return "בריכה";
        if (r.contains("כושר")) return "כושר";
        if (r.contains("ספורט")) return "ספורט";

        // 9. Bloomfield / Rabin / Silver
        if (r.contains("בלומפילד")) {
            Matcher m = Pattern.compile("\\d+").matcher(r);
            if (m.find()) return "בלומפילד " + m.group();
            return "בלומפילד";
        }
        if (r.contains("רבין")) {
            Matcher m = Pattern.compile("\\d+").matcher(r);
            if (m.find()) return "רבין " + m.group();
            return "רבין";
        }

        // 10. Fallback for any other new room: clean and keep under 10 chars
        if (r.length() > 10) {
            return r.substring(0, 10).trim();
        }
        return r;
    }
}
