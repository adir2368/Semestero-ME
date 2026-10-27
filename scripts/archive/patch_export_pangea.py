import os
import sys

sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
app_path = os.path.join(ROOT, "app.js")

with open(app_path, "r", encoding="utf-8") as f:
    text = f.read()

target = "'35041': 'https://idofangbentov.uk/Technion/MCS1/',\n};"
replacement = "'35041': 'https://idofangbentov.uk/Technion/MCS1/',\n};\nif (typeof window !== 'undefined') {\n    window.PANGEA_COURSE_MAP = PANGEA_COURSE_MAP;\n}"

if target in text:
    text = text.replace(target, replacement, 1)
    with open(app_path, "w", encoding="utf-8") as f:
        f.write(text)
    print("SUCCESS: Attached window.PANGEA_COURSE_MAP")
else:
    print("WARNING: Target not found")
