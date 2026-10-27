import re

with open(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

matches = re.findall(r'[a-zA-Z0-9_\-\.]+\.(?:js|css)\?v=[^\'\"`\s>]+', text)
print(sorted(set(matches)))
