import os
import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NEW_VER = "2.7.5"
OLD_VER = "2.7.4"
TAG = f"v{NEW_VER}"
DATE_STR = "27/10/2026"

print(f"Bumping version across codebase to {TAG}...")

# 1. package.json
pkg_path = os.path.join(ROOT, "package.json")
with open(pkg_path, "r", encoding="utf-8") as f:
    pkg = json.load(f)
pkg["version"] = NEW_VER
with open(pkg_path, "w", encoding="utf-8") as f:
    json.dump(pkg, f, indent=2, ensure_ascii=False)
print(f"✓ package.json -> {NEW_VER}")

# 2. sw.js
sw_path = os.path.join(ROOT, "sw.js")
with open(sw_path, "r", encoding="utf-8") as f:
    sw = f.read()
sw = re.sub(r"const CACHE_NAME = 'semestero-me-v[^']+';", f"const CACHE_NAME = 'semestero-me-v{NEW_VER}';", sw)
sw = re.sub(r"v\d+\.\d+\.\d+", f"v{NEW_VER}", sw, count=1)
with open(sw_path, "w", encoding="utf-8") as f:
    f.write(sw)
print(f"✓ sw.js -> semestero-me-v{NEW_VER}")

# 3. app.js
app_path = os.path.join(ROOT, "app.js")
with open(app_path, "r", encoding="utf-8") as f:
    app = f.read()
app = re.sub(r'code:\s*"REV-[^"]+"', f'code: "REV-2026.10.27-v{NEW_VER}"', app)
app = re.sub(r'version:\s*"[^"]+"', f'version: "{NEW_VER}"', app, count=1)
app = app.replace(f'APP_CURRENT_REVISION.version) || "{OLD_VER}"', f'APP_CURRENT_REVISION.version) || "{NEW_VER}"')
with open(app_path, "w", encoding="utf-8") as f:
    f.write(app)
print(f"✓ app.js -> {NEW_VER}")

# 4. android/app/build.gradle
gradle_path = os.path.join(ROOT, "android", "app", "build.gradle")
with open(gradle_path, "r", encoding="utf-8") as f:
    gradle = f.read()
gradle = re.sub(r'versionCode\s+\d+', 'versionCode 31', gradle)
gradle = re.sub(r'versionName\s+"[^"]+"', f'versionName "{NEW_VER}"', gradle)
with open(gradle_path, "w", encoding="utf-8") as f:
    f.write(gradle)
print(f"✓ android/app/build.gradle -> versionCode 31, versionName {NEW_VER}")

# 5. index.html
html_path = os.path.join(ROOT, "index.html")
with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

# Query params ?v=2.7.4 -> ?v=2.7.5
html = re.sub(r'\?v=2\.\d+\.\d+', f'?v={NEW_VER}', html)
# Footer button badge
html = re.sub(r'id="footer-version-badge"[^>]*>v[^<]+<', f'id="footer-version-badge" title="לחץ לבדיקת עדכונים ורענון המערכת (v{NEW_VER})" aria-label="בדיקת עדכוני גרסה ורענון המערכת" style="cursor: pointer;">v{NEW_VER} ✨<', html)
# System version
html = re.sub(r'id="display-system-version"[^>]*>v[^<]+<', f'id="display-system-version">v{NEW_VER}<', html)

# Changelog in index.html
crlf = '\r\n' in html
target_ul = '<ul style="list-style-type: disc; padding-right: 22px; margin: 0; color: #94a3b8; font-size: 0.84rem; line-height: 1.75;">\n'
new_item = f'''<ul style="list-style-type: disc; padding-right: 22px; margin: 0; color: #94a3b8; font-size: 0.84rem; line-height: 1.75;">
                            <li><strong>v{NEW_VER} ({DATE_STR}):</strong> חיבור ישיר ומלא לכל 34 הקורסים בפנגיה (Pangea) של עידו פנג בנטוב (מעל 100 כינויי קורסים), ניתוב אוטומטי ישיר למאגר הסיכומים והמבחנים, והרחבת סוויטת בדיקות הבריאות האוטומטית (npm test) ל-8 בדיקות.</li>\n'''

