import json, re

# 1. package.json
pkg_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\package.json"
with open(pkg_path, "r", encoding="utf-8") as f:
    pkg = json.load(f)
pkg["version"] = "2.10.4"
with open(pkg_path, "w", encoding="utf-8") as f:
    json.dump(pkg, f, indent=2, ensure_ascii=False)
print("Updated package.json to 2.10.4")

# 2. app.js
app_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js"
with open(app_path, "r", encoding="utf-8") as f:
    app_text = f.read()

old_rev_pattern = r'const APP_CURRENT_REVISION = \{[^}]+\};'
new_rev = """const APP_CURRENT_REVISION = {
    code: "REV-2026.11.07-v2.10.4",
    version: "2.10.4",
    build: "20261107_01",
    date: "2026-11-07 01:00",
    description: "v2.10.4: פתיחה אוטומטית בדפדפן מערכת חיצוני של כלל שירותי המודל והאס״ט, קישור עמוק ישיר לתיקיות רפרנסים של קורסים בדרייב הפקולטה, ומבנה נתונים כפול לשיעורי בית (דיגיטלי + פתרון בכתב)."
};"""

app_text = re.sub(old_rev_pattern, new_rev, app_text, count=1)
app_text = re.sub(r'APP_VERSION = ["\']2\.10\.3["\']', 'APP_VERSION = "2.10.4"', app_text)
app_text = re.sub(r'APP_VERSION: ["\']2\.10\.3["\']', 'APP_VERSION: "2.10.4"', app_text)
app_text = re.sub(r'const APP_VERSION = ["\']2\.10\.3["\']', 'const APP_VERSION = "2.10.4"', app_text)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(app_text)
print("Updated app.js to 2.10.4")

# 3. sw.js
sw_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\sw.js"
with open(sw_path, "r", encoding="utf-8") as f:
    sw_text = f.read()

sw_text = sw_text.replace("semestero-me-v2.10.3", "semestero-me-v2.10.4")
sw_text = sw_text.replace("v2.10.3", "v2.10.4")
with open(sw_path, "w", encoding="utf-8") as f:
    f.write(sw_text)
print("Updated sw.js to semestero-me-v2.10.4")

# 4. index.html
index_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\index.html"
with open(index_path, "r", encoding="utf-8") as f:
    index_text = f.read()

index_text = index_text.replace("?v=2.10.3", "?v=2.10.4")
index_text = index_text.replace('id="display-system-version">v2.10.3</span>', 'id="display-system-version">v2.10.4</span>')
index_text = index_text.replace('(v2.10.3)"', '(v2.10.4)"')

# Add changelog entry for v2.10.4
changelog_needle = '<ul style="list-style-type: disc; padding-right: 22px; margin: 0; color: #94a3b8; font-size: 0.84rem; line-height: 1.75;">'
new_changelog_item = changelog_needle + '\n                                                            <li><strong>v2.10.4 (07/11/2026):</strong> פתיחה אוטומטית בדפדפן מערכת חיצוני של כלל שירותי המודל והאס״ט (שימור סשן מחובר של הטכניון ללא צורך בהתחברות חוזרת באפליקציה), ניתוב עמוק אוטומטי מכל משימה וקורס ישירות לתיקיית הרפרנסים והפתרונות הייעודית בדרייב הפקולטה להנדסת מכונות, והכנת תשתית למעקב התקדמות שיעורי בית ומודל הגשה כפול (שאלון דיגיטלי + סריקה בכתב).</li>'
index_text = index_text.replace(changelog_needle, new_changelog_item, 1)

with open(index_path, "w", encoding="utf-8") as f:
    f.write(index_text)
print("Updated index.html to 2.10.4")

# 5. android/app/build.gradle
app_gradle_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\android\app\build.gradle"
with open(app_gradle_path, "r", encoding="utf-8") as f:
    ag_text = f.read()
ag_text = re.sub(r'versionCode\s+57', 'versionCode 58', ag_text)
ag_text = re.sub(r'versionName\s+["\']2\.10\.3["\']', 'versionName "2.10.4"', ag_text)
with open(app_gradle_path, "w", encoding="utf-8") as f:
    f.write(ag_text)
print("Updated android/app/build.gradle to versionCode 58, versionName 2.10.4")

# 6. android/wear/build.gradle
wear_gradle_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\android\wear\build.gradle"
with open(wear_gradle_path, "r", encoding="utf-8") as f:
    wg_text = f.read()
wg_text = re.sub(r'versionCode\s+57', 'versionCode 58', wg_text)
wg_text = re.sub(r'versionName\s+["\']2\.10\.3["\']', 'versionName "2.10.4"', wg_text)
with open(wear_gradle_path, "w", encoding="utf-8") as f:
    f.write(wg_text)
print("Updated android/wear/build.gradle to versionCode 58, versionName 2.10.4")
