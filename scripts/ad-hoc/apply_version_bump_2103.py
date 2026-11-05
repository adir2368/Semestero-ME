import json, re

# 1. package.json
pkg_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\package.json"
with open(pkg_path, "r", encoding="utf-8") as f:
    pkg = json.load(f)
pkg["version"] = "2.10.3"
with open(pkg_path, "w", encoding="utf-8") as f:
    json.dump(pkg, f, indent=2, ensure_ascii=False)
print("Updated package.json to 2.10.3")

# 2. app.js
app_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js"
with open(app_path, "r", encoding="utf-8") as f:
    app_text = f.read()

# Replace APP_CURRENT_REVISION
old_rev_pattern = r'const APP_CURRENT_REVISION = \{[^}]+\};'
new_rev = """const APP_CURRENT_REVISION = {
    code: "REV-2026.11.05-v2.10.3",
    version: "2.10.3",
    build: "20261105_01",
    date: "2026-11-05 20:50",
    description: "v2.10.3: שדרוג לוח המשימות וסינון Notion מתקדם, תיקון זליגת שכבות (z-index) בניווט, מיתוג פנגייה רשמי, ניתוב ישיר להגשות מודל 26 (עקיפת לוח השנה) וקישור ישיר לדרייב הפקולטה להנדסת מכונות."
};"""

app_text = re.sub(old_rev_pattern, new_rev, app_text, count=1)
app_text = re.sub(r'APP_VERSION = ["\']2\.10\.2["\']', 'APP_VERSION = "2.10.3"', app_text)
app_text = re.sub(r'APP_VERSION: ["\']2\.10\.2["\']', 'APP_VERSION: "2.10.3"', app_text)
app_text = re.sub(r'const APP_VERSION = ["\']2\.10\.2["\']', 'const APP_VERSION = "2.10.3"', app_text)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(app_text)
print("Updated app.js to 2.10.3")

# 3. sw.js
sw_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\sw.js"
with open(sw_path, "r", encoding="utf-8") as f:
    sw_text = f.read()

sw_text = sw_text.replace("semestero-me-v2.10.2", "semestero-me-v2.10.3")
sw_text = sw_text.replace("v2.10.2", "v2.10.3")
with open(sw_path, "w", encoding="utf-8") as f:
    f.write(sw_text)
print("Updated sw.js to semestero-me-v2.10.3")

# 4. index.html
index_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\index.html"
with open(index_path, "r", encoding="utf-8") as f:
    index_text = f.read()

index_text = index_text.replace("?v=2.10.2", "?v=2.10.3")
index_text = index_text.replace('id="display-system-version">v2.10.2</span>', 'id="display-system-version">v2.10.3</span>')
index_text = index_text.replace('(v2.10.2)"', '(v2.10.3)"')
index_text = index_text.replace('v2.10.2 (29/10/2026)', 'v2.10.2 (29/10/2026)')

# Add changelog entry right above older-versions-list or first item
changelog_needle = '<ul style="list-style-type: disc; padding-right: 22px; margin: 0; color: #94a3b8; font-size: 0.84rem; line-height: 1.75;">'
new_changelog_item = changelog_needle + '\n                                                            <li><strong>v2.10.3 (05/11/2026):</strong> שדרוג לוח המשימות וסינון Notion מתקדם (בחירה מרובה לסמסטר ולקורס בדומה לסטטוס וסוג), פתרון הרמטי לזליגת שכבות (z-index) של תפריטי ניווט וסטטוס, תיקון איות וסמל פנגייה אותנטי, ניתוב ישיר לפעילויות והגשות במודל 26 (עקיפה מוחלטת של לוח השנה), הוספת כפתור בדיקת הגשה במודל במודאל אימות סיום, ושילוב קישור ישיר לדרייב הפקולטה להנדסת מכונות (אס״ט).</li>'
index_text = index_text.replace(changelog_needle, new_changelog_item, 1)

with open(index_path, "w", encoding="utf-8") as f:
    f.write(index_text)
print("Updated index.html to 2.10.3 and added changelog entry")

# 5. android/app/build.gradle
app_gradle_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\android\app\build.gradle"
with open(app_gradle_path, "r", encoding="utf-8") as f:
    ag_text = f.read()
ag_text = re.sub(r'versionCode\s+56', 'versionCode 57', ag_text)
ag_text = re.sub(r'versionName\s+["\']2\.10\.2["\']', 'versionName "2.10.3"', ag_text)
with open(app_gradle_path, "w", encoding="utf-8") as f:
    f.write(ag_text)
print("Updated android/app/build.gradle to versionCode 57, versionName 2.10.3")

# 6. android/wear/build.gradle
wear_gradle_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\android\wear\build.gradle"
with open(wear_gradle_path, "r", encoding="utf-8") as f:
    wg_text = f.read()
wg_text = re.sub(r'versionCode\s+56', 'versionCode 57', wg_text)
wg_text = re.sub(r'versionName\s+["\']2\.10\.2["\']', 'versionName "2.10.3"', wg_text)
with open(wear_gradle_path, "w", encoding="utf-8") as f:
    f.write(wg_text)
print("Updated android/wear/build.gradle to versionCode 57, versionName 2.10.3")
