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
import androidx.wear.protolayout.TimelineBuilders;
import androidx.wear.tiles.RequestBuilders;
import androidx.wear.tiles.TileBuilders;
import androidx.wear.tiles.TileService;
import com.google.common.util.concurrent.Futures;
import com.google.common.util.concurrent.ListenableFuture;

/**
 * Semestero ME • Wear OS Tasks & Homework Due Glance Tile (Watch Widget)
 * Displays imminent assignments and submissions due within the next 48 hours directly on wrist swipe.
 * One-tap anywhere launches MainActivity directly into the Tasks tab.
 */
public class SemesteroTasksTileService extends TileService {

    private static final String RESOURCES_VERSION = "2";

    @Override
    protected ListenableFuture<TileBuilders.Tile> onTileRequest(RequestBuilders.TileRequest requestParams) {
        SharedPreferences prefs = getSharedPreferences(MainActivity.PREFS_NAME, Context.MODE_PRIVATE);

        String task1 = prefs.getString("task_1", "");
        boolean task1Done = prefs.getBoolean("wear_task_1_done", false);
        String task2 = prefs.getString("task_2", "");
        boolean task2Done = prefs.getBoolean("wear_task_2_done", false);
        String summary = prefs.getString("tasks_summary", "");

        // If task1 is empty or corrupted, dynamically extract from all_tasks_json
        if (task1.isEmpty() || isCorrupted(task1)) {
            String allTasks = prefs.getString("all_tasks_json", "[]");
            try {
                org.json.JSONArray arr = new org.json.JSONArray(allTasks);
                if (arr.length() > 0) {
                    org.json.JSONObject o1 = arr.getJSONObject(0);
                    String c1 = o1.optString("course", "");
                    String t1 = o1.optString("title", "");
                    if (!isCorrupted(t1) && !t1.isEmpty()) {
                        task1 = (!c1.isEmpty() && !t1.startsWith("[")) ? ("📌 [" + c1 + "] " + t1) : t1;
                    }
                }
                if (arr.length() > 1) {
                    org.json.JSONObject o2 = arr.getJSONObject(1);
                    String c2 = o2.optString("course", "");
                    String t2 = o2.optString("title", "");
                    if (!isCorrupted(t2) && !t2.isEmpty()) {
                        task2 = (!c2.isEmpty() && !t2.startsWith("[")) ? ("⚡ [" + c2 + "] " + t2) : t2;
                    }
                }
            } catch (Exception ignored) {}
        }

        if (isCorrupted(task1)) task1 = "";
        if (isCorrupted(task2)) task2 = "";
        if (isCorrupted(summary) || summary.isEmpty()) summary = "משימות";

        // Launch MainActivity on tap
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

        // 1. Header Chip (Cyan Accent)
        LayoutElementBuilders.Text headerChip = new LayoutElementBuilders.Text.Builder()
            .setText("📝 משימות והגשות")
            .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                .setSize(DimensionBuilders.sp(11))
                .setColor(ColorBuilders.argb(0xFF38BDF8))
                .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                .build())
            .build();

