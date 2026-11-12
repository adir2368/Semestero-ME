package com.technion.semestero.wear;

import android.content.Context;
import androidx.annotation.NonNull;
import androidx.wear.protolayout.ActionBuilders;
import androidx.wear.protolayout.ColorBuilders;
import androidx.wear.protolayout.DimensionBuilders;
import androidx.wear.protolayout.LayoutElementBuilders;
import androidx.wear.protolayout.ModifiersBuilders;
import androidx.wear.protolayout.ResourceBuilders;
import androidx.wear.protolayout.TimelineBuilders;
import androidx.wear.tiles.RequestBuilders;
import androidx.wear.tiles.TileBuilders;
import androidx.wear.tiles.TileService;
import com.google.common.util.concurrent.Futures;
import com.google.common.util.concurrent.ListenableFuture;
import java.util.Calendar;

/**
 * Semestero ME • Wear OS Tile Service (Watch Widget)
 * Provides 1:1 identical visual design to the interactive watch app's Class Radar screen.
 * - Day & date header chip in cyan accent
 * - Dynamic status pill (🟢 מתקיים כעת!, ⏰ מתחיל בעוד X דק׳, ⏳ השיעור הבא היום)
 * - Hero course title in high-contrast crisp typography
 * - Time pill in cyan
 * - Rounded room tag card with border
 * - Lecturer & course type tag
 * - Never shows tomorrow prematurely while today's classes are ongoing or upcoming!
 * - One-tap anywhere on the Tile directly launches the app into the Class Radar!
 */
public class SemesteroClassTileService extends TileService {

    private static final String RESOURCES_VERSION = "5";

    @Override
    protected ListenableFuture<TileBuilders.Tile> onTileRequest(RequestBuilders.TileRequest requestParams) {
        Calendar now = Calendar.getInstance();
        WearScheduleHelper.ScheduleResolution res = WearScheduleHelper.resolve(this, now);
        WearScheduleHelper.scheduleNextBoundaryUpdate(this);

        // Click action: tap anywhere opens MainActivity directly
        ActionBuilders.LaunchAction launchAction = new ActionBuilders.LaunchAction.Builder()
            .setAndroidActivity(
                new ActionBuilders.AndroidActivity.Builder()
                    .setPackageName("com.technion.semestero")
                    .setClassName("com.technion.semestero.wear.MainActivity")
                    .build()
            )
            .build();

        ModifiersBuilders.Clickable clickable = new ModifiersBuilders.Clickable.Builder()
            .setOnClick(launchAction)
            .build();

        // 1. Day & Date Chip
        LayoutElementBuilders.Text dayChip = new LayoutElementBuilders.Text.Builder()
            .setText(res.dayHeader)
            .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                .setSize(DimensionBuilders.sp(11))
                .setColor(ColorBuilders.argb(0xFF38BDF8))
                .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                .build())
            .build();

        // 2. Status Badge Pill
        int statusBg = res.isActive ? 0x2E10B981 : (res.isStartingSoon ? 0x2EF59E0B : 0x2E38BDF8);
        int statusColor = res.isActive ? 0xFF10B981 : (res.isStartingSoon ? 0xFFF59E0B : 0xFF38BDF8);

