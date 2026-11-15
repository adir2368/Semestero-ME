import os
import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NEW_VER = "2.7.7"
OLD_VER = "2.7.6"
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
gradle = re.sub(r'versionCode\s+\d+', 'versionCode 33', gradle)
gradle = re.sub(r'versionName\s+"[^"]+"', f'versionName "{NEW_VER}"', gradle)
with open(gradle_path, "w", encoding="utf-8") as f:
    f.write(gradle)
print(f"✓ android/app/build.gradle -> versionCode 33, versionName {NEW_VER}")

# 5. index.html
html_path = os.path.join(ROOT, "index.html")
with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

# Query params ?v=2.7.6 -> ?v=2.7.7
html = re.sub(r'\?v=2\.\d+\.\d+', f'?v={NEW_VER}', html)
# Footer button badge
html = re.sub(r'id="footer-version-badge"[^>]*>v[^<]+<', f'id="footer-version-badge" title="לחץ לבדיקת עדכונים ורענון המערכת (v{NEW_VER})" aria-label="בדיקת עדכוני גרסה ורענון המערכת" style="cursor: pointer;">v{NEW_VER} ✨<', html)
# System version
html = re.sub(r'id="display-system-version"[^>]*>v[^<]+<', f'id="display-system-version">v{NEW_VER}<', html)

# Changelog in index.html
crlf = '\r\n' in html
target_ul = '<ul style="list-style-type: disc; padding-right: 22px; margin: 0; color: #94a3b8; font-size: 0.84rem; line-height: 1.75;">\n'
new_item = f'''<ul style="list-style-type: disc; padding-right: 22px; margin: 0; color: #94a3b8; font-size: 0.84rem; line-height: 1.75;">
                            <li><strong>v{NEW_VER} ({DATE_STR}):</strong> חיבור מלא לאשף ההרשמה העשיר (3-Step Onboarding Wizard): ניתוב ישיר מחלונית ההתחברות לאשף המלא עם טיפים לשימוש, צ\'קליסט קורסים והזנת ציונים לפי סמסטרים, שילוב הרשמת ענן אופציונלית, כפתור מעבר נוח לחשבון קיים, והפעלה אוטומטית של הסיור המודרך (Interactive Tour) מיד בסיום.</li>\n'''

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
rel_code = re.sub(r'NAME = f"Semestero ME v\{VERSION\} - [^"]+"', f'NAME = f"Semestero ME v{{VERSION}} - Complete Onboarding Wizard Integration, Registration & Tour Flow"', rel_code)

new_notes = f'''    body_notes = f"""## מה חדש בגרסה v{{VERSION}} 🚀🎓✨

### 1. שילוב מלא של אשף ההרשמה העשיר (3-Step Onboarding Wizard)
- חיבור ישיר של כפתורי "הרשמה (סטודנט חדש)" בחלונית הכניסה ישירות לאשף ההרשמה המלא והמקיף.
- כולל את כל שלושת השלבים:
  1. הגדרת שם מלא + אפשרות להזנת אימייל וסיסמה אישית לסנכרון ענן (Supabase Cloud Sync).
  2. בחירת סמסטר פתיחה מדויק.
  3. צ'קליסט קורסים קודמים לפי סמסטרים (1 עד 4) עם כרטיסי קורס מעוצבים, נק״ז, ושדה הזנת ציון סופי חכם.
  - תיבת טיפים לשימוש מהיר: עץ דרישות קדומות, מתכנן תואר, ולוח שנה אקדמי.

### 2. מעבר נוח בחזרה להתחברות (Return to Login)
- נוספו קישורים וכפתורי מעבר ברורים ("🔑 יש לי חשבון" / "כבר יש לך חשבון קיים? לחץ כאן להתחברות ←") בראש ובתחתית אשף ההרשמה.

### 3. הפעלה אוטומטית של הסיור המודרך (Interactive Tour Launch)
- לחיצה על "סיום והתחלת שימוש 🚀" או "דלג והתחל" שומרת את תוכנית הלימודים ומפעילה מיד את הסיור האינטראקטיבי להכרת המערכת.

### 4. אימות מלא ומבחני אוטומציה
- עמידה בכל מבחני הרגרסיה והבריאות המלאים (8/8) ובדיקת תהליך ההרשמה המלא (5/5).
"""'''

rel_code = re.sub(r'body_notes = f"""[\s\S]*?"""', new_notes, rel_code)

with open(rel_path, "w", encoding="utf-8") as f:
    f.write(rel_code)
print(f"✓ scripts/create_github_release.py -> v{NEW_VER}")

print(f"\n🎉 Successfully bumped codebase to {TAG}!")