if crlf:
    target_ul = target_ul.replace('\n', '\r\n')
    new_item = new_item.replace('\n', '\r\n')

if target_ul in html:
    html = html.replace(target_ul, new_item, 1)

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)
print(f"✓ index.html -> {NEW_VER}")

# 6. scripts/create_github_release.py
rel_path = os.path.join(ROOT, "scripts", "create_github_release.py")
with open(rel_path, "r", encoding="utf-8") as f:
    rel_code = f.read()

rel_code = re.sub(r'pkg\.get\("version", "[^"]+"\)', f'pkg.get("version", "{NEW_VER}")', rel_code)
rel_code = re.sub(r'NAME = f"Semestero ME v\{VERSION\} - [^"]+"', f'NAME = f"Semestero ME v{{VERSION}} - Complete 34-Course Pangea Direct Integration & Extended Health Suite"', rel_code)

new_notes = f'''    body_notes = f"""## מה חדש בגרסה v{{VERSION}} 🌐⚡🎯

### 1. חיבור ישיר ומלא לכל 34 הקורסים בפנגיה (Exhaustive Pangea Integration)
- סריקה מלאה ומקיפה של הגן הדיגיטלי "פנגיה" (Pangea של עידו פנג בנטוב - `idofangbentov.uk`).
- מיפוי ישיר של כל 34 קורסי הטכניון הקיימים באתר מול מעל 100 וריאציות וכינויי קורסים (קודים בני 6 ספרות, 8 ספרות וריפודים).
- פתיחה ישירה ומדויקת מתוך כרטיסיית הקורס לעמודי המאגר הייעודיים (DYN1, FLD1, MNF1, LSY1, THE1, CAL1, PHY1, LPH1 ועוד) במקום חיפוש כללי.

### 2. הרחבת סוויטת בדיקות הבריאות האוטומטית (Automated Health Suite - 8 Gates)
- פקודת `npm test` הורחבה וכעת מוודאת באופן אוטומטי 8 מישורים קריטיים:
  1. היעדר שגיאות JavaScript בלתי מטופלות בטעינת האפליקציה.
  2. הגדרה תקינה ומלאה של פונקציית הסינון `escapeHtml`.
  3. תאימות מלאה של תגיות הגרסה ב-DOM מול `window.APP_VERSION`.
  4. פתיחה חלקה של חלונית פרטי קורס (`course-modal`) בעת לחיצה בעץ.
  5. וידוא קיומם של 4 קורסי החובה בלבד בסמסטר 4 והיעדר קורסי ספורט זרים.
  6. קיבוע מעבדה לפיזיקה 1ח׳ (`114032`) בסמסטר 5 (חורף תשפ"ז).
  7. קיומה ופעולתה של פונקציית Force Update.
  8. וידוא תקינות ושלמות מיפוי פנגיה (כל 34 הקורסים ומעל 100 כינויים) ב-`window.PANGEA_COURSE_MAP`.

### 3. חבילות הפצה מעודכנות
- חבילת Android APK מעודכנת (v{{VERSION}}, versionCode 31).
- חבילת Windows שולחנית עצמאית (Semestero-ME.exe + ZIP).
- סנכרון מלא ל-GitHub Pages."""'''

# Replace body_notes definition
rel_code = re.sub(r'    body_notes = f""".*?"""', new_notes, rel_code, flags=re.DOTALL)
rel_code = re.sub(r'versionCode \d+', 'versionCode 31', rel_code)

with open(rel_path, "w", encoding="utf-8") as f:
    f.write(rel_code)
print(f"✓ scripts/create_github_release.py -> {NEW_VER}")

print(f"\nAll version bumps to {TAG} completed successfully!")