        // 2. Summary Badge Pill
        String badgeText = summary.isEmpty() ? "סמסטרו ME" : summary;
        LayoutElementBuilders.Box summaryBox = new LayoutElementBuilders.Box.Builder()
            .setModifiers(new ModifiersBuilders.Modifiers.Builder()
                .setBackground(new ModifiersBuilders.Background.Builder()
                    .setColor(ColorBuilders.argb(0x2E38BDF8))
                    .setCorner(new ModifiersBuilders.Corner.Builder()
                        .setRadius(DimensionBuilders.dp(10))
                        .build())
                    .build())
                .setPadding(new ModifiersBuilders.Padding.Builder()
                    .setStart(DimensionBuilders.dp(8))
                    .setEnd(DimensionBuilders.dp(8))
                    .setTop(DimensionBuilders.dp(2))
                    .setBottom(DimensionBuilders.dp(2))
                    .build())
                .build())
            .addContent(
                new LayoutElementBuilders.Text.Builder()
                    .setText(badgeText)
                    .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                        .setSize(DimensionBuilders.sp(10))
                        .setColor(ColorBuilders.argb(0xFF38BDF8))
                        .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                        .build())
                    .build()
            )
            .build();

        // 3. Task Items Column
        LayoutElementBuilders.Column.Builder columnBuilder = new LayoutElementBuilders.Column.Builder()
            .setModifiers(new ModifiersBuilders.Modifiers.Builder()
                .setClickable(clickable)
                .build())
            .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
            .addContent(headerChip)
            .addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(4)).build())
            .addContent(summaryBox)
            .addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(6)).build());

        if (!task1.isEmpty() && !task1Done) {
            columnBuilder.addContent(createTaskRow(task1, 0xFFF8FAFC));
            columnBuilder.addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(4)).build());
        }

        if (!task2.isEmpty() && !task2Done) {
            columnBuilder.addContent(createTaskRow(task2, 0xFFCBD5E1));
            columnBuilder.addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(4)).build());
        }

        if ((task1.isEmpty() || task1Done) && (task2.isEmpty() || task2Done)) {
            LayoutElementBuilders.Text allClear = new LayoutElementBuilders.Text.Builder()
                .setText("אין משימות דחופות! 🎉")
                .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                    .setSize(DimensionBuilders.sp(11))
                    .setColor(ColorBuilders.argb(0xFF10B981))
                    .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                    .build())
                .build();
            columnBuilder.addContent(allClear);
        }

        LayoutElementBuilders.Layout layout = new LayoutElementBuilders.Layout.Builder()
            .setRoot(
                new LayoutElementBuilders.Box.Builder()
                    .setModifiers(new ModifiersBuilders.Modifiers.Builder()
                        .setClickable(clickable)
                        .setBackground(new ModifiersBuilders.Background.Builder()
                            .setColor(ColorBuilders.argb(0xFF000000))
                            .build())
                        .build())
                    .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
                    .setVerticalAlignment(LayoutElementBuilders.VERTICAL_ALIGN_CENTER)
                    .addContent(columnBuilder.build())
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
            .setFreshnessIntervalMillis(60000) // 1 minute
            .build();

        return Futures.immediateFuture(tile);
    }

    private static boolean isCorrupted(String s) {
        if (s == null || s.trim().isEmpty()) return false;
        return s.contains("?") && !s.matches(".*[\\u0590-\\u05FF].*");
    }

    private LayoutElementBuilders.LayoutElement createTaskRow(String text, int color) {
        String clean = text.length() > 28 ? text.substring(0, 25) + "..." : text;
        return new LayoutElementBuilders.Box.Builder()
            .setModifiers(new ModifiersBuilders.Modifiers.Builder()
                .setBackground(new ModifiersBuilders.Background.Builder()
                    .setColor(ColorBuilders.argb(0x1F334155))
                    .setCorner(new ModifiersBuilders.Corner.Builder()
                        .setRadius(DimensionBuilders.dp(8))
                        .build())
                    .build())
                .setBorder(new ModifiersBuilders.Border.Builder()
                    .setWidth(DimensionBuilders.dp(0.75f))
                    .setColor(ColorBuilders.argb(0x33475569))
                    .build())
                .setPadding(new ModifiersBuilders.Padding.Builder()
                    .setStart(DimensionBuilders.dp(8))
                    .setEnd(DimensionBuilders.dp(8))
                    .setTop(DimensionBuilders.dp(3))
                    .setBottom(DimensionBuilders.dp(3))
                    .build())
                .build())
            .addContent(
                new LayoutElementBuilders.Text.Builder()
                    .setText(clean)
                    .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                        .setSize(DimensionBuilders.sp(10))
                        .setColor(ColorBuilders.argb(color))
                        .build())
                    .setMaxLines(1)
                    .build()
            )
            .build();
    }

    @Override
    protected ListenableFuture<ResourceBuilders.Resources> onTileResourcesRequest(RequestBuilders.ResourcesRequest requestParams) {
        ResourceBuilders.Resources resources = new ResourceBuilders.Resources.Builder()
            .setVersion(RESOURCES_VERSION)
            .build();
        return Futures.immediateFuture(resources);
    }
}
