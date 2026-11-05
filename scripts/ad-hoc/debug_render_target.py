import sys

sys.stdout.reconfigure(encoding="utf-8")

with open(r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js", "r", encoding="utf-8") as f:
    text = f.read()

idx = text.find('const cSem = course.semester || 1;')
print(repr(text[idx:idx+600]))
