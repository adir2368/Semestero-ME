package com.technion.semestero.wear;

import android.content.Context;
import android.content.SharedPreferences;
import androidx.wear.tiles.RequestBuilders;
import androidx.wear.tiles.TileBuilders;
import androidx.wear.tiles.TileService;
import androidx.wear.protolayout.ResourceBuilders;
import androidx.wear.protolayout.TimelineBuilders;
import androidx.wear.protolayout.LayoutElementBuilders;
import androidx.wear.protolayout.DimensionBuilders;
import androidx.wear.protolayout.ColorBuilders;
import com.google.common.util.concurrent.Futures;
import com.google.common.util.concurrent.ListenableFuture;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

/**
 * Semestero ME • Wear OS Tile Service
 * Provides glanceable Next Class Radar on 44mm & 40mm Galaxy Watch screens.
 * Includes authentic Hebrew day-of-week detection and real-time class resolution.
 */
public class SemesteroClassTileService extends TileService {

    private static final String RESOURCES_VERSION = "3";
    private static final String[] HEBREW_DAYS = {
        "", "יום ראשון", "יום שני", "יום שלישי", "יום רביעי", "יום חמישי", "יום שישי", "שבת"
    };

    @Override
    protected ListenableFuture<TileBuilders.Tile> onTileRequest(RequestBuilders.TileRequest requestParams) {
        SharedPreferences prefs = getSharedPreferences(MainActivity.PREFS_NAME, Context.MODE_PRIVATE);

        // 1. Current Hebrew Day & Date
        Calendar now = Calendar.getInstance();
        int dayOfWeek = now.get(Calendar.DAY_OF_WEEK);
        String curDayName = (dayOfWeek >= 1 && dayOfWeek <= 7) ? HEBREW_DAYS[dayOfWeek] : "יום ראשון";

        SimpleDateFormat sdf = new SimpleDateFormat("d בMMMM", new Locale("he", "IL"));
        String formattedDate = sdf.format(now.getTime());
        String dayHeader = curDayName + " • " + formattedDate;

        // 2. Class Resolution
        long lastSync = prefs.getLong("last_sync_timestamp", 0);
        boolean isFreshSync = (lastSync > 0) && ((System.currentTimeMillis() - lastSync) < 24 * 3600 * 1000);
        String syncedDay = prefs.getString("day_name", "");
        boolean hasMatchingDaySync = isFreshSync && curDayName.equals(syncedDay);

        String classTitle;
        String classTime;
        String classRoom;
        String classStatus;

        if (hasMatchingDaySync && prefs.contains("class_title")) {
            classTitle = prefs.getString("class_title", "אין שיעורים קרובים היום");
            classTime = prefs.getString("class_time", "--:--");
            classRoom = prefs.getString("class_details", "יום חופשי 🎉");
            classStatus = prefs.getString("class_status", "חופשי");
        } else {
            // Built-in authentic Technion Mechanical Engineering Schedule
            int curTotalMin = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE);
            switch (dayOfWeek) {
                case Calendar.SUNDAY:
                    classTitle = "משוואות דיפרנציאליות חלקיות מ'";
                    classTime = "11:30 - 13:30";
                    classRoom = "📍 אולמן 506";
                    classStatus = (curTotalMin >= 690 && curTotalMin <= 810) ? "🟢 מתקיים כעת!" : (curTotalMin < 690 ? "⏳ השיעור הבא היום" : "🎉 הסתיימו הלימודים");
                    break;
                case Calendar.MONDAY:
                    classTitle = "פיסיקה 2";
                    classTime = "08:30 - 10:30";
                    classRoom = "📍 טאוב 1";
                    classStatus = (curTotalMin >= 510 && curTotalMin <= 630) ? "🟢 מתקיים כעת!" : (curTotalMin < 510 ? "⏳ השיעור הבא היום" : "🎉 השיעור הבא: מוצקים 2");
                    break;
                case Calendar.TUESDAY:
                    classTitle = "תרמודינמיקה 1";
                    classTime = "08:30 - 11:30";
                    classRoom = "📍 הנדסה כימית 1";
                    classStatus = (curTotalMin >= 510 && curTotalMin <= 690) ? "🟢 מתקיים כעת!" : "⏳ השיעור הבא היום";
                    break;
                case Calendar.WEDNESDAY:
                    classTitle = "מכניקת מוצקים 2מ'";
                    classTime = "12:30 - 14:30";
                    classRoom = "📍 ליידי דייוויס 240";
                    classStatus = (curTotalMin >= 750 && curTotalMin <= 870) ? "🟢 מתקיים כעת!" : "⏳ השיעור הבא היום";
                    break;
                case Calendar.THURSDAY:
                    classTitle = "גרפיקה הנדסית";
                    classTime = "09:30 - 11:30";
                    classRoom = "📍 דנציגר";
                    classStatus = (curTotalMin >= 570 && curTotalMin <= 690) ? "🟢 מתקיים כעת!" : "⏳ השיעור הבא היום";
                    break;
                case Calendar.FRIDAY:
                    classTitle = "יום שישי - יום חופשי";
                    classTime = "סופ״ש נעים 🏖️";
                    classRoom = "ללא שיעורים פרונטליים";
                    classStatus = "🏖️ יום חופשי";
                    break;
                case Calendar.SATURDAY:
                default:
                    classTitle = "שבת שלום ומנוחה! 🕯️";
                    classTime = "סופ״ש";
                    classRoom = "מתחילים ביום ראשון ב-11:30";
                    classStatus = "🕯️ שבת שלום";
                    break;
            }
        }

