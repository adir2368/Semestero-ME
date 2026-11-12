package com.technion.semestero.wear;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import androidx.wear.tiles.TileService;
import androidx.wear.watchface.complications.datasource.ComplicationDataSourceUpdateRequester;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Single source of truth for the academic schedule, live class radar resolution,
 * dynamic phone-synced timetable parsing, and upcoming class calculation on Wear OS (Samsung Galaxy Watch 8).
 *
 * Guarantees:
 * 1. 100% authentic Technion Mechanical Engineering Semester 3 (Winter 2026/27) timetable matching app.js 1:1.
 * 2. Dynamic 7-day phone schedule sync support via SharedPreferences ("full_timetable_json") with auto-healing.
 * 3. Smart 15-minute Class Radar switch rule:
 *    - During the first 15 minutes of a class (startMin <= now < startMin + 15), it is ACTIVE.
 *    - After 15 minutes (now >= startMin + 15), if another class exists later today, switches to that next class!
 *    - If it is the last class of the day, stays ACTIVE until endMin so it never prematurely shows tomorrow.
 * 4. Switches to tomorrow/next study day only after all classes of today are complete.
 */
public class WearScheduleHelper {

    public static final String[] HEBREW_DAYS = {
        "", "יום ראשון", "יום שני", "יום שלישי", "יום רביעי", "יום חמישי", "יום שישי", "שבת"
    };

    public static final String[] HEBREW_DAYS_SHORT = {
        "", "ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"
    };

    public static class CourseSlot {
        public final String title;
        public final String time;
        public final int startMin;
        public final int endMin;
        public final String room;
        public final String lecturer;
        public final String type;
        public final boolean isDitched;

        public CourseSlot(String title, String time, int startMin, int endMin, String room, String lecturer, String type) {
            this(title, time, startMin, endMin, room, lecturer, type, false);
        }

