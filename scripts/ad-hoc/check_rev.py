with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
for m in re.finditer(r'APP_CURRENT_REVISION\s*=\s*\{[^}]+\}', text):
    print(m.group(0))
