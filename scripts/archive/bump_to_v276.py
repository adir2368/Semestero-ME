import os
import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NEW_VER = "2.7.6"
OLD_VER = "2.7.5"
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
gradle = re.sub(r'versionCode\s+\d+', 'versionCode 32', gradle)
gradle = re.sub(r'versionName\s+"[^"]+"', f'versionName "{NEW_VER}"', gradle)
with open(gradle_path, "w", encoding="utf-8") as f:
    f.write(gradle)
print(f"✓ android/app/build.gradle -> versionCode 32, versionName {NEW_VER}")

# 5. index.html
html_path = os.path.join(ROOT, "index.html")
with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

# Query params ?v=2.7.5 -> ?v=2.7.6
html = re.sub(r'\?v=2\.\d+\.\d+', f'?v={NEW_VER}', html)
# Footer button badge
html = re.sub(r'id="footer-version-badge"[^>]*>v[^<]+<', f'id="footer-version-badge" title="לחץ לבדיקת עדכונים ורענון המערכת (v{NEW_VER})" aria-label="בדיקת עדכוני גרסה ורענון המערכת" style="cursor: pointer;">v{NEW_VER} ✨<', html)
# System version
html = re.sub(r'id="display-system-version"[^>]*>v[^<]+<', f'id="display-system-version">v{NEW_VER}<', html)

# Changelog in index.html
crlf = '\r\n' in html
target_ul = '<ul style="list-style-type: disc; padding-right: 22px; margin: 0; color: #94a3b8; font-size: 0.84rem; line-height: 1.75;">\n'
new_item = f'''<ul style="list-style-type: disc; padding-right: 22px; margin: 0; color: #94a3b8; font-size: 0.84rem; line-height: 1.75;">
                            <li><strong>v{NEW_VER} ({DATE_STR}):</strong> זרימת Onboarding והתחברות אוטומטית בכניסה: חלונית התחברות והרשמה לאורחים חדשים, מעבר ישיר לטופס הרשמת סטודנט עם בחירת סמסטר פתיחה וקורסים קודמים, והפעלת הסיור המודרך (Interactive Tour) מיד עם סיום ההרשמה.</li>\n'''

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
rel_code = re.sub(r'NAME = f"Semestero ME v\{VERSION\} - [^"]+"', f'NAME = f"Semestero ME v{{VERSION}} - Entrance Auth Prompt, Registration Flow & Auto-Tour Launch"', rel_code)

new_notes = f'''    body_notes = f"""## מה חדש בגרסה v{{VERSION}} 🚀🧭✨

### 1. זרימת Onboarding והתחברות אוטומטית בכניסה (Entrance Auth Prompt)
- עבור משתמשים חדשים ואורחים שאינם מחוברים, המערכת מציגה אוטומטית עם כניסתם חלונית התחברות ידידותית ומעוצבת.
- אפשרות כניסה מהירה, מעבר בלחיצה אחת להרשמה, או המשך שיטוט חופשי כאורח ללא כפייה.

### 2. מעבר חלק להרשמה אישית (Seamless Registration Flow)
- לחיצה על כפתור ההרשמה מובילה ישירות לטופס יצירת חשבון סטודנט:
  - הזנת שם מלא / כינוי, סיסמה ואימייל אישי/טכניוני.
  - בחירת סמסטר פתיחה וסימון קורסים שכבר הושלמו בעבר (עם ציונים אופציונליים) לחישוב ממוצע ונק"ז התחלתיים.
  - סנכרון מיידי ומאובטח לענן Supabase Cloud ולמכשיר המקומי.

### 3. הפעלה אוטומטית של הסיור המודרך (Auto Interactive Tour Launch)
- מיד עם סיום ההרשמה, המערכת מברכת את הסטודנט ומפעילה אוטומטית את הסיור האינטראקטיבי החי (`InteractiveTour`).
- הסיור מנחה את הסטודנט צעד-אחר-צעד בעץ הקורסים, סרגל הניווט, מתכנן התואר, סנכרון המודל ומחשבון הציונים.

### 4. חבילות הפצה מעודכנות
- חבילת Android APK מעודכנת (v{{VERSION}}, versionCode 32).
- חבילת Windows שולחנית עצמאית (Semestero-ME.exe + ZIP).
- סנכרון מלא ל-GitHub Pages ולדומיין `semestero.me`."""'''

rel_code = re.sub(r'    body_notes = f""".*?"""', new_notes, rel_code, flags=re.DOTALL)
rel_code = re.sub(r'versionCode \d+', 'versionCode 32', rel_code)

with open(rel_path, "w", encoding="utf-8") as f:
    f.write(rel_code)
print(f"✓ scripts/create_github_release.py -> {NEW_VER}")

print(f"\nAll version bumps to {TAG} completed successfully!")
