file_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js"
with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r"openCourseDetails", text)]
for m in matches:
    lines = text[:m].count("\n") + 1
    if 18500 <= lines <= 20000:
        pos = m
        print(f"Line {lines}: {text[pos-40:pos+80]}")
