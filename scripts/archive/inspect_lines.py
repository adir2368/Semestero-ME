import sys

file_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js"
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

start = 13200
end = 13350
for i in range(start, min(end, len(lines))):
    sys.stdout.reconfigure(encoding='utf-8')
    print(f"{i+1}: {lines[i]}", end="")
