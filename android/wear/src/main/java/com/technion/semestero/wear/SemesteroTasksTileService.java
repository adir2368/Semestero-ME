package com.technion.semestero.wear;

import android.content.Context;
import android.content.SharedPreferences;
import androidx.annotation.NonNull;
import androidx.wear.protolayout.ActionBuilders;
import androidx.wear.protolayout.ColorBuilders;
import androidx.wear.protolayout.DimensionBuilders;
import androidx.wear.protolayout.LayoutElementBuilders;
import androidx.wear.protolayout.ModifiersBuilders;
import androidx.wear.protolayout.ResourceBuilders;
import androidx.wear.protolayout.StateBuilders;
import androidx.wear.protolayout.TimelineBuilders;
import androidx.wear.tiles.RequestBuilders;
import androidx.wear.tiles.TileBuilders;
import androidx.wear.tiles.TileService;
import com.google.android.gms.wearable.Node;
import com.google.android.gms.wearable.Wearable;
import com.google.common.util.concurrent.Futures;
import com.google.common.util.concurrent.ListenableFuture;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Semestero ME • Galaxy Watch 8 Tasks & Submissions Glance Tile (v3.1.0 Visual Overhaul)
 * Circular AMOLED One UI Watch design:
 * - Outer circular urgency arc framing the 226dp round display
 * - Crisp top header + urgency-tinted open tasks badge
 * - 2 rich elevated task cards (clean title + short course + color-coded due pill + vertical accent bar)
 * - Next Exam countdown card when queue has 0–1 open tasks
 * - Curved bottom action bar: "+N more" pill (opens Page 2: Tasks) + 1-tap Sync button
 */
public class SemesteroTasksTileService extends TileService {

    private static final String RESOURCES_VERSION = "3";
    private static final String CLICK_ID_OPEN_TASKS = "open_tasks_page";
    private static final String CLICK_ID_SYNC_NOW = "sync_tasks_now";

    private static final int URGENCY_CRITICAL = 2; // Overdue or Due Today (Red)
    private static final int URGENCY_SOON = 1;     // Tomorrow or <= 3 days (Amber)
    private static final int URGENCY_NORMAL = 0;   // Upcoming (Cyan)

    private static final int COLOR_BG_ROOT = 0xFF000000;
    private static final int COLOR_CARD_BG_PRIMARY = 0xFF131D31;
    private static final int COLOR_CARD_BG_SECONDARY = 0xFF0F172A;
    private static final int COLOR_CARD_BORDER_SUBTLE = 0xFF26344D;

    private static final int COLOR_RED = 0xFFEF4444;
    private static final int COLOR_RED_TEXT = 0xFFFCA5A5;
    private static final int COLOR_RED_PILL_BG = 0x33EF4444;
    private static final int COLOR_RED_BORDER = 0x77EF4444;

    private static final int COLOR_AMBER = 0xFFF59E0B;
    private static final int COLOR_AMBER_TEXT = 0xFFFCD34D;
    private static final int COLOR_AMBER_PILL_BG = 0x30F59E0B;
    private static final int COLOR_AMBER_BORDER = 0x66F59E0B;

    private static final int COLOR_CYAN = 0xFF38BDF8;
    private static final int COLOR_CYAN_TEXT = 0xFF7DD3FC;
    private static final int COLOR_CYAN_PILL_BG = 0x2B38BDF8;
    private static final int COLOR_CYAN_BORDER = 0x5538BDF8;

    private static final int COLOR_EMERALD = 0xFF10B981;
    private static final int COLOR_EMERALD_TEXT = 0xFF6EE7B7;
    private static final int COLOR_EMERALD_PILL_BG = 0x2B10B981;
    private static final int COLOR_EMERALD_BORDER = 0x6610B981;

    private static final int COLOR_TEXT_PRIMARY = 0xFFF8FAFC;
    private static final int COLOR_TEXT_SECONDARY = 0xFF94A3B8;

    private static class TileTask {
        String course;
        String title;
        String dueLabel;
        int urgency;

        TileTask(String course, String title, String dueLabel, int urgency) {
            this.course = course;
            this.title = title;
            this.dueLabel = dueLabel;
            this.urgency = urgency;
        }
    }

