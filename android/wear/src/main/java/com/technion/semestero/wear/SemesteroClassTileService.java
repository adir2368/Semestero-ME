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

/**
 * Semestero ME • Wear OS Tile Service
 * Provides glanceable Next Class Radar on 44mm & 40mm Galaxy Watch screens.
 */
public class SemesteroClassTileService extends TileService {

    private static final String RESOURCES_VERSION = "2";

    @Override
    protected ListenableFuture<TileBuilders.Tile> onTileRequest(RequestBuilders.TileRequest requestParams) {
        SharedPreferences prefs = getSharedPreferences(MainActivity.PREFS_NAME, Context.MODE_PRIVATE);

        String classTitle = prefs.getString("class_title", "אין שיעורים קרובים היום");
        String classTime = prefs.getString("class_time", "--:--");
        String classRoom = prefs.getString("class_details", "יום חופשי 🎉");
        String classStatus = prefs.getString("class_status", "חופשי");

        LayoutElementBuilders.Layout layout = new LayoutElementBuilders.Layout.Builder()
            .setRoot(
                new LayoutElementBuilders.Column.Builder()
                    .setWidth(DimensionBuilders.expand())
                    .setHeight(DimensionBuilders.expand())
                    .setHorizontalAlignment(LayoutElementBuilders.HORIZONTAL_ALIGN_CENTER)
                    // Top breathing room for round bezel
                    .addContent(
                        new LayoutElementBuilders.Spacer.Builder()
                            .setHeight(DimensionBuilders.dp(16))
                            .build()
                    )
                    // Status Badge
                    .addContent(
                        new LayoutElementBuilders.Text.Builder()
                            .setText(classStatus)
                            .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                                .setSize(DimensionBuilders.sp(11))
                                .setColor(ColorBuilders.argb(0xFF10B981))
                                .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                                .build())
                            .build()
                    )
                    .addContent(
                        new LayoutElementBuilders.Spacer.Builder()
                            .setHeight(DimensionBuilders.dp(4))
                            .build()
                    )
                    // Class Name (Max 1 line, prominent on 44mm screen)
                    .addContent(
                        new LayoutElementBuilders.Text.Builder()
                            .setText(classTitle)
                            .setMaxLines(1)
                            .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                                .setSize(DimensionBuilders.sp(16))
                                .setColor(ColorBuilders.argb(0xFFF8FAFC))
                                .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                                .build())
                            .build()
                    )
                    .addContent(
                        new LayoutElementBuilders.Spacer.Builder()
                            .setHeight(DimensionBuilders.dp(3))
                            .build()
                    )
                    // Time
                    .addContent(
                        new LayoutElementBuilders.Text.Builder()
                            .setText(classTime)
                            .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                                .setSize(DimensionBuilders.sp(13))
                                .setColor(ColorBuilders.argb(0xFF38BDF8))
                                .setWeight(LayoutElementBuilders.FONT_WEIGHT_BOLD)
                                .build())
                            .build()
                    )
                    .addContent(
                        new LayoutElementBuilders.Spacer.Builder()
                            .setHeight(DimensionBuilders.dp(3))
                            .build()
                    )
                    // Room Location
                    .addContent(
                        new LayoutElementBuilders.Text.Builder()
                            .setText(classRoom)
                            .setFontStyle(new LayoutElementBuilders.FontStyle.Builder()
                                .setSize(DimensionBuilders.sp(12))
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
