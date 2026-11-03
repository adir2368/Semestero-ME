package com.technion.semestero.wear;

import android.content.Context;
import android.graphics.Paint;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.List;

/**
 * Semestero ME • Samsung Galaxy Watch 8 Focused 3-Screen Carousel:
 * Screen 0: Class Radar
 * Screen 1: Today's Timeline
 * Screen 2: Tasks & Exams
 */
public class WearCarouselAdapter extends RecyclerView.Adapter<RecyclerView.ViewHolder> {

    public static final int TYPE_RADAR = 0;
    public static final int TYPE_TIMELINE = 1;
    public static final int TYPE_TASKS = 2;
    public static final int TYPE_SYNC = 3;

    public interface OnCarouselActionListener {
        void onTaskToggled(int taskIndex);
        void onRefreshRequested();
        void onTestNotificationRequested();
    }

    public static class ClassItem {
        public String title;
        public String time;
        public String room;
        public boolean isActive;

        public ClassItem(String title, String time, String room, boolean isActive) {
            this.title = title;
            this.time = time;
            this.room = room;
            this.isActive = isActive;
        }
    }

    public static class TaskItem {
        public String title;
        public String due;
        public boolean isDone;

        public TaskItem(String title, String due, boolean isDone) {
            this.title = title;
            this.due = due;
            this.isDone = isDone;
        }
    }

    // State data
    public String radarDay = "";
    public String radarStatus = "";
    public String radarCourse = "";
    public String radarTime = "";
    public String radarRoom = "";
    public String radarLecturer = "";

    public String timelineHeader = "";
    public List<ClassItem> timelineClasses;

    public String examBannerTitle = "";
    public String examBannerSub = "";
    public List<TaskItem> tasksList;

    private final Context context;
    private final LayoutInflater inflater;
    private final OnCarouselActionListener actionListener;

    public String syncStatusText = "טלפון מחובר";
    public String syncLastTime = "סונכרן: מעודכן";
    public boolean isSyncing = false;
    public ScrollView syncScrollView;

    public ScrollView timelineScrollView;
    public ScrollView tasksScrollView;

    public WearCarouselAdapter(Context context, OnCarouselActionListener listener) {
        this.context = context;
        this.inflater = LayoutInflater.from(context);
        this.actionListener = listener;
    }

    @Override
    public int getItemCount() {
        return 4;
    }

    @Override
    public int getItemViewType(int position) {
        return position;
    }