    @Override
    protected ListenableFuture<TileBuilders.Tile> onTileRequest(RequestBuilders.TileRequest requestParams) {
        boolean syncTriggered = false;
        if (requestParams != null) {
            StateBuilders.State state = requestParams.getCurrentState();
            if (state != null && CLICK_ID_SYNC_NOW.equals(state.getLastClickableId())) {
                syncTriggered = true;
                requestSyncFromPhone();
            }
        }

        SharedPreferences prefs = getSharedPreferences(MainActivity.PREFS_NAME, Context.MODE_PRIVATE);
        List<TileTask> openTasks = loadOpenTasks(prefs);
        int openCount = openTasks.size();

        int topUrgency = URGENCY_NORMAL;
        for (TileTask t : openTasks) {
            if (t.urgency > topUrgency) topUrgency = t.urgency;
        }

        // Launch MainActivity directly into Page 2 (Tasks)
        ActionBuilders.LaunchAction openTasksAction = new ActionBuilders.LaunchAction.Builder()
            .setAndroidActivity(
                new ActionBuilders.AndroidActivity.Builder()
                    .setPackageName("com.technion.semestero")
                    .setClassName("com.technion.semestero.wear.MainActivity")
                    .addKeyToExtraMapping(
                        "page",
                        new ActionBuilders.AndroidIntExtra.Builder().setValue(2).build()
                    )
                    .build()
            )
            .build();

        ModifiersBuilders.Clickable openTasksClickable = new ModifiersBuilders.Clickable.Builder()
            .setId(CLICK_ID_OPEN_TASKS)
            .setOnClick(openTasksAction)
            .build();

        ModifiersBuilders.Clickable syncClickable = new ModifiersBuilders.Clickable.Builder()
            .setId(CLICK_ID_SYNC_NOW)
            .setOnClick(new ActionBuilders.LoadAction.Builder().build())
            .build();

        // 1. Subtle Top Circular Bezel Progress Arc (Samsung One UI Watch ring craft)
        int ringAccent = (openCount == 0)
            ? COLOR_EMERALD
            : (topUrgency == URGENCY_CRITICAL ? COLOR_RED : (topUrgency == URGENCY_SOON ? COLOR_AMBER : COLOR_CYAN));
        float arcSweep = (openCount == 0) ? 100f : Math.min(130f, 34f + (openCount * 14f));

        LayoutElementBuilders.Arc bezelTrack = new LayoutElementBuilders.Arc.Builder()
            .setAnchorAngle(DimensionBuilders.degrees(0f))
            .setAnchorType(LayoutElementBuilders.ARC_ANCHOR_CENTER)
            .addContent(
                new LayoutElementBuilders.ArcLine.Builder()
                    .setLength(DimensionBuilders.degrees(150f))
                    .setThickness(DimensionBuilders.dp(2.5f))
                    .setColor(ColorBuilders.argb(0x1EFFFFFF))
                    .build()
            )
            .build();

        LayoutElementBuilders.Arc bezelHighlight = new LayoutElementBuilders.Arc.Builder()
            .setAnchorAngle(DimensionBuilders.degrees(0f))
            .setAnchorType(LayoutElementBuilders.ARC_ANCHOR_CENTER)
            .addContent(
                new LayoutElementBuilders.ArcLine.Builder()
                    .setLength(DimensionBuilders.degrees(arcSweep))
                    .setThickness(DimensionBuilders.dp(2.8f))
                    .setColor(ColorBuilders.argb(ringAccent))
                    .build()
            )
            .build();

        // 2. Top Header: Clean title + Urgency-tinted Count Pill
        String badgeText;
        int badgeBg;
        int badgeBorder;
        int badgeFg;
        if (syncTriggered) {
            badgeText = "מסנכרן...";
            badgeBg = COLOR_CYAN_PILL_BG;
            badgeBorder = COLOR_CYAN_BORDER;
            badgeFg = COLOR_CYAN_TEXT;
        } else if (openCount == 0) {
            badgeText = "הכל הושלם";
            badgeBg = COLOR_EMERALD_PILL_BG;
            badgeBorder = COLOR_EMERALD_BORDER;
            badgeFg = COLOR_EMERALD_TEXT;
        } else {
            badgeText = (openCount == 1) ? "משימה 1" : (openCount + " פתוחות");
            if (topUrgency == URGENCY_CRITICAL) {
                badgeBg = COLOR_RED_PILL_BG;
                badgeBorder = COLOR_RED_BORDER;
                badgeFg = COLOR_RED_TEXT;
            } else if (topUrgency == URGENCY_SOON) {
                badgeBg = COLOR_AMBER_PILL_BG;
                badgeBorder = COLOR_AMBER_BORDER;
                badgeFg = COLOR_AMBER_TEXT;
            } else {
                badgeBg = COLOR_CYAN_PILL_BG;
                badgeBorder = COLOR_CYAN_BORDER;
                badgeFg = COLOR_CYAN_TEXT;
            }
        }

        LayoutElementBuilders.Row headerRow = new LayoutElementBuilders.Row.Builder()
            .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER)
            .addContent(
                new LayoutElementBuilders.Box.Builder()
                    .setModifiers(new ModifiersBuilders.Modifiers.Builder()
                        .setBackground(new ModifiersBuilders.Background.Builder()
                            .setColor(ColorBuilders.argb(badgeBg))
                            .setCorner(new ModifiersBuilders.Corner.Builder()
                                .setRadius(DimensionBuilders.dp(10))
                                .build())
                            .build())
                        .setBorder(new ModifiersBuilders.Border.Builder()
                            .setWidth(DimensionBuilders.dp(0.9f))
                            .setColor(ColorBuilders.argb(badgeBorder))
                            .build())
                        .setPadding(new ModifiersBuilders.Padding.Builder()
                            .setStart(DimensionBuilders.dp(7))
                            .setEnd(DimensionBuilders.dp(7))
                            .setTop(DimensionBuilders.dp(1.5f))
                            .setBottom(DimensionBuilders.dp(1.5f))
                            .build())
                        .build())
                    .addContent(
                        new LayoutElementBuilders.Text.Builder()
                            .setText(badgeText)
                            .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                                .setSize(DimensionBuilders.sp(9.5f))
                                .setColor(ColorBuilders.argb(badgeFg))
                                .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                                .build())
                            .setMaxLines(1)
                            .build()
                    )
                    .build()
            )
            .addContent(new LayoutElementBuilders.Spacer.Builder().setWidth(DimensionBuilders.dp(6)).build())
            .addContent(
                new LayoutElementBuilders.Text.Builder()
                    .setText("משימות")
                    .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                        .setSize(DimensionBuilders.sp(11f))
                        .setColor(ColorBuilders.argb(COLOR_TEXT_PRIMARY))
                        .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                        .build())
                    .setMaxLines(1)
                    .build()
            )
            .build();

        // 3. Main Content Area (2 Rich Cards, or 1 Card + Exam Card, or All-Clear + Exam Card)
        LayoutElementBuilders.Column.Builder contentColumn = new LayoutElementBuilders.Column.Builder()
            .setWidth(DimensionBuilders.expand())
            .setHeight(DimensionBuilders.expand())
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
            .addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(14)).build())
            .addContent(headerRow)
            .addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(8)).build());

        if (openCount >= 2) {
            contentColumn.addContent(buildTaskCard(openTasks.get(0), true, openTasksClickable));
            contentColumn.addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(6)).build());
            contentColumn.addContent(buildTaskCard(openTasks.get(1), false, openTasksClickable));
        } else if (openCount == 1) {
            contentColumn.addContent(buildTaskCard(openTasks.get(0), true, openTasksClickable));
            contentColumn.addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(6)).build());
            contentColumn.addContent(buildExamCountdownCard(prefs, openTasksClickable));
        } else {
            contentColumn.addContent(buildAllClearCard(openTasksClickable));
            contentColumn.addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(6)).build());
            contentColumn.addContent(buildExamCountdownCard(prefs, openTasksClickable));
        }

        // 4. Curved Bottom Action Bar: "+N more / Open all" pill + compact Sync button
        String ctaText;
        if (openCount > 2) {
            ctaText = "עוד +" + (openCount - 2) + " משימות";
        } else {
            ctaText = "כל המשימות";
        }

        LayoutElementBuilders.Box openAllPill = new LayoutElementBuilders.Box.Builder()
            .setModifiers(new ModifiersBuilders.Modifiers.Builder()
                .setClickable(openTasksClickable)
                .setBackground(new ModifiersBuilders.Background.Builder()
                    .setColor(ColorBuilders.argb(0x2438BDF8))
                    .setCorner(new ModifiersBuilders.Corner.Builder()
                        .setRadius(DimensionBuilders.dp(14))
                        .build())
                    .build())
                .setBorder(new ModifiersBuilders.Border.Builder()
                    .setWidth(DimensionBuilders.dp(0.9f))
                    .setColor(ColorBuilders.argb(0x6638BDF8))
                    .build())
                .setPadding(new ModifiersBuilders.Padding.Builder()
                    .setStart(DimensionBuilders.dp(11))
                    .setEnd(DimensionBuilders.dp(11))
                    .setTop(DimensionBuilders.dp(4.5f))
                    .setBottom(DimensionBuilders.dp(4.5f))
                    .build())
                .build())
            .addContent(
                new LayoutElementBuilders.Text.Builder()
                    .setText(ctaText)
                    .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                        .setSize(DimensionBuilders.sp(9.5f))
                        .setColor(ColorBuilders.argb(COLOR_CYAN_TEXT))
                        .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                        .build())
                    .setMaxLines(1)
                    .build()
            )
            .build();

        LayoutElementBuilders.Box syncPill = new LayoutElementBuilders.Box.Builder()
            .setWidth(DimensionBuilders.dp(25))
            .setHeight(DimensionBuilders.dp(25))
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
            .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER)
            .setModifiers(new ModifiersBuilders.Modifiers.Builder()
                .setClickable(syncClickable)
                .setBackground(new ModifiersBuilders.Background.Builder()
                    .setColor(ColorBuilders.argb(0xFF162033))
                    .setCorner(new ModifiersBuilders.Corner.Builder()
                        .setRadius(DimensionBuilders.dp(13))
                        .build())
                    .build())
                .setBorder(new ModifiersBuilders.Border.Builder()
                    .setWidth(DimensionBuilders.dp(0.9f))
                    .setColor(ColorBuilders.argb(0xFF334155))
                    .build())
                .build())
            .addContent(
                new LayoutElementBuilders.Text.Builder()
                    .setText("↻")
                    .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                        .setSize(DimensionBuilders.sp(12.5f))
                        .setColor(ColorBuilders.argb(COLOR_TEXT_PRIMARY))
                        .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                        .build())
                    .setMaxLines(1)
                    .build()
            )
            .build();

        LayoutElementBuilders.Row bottomBar = new LayoutElementBuilders.Row.Builder()
            .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER)
            .addContent(syncPill)
            .addContent(new LayoutElementBuilders.Spacer.Builder().setWidth(DimensionBuilders.dp(6)).build())
            .addContent(openAllPill)
            .build();

        contentColumn.addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(8)).build());
        contentColumn.addContent(bottomBar);

        // Root Layered Box: Black AMOLED base + Bezel Arc + Content Column
        LayoutElementBuilders.Box rootBox = new LayoutElementBuilders.Box.Builder()
            .setWidth(DimensionBuilders.expand())
            .setHeight(DimensionBuilders.expand())
            .setModifiers(new ModifiersBuilders.Modifiers.Builder()
                .setClickable(openTasksClickable)
                .setBackground(new ModifiersBuilders.Background.Builder()
                    .setColor(ColorBuilders.argb(COLOR_BG_ROOT))
                    .build())
                .build())
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
            .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER)
            .addContent(bezelTrack)
            .addContent(bezelHighlight)
            .addContent(contentColumn.build())
            .build();

        LayoutElementBuilders.Layout layout = new LayoutElementBuilders.Layout.Builder()
            .setRoot(rootBox)
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
            .setFreshnessIntervalMillis(60000) // Refresh every 60s
            .build();

        return Futures.immediateFuture(tile);
    }

    private LayoutElementBuilders.LayoutElement buildTaskCard(
        TileTask task,
        boolean isPrimary,
        ModifiersBuilders.Clickable clickable
    ) {
        int accentBarColor;
        int dueTextColor;
        int duePillBg;
        int cardBg;
        int cardBorder;

        if (task.urgency == URGENCY_CRITICAL) {
            accentBarColor = COLOR_RED;
            dueTextColor = COLOR_RED_TEXT;
            duePillBg = COLOR_RED_PILL_BG;
            cardBg = isPrimary ? 0xFF1E141B : COLOR_CARD_BG_SECONDARY;
            cardBorder = isPrimary ? COLOR_RED_BORDER : COLOR_CARD_BORDER_SUBTLE;
        } else if (task.urgency == URGENCY_SOON) {
            accentBarColor = COLOR_AMBER;
            dueTextColor = COLOR_AMBER_TEXT;
            duePillBg = COLOR_AMBER_PILL_BG;
            cardBg = isPrimary ? 0xFF1D1A12 : COLOR_CARD_BG_SECONDARY;
            cardBorder = isPrimary ? COLOR_AMBER_BORDER : COLOR_CARD_BORDER_SUBTLE;
        } else {
            accentBarColor = COLOR_CYAN;
            dueTextColor = COLOR_CYAN_TEXT;
            duePillBg = COLOR_CYAN_PILL_BG;
            cardBg = isPrimary ? COLOR_CARD_BG_PRIMARY : COLOR_CARD_BG_SECONDARY;
            cardBorder = isPrimary ? COLOR_CYAN_BORDER : COLOR_CARD_BORDER_SUBTLE;
        }

        // Line 1: Clean bold task title
        LayoutElementBuilders.Text titleView = new LayoutElementBuilders.Text.Builder()
            .setText(task.title)
            .setMaxLines(1)
            .setOverflow(LayoutElementBuilders.TEXT_OVERFLOW_ELLIPSIZE_END)
            .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                .setSize(DimensionBuilders.sp(isPrimary ? 11.5f : 11f))
                .setColor(ColorBuilders.argb(COLOR_TEXT_PRIMARY))
                .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                .build())
            .build();

        // Line 2: Compact urgency due pill + short course name
        LayoutElementBuilders.Row.Builder metaRow = new LayoutElementBuilders.Row.Builder()
            .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER);

        if (task.dueLabel != null && !task.dueLabel.isEmpty()) {
            metaRow.addContent(
                new LayoutElementBuilders.Box.Builder()
                    .setModifiers(new ModifiersBuilders.Modifiers.Builder()
                        .setBackground(new ModifiersBuilders.Background.Builder()
                            .setColor(ColorBuilders.argb(duePillBg))
                            .setCorner(new ModifiersBuilders.Corner.Builder()
                                .setRadius(DimensionBuilders.dp(6))
                                .build())
                            .build())
                        .setPadding(new ModifiersBuilders.Padding.Builder()
                            .setStart(DimensionBuilders.dp(5))
                            .setEnd(DimensionBuilders.dp(5))
                            .setTop(DimensionBuilders.dp(1))
                            .setBottom(DimensionBuilders.dp(1))
                            .build())
                        .build())
                    .addContent(
                        new LayoutElementBuilders.Text.Builder()
                            .setText(task.dueLabel)
                            .setMaxLines(1)
                            .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                                .setSize(DimensionBuilders.sp(8.5f))
                                .setColor(ColorBuilders.argb(dueTextColor))
                                .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                                .build())
                            .build()
                    )
                    .build()
            );
        }

        if (task.course != null && !task.course.isEmpty()) {
            if (task.dueLabel != null && !task.dueLabel.isEmpty()) {
                metaRow.addContent(new LayoutElementBuilders.Spacer.Builder().setWidth(DimensionBuilders.dp(5)).build());
            }
            metaRow.addContent(
                new LayoutElementBuilders.Text.Builder()
                    .setText(task.course)
                    .setMaxLines(1)
                    .setOverflow(LayoutElementBuilders.TEXT_OVERFLOW_ELLIPSIZE_END)
                    .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                        .setSize(DimensionBuilders.sp(9f))
                        .setColor(ColorBuilders.argb(COLOR_TEXT_SECONDARY))
                        .build())
                    .build()
            );
        }

        LayoutElementBuilders.Column textStack = new LayoutElementBuilders.Column.Builder()
            .setWidth(DimensionBuilders.weight(1f))
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_END)
            .addContent(titleView)
            .addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(2.5f)).build())
            .addContent(metaRow.build())
            .build();

        // Vertical urgency accent pill bar on the right (Hebrew reading edge)
        LayoutElementBuilders.Box accentBar = new LayoutElementBuilders.Box.Builder()
            .setWidth(DimensionBuilders.dp(3.5f))
            .setHeight(DimensionBuilders.dp(28))
            .setModifiers(new ModifiersBuilders.Modifiers.Builder()
                .setBackground(new ModifiersBuilders.Background.Builder()
                    .setColor(ColorBuilders.argb(accentBarColor))
                    .setCorner(new ModifiersBuilders.Corner.Builder()
                        .setRadius(DimensionBuilders.dp(2))
                        .build())
                    .build())
                .build())
            .build();

        LayoutElementBuilders.Row cardRow = new LayoutElementBuilders.Row.Builder()
            .setWidth(DimensionBuilders.expand())
            .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER)
            .addContent(textStack)
            .addContent(new LayoutElementBuilders.Spacer.Builder().setWidth(DimensionBuilders.dp(7)).build())
            .addContent(accentBar)
            .build();

        return new LayoutElementBuilders.Box.Builder()
            .setWidth(DimensionBuilders.dp(182))
            .setModifiers(new ModifiersBuilders.Modifiers.Builder()
                .setClickable(clickable)
                .setBackground(new ModifiersBuilders.Background.Builder()
                    .setColor(ColorBuilders.argb(cardBg))
                    .setCorner(new ModifiersBuilders.Corner.Builder()
                        .setRadius(DimensionBuilders.dp(13))
                        .build())
                    .build())
                .setBorder(new ModifiersBuilders.Border.Builder()
                    .setWidth(DimensionBuilders.dp(1f))
                    .setColor(ColorBuilders.argb(cardBorder))
                    .build())
                .setPadding(new ModifiersBuilders.Padding.Builder()
                    .setStart(DimensionBuilders.dp(9))
                    .setEnd(DimensionBuilders.dp(7))
                    .setTop(DimensionBuilders.dp(6))
                    .setBottom(DimensionBuilders.dp(6))
                    .build())
                .build())
            .addContent(cardRow)
            .build();
    }

    private LayoutElementBuilders.LayoutElement buildAllClearCard(ModifiersBuilders.Clickable clickable) {
        LayoutElementBuilders.Column stack = new LayoutElementBuilders.Column.Builder()
            .setWidth(DimensionBuilders.expand())
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
            .addContent(
                new LayoutElementBuilders.Text.Builder()
                    .setText("✓ אין משימות פתוחות")
                    .setMaxLines(1)
                    .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                        .setSize(DimensionBuilders.sp(12f))
                        .setColor(ColorBuilders.argb(COLOR_EMERALD_TEXT))
                        .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                        .build())
                    .build()
            )
            .addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(2)).build())
            .addContent(
                new LayoutElementBuilders.Text.Builder()
                    .setText("הכל מעודכן ומסונכרן")
                    .setMaxLines(1)
                    .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                        .setSize(DimensionBuilders.sp(9.5f))
                        .setColor(ColorBuilders.argb(COLOR_TEXT_SECONDARY))
                        .build())
                    .build()
            )
            .build();

        return new LayoutElementBuilders.Box.Builder()
            .setWidth(DimensionBuilders.dp(182))
            .setModifiers(new ModifiersBuilders.Modifiers.Builder()
                .setClickable(clickable)
                .setBackground(new ModifiersBuilders.Background.Builder()
                    .setColor(ColorBuilders.argb(0xFF0E1F1B))
                    .setCorner(new ModifiersBuilders.Corner.Builder()
                        .setRadius(DimensionBuilders.dp(13))
                        .build())
                    .build())
                .setBorder(new ModifiersBuilders.Border.Builder()
                    .setWidth(DimensionBuilders.dp(1f))
                    .setColor(ColorBuilders.argb(COLOR_EMERALD_BORDER))
                    .build())
                .setPadding(new ModifiersBuilders.Padding.Builder()
                    .setStart(DimensionBuilders.dp(10))
                    .setEnd(DimensionBuilders.dp(10))
                    .setTop(DimensionBuilders.dp(8))
                    .setBottom(DimensionBuilders.dp(8))
                    .build())
                .build())
            .addContent(stack)
            .build();
    }

    private LayoutElementBuilders.LayoutElement buildExamCountdownCard(
        SharedPreferences prefs,
        ModifiersBuilders.Clickable clickable
    ) {
        String examDays = prefs.getString("exam_days", "");
        String examTitle = prefs.getString("exam_title", "");
        String examSub = prefs.getString("exam_sub", "");

        String headline;
        String subline;
        Integer liveExamDays = MainActivity.computeLiveDaysDiff(examSub);
        if (liveExamDays != null && liveExamDays >= 0) {
            headline = (liveExamDays == 0)
                ? "בחינה היום!"
                : (liveExamDays == 1 ? "בחינה מחר!" : ("בחינה קרובה בעוד " + liveExamDays + " ימים"));
            String shortEx = shortenCourseName((examTitle != null && !isCorrupted(examTitle)) ? examTitle : "");
            if (!shortEx.isEmpty() && examSub != null && !examSub.trim().isEmpty() && !isCorrupted(examSub)) {
                subline = shortEx + " • " + examSub.trim();
            } else if (!shortEx.isEmpty()) {
                subline = shortEx;
            } else {
                subline = "סמסטר חורף תשפ״ז";
            }
        } else if (examDays != null && !examDays.trim().isEmpty() && !examDays.equals("--") && !isCorrupted(examDays)) {
            headline = examDays.trim().matches("^\\d+$")
                ? ("בחינה קרובה בעוד " + examDays.trim() + " ימים")
                : examDays.trim();
            String shortEx = shortenCourseName((examTitle != null && !isCorrupted(examTitle)) ? examTitle : "");
            if (!shortEx.isEmpty() && examSub != null && !examSub.trim().isEmpty() && !isCorrupted(examSub)) {
                subline = shortEx + " • " + examSub.trim();
            } else if (!shortEx.isEmpty()) {
                subline = shortEx;
            } else {
                subline = "סמסטר חורף תשפ״ז";
            }
        } else {
            headline = "תקופת לימודים שוטפת";
            subline = "הקש לצפייה בלוח המשימות";
        }

        LayoutElementBuilders.Column stack = new LayoutElementBuilders.Column.Builder()
            .setWidth(DimensionBuilders.expand())
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
            .addContent(
                new LayoutElementBuilders.Text.Builder()
                    .setText(headline)
                    .setMaxLines(1)
                    .setOverflow(LayoutElementBuilders.TEXT_OVERFLOW_ELLIPSIZE_END)
                    .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                        .setSize(DimensionBuilders.sp(10.5f))
                        .setColor(ColorBuilders.argb(COLOR_AMBER_TEXT))
                        .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                        .build())
                    .build()
            )
            .addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(2)).build())
            .addContent(
                new LayoutElementBuilders.Text.Builder()
                    .setText(subline)
                    .setMaxLines(1)
                    .setOverflow(LayoutElementBuilders.TEXT_OVERFLOW_ELLIPSIZE_END)
                    .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                        .setSize(DimensionBuilders.sp(9f))
                        .setColor(ColorBuilders.argb(COLOR_TEXT_SECONDARY))
                        .build())
                    .build()
            )
            .build();

        return new LayoutElementBuilders.Box.Builder()
            .setWidth(DimensionBuilders.dp(178))
            .setModifiers(new ModifiersBuilders.Modifiers.Builder()
                .setClickable(clickable)
                .setBackground(new ModifiersBuilders.Background.Builder()
                    .setColor(ColorBuilders.argb(COLOR_CARD_BG_SECONDARY))
                    .setCorner(new ModifiersBuilders.Corner.Builder()
                        .setRadius(DimensionBuilders.dp(12))
                        .build())
                    .build())
                .setBorder(new ModifiersBuilders.Border.Builder()
                    .setWidth(DimensionBuilders.dp(0.9f))
                    .setColor(ColorBuilders.argb(COLOR_CARD_BORDER_SUBTLE))
                    .build())
                .setPadding(new ModifiersBuilders.Padding.Builder()
                    .setStart(DimensionBuilders.dp(9))
                    .setEnd(DimensionBuilders.dp(9))
                    .setTop(DimensionBuilders.dp(6))
                    .setBottom(DimensionBuilders.dp(6))
                    .build())
                .build())
            .addContent(stack)
            .build();
    }

    private List<TileTask> loadOpenTasks(SharedPreferences prefs) {
        List<TileTask> result = new ArrayList<>();
        java.util.Set<String> seenKeys = new java.util.HashSet<>();
        int daysSinceSync = MainActivity.computeDaysElapsedSince(prefs.getLong("last_sync_timestamp", 0L));
        boolean parsedJson = false;
        String allTasks = prefs.getString("all_tasks_json", "[]");

        if (allTasks != null && !allTasks.trim().isEmpty() && !allTasks.trim().equals("[]")) {
            try {
                org.json.JSONArray arr = new org.json.JSONArray(allTasks);
                if (arr.length() > 0) {
                    parsedJson = true;
                    for (int i = 0; i < arr.length(); i++) {
                        org.json.JSONObject obj = arr.getJSONObject(i);
                        boolean isDone = obj.optBoolean("completed", false)
                            || (i < 15 && prefs.getBoolean("wear_task_" + (i + 1) + "_done", false));
                        if (isDone) continue;

                        String rawCourse = obj.optString("course", "").trim();
                        String rawTitle = obj.optString("title", "").trim();
                        String dueDateIso = obj.optString("dueDate", "").trim();
                        String rawDue = obj.optString("dueFormatted", obj.optString("due", "")).trim();
                        if (rawTitle.isEmpty() || isCorrupted(rawTitle)) continue;
                        if (isCorrupted(rawCourse)) rawCourse = "";
                        if (isCorrupted(rawDue)) rawDue = "";

                        // Strip redundant [Course] prefix from title if present
                        if (rawTitle.startsWith("[")) {
                            int closeIdx = rawTitle.indexOf(']');
                            if (closeIdx > 1 && closeIdx < rawTitle.length() - 1) {
                                if (rawCourse.isEmpty()) {
                                    rawCourse = rawTitle.substring(1, closeIdx).trim();
                                }
                                rawTitle = rawTitle.substring(closeIdx + 1).trim();
                            }
                        }

                        String shortCourse = shortenCourseName(rawCourse);
                        String dedupKey = MainActivity.buildTaskDedupKey(shortCourse, rawTitle);
                        if (!dedupKey.isEmpty() && seenKeys.contains(dedupKey)) continue;
                        if (!dedupKey.isEmpty()) seenKeys.add(dedupKey);

                        String compactDue;
                        int urgency;
                        Integer liveDays = MainActivity.computeLiveDaysDiff(dueDateIso);
                        if (liveDays == null && daysSinceSync > 0) {
                            liveDays = MainActivity.adjustRelativeDueDays(rawDue, daysSinceSync);
                        }
                        if (liveDays != null) {
                            compactDue = MainActivity.formatDaysDiffLabel(liveDays);
                            urgency = (liveDays <= 0) ? URGENCY_CRITICAL : (liveDays <= 3 ? URGENCY_SOON : URGENCY_NORMAL);
                        } else {
                            compactDue = formatCompactDue(rawDue);
                            urgency = resolveUrgency(rawDue);
                        }
                        result.add(new TileTask(shortCourse, rawTitle, compactDue, urgency));
                    }
                }
            } catch (Exception ignored) {}
        }

        if (!parsedJson) {
            for (int i = 1; i <= 3; i++) {
                String raw = prefs.getString("task_" + i, "");
                boolean isDone = prefs.getBoolean("wear_task_" + i + "_done", false)
                    || prefs.getBoolean("task_" + i + "_done", false);
                if (raw == null || raw.trim().isEmpty() || isDone || isCorrupted(raw) || raw.contains("אין משימות")) {
                    continue;
                }
                String cleaned = raw.replace("📌", "").replace("⚡", "").trim();
                String course = "";
                String due = "";
                if (cleaned.startsWith("[")) {
                    int closeIdx = cleaned.indexOf(']');
                    if (closeIdx > 1 && closeIdx < cleaned.length() - 1) {
                        course = shortenCourseName(cleaned.substring(1, closeIdx).trim());
                        cleaned = cleaned.substring(closeIdx + 1).trim();
                    }
                }
                int openParen = cleaned.lastIndexOf('(');
                int closeParen = cleaned.lastIndexOf(')');
                if (openParen > 0 && closeParen == cleaned.length() - 1) {
                    due = cleaned.substring(openParen + 1, closeParen).trim();
                    cleaned = cleaned.substring(0, openParen).trim();
                }
                result.add(new TileTask(course, cleaned, formatCompactDue(due), resolveUrgency(due)));
            }
        }

        return result;
    }

    private void requestSyncFromPhone() {
        try {
            Wearable.getNodeClient(this).getConnectedNodes().addOnSuccessListener(nodes -> {
                if (nodes != null) {
                    for (Node node : nodes) {
                        Wearable.getMessageClient(this).sendMessage(
                            node.getId(),
                            MainActivity.PATH_REQUEST_SYNC,
                            "tile_sync".getBytes()
                        );
                    }
                }
            });
        } catch (Exception ignored) {}
    }

    private static int resolveUrgency(String dueText) {
        if (dueText == null || dueText.isEmpty()) return URGENCY_NORMAL;
        if (dueText.contains("באיחור") || dueText.contains("היום")) return URGENCY_CRITICAL;
        if (dueText.contains("מחר")) return URGENCY_SOON;
        Matcher m = Pattern.compile("(\\d+)").matcher(dueText);
        if (dueText.contains("בעוד") && m.find()) {
            try {
                int days = Integer.parseInt(m.group(1));
                if (days <= 0) return URGENCY_CRITICAL;
                if (days <= 3) return URGENCY_SOON;
            } catch (Exception ignored) {}
        }
        return URGENCY_NORMAL;
    }

    private static String formatCompactDue(String dueText) {
        if (dueText == null || dueText.trim().isEmpty()) return "בקרוב";
        String d = dueText.trim();
        if (d.contains("להגשה היום") || d.contains("היום")) return "היום!";
        if (d.contains("להגשה מחר") || d.contains("מחר")) return "מחר";
        if (d.contains("באיחור")) {
            Matcher m = Pattern.compile("(\\d+)").matcher(d);
            return m.find() ? ("באיחור " + m.group(1) + " י׳") : "באיחור!";
        }
        if (d.contains("בעוד")) {
            Matcher m = Pattern.compile("(\\d+)").matcher(d);
            if (m.find()) return "בעוד " + m.group(1) + " י׳";
        }
        if (d.contains("ללא תאריך")) return "פתוחה";
        return d.length() > 14 ? d.substring(0, 13) + "…" : d;
    }

    private static String shortenCourseName(String course) {
        if (course == null || course.trim().isEmpty()) return "";
        String c = course.trim();
        if (c.contains("משוואות דיפרנציאליות חלקיות") || c.contains("104228")) return "מד״ח מ׳";
        if (c.contains("מוצקים 2") || c.contains("034053")) return "מוצקים 2מ׳";
        if (c.contains("חישוב מדעי") || c.contains("חישוב הנדסי") || c.contains("034056")) return "חישוב הנדסי";
        if (c.contains("תרמודינמיקה 1") || c.contains("034035")) return "תרמו 1";
        if (c.contains("פיסיקה 2") || c.contains("114052")) return "פיסיקה 2";
        if (c.contains("יוגה") || c.contains("חינוך גופני") || c.contains("03940805")) return "יוגה";
        return c.length() > 15 ? c.substring(0, 14) + "…" : c;
    }

    private static boolean isCorrupted(String s) {
        if (s == null || s.trim().isEmpty()) return false;
        return s.contains("?") && !s.matches(".*[\\u0590-\\u05FF].*");
    }

    @Override
    protected ListenableFuture<ResourceBuilders.Resources> onTileResourcesRequest(RequestBuilders.ResourcesRequest requestParams) {
        ResourceBuilders.Resources resources = new ResourceBuilders.Resources.Builder()
            .setVersion(RESOURCES_VERSION)
            .build();
        return Futures.immediateFuture(resources);
    }
}
