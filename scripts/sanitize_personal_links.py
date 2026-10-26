import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def sanitize_file(filename, replacements):
    filepath = os.path.join(ROOT, filename)
    if not os.path.exists(filepath):
        print(f"Skipping {filename} (not found)")
        return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    modified = False
    for old_str, new_str in replacements:
        c = content.count(old_str)
        if c > 0:
            content = content.replace(old_str, new_str)
            print(f"[{filename}] Replaced {c} occurrences of target string.")
            modified = True
        else:
            print(f"[{filename}] Target string not found for replacement.")

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"[{filename}] Saved successfully.")

# 1. Sanitize app.js
sanitize_file('app.js', [
    (
        '"moodleCalendarUrl": "https://moodle25.technion.ac.il/calendar/export_execute.php?userid=43774&authtoken=a124e33d97c0722e89374bea7fddb03632778eee&preset_what=all&preset_time=custom"',
        '"moodleCalendarUrl": ""'
    ),
    (
        '''    if (input) {
        input.value = CLOUD_GIST_SYNC.webcalUrl;
        if (hint) hint.innerText = "💡 קישור זה מזין ישירות את Apple Calendar (iPhone/Mac), Google Calendar (Android/Web), ו-Outlook.";
    }''',
        '''    if (input) {
        if (isAdir) {
            input.value = CLOUD_GIST_SYNC.webcalUrl;
            if (hint) hint.innerText = "💡 קישור זה מזין ישירות את Apple Calendar (iPhone/Mac), Google Calendar (Android/Web), ו-Outlook.";
        } else {
            input.value = "";
            input.placeholder = "סנכרון ענן אישי מופעל עבור חשבונות מחוברים בלבד";
            if (hint) hint.innerText = "💡 באפשרותך להוריד קובץ .ics מקומי של המערכת שלך באמצעות הכפתור מטה.";
        }
    }'''
    ),
    (
        '''    const isAdir = (window.AuthSync && typeof window.AuthSync.isAdirActive === 'function' && window.AuthSync.isAdirActive());
    const defaultUrl = isAdir 
        ? "https://cheesefork.netlify.app/?semester=202601&uid=D4bh8oHO0GQI5Gx1iYAbWsouBVx2" 
        : "https://cheesefork.netlify.app/?semester=202601";
    const targetUrl = customUrl || localStorage.getItem('ast_cheesefork_url') || defaultUrl;
    const parsed = parseCheeseForkUrl(targetUrl);''',
        '''    const isAdir = (window.AuthSync && typeof window.AuthSync.isAdirActive === 'function' && window.AuthSync.isAdirActive());
    const defaultUrl = isAdir 
        ? "https://cheesefork.netlify.app/?semester=202601&uid=D4bh8oHO0GQI5Gx1iYAbWsouBVx2" 
        : null;
    const targetUrl = customUrl || localStorage.getItem('ast_cheesefork_url') || defaultUrl;

    if (!targetUrl) {
        const errMsg = "כדי לסנכרן מערכת שעות, אנא הזן תחילה את קישור ה-CheeseFork האישי שלך (כולל uid וסמסטר).";
        if (statusDiv) {
            statusDiv.style.color = "#f59e0b";
            statusDiv.innerText = errMsg;
        }
        if (typeof showToastNotification === 'function') {
            showToastNotification(`ℹ️ ${errMsg}`, 'info');
        }
        const cfInput = document.getElementById("cheesefork-url");
        if (cfInput) {
            cfInput.focus();
            cfInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }
    const parsed = parseCheeseForkUrl(targetUrl);'''
    )
])

# 2. Sanitize preloaded_user_state.js
sanitize_file('preloaded_user_state.js', [
    (
        '"moodleCalendarUrl": "https://moodle25.technion.ac.il/calendar/export_execute.php?userid=43774&authtoken=a124e33d97c0722e89374bea7fddb03632778eee&preset_what=all&preset_time=custom"',
        '"moodleCalendarUrl": ""'
    )
])

# 3. Sanitize user_saved_state.json
sanitize_file('user_saved_state.json', [
    (
        '"moodleCalendarUrl": "https://moodle25.technion.ac.il/calendar/export_execute.php?userid=43774&authtoken=a124e33d97c0722e89374bea7fddb03632778eee&preset_what=all&preset_time=custom"',
        '"moodleCalendarUrl": ""'
    )
])

# 4. Sanitize widgets.html
sanitize_file('widgets.html', [
    (
        '''        function copyCalendarFeed() {
            const icsUrl = 'https://gist.githubusercontent.com/adir2368/71ec3efb9e46b0abafa44532f0e2aab1/raw/technion_schedule.ics';
            navigator.clipboard.writeText(icsUrl).then(() => {
                alert(`כתובת יומן הבחינות והמטלות (Webcal) הועתקה! הוסף אותה ב-Google Calendar או Samsung Calendar.`);
            });
        }''',
        '''        function copyCalendarFeed() {
            const isAdir = (window.AuthSync && typeof window.AuthSync.isAdirActive === 'function' && window.AuthSync.isAdirActive());
            if (isAdir) {
                const icsUrl = 'https://gist.githubusercontent.com/adir2368/71ec3efb9e46b0abafa44532f0e2aab1/raw/technion_schedule.ics';
                navigator.clipboard.writeText(icsUrl).then(() => {
                    alert(`כתובת יומן הבחינות והמטלות (Webcal) הועתקה! הוסף אותה ב-Google Calendar או Samsung Calendar.`);
                });
            } else {
                alert(`סנכרון יומן אישי מופעל עבור חשבונות מחוברים בלבד. באפשרותך לייצא קובץ יומן באפליקציה הראשית.`);
            }
        }'''
    )
])

print("Sanitization script complete.")