    @NonNull
    @Override
    public RecyclerView.ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        switch (viewType) {
            case TYPE_RADAR: {
                View v = inflater.inflate(R.layout.page_radar, parent, false);
                return new RadarViewHolder(v);
            }
            case TYPE_TIMELINE: {
                View v = inflater.inflate(R.layout.page_timeline, parent, false);
                return new TimelineViewHolder(v);
            }
            case TYPE_TASKS: {
                View v = inflater.inflate(R.layout.page_tasks, parent, false);
                return new TasksViewHolder(v);
            }
            case TYPE_SYNC:
            default: {
                View v = inflater.inflate(R.layout.page_sync, parent, false);
                return new SyncViewHolder(v);
            }
        }
    }

    @Override
    public void onBindViewHolder(@NonNull RecyclerView.ViewHolder holder, int position) {
        if (holder instanceof RadarViewHolder) {
            bindRadar((RadarViewHolder) holder);
        } else if (holder instanceof TimelineViewHolder) {
            bindTimeline((TimelineViewHolder) holder);
        } else if (holder instanceof TasksViewHolder) {
            bindTasks((TasksViewHolder) holder);
        } else if (holder instanceof SyncViewHolder) {
            bindSync((SyncViewHolder) holder);
        }
    }

    private void bindSync(SyncViewHolder h) {
        this.syncScrollView = h.scrollView;
        h.tvPhoneStatusText.setText(syncStatusText);
        h.tvLastSynced.setText(syncLastTime);
        if (isSyncing) {
            h.tvSyncBtnLabel.setText("🔄 מסנכרן כעת...");
            h.btnTriggerSync.setEnabled(false);
            h.btnTriggerSync.setAlpha(0.6f);
        } else {
            h.tvSyncBtnLabel.setText("🔄 סנכרן נתונים עכשיו");
            h.btnTriggerSync.setEnabled(true);
            h.btnTriggerSync.setAlpha(1.0f);
        }

        h.btnTriggerSync.setOnClickListener(v -> {
            if (actionListener != null) {
                isSyncing = true;
                notifyItemChanged(TYPE_SYNC);
                actionListener.onRefreshRequested();
            }
        });

        if (h.btnTestNotification != null) {
            h.btnTestNotification.setOnClickListener(v -> {
                if (actionListener != null) {
                    actionListener.onTestNotificationRequested();
                }
            });
        }
    }

    private void bindRadar(RadarViewHolder h) {
        h.tvDayChip.setText(radarDay.isEmpty() ? "יום שלישי • 3 בנובמבר" : radarDay);
        h.tvStatusBadge.setText(radarStatus.isEmpty() ? "⏰ מתחיל בעוד 51 דקות" : radarStatus);
        h.tvCourseTitle.setText(radarCourse.isEmpty() ? "משוואות דיפרנציאליות חלקיות מ׳" : radarCourse);
        h.tvTimePill.setText(radarTime.isEmpty() ? "12:30 - 14:30" : radarTime);
        h.tvRoomTag.setText(radarRoom.isEmpty() ? "📍 אולמן 506" : radarRoom);
        h.tvLecturer.setText(radarLecturer.isEmpty() ? "👨‍🏫 אמתי אלפרין • הרצאה" : radarLecturer);
    }

    private void bindTimeline(TimelineViewHolder h) {
        this.timelineScrollView = h.scrollView;
        h.tvHeader.setText(timelineHeader.isEmpty() ? "לו״ז יום שלישי (3 בנובמבר)" : timelineHeader);
        h.container.removeAllViews();

        if (timelineClasses != null && !timelineClasses.isEmpty()) {
            for (ClassItem ci : timelineClasses) {
                View item = inflater.inflate(R.layout.item_timeline, h.container, false);
                TextView tvTitle = item.findViewById(R.id.tv_item_title);
                TextView tvRoom = item.findViewById(R.id.tv_item_room);
                TextView tvTime = item.findViewById(R.id.tv_item_time);

                tvTitle.setText(ci.title);
                tvRoom.setText(ci.room);
                tvTime.setText(ci.time);

                if (ci.isActive) {
                    item.setBackgroundResource(R.drawable.card_timeline_active);
                    tvTime.setTextColor(context.getColor(R.color.emerald_green));
                } else {
                    item.setBackgroundResource(R.drawable.card_timeline_item);
                    tvTime.setTextColor(context.getColor(R.color.cyan_accent));
                }
                h.container.addView(item);
            }
        }
    }

    private void bindTasks(TasksViewHolder h) {
        this.tasksScrollView = h.scrollView;
        h.tvExamTitle.setText(examBannerTitle.isEmpty() ? "📝 מועד א׳ בעוד 14 ימים" : examBannerTitle);
        h.tvExamSub.setText(examBannerSub.isEmpty() ? "104228 - מד״ח מ'" : examBannerSub);
        h.container.removeAllViews();

        if (tasksList != null && !tasksList.isEmpty()) {
            for (int i = 0; i < tasksList.size(); i++) {
                final int taskIndex = i + 1;
                TaskItem t = tasksList.get(i);

                View item = inflater.inflate(R.layout.item_task, h.container, false);
                TextView tvTitle = item.findViewById(R.id.tv_task_title);
                View chkBg = item.findViewById(R.id.view_task_chk_bg);
                TextView tvChkIcon = item.findViewById(R.id.tv_task_chk_icon);

                tvTitle.setText(t.title);

                if (t.isDone) {
                    tvTitle.setPaintFlags(tvTitle.getPaintFlags() | Paint.STRIKE_THRU_TEXT_FLAG);
                    tvTitle.setTextColor(context.getColor(R.color.text_secondary));
                    chkBg.setBackgroundResource(R.drawable.chk_circle_done);
                    tvChkIcon.setVisibility(View.VISIBLE);
                    item.setAlpha(0.6f);
                } else {
                    tvTitle.setPaintFlags(tvTitle.getPaintFlags() & (~Paint.STRIKE_THRU_TEXT_FLAG));
                    tvTitle.setTextColor(context.getColor(R.color.text_primary));
                    chkBg.setBackgroundResource(R.drawable.chk_circle_idle);
                    tvChkIcon.setVisibility(View.GONE);
                    item.setAlpha(1.0f);
                }

                item.setOnClickListener(v -> {
                    if (actionListener != null) {
                        actionListener.onTaskToggled(taskIndex);
                    }
                });

                h.container.addView(item);
            }
        }
    }

    // View Holders
    public static class RadarViewHolder extends RecyclerView.ViewHolder {
        public TextView tvDayChip;
        public TextView tvStatusBadge;
        public TextView tvCourseTitle;
        public TextView tvTimePill;
        public TextView tvRoomTag;
        public TextView tvLecturer;

        public RadarViewHolder(@NonNull View itemView) {
            super(itemView);
            tvDayChip = itemView.findViewById(R.id.radar_day_chip);
            tvStatusBadge = itemView.findViewById(R.id.radar_status_badge);
            tvCourseTitle = itemView.findViewById(R.id.radar_course_title);
            tvTimePill = itemView.findViewById(R.id.radar_time_pill);
            tvRoomTag = itemView.findViewById(R.id.radar_room_tag);
            tvLecturer = itemView.findViewById(R.id.radar_lecturer);
        }
    }

    public static class TimelineViewHolder extends RecyclerView.ViewHolder {
        public TextView tvHeader;
        public LinearLayout container;
        public ScrollView scrollView;

        public TimelineViewHolder(@NonNull View itemView) {
            super(itemView);
            tvHeader = itemView.findViewById(R.id.timeline_header);
            container = itemView.findViewById(R.id.timeline_container);
            scrollView = itemView.findViewById(R.id.timeline_scroll_view);
        }
    }

    public static class TasksViewHolder extends RecyclerView.ViewHolder {
        public TextView tvExamTitle;
        public TextView tvExamSub;
        public LinearLayout container;
        public ScrollView scrollView;

        public TasksViewHolder(@NonNull View itemView) {
            super(itemView);
            tvExamTitle = itemView.findViewById(R.id.tv_exam_banner_title);
            tvExamSub = itemView.findViewById(R.id.tv_exam_banner_sub);
            container = itemView.findViewById(R.id.tasks_items_container);
            scrollView = itemView.findViewById(R.id.tasks_scroll_view);
        }
    }

    public static class SyncViewHolder extends RecyclerView.ViewHolder {
        public ScrollView scrollView;
        public View btnTriggerSync;
        public View btnTestNotification;
        public TextView tvSyncBtnLabel;
        public TextView tvPhoneStatusDot;
        public TextView tvPhoneStatusText;
        public TextView tvLastSynced;

        public SyncViewHolder(@NonNull View itemView) {
            super(itemView);
            scrollView = itemView.findViewById(R.id.scroll_sync);
            btnTriggerSync = itemView.findViewById(R.id.btn_trigger_sync);
            btnTestNotification = itemView.findViewById(R.id.btn_test_notification);
            tvSyncBtnLabel = itemView.findViewById(R.id.tv_sync_btn_label);
            tvPhoneStatusDot = itemView.findViewById(R.id.tv_phone_status_dot);
            tvPhoneStatusText = itemView.findViewById(R.id.tv_phone_status_text);
            tvLastSynced = itemView.findViewById(R.id.tv_last_synced_time);
        }
    }
}
