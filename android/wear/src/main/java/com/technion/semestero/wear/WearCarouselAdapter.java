package com.technion.semestero.wear;

import android.content.Context;
import android.graphics.Paint;
import android.graphics.drawable.GradientDrawable;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import java.util.List;

/**
 * Semestero ME • Samsung Galaxy Watch 8 4-Screen Carousel:
 * Screen 0: Class Radar (Live upcoming / active lecture countdown + room + lecturer)
 * Screen 1: Interactive Weekly Timeline (Day switcher ◀ / ▶ + full authentic daily schedule)
 * Screen 2: Tasks & Exams (Prioritized tasks with due dates + 1-tap complete)
 * Screen 3: Academic Status & Phone Sync Bridge (GPA, Honors, Weekly Load, Instant Sync)
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
        void onTimelineDayChanged(int delta);
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
        public String course;
        public String due;
        public boolean isDone;
        public int urgency; // 0 = upcoming (cyan), 1 = soon <=3d (amber), 2 = overdue/today (red)

        public TaskItem(String title, String due, boolean isDone) {
            this(title, "", due, isDone, 0);
        }

        public TaskItem(String title, String course, String due, boolean isDone, int urgency) {
            this.title = title;
            this.course = course != null ? course : "";
            this.due = due;
            this.isDone = isDone;
            this.urgency = urgency;
        }
    }

    // State data
    public String radarDay = "";
    public String radarStatus = "";
    public String radarCourse = "";
    public String radarTime = "";
    public String radarRoom = "";
    public String radarLecturer = "";
    public boolean radarIsActive = false;
    public boolean radarIsStartingSoon = false;

    public String timelineHeader = "";
    public List<ClassItem> timelineClasses;

    public String examBannerTitle = "";
    public String examBannerSub = "";
    public List<TaskItem> tasksList;
    public boolean hasSyncedWithPhone = false;

    private final Context context;
    private final LayoutInflater inflater;
    private final OnCarouselActionListener actionListener;

    public String syncStatusText = "טלפון מחובר";
    public String syncLastTime = "סונכרן: מעודכן";
    public String gpaSummaryText = "🎓 ממוצע: -- • סמסטרו ME";
    public String schedSummaryText = "📅 ממתין לסנכרון מערכת";
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
        if (h.tvGpaBadge != null) {
            h.tvGpaBadge.setText(gpaSummaryText);
        }
        if (h.tvSchedSummary != null) {
            h.tvSchedSummary.setText(schedSummaryText);
        }
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
        h.tvDayChip.setText(radarDay.isEmpty() ? "יום חמישי • 12 בנובמבר" : radarDay);
        h.tvStatusBadge.setText(radarStatus.isEmpty() ? "⏰ מתחיל בקרוב" : radarStatus);

        if (radarIsActive) {
            h.tvStatusBadge.setBackgroundResource(R.drawable.pill_status_emerald);
            h.tvStatusBadge.setTextColor(context.getColor(R.color.emerald_green));
        } else if (radarIsStartingSoon) {
            h.tvStatusBadge.setBackgroundResource(R.drawable.pill_status_amber);
            h.tvStatusBadge.setTextColor(context.getColor(R.color.amber_warning));
        } else {
            h.tvStatusBadge.setBackgroundResource(R.drawable.pill_faculty_badge);
            h.tvStatusBadge.setTextColor(context.getColor(R.color.cyan_accent));
        }

        h.tvCourseTitle.setText(radarCourse.isEmpty() ? "משוואות דיפרנציאליות חלקיות מ׳" : radarCourse);
        h.tvTimePill.setText(radarTime.isEmpty() ? "10:30 - 12:30" : radarTime);
        String cleanRoom = radarRoom.isEmpty() ? "הנדסה כימית 1" : radarRoom;
        h.tvRoomTag.setText(cleanRoom.startsWith("📍") ? cleanRoom : ("📍 " + cleanRoom));
        h.tvLecturer.setText(radarLecturer.isEmpty() ? "👨‍🏫 ד״ר רועי בר און • הרצאה 20" : radarLecturer);
    }

    private void bindTimeline(TimelineViewHolder h) {
        this.timelineScrollView = h.scrollView;
        h.tvHeader.setText(timelineHeader.isEmpty() ? "לו״ז היום" : timelineHeader);

        if (h.btnPrevDay != null) {
            h.btnPrevDay.setOnClickListener(v -> {
                if (actionListener != null) actionListener.onTimelineDayChanged(-1);
            });
        }
        if (h.btnNextDay != null) {
            h.btnNextDay.setOnClickListener(v -> {
                if (actionListener != null) actionListener.onTimelineDayChanged(1);
            });
        }
        h.tvHeader.setOnClickListener(v -> {
            if (actionListener != null) actionListener.onTimelineDayChanged(0);
        });

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

                item.setOnClickListener(v -> {
                    Toast.makeText(context, ci.title + "\n" + ci.time + " | " + ci.room.replace("\n", " • "), Toast.LENGTH_SHORT).show();
                });

                h.container.addView(item);
            }
        } else {
            View emptyItem = inflater.inflate(R.layout.item_timeline, h.container, false);
            TextView tvTitle = emptyItem.findViewById(R.id.tv_item_title);
            TextView tvRoom = emptyItem.findViewById(R.id.tv_item_room);
            TextView tvTime = emptyItem.findViewById(R.id.tv_item_time);
            tvTitle.setText("יום חופשי ללא שיעורים 🏖️");
            tvRoom.setText("זמן מצוין לתרגילי בית, חזרות או מנוחה");
            tvTime.setText("חופשי");
            h.container.addView(emptyItem);
        }
    }

    private void bindTasks(TasksViewHolder h) {
        this.tasksScrollView = h.scrollView;
        h.tvExamTitle.setText(examBannerTitle.isEmpty() ? "📝 מועד א׳ בעוד 14 ימים" : examBannerTitle);
        h.tvExamSub.setText(examBannerSub.isEmpty() ? "104228 - מד״ח מ'" : examBannerSub);
        h.container.removeAllViews();

        if (tasksList != null && !tasksList.isEmpty()) {
            float density = context.getResources().getDisplayMetrics().density;
            for (int i = 0; i < tasksList.size(); i++) {
                TaskItem t = tasksList.get(i);

                View item = inflater.inflate(R.layout.item_task, h.container, false);
                TextView tvTitle = item.findViewById(R.id.tv_task_title);
                TextView tvDue = item.findViewById(R.id.tv_task_due);
                TextView tvCourse = item.findViewById(R.id.tv_task_course);
                View urgencyBar = item.findViewById(R.id.view_task_urgency_bar);

                tvTitle.setText(t.title);
                tvTitle.setPaintFlags(tvTitle.getPaintFlags() & (~Paint.STRIKE_THRU_TEXT_FLAG));
                tvTitle.setTextColor(context.getColor(R.color.text_primary));
                item.setAlpha(1.0f);

                if (tvCourse != null) {
                    if (t.course != null && !t.course.isEmpty()) {
                        tvCourse.setText(t.course);
                        tvCourse.setVisibility(View.VISIBLE);
                    } else {
                        tvCourse.setVisibility(View.GONE);
                    }
                }

                int barColor;
                int dueBgColor;
                int dueFgColor;
                if (t.urgency >= 2) {
                    barColor = 0xFFEF4444;
                    dueBgColor = 0x33EF4444;
                    dueFgColor = 0xFFFCA5A5;
                } else if (t.urgency == 1) {
                    barColor = 0xFFF59E0B;
                    dueBgColor = 0x30F59E0B;
                    dueFgColor = 0xFFFCD34D;
                } else {
                    barColor = 0xFF38BDF8;
                    dueBgColor = 0x2838BDF8;
                    dueFgColor = 0xFF7DD3FC;
                }

                if (tvDue != null) {
                    String dueDisplay = (t.due != null && !t.due.isEmpty()) ? t.due : "בקרוב";
                    tvDue.setText(dueDisplay);
                    tvDue.setTextColor(dueFgColor);
                    GradientDrawable duePill = new GradientDrawable();
                    duePill.setColor(dueBgColor);
                    duePill.setCornerRadius(6f * density);
                    tvDue.setBackground(duePill);
                }

                if (urgencyBar != null) {
                    GradientDrawable barBg = new GradientDrawable();
                    barBg.setColor(barColor);
                    barBg.setCornerRadius(2f * density);
                    urgencyBar.setBackground(barBg);
                }

                // Read-only on wrist (prevents accidental completions): tapping shows full details cleanly
                item.setOnClickListener(v -> {
                    String toastMsg = (t.course != null && !t.course.isEmpty())
                        ? ("[" + t.course + "] " + t.title + "\n" + t.due)
                        : (t.title + "\n" + t.due);
                    Toast.makeText(context, toastMsg, Toast.LENGTH_SHORT).show();
                });

                h.container.addView(item);
            }
        } else {
            float density = context.getResources().getDisplayMetrics().density;
            View emptyItem = inflater.inflate(R.layout.item_task, h.container, false);
            TextView tvTitle = emptyItem.findViewById(R.id.tv_task_title);
            TextView tvDue = emptyItem.findViewById(R.id.tv_task_due);
            TextView tvCourse = emptyItem.findViewById(R.id.tv_task_course);
            View urgencyBar = emptyItem.findViewById(R.id.view_task_urgency_bar);

            if (tvCourse != null) tvCourse.setVisibility(View.GONE);
            if (hasSyncedWithPhone) {
                tvTitle.setText("אין משימות פתוחות כרגע 🎉");
                if (tvDue != null) {
                    tvDue.setText("הקש לסנכרון מחדש");
                    tvDue.setTextColor(0xFF6EE7B7);
                    GradientDrawable pill = new GradientDrawable();
                    pill.setColor(0x2610B981);
                    pill.setCornerRadius(6f * density);
                    tvDue.setBackground(pill);
                }
                if (urgencyBar != null) {
                    GradientDrawable barBg = new GradientDrawable();
                    barBg.setColor(0xFF10B981);
                    barBg.setCornerRadius(2f * density);
                    urgencyBar.setBackground(barBg);
                }
            } else {
                tvTitle.setText("ממתין לסנכרון משימות 🔄");
                if (tvDue != null) {
                    tvDue.setText("פתח סמסטרו בטלפון • הקש לסנכרון");
                    tvDue.setTextColor(0xFF7DD3FC);
                    GradientDrawable pill = new GradientDrawable();
                    pill.setColor(0x2838BDF8);
                    pill.setCornerRadius(6f * density);
                    tvDue.setBackground(pill);
                }
                if (urgencyBar != null) {
                    GradientDrawable barBg = new GradientDrawable();
                    barBg.setColor(0xFF38BDF8);
                    barBg.setCornerRadius(2f * density);
                    urgencyBar.setBackground(barBg);
                }
            }
            emptyItem.setOnClickListener(v -> {
                if (actionListener != null) {
                    actionListener.onRefreshRequested();
                }
            });
            h.container.addView(emptyItem);
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
        public TextView btnPrevDay;
        public TextView btnNextDay;
        public LinearLayout container;
        public ScrollView scrollView;

        public TimelineViewHolder(@NonNull View itemView) {
            super(itemView);
            tvHeader = itemView.findViewById(R.id.timeline_header);
            btnPrevDay = itemView.findViewById(R.id.btn_prev_day);
            btnNextDay = itemView.findViewById(R.id.btn_next_day);
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
        public TextView tvGpaBadge;
        public TextView tvSchedSummary;

        public SyncViewHolder(@NonNull View itemView) {
            super(itemView);
            scrollView = itemView.findViewById(R.id.scroll_sync);
            btnTriggerSync = itemView.findViewById(R.id.btn_trigger_sync);
            btnTestNotification = itemView.findViewById(R.id.btn_test_notification);
            tvSyncBtnLabel = itemView.findViewById(R.id.tv_sync_btn_label);
            tvPhoneStatusDot = itemView.findViewById(R.id.tv_phone_status_dot);
            tvPhoneStatusText = itemView.findViewById(R.id.tv_phone_status_text);
            tvLastSynced = itemView.findViewById(R.id.tv_last_synced_time);
            tvGpaBadge = itemView.findViewById(R.id.tv_sync_gpa_badge);
            tvSchedSummary = itemView.findViewById(R.id.tv_sync_sched_summary);
        }
    }
}
