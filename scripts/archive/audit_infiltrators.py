import re, json

with open(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\planner_catalog.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's inspect where 03240269, 03940800, 03940808 are in planner_catalog.js
lines = text.splitlines()
for i, line in enumerate(lines, 1):
    for code in ['03240269', '03940800', '03940808']:
        if code in line:
            print(f"planner_catalog.js:{i}: {line.strip()}")