        LayoutElementBuilders.Layout layout = new LayoutElementBuilders.Layout.Builder()
            .setRoot(
                new LayoutElementBuilders.Column.Builder()
                    .setWidth(DimensionBuilders.expand())
                    .setHeight(DimensionBuilders.expand())
                    .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
                    // Top breathing room for round bezel
                    .addContent(
                        new LayoutElementBuilders.Spacer.Builder()
                            .setHeight(DimensionBuilders.dp(12))
                            .build()
                    )
                    // Day of Week & Date Header
                    .addContent(
                        new LayoutElementBuilders.Text.Builder()
                            .setText(dayHeader)
                            .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                                .setSize(DimensionBuilders.sp(11))
                                .setColor(ColorBuilders.argb(0xFF38BDF8))
                                .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                                .build())
                            .build()
                    )
                    .addContent(
                        new LayoutElementBuilders.Spacer.Builder()
                            .setHeight(DimensionBuilders.dp(4))
                            .build()
                    )
                    // Status Badge
                    .addContent(
                        new LayoutElementBuilders.Text.Builder()
                            .setText(classStatus)
                            .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                                .setSize(DimensionBuilders.sp(10.5f))
                                .setColor(ColorBuilders.argb(0xFF10B981))
                                .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                                .build())
                            .build()
                    )
                    .addContent(
                        new LayoutElementBuilders.Spacer.Builder()
                            .setHeight(DimensionBuilders.dp(3))
                            .build()
                    )
                    // Class Name (Max 1 line, prominent on 44mm screen)
                    .addContent(
                        new LayoutElementBuilders.Text.Builder()
                            .setText(classTitle)
                            .setMaxLines(1)
                            .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                                .setSize(DimensionBuilders.sp(15))
                                .setColor(ColorBuilders.argb(0xFFF8FAFC))
                                .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                                .build())
                            .build()
                    )
                    .addContent(
                        new LayoutElementBuilders.Spacer.Builder()
                            .setHeight(DimensionBuilders.dp(2))
                            .build()
                    )
                    // Time
                    .addContent(
                        new LayoutElementBuilders.Text.Builder()
                            .setText(classTime)
                            .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                                .setSize(DimensionBuilders.sp(12.5f))
                                .setColor(ColorBuilders.argb(0xFF38BDF8))
                                .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                                .build())
                            .build()
                    )
                    .addContent(
                        new LayoutElementBuilders.Spacer.Builder()
                            .setHeight(DimensionBuilders.dp(2))
                            .build()
                    )
                    // Room Location
                    .addContent(
                        new LayoutElementBuilders.Text.Builder()
                            .setText(classRoom)
                            .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                                .setSize(DimensionBuilders.sp(11.5f))
                                .setColor(ColorBuilders.argb(0xFF94A3B8))
                                .build())
                            .build()
                    )
                    .build()
            )
            .build();

        TimelineBuilders.Timeline timeline = new TimelineBuilders.Timeline.Builder()
            .addTimelineEntry(
                new TimelineBuilders.TimelineEntry.Builder()
                    .setLayout(layout)
                    .build()
            )
            .build();

        TileBuilders.Tile tile = new TileBuilders.Tile.Builder()
            .setResourcesVersion(RESOURCES_VERSION)
            .setTileTimeline(timeline)
            .build();

        return Futures.immediateFuture(tile);
    }

    @Override
    protected ListenableFuture<ResourceBuilders.Resources> onTileResourcesRequest(RequestBuilders.ResourcesRequest requestParams) {
        ResourceBuilders.Resources resources = new ResourceBuilders.Resources.Builder()
            .setVersion(RESOURCES_VERSION)
            .build();
        return Futures.immediateFuture(resources);
    }
}
