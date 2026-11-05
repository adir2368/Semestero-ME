with open(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\tests\verify_system_health.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = [m.start() for m in re.finditer(r'version', text, re.IGNORECASE)]
for m in matches:
    print(text[m-30:m+100])
    print('---')