        LayoutElementBuilders.Box statusBadgeBox = new LayoutElementBuilders.Box.Builder()
            .setModifiers(new ModifiersBuilders.Modifiers.Builder()
                .setBackground(new ModifiersBuilders.Background.Builder()
                    .setColor(ColorBuilders.argb(statusBg))
                    .setCorner(new ModifiersBuilders.Corner.Builder()
                        .setRadius(DimensionBuilders.dp(12))
                        .build())
                    .build())
                .setBorder(new ModifiersBuilders.Border.Builder()
                    .setWidth(DimensionBuilders.dp(1f))
                    .setColor(ColorBuilders.argb(statusColor))
                    .build())
                .setPadding(new ModifiersBuilders.Padding.Builder()
                    .setStart(DimensionBuilders.dp(9))
                    .setEnd(DimensionBuilders.dp(9))
                    .setTop(DimensionBuilders.dp(2))
                    .setBottom(DimensionBuilders.dp(2))
                    .build())
                .build())
            .addContent(
                new LayoutElementBuilders.Text.Builder()
                    .setText(res.statusText)
                    .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                        .setSize(DimensionBuilders.sp(10))
                        .setColor(ColorBuilders.argb(statusColor))
                        .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                        .build())
                    .build()
            )
            .build();

        // 3. Course Title (Hero)
        LayoutElementBuilders.Text courseTitle = new LayoutElementBuilders.Text.Builder()
            .setText(res.courseTitle)
            .setMaxLines(2)
            .setMultilineAlignment(LayoutElementBuilders.TEXT_ALIGN_CENTER)
            .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                .setSize(DimensionBuilders.sp(16))
                .setColor(ColorBuilders.argb(0xFFF8FAFC))
                .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                .build())
            .build();

        // 4. Time Pill
        LayoutElementBuilders.Text timePill = new LayoutElementBuilders.Text.Builder()
            .setText(res.timeText)
            .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                .setSize(DimensionBuilders.sp(13))
                .setColor(ColorBuilders.argb(0xFF38BDF8))
                .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                .build())
            .build();

        // 5. Room Tag (Dark pill container matching card_timeline_item)
        String roomDisplay = res.roomText.startsWith("📍") ? res.roomText : ("📍 " + res.roomText);
        LayoutElementBuilders.Box roomBox = new LayoutElementBuilders.Box.Builder()
            .setModifiers(new ModifiersBuilders.Modifiers.Builder()
                .setBackground(new ModifiersBuilders.Background.Builder()
                    .setColor(ColorBuilders.argb(0xFF1E293B))
                    .setCorner(new ModifiersBuilders.Corner.Builder()
                        .setRadius(DimensionBuilders.dp(8))
                        .build())
                    .build())
                .setBorder(new ModifiersBuilders.Border.Builder()
                    .setWidth(DimensionBuilders.dp(1f))
                    .setColor(ColorBuilders.argb(0xFF334155))
                    .build())
                .setPadding(new ModifiersBuilders.Padding.Builder()
                    .setStart(DimensionBuilders.dp(10))
                    .setEnd(DimensionBuilders.dp(10))
                    .setTop(DimensionBuilders.dp(2.5f))
                    .setBottom(DimensionBuilders.dp(2.5f))
                    .build())
                .build())
            .addContent(
                new LayoutElementBuilders.Text.Builder()
                    .setText(roomDisplay)
                    .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                        .setSize(DimensionBuilders.sp(11))
                        .setColor(ColorBuilders.argb(0xFFF8FAFC))
                        .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                        .build())
                    .build()
            )
            .build();

        // 6. Lecturer & Type Subtitle
        LayoutElementBuilders.Text lecturerText = new LayoutElementBuilders.Text.Builder()
            .setText(res.lecturerText)
            .setMaxLines(2)
            .setMultilineAlignment(LayoutElementBuilders.TEXT_ALIGN_CENTER)
            .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                .setSize(DimensionBuilders.sp(9.5f))
                .setColor(ColorBuilders.argb(0xFF94A3B8))
                .build())
            .build();

        // Assemble Root Layout with round bezel spacing
        LayoutElementBuilders.Column rootColumn = new LayoutElementBuilders.Column.Builder()
            .setWidth(DimensionBuilders.expand())
            .setHeight(DimensionBuilders.expand())
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
            .setModifiers(new ModifiersBuilders.Modifiers.Builder()
                .setClickable(clickable)
                .build())
            .addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(10)).build())
            .addContent(dayChip)
            .addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(4)).build())
            .addContent(statusBadgeBox)
            .addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(4)).build())
            .addContent(courseTitle)
            .addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(3)).build())
            .addContent(timePill)
            .addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(3)).build())
            .addContent(roomBox)
            .addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(2)).build())
            .addContent(lecturerText)
            .build();

        LayoutElementBuilders.Layout layout = new LayoutElementBuilders.Layout.Builder()
            .setRoot(rootColumn)
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
            .setFreshnessIntervalMillis(60000) // Refresh every 60s so class status is always live
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
