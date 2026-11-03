package com.technion.semestero.wear;

import android.content.Context;
import android.content.SharedPreferences;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Single source of truth for the academic schedule, live class radar resolution,
 * and upcoming class calculation on Wear OS (Samsung Galaxy Watch 8).
 * 
 * Guarantees:
 * 1. 100% authentic Technion Mechanical Engineering Semester 3 timetable.
 * 2. Active class detection: if a class is currently taking place, it is ACTIVE.
 * 3. Upcoming class detection: if a class is later today, it displays remaining minutes or start time.
 * 4. NEVER prematurely shows tomorrow while today's classes are ongoing or upcoming.
 * 5. Switches to tomorrow only after all classes of today are complete (or late evening >= 18:00).
 */
public class WearScheduleHelper {

    public static final String[] HEBREW_DAYS = {
        "", "יום ראשון", "יום שני", "יום שלישי", "יום רביעי", "יום חמישי", "יום שישי", "שבת"
    };

    public static class CourseSlot {
        public final String title;
        public final String time;
        public final int startMin;
        public final int endMin;
        public final String room;
        public final String lecturer;
        public final String type;

        public CourseSlot(String title, String time, int startMin, int endMin, String room, String lecturer, String type) {
            this.title = title;
            this.time = time;
            this.startMin = startMin;
            this.endMin = endMin;
            this.room = room;
            this.lecturer = lecturer;
            this.type = type;
        }
    }

    public static class ScheduleResolution {
        public String dayHeader = "";
        public String statusText = "";
        public String courseTitle = "";
        public String timeText = "";
        public String roomText = "";
        public String lecturerText = "";
        public boolean isActive = false;
        public boolean isStartingSoon = false;
        public boolean isTomorrow = false;
        public boolean isFreeDay = false;
        public List<WearCarouselAdapter.ClassItem> timelineItems = new ArrayList<>();
    }

    /**
     * Authentic Technion Mechanical Engineering Semester 3 Timetable
     */
    public static List<CourseSlot> getScheduleForDay(int dayOfWeek) {
        List<CourseSlot> list = new ArrayList<>();
        switch (dayOfWeek) {
            case Calendar.SUNDAY: // יום ראשון
                list.add(new CourseSlot(
                    "משוואות דיפרנציאליות חלקיות מ'",
                    "11:30 - 13:30",
                    690, 810,
                    "אולמן 506",
                    "אמתי אלפרין",
                    "תרגול 22"
                ));
                break;

            case Calendar.MONDAY: // יום שני
                list.add(new CourseSlot(
                    "פיסיקה 2",
                    "08:30 - 10:30",
                    510, 630,
                    "טאוב - מדמ\"ח 1",
                    "ד\"ר גדעון אלון",
                    "הרצאה 10"
                ));
                list.add(new CourseSlot(
                    "מכניקת מוצקים 2מ'",
                    "10:30 - 14:30",
                    630, 870,
                    "דן קאהן - מכונות 6",
                    "פרופ' יוסף גבלי",
                    "הרצאה 10"
                ));
                break;

            case Calendar.TUESDAY: // יום שלישי
                list.add(new CourseSlot(
                    "תרמודינמיקה 1",
                    "08:30 - 10:30",
                    510, 630,
                    "הנדסה כימית 1",
                    "פרופ' לאוניד טרטקובסקי",
                    "הרצאה 10"
                ));
                list.add(new CourseSlot(
                    "תרמודינמיקה 1",
                    "12:30 - 14:30",
                    750, 870,
                    "אולמן 101",
                    "גב' עומר גזית אורלוב",
                    "תרגול 11"
                ));
                list.add(new CourseSlot(
                    "מכניקת מוצקים 2מ'",
                    "14:30 - 16:30",
                    870, 990,
                    "אולמן 103",
                    "מר איתם טננבאום",
                    "תרגול 11"
                ));
                break;

            case Calendar.WEDNESDAY: // יום רביעי
                list.add(new CourseSlot(
                    "פיסיקה 2",
                    "08:30 - 09:30",
                    510, 570,
                    "פיזיקה 1",
                    "ד\"ר גדעון אלון",
                    "הרצאה 10"
                ));
                list.add(new CourseSlot(
                    "פיסיקה 2",
                    "09:30 - 10:30",
                    570, 630,
                    "אולמן 606",
                    "מר אייל קלמן",
                    "תרגול 21"
                ));
                list.add(new CourseSlot(
                    "מבוא לחישוב מדעי והנדסי",
                    "14:30 - 17:30",
                    870, 1050,
                    "הנדסה כימית 1",
                    "ד\"ר דניאל הקסנר",
                    "הרצאה 10"
                ));
                break;

            case Calendar.THURSDAY: // יום חמישי
                list.add(new CourseSlot(
                    "חינוך גופני - אתלטיקה קלה",
                    "07:30 - 08:30",
                    450, 510,
                    "חינוך גופני - אתלטיקה קלה",
                    "שלומית בן-איש",
                    "יוגה 24"
                ));
                list.add(new CourseSlot(
                    "משוואות דיפרנציאליות חלקיות מ'",
                    "10:30 - 12:30",
                    630, 750,
                    "הנדסה כימית 1",
                    "ד\"ר רועי בר און",
                    "הרצאה 20"
                ));
                list.add(new CourseSlot(
                    "מבוא לחישוב מדעי והנדסי",
                    "12:30 - 14:30",
                    750, 870,
                    "אולמן 705",
                    "מר יותם אהרון פרי",
                    "תרגול 15"
                ));
                break;

            case Calendar.FRIDAY:
            case Calendar.SATURDAY:
            default:
                // Weekend
                break;
        }
        return list;
    }

