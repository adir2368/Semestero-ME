with open('android/wear/src/main/java/com/technion/semestero/wear/MainActivity.java', 'r', encoding='utf-8') as f:
    text = f.read()

old_code = """    @Override
    public void onRefreshRequested() {
        if (vibrator != null) vibrator.vibrate(35);
        if (adapter != null) {
            adapter.isSyncing = true;
            adapter.notifyItemChanged(WearCarouselAdapter.TYPE_SYNC);
        }
        requestSyncFromPhone();
        updateUIFromPrefsAndSchedule();
        Toast.makeText(this, "מבקש סנכרון מהטלפון... 🔄", Toast.LENGTH_SHORT).show();
    }"""

new_code = """    @Override
    public void onRefreshRequested() {
        if (vibrator != null) vibrator.vibrate(35);
        if (adapter != null) {
            adapter.isSyncing = true;
            adapter.notifyItemChanged(WearCarouselAdapter.TYPE_SYNC);
        }
        requestSyncFromPhone();
        updateUIFromPrefsAndSchedule();
        Toast.makeText(this, "מבקש סנכרון מהטלפון... 🔄", Toast.LENGTH_SHORT).show();
    }

    @Override
    public void onTestNotificationRequested() {
        if (vibrator != null) vibrator.vibrate(50);
        WearNotificationHelper.sendTestNotification(this);
        Toast.makeText(this, "התראת בדיקה נשלחה 🔔", Toast.LENGTH_SHORT).show();
    }"""

if old_code not in text:
    # search for onRefreshRequested
    idx = text.find("public void onRefreshRequested()")
    print("Found at:", idx)
    print(ascii(text[idx-20:idx+400]))
else:
    text = text.replace(old_code, new_code)
    with open('android/wear/src/main/java/com/technion/semestero/wear/MainActivity.java', 'w', encoding='utf-8') as f:
        f.write(text)
    print("MainActivity.java updated successfully!")
