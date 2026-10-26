import re

with open('index.html', 'r', encoding='utf-8') as f:
    html_lines = f.readlines()

with open('app.js', 'r', encoding='utf-8') as f:
    app_lines = f.readlines()

print("=== CHECKING INDEX.HTML BUTTONS WITH 'סנכר' OR 'ענן' OR 'חיבור' OR 'גיבוי' ===")
for idx, line in enumerate(html_lines):
    if ('<button' in line or '<a ' in line or 'class="card' in line or 'class="settings-' in line) and any(w in line for w in ['סנכר', 'ענן', 'חיבור', 'גיבוי', 'Google', 'Sync', 'בדיקה']):
        print(f"index.html:{idx+1}: {line.strip()[:140]}")

print("\n=== CHECKING APP.JS FOR BUTTON EVENT LISTENERS ON SYNC/CONNECT/CLOUD ===")
for idx, line in enumerate(app_lines):
    if any(k in line for k in ['addEventListener', 'onclick']) and any(w in line for w in ['sync', 'Sync', 'cloud', 'Cloud', 'phone', 'Phone', 'grades', 'Grades', 'calendar', 'Calendar']):
        print(f"app.js:{idx+1}: {line.strip()[:140]}")
