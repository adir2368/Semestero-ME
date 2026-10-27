file_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js"
with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r"isAdirActive", text)]
for m in matches:
    line = text[:m].count("\n") + 1
    print(f"Line {line}: {text[m-20:m+80]}")
