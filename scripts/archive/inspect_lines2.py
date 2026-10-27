import sys

file_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js"
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

start = 13350
end = 13600
for i in range(start, min(end, len(lines))):
    line = lines[i]
    if "modal" in line.lower() or "active" in line.lower() or "display" in line.lower() or "function " in line:
        print(f"{i+1}: {line.strip()}")
