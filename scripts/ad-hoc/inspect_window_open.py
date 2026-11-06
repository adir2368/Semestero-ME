import re

with open(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js', 'r', encoding='utf-8') as f:
    text = f.read()

print("window.open occurrences:", len(re.findall(r'window\.open', text)))
for m in re.finditer(r'window\.open\([^)]+\)', text):
    print(m.group(0)[:100])