        public CourseSlot(String title, String time, int startMin, int endMin, String room, String lecturer, String type, boolean isDitched) {
            this.title = title != null ? title : "";
            this.time = time != null ? time : "";
            this.startMin = startMin;
            this.endMin = endMin;
            this.room = room != null ? room : "";
            this.lecturer = lecturer != null ? lecturer : "";
            this.type = type != null ? type : "";
            this.isDitched = isDitched;
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
     * Returns the schedule for a given Calendar dayOfWeek (1=Sunday .. 7=Saturday),
     * prioritizing a valid synced 7-day timetable from the phone if available, and auto-healing
     * any legacy room/lecturer mismatches.
     */
    public static List<CourseSlot> getScheduleForDay(Context context, int dayOfWeek) {
        if (context != null) {
            try {
                SharedPreferences prefs = context.getSharedPreferences(MainActivity.PREFS_NAME, Context.MODE_PRIVATE);
                String fullJson = prefs.getString("full_timetable_json", "");
                if (fullJson != null && !fullJson.trim().isEmpty() && !fullJson.equals("[]") && !MainActivity.isCorruptedText(fullJson)) {
                    int targetDayIndex = dayOfWeek - 1; // 0=Sunday .. 6=Saturday
                    JSONArray daysArr = new JSONArray(fullJson);
                    for (int i = 0; i < daysArr.length(); i++) {
                        JSONObject dayObj = daysArr.getJSONObject(i);
                        if (dayObj.optInt("dayIndex", -1) == targetDayIndex) {
                            JSONArray classesArr = dayObj.optJSONArray("classes");
                            List<CourseSlot> syncedSlots = new ArrayList<>();
                            if (classesArr != null) {
                                for (int j = 0; j < classesArr.length(); j++) {
                                    JSONObject c = classesArr.getJSONObject(j);
                                    String title = c.optString("title", c.optString("courseName", ""));
                                    String start = c.optString("startTime", "");
                                    String end = c.optString("endTime", "");
                                    String time = c.optString("time", (!start.isEmpty() && !end.isEmpty()) ? (start + " - " + end) : "");
                                    int startMin = c.optInt("startMin", parseMinutes(start, 510));
                                    int endMin = c.optInt("endMin", parseMinutes(end, startMin + 120));
                                    String room = c.optString("room", "");
                                    String lecturer = c.optString("lecturer", "");
                                    String type = c.optString("type", "");
                                    boolean isDitched = c.optBoolean("isDitched", false);

                                    if (!title.isEmpty() && !MainActivity.isCorruptedText(title)) {
                                        syncedSlots.add(sanitizeSlot(targetDayIndex, new CourseSlot(
                                            title, time, startMin, endMin, room, lecturer, type, isDitched
                                        )));
                                    }
                                }
                            }
                            if (!syncedSlots.isEmpty() || targetDayIndex >= 5) {
                                return syncedSlots;
                            }
                        }
                    }
                }
            } catch (Exception ignored) {}
        }
        return getScheduleForDay(dayOfWeek);
    }

    private static int parseMinutes(String hhmm, int fallback) {
        if (hhmm == null || !hhmm.contains(":")) return fallback;
        try {
            String[] parts = hhmm.trim().split(":");
            return Integer.parseInt(parts[0].trim()) * 60 + Integer.parseInt(parts[1].trim());
        } catch (Exception e) {
            return fallback;
        }
    }

    /**
     * Auto-heals any stale pre-ADR-107 room/lecturer/course entries in cached phone payloads
     * so the watch never displays outdated rooms or lecturers.
     */
    private static CourseSlot sanitizeSlot(int dayIndex, CourseSlot slot) {
        String title = slot.title;
        String time = slot.time;
        int startMin = slot.startMin;
        int endMin = slot.endMin;
        String room = slot.room;
        String lecturer = slot.lecturer;
        String type = slot.type;

        // Monday (dayIndex 1): Solids 2 Lecture 10 is 10:30-14:30 in Dan Kahn 6
        if (dayIndex == 1 && title.contains("מוצקים") && startMin == 630) {
            endMin = 870;
            time = "10:30 - 14:30";
            if (room.isEmpty() || room.contains("כימית")) room = "דן קאהן - מכונות 6";
            if (lecturer.isEmpty()) lecturer = "פרופ' יוסף גבלי";
        }
        // Tuesday (dayIndex 2): Thermo 1 Lecture 10 is 08:30-10:30 (2 hours)
        if (dayIndex == 2 && title.contains("תרמו") && startMin == 510 && endMin == 690) {
            endMin = 630;
            time = "08:30 - 10:30";
        }
        // Tuesday (dayIndex 2) 14:30: If stale Solids 2 Tutorial 11 in Ullmann 103/602 leaked, heal to Computing Tutorial 11
        if (dayIndex == 2 && startMin == 870 && (room.contains("103") || room.contains("602") || lecturer.contains("טננבאום") || lecturer.contains("דואר"))) {
            title = "מבוא לחישוב מדעי והנדסי";
            room = "אולמן 501";
            lecturer = "מר גיא ארבר";
            type = "תרגול 11";
        }
        // Wednesday (dayIndex 3) 09:30: Physics 2 Tutorial 13 in Sherman 107 with Noam Hentz Gamliel
        if (dayIndex == 3 && title.contains("פיסיקה") && startMin == 570 && (type.contains("13") || room.contains("606") || lecturer.contains("קלמן") || lecturer.contains("חגי"))) {
            room = "שרמן - חינוך למדע וטכנולוגיה 107";
            lecturer = "גב' נעם הנץ גמליאל";
            type = "תרגול 13";
        }
        // Thursday (dayIndex 4) 07:30: Yoga is 07:30-08:30
        if (dayIndex == 4 && startMin == 450 && endMin == 540) {
            endMin = 510;
            time = "07:30 - 08:30";
        }
        // Thursday (dayIndex 4) 10:30: PDE Lecture 20 in ChemEng 1 with Dr. Roi Bar-On
        if (dayIndex == 4 && title.contains("דיפרנציאליות") && startMin == 630 && (lecturer.contains("גובר") || room.contains("שרמן"))) {
            room = "הנדסה כימית 1";
            lecturer = "ד\"ר רועי בר און";
            type = "הרצאה 20";
        }
        // Thursday (dayIndex 4) 12:30: Solids 2 Tutorial 21 in Ullmann 205 with Yuval Bar-Ratson
        if (dayIndex == 4 && startMin == 750 && (room.contains("705") || lecturer.contains("פרי") || (title.contains("חישוב") && type.contains("15")))) {
            title = "מכניקת מוצקים 2מ'";
            room = "אולמן 205";
            lecturer = "מר יובל בר-רצון";
            type = "תרגול 21";
        }

        return new CourseSlot(title, time, startMin, endMin, room, lecturer, type, slot.isDitched);
    }

    /**
     * Authentic Technion Mechanical Engineering Semester 3 Timetable (1:1 with app.js CHEESEFORK_SEMESTER_SCHEDULE)
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
                    "מבוא לחישוב מדעי והנדסי",
                    "14:30 - 16:30",
                    870, 990,
                    "אולמן 501",
                    "מר גיא ארבר",
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
                    "שרמן - חינוך למדע וטכנולוגיה 107",
                    "גב' נעם הנץ גמליאל",
                    "תרגול 13"
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
                    "מכניקת מוצקים 2מ'",
                    "12:30 - 14:30",
                    750, 870,
                    "אולמן 205",
                    "מר יובל בר-רצון",
                    "תרגול 21"
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
     * Builds enriched timeline items for any requested dayOfWeek (1=Sunday .. 7=Saturday).
     */
    public static List<WearCarouselAdapter.ClassItem> buildTimelineForDay(Context context, int dayOfWeek, int curDayOfWeek, int curTotalMin) {
        List<CourseSlot> courses = getScheduleForDay(context, dayOfWeek);
        List<WearCarouselAdapter.ClassItem> items = new ArrayList<>();
        for (CourseSlot cs : courses) {
            boolean active = (dayOfWeek == curDayOfWeek) && (curTotalMin >= cs.startMin && curTotalMin < cs.endMin);
            String roomClean = formatRoom(cs.room);
            String detailsLine = "📍 " + roomClean;
            if (!cs.type.isEmpty()) {
                detailsLine += " • " + cs.type;
            }
            if (!cs.lecturer.isEmpty()) {
                detailsLine += "\n👨‍🏫 " + cs.lecturer;
            }
            if (cs.isDitched) {
                detailsLine += " (🏠 למידה עצמית)";
            }
            items.add(new WearCarouselAdapter.ClassItem(
                cs.title,
                cs.time,
                detailsLine,
                active
            ));
        }
        return items;
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

        String dayName = (dayOfWeek >= 1 && dayOfWeek <= 7) ? HEBREW_DAYS[dayOfWeek] : "יום ראשון";
        SimpleDateFormat sdf = new SimpleDateFormat("d בMMMM", new Locale("he", "IL"));
        String dateFormatted = sdf.format(now.getTime());
        res.dayHeader = dayName + " • " + dateFormatted;

        List<CourseSlot> allTodaysCourses = getScheduleForDay(context, dayOfWeek);
        res.timelineItems = buildTimelineForDay(context, dayOfWeek, dayOfWeek, curTotalMin);

        // Filter non-ditched classes for Radar & Complication (fallback to all if all are ditched)
        List<CourseSlot> todaysCourses = new ArrayList<>();
        for (CourseSlot cs : allTodaysCourses) {
            if (!cs.isDitched) todaysCourses.add(cs);
        }
        if (todaysCourses.isEmpty() && !allTodaysCourses.isEmpty()) {
            todaysCourses = allTodaysCourses;
        }

        // User Rule (ADR-062):
        // - During first 15 minutes of a class (startMin <= curTotalMin < startMin + 15): show as ACTIVE.
        // - After 15 minutes (curTotalMin >= startMin + 15): if there is a next class today, switch to next class!
        // - If it is the LAST class of the day and still ongoing (curTotalMin < endMin): keep showing it as ACTIVE
        //   so we never jump to tomorrow while the last class of today is still in session.
        CourseSlot radarSlot = null;
        boolean slotIsActiveNow = false;
        int slotIndex = -1;

        for (int i = 0; i < todaysCourses.size(); i++) {
            CourseSlot cs = todaysCourses.get(i);
            boolean isLastClassToday = (i == todaysCourses.size() - 1);
            if (curTotalMin < cs.startMin + 15) {
                radarSlot = cs;
                slotIndex = i;
                slotIsActiveNow = (curTotalMin >= cs.startMin);
                break;
            } else if (isLastClassToday && curTotalMin < cs.endMin) {
                radarSlot = cs;
                slotIndex = i;
                slotIsActiveNow = true;
                break;
            }
        }

        if (radarSlot != null) {
            String nextHint = "";
            if (slotIndex >= 0 && slotIndex + 1 < todaysCourses.size()) {
                CourseSlot afterSlot = todaysCourses.get(slotIndex + 1);
                String shortAfter = SemesteroComplicationService.getShortCourseName(afterSlot.title);
                String shortAfterRoom = SemesteroComplicationService.getShortRoomName(afterSlot.room);
                String afterStart = afterSlot.time.contains(" - ") ? afterSlot.time.split(" - ")[0].trim() : afterSlot.time;
                nextHint = " (הבא: " + shortAfter + " ב-" + afterStart + (!shortAfterRoom.isEmpty() ? ", " + shortAfterRoom : "") + ")";
            }

            if (slotIsActiveNow) {
                res.isActive = true;
                res.statusText = "🟢 מתקיים כעת!";
            } else {
                int diff = radarSlot.startMin - curTotalMin;
                if (diff <= 60) {
                    res.isStartingSoon = true;
                    res.statusText = "⏰ מתחיל בעוד " + diff + " דקות";
                } else {
                    res.statusText = "⏳ השיעור הבא היום (" + radarSlot.time.split(" - ")[0] + ")";
                }
            }
            res.courseTitle = radarSlot.title;
            res.timeText = radarSlot.time;
            res.roomText = formatRoom(radarSlot.room);
            res.lecturerText = "👨‍🏫 " + radarSlot.lecturer + " • " + radarSlot.type + nextHint;
            return res;
        }

        // 3. No active or upcoming class today.
        // If today is a weekend / free day:
        if (allTodaysCourses.isEmpty()) {
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
            res.roomText = "אין שיעורים פרונטליים";
            res.lecturerText = "השיעור הבא ביום ראשון ב-11:30 (אולמן 506)";
            return res;
        }

        // 4. Today had classes, and ALL of them are now FINISHED (curTotalMin >= lastClass.endMin).
        res.isTomorrow = true;
        CourseSlot nextDaySlot = null;
        String nextDayName = "";
        boolean isDirectTomorrow = false;

        for (int offset = 1; offset <= 6; offset++) {
            int checkDay = (dayOfWeek - 1 + offset) % 7 + 1;
            List<CourseSlot> nextList = getScheduleForDay(context, checkDay);
            if (!nextList.isEmpty()) {
                nextDaySlot = nextList.get(0);
                nextDayName = HEBREW_DAYS[checkDay];
                isDirectTomorrow = (offset == 1);
                break;
            }
        }

        if (nextDaySlot != null) {
            if (isDirectTomorrow) {
                res.statusText = "מחר (" + nextDayName + ") ב-" + nextDaySlot.time.split(" - ")[0];
            } else {
                res.statusText = "השיעור הבא ב" + nextDayName + " ב-" + nextDaySlot.time.split(" - ")[0];
            }
            res.courseTitle = nextDaySlot.title;
            res.timeText = nextDaySlot.time;
            res.roomText = formatRoom(nextDaySlot.room);
            res.lecturerText = "👨‍🏫 " + nextDaySlot.lecturer + " • " + nextDaySlot.type;
        } else {
            res.statusText = "יום חופשי";
            res.courseTitle = "סיום שיעורי השבוע";
            res.timeText = "--:--";
            res.roomText = "יום חופשי";
            res.lecturerText = "סמסטרו ME";
        }

        return res;
    }

    /**
     * Schedules the next automatic watch complication/tile refresh and 10-minute pre-class reminder.
     */
    public static void scheduleNextBoundaryUpdate(Context context) {
        if (context == null) return;
        try {
            Calendar now = Calendar.getInstance();
            int dayOfWeek = now.get(Calendar.DAY_OF_WEEK);
            int curMin = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE);
            List<CourseSlot> today = getScheduleForDay(context, dayOfWeek);

            int nextBoundaryMin = -1;
            CourseSlot reminderSlot = null;

            for (CourseSlot cs : today) {
                if (cs.isDitched) continue;
                int preRemindMin = cs.startMin - 10;
                int switchMin = cs.startMin + 15;
                if (curMin < preRemindMin) {
                    nextBoundaryMin = preRemindMin;
                    reminderSlot = cs;
                    break;
                } else if (curMin < cs.startMin) {
                    nextBoundaryMin = cs.startMin;
                    break;
                } else if (curMin < switchMin) {
                    nextBoundaryMin = switchMin;
                    break;
                } else if (curMin < cs.endMin) {
                    nextBoundaryMin = cs.endMin;
                    break;
                }
            }

            if (nextBoundaryMin > curMin) {
                Calendar triggerCal = (Calendar) now.clone();
                triggerCal.set(Calendar.HOUR_OF_DAY, nextBoundaryMin / 60);
                triggerCal.set(Calendar.MINUTE, nextBoundaryMin % 60);
                triggerCal.set(Calendar.SECOND, 2);

                Intent intent = new Intent(context, WearNotificationReceiver.class);
                intent.setAction(WearNotificationReceiver.ACTION_BOUNDARY_REFRESH);
                if (reminderSlot != null) {
                    intent.putExtra("send_reminder", true);
                    intent.putExtra("course_title", reminderSlot.title);
                    intent.putExtra("course_time", reminderSlot.time.split(" - ")[0]);
                    intent.putExtra("course_room", formatRoom(reminderSlot.room) + " • " + reminderSlot.type + " • " + reminderSlot.lecturer);
                }

                PendingIntent pi = PendingIntent.getBroadcast(
                    context,
                    1402,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0)
                );

                AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
                if (am != null) {
                    am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerCal.getTimeInMillis(), pi);
                }
            }
        } catch (Exception ignored) {}
    }

    /**
     * Triggers an immediate update of all Watch Tiles and Watch Face Complications.
     */
    public static void requestComplicationAndTileRefresh(Context context) {
        if (context == null) return;
        try {
            TileService.getUpdater(context).requestUpdate(SemesteroClassTileService.class);
            TileService.getUpdater(context).requestUpdate(SemesteroTasksTileService.class);
        } catch (Exception ignored) {}
        try {
            ComplicationDataSourceUpdateRequester
                .create(context, new ComponentName(context, SemesteroComplicationService.class))
                .requestUpdateAll();
            ComplicationDataSourceUpdateRequester
                .create(context, new ComponentName(context, SemesteroTasksComplicationService.class))
                .requestUpdateAll();
        } catch (Exception ignored) {}
    }

    public static String formatRoom(String room) {
        if (room == null || room.trim().isEmpty()) return "";
        String r = room.trim();
        if (r.startsWith("📍")) {
            r = r.substring(2).trim();
        }
        if (r.startsWith("חדר:") || r.startsWith("חדר ")) {
            if (!r.contains("כושר")) {
                r = r.replaceFirst("^חדר[:\\s]+", "").trim();
            }
        }
        return r;
    }
}
