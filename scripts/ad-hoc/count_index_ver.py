with open(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = list(re.finditer(r'2\.10\.2', text))
print(f"Found {len(matches)} occurrences of 2.10.2 in index.html")
for m in matches[:10]:
    start = max(0, m.start() - 30)
    end = min(len(text), m.end() + 30)
    print(text[start:end].replace('\n', ' '))
