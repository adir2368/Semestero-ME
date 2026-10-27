file_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js"
with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r"isAdirActive\s*:", text)]
if not matches:
    matches = [m.start() for m in re.finditer(r"isAdirActive", text)]
for m in matches[:5]:
    line = text[:m].count("\n") + 1
    print(f"Line {line}: {text[m-30:m+120]}")
