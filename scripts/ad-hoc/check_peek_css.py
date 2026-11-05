with open('style.css', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = re.finditer(r'(\.task-side-peek[^{]*\{[^}]+\}|\.peek-content[^{]*\{[^}]+\}|\.peek-header[^{]*\{[^}]+\}|\.peek-close-btn[^{]*\{[^}]+\})', text)
for m in matches:
    print(m.group(0))
    print('---')
