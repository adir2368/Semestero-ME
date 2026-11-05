with open('android/wear/src/main/java/com/technion/semestero/wear/WearCarouselAdapter.java', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update bindSync
old_btn_click = """        h.btnTriggerSync.setOnClickListener(v -> {
            if (actionListener != null) {
                isSyncing = true;
                notifyItemChanged(TYPE_SYNC);
                actionListener.onRefreshRequested();
            }
        });"""

new_btn_click = """        h.btnTriggerSync.setOnClickListener(v -> {
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
        }"""

assert old_btn_click in text, "old_btn_click not found"
text = text.replace(old_btn_click, new_btn_click)

# 2. Update SyncViewHolder
old_svh = """    public static class SyncViewHolder extends RecyclerView.ViewHolder {
        public ScrollView scrollView;
        public View btnTriggerSync;
        public TextView tvSyncBtnLabel;
        public TextView tvPhoneStatusDot;
        public TextView tvPhoneStatusText;
        public TextView tvLastSynced;

        public SyncViewHolder(@NonNull View itemView) {
            super(itemView);
            scrollView = itemView.findViewById(R.id.scroll_sync);
            btnTriggerSync = itemView.findViewById(R.id.btn_trigger_sync);
            tvSyncBtnLabel = itemView.findViewById(R.id.tv_sync_btn_label);
            tvPhoneStatusDot = itemView.findViewById(R.id.tv_phone_status_dot);
            tvPhoneStatusText = itemView.findViewById(R.id.tv_phone_status_text);
            tvLastSynced = itemView.findViewById(R.id.tv_last_synced_time);
        }
    }"""

new_svh = """    public static class SyncViewHolder extends RecyclerView.ViewHolder {
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
    }"""

assert old_svh in text, "old_svh not found"
text = text.replace(old_svh, new_svh)

with open('android/wear/src/main/java/com/technion/semestero/wear/WearCarouselAdapter.java', 'w', encoding='utf-8') as f:
    f.write(text)

print("WearCarouselAdapter.java updated successfully!")
