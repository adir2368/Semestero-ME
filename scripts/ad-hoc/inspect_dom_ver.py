with open(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
for term in ['display-system-version', 'footer-version-badge']:
    for m in re.finditer(re.escape(term), text):
        print(text[m.start()-50:m.end()+100])
        print('---')
