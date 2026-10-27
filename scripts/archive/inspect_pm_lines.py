import sys

file_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\planner_module.js"
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

start = 50
end = 120
sys.stdout.reconfigure(encoding='utf-8')
for i in range(start, min(end, len(lines))):
    print(f"{i+1}: {lines[i]}", end="")
