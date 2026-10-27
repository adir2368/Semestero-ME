import sys

file_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js"
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

start = 12134
end = 13757

potential_risks = []
for i in range(start, end):
    line = lines[i]
    for pattern in [".filter(", ".map(", ".find(", ".forEach(", ".replace(", ".includes(", ".toUpperCase(", "document.getElementById"]:
        if pattern in line:
            potential_risks.append((i+1, pattern, line.strip()))

print(f"Total potential risks: {len(potential_risks)}")
for l, p, line in potential_risks:
    print(f"{l} [{p}]: {line[:120]}")
