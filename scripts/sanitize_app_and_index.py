import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# =========================================================================
# 1. Update app.js
# =========================================================================
app_path = os.path.join(ROOT, 'app.js')
with open(app_path, 'r', encoding='utf-8') as f:
    app_text = f.read()

# 1.1 Remove Capacitor bypass in isAdir checks
app_text = re.sub(
    r'const isAdirActiveUser = \(window\.AuthSync && typeof window\.AuthSync\.isAdirActive === [\'"]function[\'"] && window\.AuthSync\.isAdirActive\(\)\) \|\| \(typeof window !== [\'"]undefined[\'"] && \(window\.Capacitor \|\| window\.location\.protocol === [\'"]capacitor:[\'"]\)\);',
    'const isAdirActiveUser = (window.AuthSync && typeof window.AuthSync.isAdirActive === "function" && window.AuthSync.isAdirActive());',
    app_text
)
app_text = re.sub(
    r'const isAdir = \(window\.AuthSync && typeof window\.AuthSync\.isAdirActive === [\'"]function[\'"] && window\.AuthSync\.isAdirActive\(\)\) \|\| \(typeof window !== [\'"]undefined[\'"] && \(window\.Capacitor \|\| window\.location\.protocol === [\'"]capacitor:[\'"]\)\);',
    'const isAdir = (window.AuthSync && typeof window.AuthSync.isAdirActive === "function" && window.AuthSync.isAdirActive());',
    app_text
)
app_text = re.sub(
    r'const isAdirForRecovery = \(window\.AuthSync && typeof window\.AuthSync\.isAdirActive === [\'"]function[\'"] && window\.AuthSync\.isAdirActive\(\)\) \|\| \(typeof window !== [\'"]undefined[\'"] && \(window\.Capacitor \|\| window\.location\.protocol === [\'"]capacitor:[\'"]\)\);',
    'const isAdirForRecovery = (window.AuthSync && typeof window.AuthSync.isAdirActive === "function" && window.AuthSync.isAdirActive());',
    app_text
)

# 1.2 In openCheeseFork: remove hardcoded personal UID
old_open_cf = '''    const isAdir = (window.AuthSync && typeof window.AuthSync.isAdirActive === 'function' && window.AuthSync.isAdirActive());
    const defaultUrl = isAdir 
        ? "https://cheesefork.netlify.app/?semester=202601&uid=D4bh8oHO0GQI5Gx1iYAbWsouBVx2" 
        : "https://cheesefork.netlify.app/?semester=202601";'''
new_open_cf = '''    const defaultUrl = "https://cheesefork.netlify.app/?semester=202601";'''
app_text = app_text.replace(old_open_cf, new_open_cf)

# 1.3 In syncLiveCheeseForkData: remove hardcoded personal UID
old_sync_cf = '''    const isAdir = (window.AuthSync && typeof window.AuthSync.isAdirActive === 'function' && window.AuthSync.isAdirActive());
    const defaultUrl = isAdir 
        ? "https://cheesefork.netlify.app/?semester=202601&uid=D4bh8oHO0GQI5Gx1iYAbWsouBVx2" 
        : null;'''
new_sync_cf = '''    const defaultUrl = null;'''
app_text = app_text.replace(old_sync_cf, new_sync_cf)

# 1.4 In getActiveTimetableSchedule: do not return CHEESEFORK_SEMESTER_SCHEDULE if not Adir
old_get_active_tt = '''    if (typeof CHEESEFORK_SEMESTER_SCHEDULE !== 'undefined' && CHEESEFORK_SEMESTER_SCHEDULE && CHEESEFORK_SEMESTER_SCHEDULE.days && CHEESEFORK_SEMESTER_SCHEDULE.days.length > 0) {
        if (isAdir && curState) {
            curState.timetable = JSON.parse(JSON.stringify(CHEESEFORK_SEMESTER_SCHEDULE));
            if (typeof saveState === 'function') saveState();
        }
        return CHEESEFORK_SEMESTER_SCHEDULE;
    }
    return null;'''
new_get_active_tt = '''    if (isAdir && typeof CHEESEFORK_SEMESTER_SCHEDULE !== 'undefined' && CHEESEFORK_SEMESTER_SCHEDULE && CHEESEFORK_SEMESTER_SCHEDULE.days && CHEESEFORK_SEMESTER_SCHEDULE.days.length > 0) {
        if (curState) {
            curState.timetable = JSON.parse(JSON.stringify(CHEESEFORK_SEMESTER_SCHEDULE));
            if (typeof saveState === 'function') saveState();
        }
        return CHEESEFORK_SEMESTER_SCHEDULE;
    }
    return null;'''
app_text = app_text.replace(old_get_active_tt, new_get_active_tt)

# 1.5 In renderTimetableHeaderStats: replace hardcoded UID with generic/local link
old_strip_cf = '<a href="https://cheesefork.netlify.app/?semester=202601&uid=D4bh8oHO0GQI5Gx1iYAbWsouBVx2"'
new_strip_cf = '<a href="https://cheesefork.netlify.app/?semester=202601"'
app_text = app_text.replace(old_strip_cf, new_strip_cf)

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_text)
print("app.js sanitized successfully!")


# =========================================================================
# 2. Update index.html
# =========================================================================
idx_path = os.path.join(ROOT, 'index.html')
with open(idx_path, 'r', encoding='utf-8') as f:
    idx_text = f.read()

# 2.1 Remove static values of Adir's Google Calendar IDs
idx_text = idx_text.replace(
    'value="f04b545847cb46d2694500ffc3ac3378bd9005e125ae4a59c2caea5a5f32725c@group.calendar.google.com"',
    'value="" placeholder="מזהה יומן גוגל למבחנים (לדוגמה: example@group.calendar.google.com)"'
)
idx_text = idx_text.replace(
    'value="a887c830cc1a7b0ca4f97d1751bcf02477d837dd4ca9cf5de8385871f44a6c4d@group.calendar.google.com"',
    'value="" placeholder="מזהה יומן גוגל למטלות בית (לדוגמה: example@group.calendar.google.com)"'
)
idx_text = idx_text.replace(
    'value="d707cbfa99ea0f68a0a31ebc42cb4cd35eae834770a5a118051727eb0c1afdd5@group.calendar.google.com"',
    'value="" placeholder="מזהה יומן גוגל לתרגול (לדוגמה: example@group.calendar.google.com)"'
)

# 2.2 Update download links to latest releases
idx_text = idx_text.replace(
    'https://github.com/adir2368/Semestero-ME/releases/download/v2.6.2/Semestero-ME-Windows-x64.zip',
    'https://github.com/adir2368/Semestero-ME/releases/latest/download/Semestero-ME-Windows-x64.zip'
)
idx_text = idx_text.replace(
    'https://github.com/adir2368/Semestero-ME/releases/download/v2.6.2/Semestero-ME.exe',
    'https://github.com/adir2368/Semestero-ME/releases/latest/download/Semestero-ME.exe'
)

with open(idx_path, 'w', encoding='utf-8') as f:
    f.write(idx_text)
print("index.html sanitized successfully!")
