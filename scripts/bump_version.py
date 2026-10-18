import os
import re

ROOT = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree"

# 1. package.json
pkg_path = os.path.join(ROOT, "package.json")
with open(pkg_path, "r", encoding="utf-8") as f:
    pkg = f.read()
pkg = pkg.replace('"version": "2.4.19"', '"version": "2.4.20"')
with open(pkg_path, "w", encoding="utf-8") as f:
    f.write(pkg)
print("Updated package.json to 2.4.20")

# 2. sw.js
sw_path = os.path.join(ROOT, "sw.js")
with open(sw_path, "r", encoding="utf-8") as f:
    sw = f.read()
sw = sw.replace("v2.4.19", "v2.4.20")
with open(sw_path, "w", encoding="utf-8") as f:
    f.write(sw)
print("Updated sw.js to 2.4.20")

# 3. app.js
app_path = os.path.join(ROOT, "app.js")
with open(app_path, "r", encoding="utf-8") as f:
    app = f.read()
app = app.replace("v2.4.19", "v2.4.20").replace("2.4.19", "2.4.20")
with open(app_path, "w", encoding="utf-8") as f:
    f.write(app)
print("Updated app.js to 2.4.20")

# 4. index.html
idx_path = os.path.join(ROOT, "index.html")
with open(idx_path, "r", encoding="utf-8") as f:
    idx = f.read()

idx = idx.replace("v=2.4.19", "v=2.4.20")
idx = idx.replace('id="display-system-version">v2.4.19<', 'id="display-system-version">v2.4.20<')
idx = idx.replace('גרסה אחרונה v2.4.19', 'גרסה אחרונה v2.4.20')
idx = idx.replace('v2.4.19 ✨', 'v2.4.20 ✨')
idx = idx.replace('(v2.4.19)', '(v2.4.20)')

# Add changelog item
changelog_needle = '<ul class="whats-new-list" style="list-style-type: disc; padding-right: 22px; margin: 0; color: #e2e8f0; font-size: 0.88rem; line-height: 1.85;">'
new_item = '''<ul class="whats-new-list" style="list-style-type: disc; padding-right: 22px; margin: 0; color: #e2e8f0; font-size: 0.88rem; line-height: 1.85;">
                        <li><strong>v2.4.20 (19/10/2026):</strong> הפצת אפליקציית אנדרואיד רשמית מבוססת Capacitor (Semestero-ME.apk) להורדה ישירה מ-GitHub Releases; מנגנון סנכרון ועדכון אוטומטי מבוסס ענן (Option 1 Remote Sync) ללא צורך בהתקנה מחדש; סמליל מותג סמסטרו אותנטי ומסך פתיחה AMOLED שחור; נעילת זום טקסט מובנית (100% TextZoom); הסרת כפתור בודק איכות ממסך ההתחברות.</li>'''

if changelog_needle in idx:
    idx = idx.replace(changelog_needle, new_item, 1)

with open(idx_path, "w", encoding="utf-8") as f:
    f.write(idx)
print("Updated index.html to 2.4.20")
