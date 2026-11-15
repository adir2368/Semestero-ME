import json
import re

print("Bumping version to v2.7.1...")

# 1. package.json
with open('package.json', 'r', encoding='utf-8') as f:
    pkg = json.load(f)
pkg['version'] = '2.7.1'
with open('package.json', 'w', encoding='utf-8') as f:
    json.dump(pkg, f, indent=2, ensure_ascii=False)
print("Updated package.json -> 2.7.1")

# 2. sw.js
with open('sw.js', 'r', encoding='utf-8') as f:
    sw = f.read()
sw = re.sub(r"const CACHE_NAME = 'semestero-me-v[^']+';", "const CACHE_NAME = 'semestero-me-v2.7.1';", sw)
with open('sw.js', 'w', encoding='utf-8') as f:
    f.write(sw)
print("Updated sw.js -> semestero-me-v2.7.1")

# 3. app.js
with open('app.js', 'r', encoding='utf-8') as f:
    app = f.read()
app = re.sub(r'code:\s*"REV-[^"]+"', 'code: "REV-2026.10.26-v2.7.1"', app)
app = re.sub(r'version:\s*"[^"]+"', 'version: "2.7.1"', app, count=1)
with open('app.js', 'w', encoding='utf-8') as f:
    f.write(app)
print("Updated app.js -> 2.7.1")

# 4. android/app/build.gradle
with open('android/app/build.gradle', 'r', encoding='utf-8') as f:
    gradle = f.read()
gradle = re.sub(r'versionCode\s+\d+', 'versionCode 27', gradle)
gradle = re.sub(r'versionName\s+"[^"]+"', 'versionName "2.7.1"', gradle)
with open('android/app/build.gradle', 'w', encoding='utf-8') as f:
    f.write(gradle)
print("Updated android/app/build.gradle -> versionCode 27, versionName 2.7.1")

# 5. index.html changelog
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

crlf = '\r\n' in html

target = '<ul style="list-style-type: disc; padding-right: 22px; margin: 0; color: #94a3b8; font-size: 0.84rem; line-height: 1.75;">\n'
new_entries = '''<ul style="list-style-type: disc; padding-right: 22px; margin: 0; color: #94a3b8; font-size: 0.84rem; line-height: 1.75;">
                            <li><strong>v2.7.1 (26/10/2026):</strong> ביקורת חיבורים מקיפה וחסימת סנכרון לכל שירותי המערכת: אינדיקטורים דינמיים אמיתיים למצב חיבור ערוץ הטלפון ויומני Google, חסימת סנכרון ענן שקט ללא טוקן, מניעת ייצוא קבצי ביטול ריקים, והודעות התרעה בעת ניסיון סנכרון ללא חיבור פעיל.</li>
                            <li><strong>v2.7.0 (26/10/2026):</strong> חסימת הדמיית סנכרון שקטה (No Fake Mock Sync) עבור מודל, יומני Google ו-CheeseFork: הצגת סטטוס אמיתי "אינו מחובר" כאשר אין קישור פעיל והתרעה ברורה בכל ניסיון סנכרון.</li>
                            <li><strong>v2.6.9 (26/10/2026):</strong> מנוע ניקוי כפילויות חכם למטלות, עדכון נתונים שהשתנו, וכפתור רענון ייעודי בטבלת המשימות.</li>\n'''

if crlf:
    target = target.replace('\n', '\r\n')
    new_entries = new_entries.replace('\n', '\r\n')

if target in html:
    html = html.replace(target, new_entries, 1)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Updated index.html changelog successfully")
else:
    print("Warning: target not found in index.html for changelog")

print("Version bump to v2.7.1 completed!")
