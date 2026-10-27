file_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js"
with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

import re
match = re.search(r"function openCourseDetails\(", text)
start = match.start()
# find next function at root indentation
next_func = re.search(r"\nfunction [a-zA-Z0-9_]+\(", text[start+50:])
end = start + 50 + next_func.start() if next_func else len(text)
print(f"openCourseDetails spans from {text[:start].count('\n')+1} to {text[:end].count('\n')+1}")

modal_lines = []
for line_idx, line in enumerate(text[start:end].split("\n")):
    if "course-modal" in line or "modal" in line and "active" in line:
        modal_lines.append((line_idx + text[:start].count('\n') + 1, line))

for l, line in modal_lines:
    print(f"{l}: {line}")
