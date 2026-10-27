import re, sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'

with open(f'{ws}\\app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if any(k in line for k in ['03940805', '03240033']):
        print(f"Line {i+1}: {line.strip()[:140]}")