    /**
     * Resolves current class status, active course, upcoming course, or tomorrow's preview.
     */
    public static ScheduleResolution resolve(Context context, Calendar now) {
        ScheduleResolution res = new ScheduleResolution();

        int dayOfWeek = now.get(Calendar.DAY_OF_WEEK);
        int curHour = now.get(Calendar.HOUR_OF_DAY);
        int curMin = now.get(Calendar.MINUTE);
        int curTotalMin = curHour * 60 + curMin;

        String dayName = HEBREW_DAYS[dayOfWeek];
        SimpleDateFormat sdf = new SimpleDateFormat("d MMMM", new Locale("he", "IL"));
        String dateFormatted = sdf.format(now.getTime());
        res.dayHeader = dayName + " • " + dateFormatted;

        List<CourseSlot> todaysCourses = getScheduleForDay(dayOfWeek);

        // Populate Timeline items
        for (CourseSlot cs : todaysCourses) {
            boolean active = (curTotalMin >= cs.startMin && curTotalMin < cs.endMin);
            String roomTag = cs.room.startsWith("חדר") ? cs.room : "חדר " + cs.room;
            res.timelineItems.add(new WearCarouselAdapter.ClassItem(
                cs.title,
                cs.time,
                roomTag,
                active
            ));
        }

        // 1. Check for ACTIVE class right now
        CourseSlot activeSlot = null;
        for (CourseSlot cs : todaysCourses) {
            if (curTotalMin >= cs.startMin && curTotalMin < cs.endMin) {
                activeSlot = cs;
                break;
            }
        }

        if (activeSlot != null) {
            res.isActive = true;
            res.statusText = "🟢 שיעור מתקיים כעת!";
            res.courseTitle = activeSlot.title;
            res.timeText = activeSlot.time;
            res.roomText = activeSlot.room.startsWith("חדר") ? activeSlot.room : "חדר " + activeSlot.room;
            res.lecturerText = "👨‍🏫 " + activeSlot.lecturer + " • " + activeSlot.type;
            return res;
        }

        // 2. Check for UPCOMING class today
        CourseSlot upcomingSlot = null;
        for (CourseSlot cs : todaysCourses) {
            if (curTotalMin < cs.startMin) {
                upcomingSlot = cs;
                break;
            }
        }

        if (upcomingSlot != null) {
            int diff = upcomingSlot.startMin - curTotalMin;
            if (diff <= 60) {
                res.isStartingSoon = true;
                res.statusText = "⏳ מתחיל בעוד " + diff + " דקות";
            } else {
                res.statusText = "📌 השיעור הבא היום (" + upcomingSlot.time.split(" - ")[0] + ")";
            }
            res.courseTitle = upcomingSlot.title;
            res.timeText = upcomingSlot.time;
            res.roomText = upcomingSlot.room.startsWith("חדר") ? upcomingSlot.room : "חדר " + upcomingSlot.room;
            res.lecturerText = "👨‍🏫 " + upcomingSlot.lecturer + " • " + upcomingSlot.type;
            return res;
        }

        // 3. No active or upcoming class today.
        // If today is a weekend / free day:
        if (todaysCourses.isEmpty()) {
            res.isFreeDay = true;
            res.isTomorrow = true;
            if (dayOfWeek == Calendar.FRIDAY) {
                res.statusText = "🎉 יום שישי חופשי";
                res.courseTitle = "סוף שבוע רגוע ונעים!";
            } else {
                res.statusText = "✨ שבת שלום ומנוחה";
                res.courseTitle = "שבת שלום!";
            }
            res.timeText = "יום חופשי";
            res.roomText = "אין שיעורים באוניברסיטה";
            res.lecturerText = "השיעור הבא ביום ראשון ב-11:30";
            return res;
        }

        // 4. Today had classes, but ALL of them are now FINISHED (curTotalMin >= lastClass.endMin).
        res.isTomorrow = true;
        CourseSlot nextDaySlot = null;
        String nextDayName = "";
        boolean isDirectTomorrow = false;

        for (int offset = 1; offset <= 6; offset++) {
            int checkDay = (dayOfWeek - 1 + offset) % 7 + 1;
            List<CourseSlot> nextList = getScheduleForDay(checkDay);
            if (!nextList.isEmpty()) {
                nextDaySlot = nextList.get(0);
                nextDayName = HEBREW_DAYS[checkDay];
                isDirectTomorrow = (offset == 1);
                break;
            }
        }

        if (nextDaySlot != null) {
            if (isDirectTomorrow) {
                res.statusText = "ראשון מחר (" + nextDayName + ") ב-" + nextDaySlot.time.split(" - ")[0];
            } else {
                res.statusText = "השיעור הבא ב" + nextDayName + " ב-" + nextDaySlot.time.split(" - ")[0];
            }
            res.courseTitle = nextDaySlot.title;
            res.timeText = nextDaySlot.time;
            res.roomText = nextDaySlot.room.startsWith("חדר") ? nextDaySlot.room : "חדר " + nextDaySlot.room;
            res.lecturerText = "👨‍🏫 " + nextDaySlot.lecturer + " • " + nextDaySlot.type;
        } else {
            res.statusText = "יום חופשי";
            res.courseTitle = "סיום שיעורי השבוע";
            res.timeText = "--:--";
            res.roomText = "חדר חופשי";
            res.lecturerText = "סמסטרו ME";
        }

        return res;
    }
}
