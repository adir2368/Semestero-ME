with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
m = re.search(r'<div[^>]*id=["\']task-side-peek["\'][^>]*>.*?(?:</div>\s*</div>)', text, re.DOTALL)
if m:
    safe = ''.join(c if ord(c) < 128 else f'[{ord(c)}]' for c in m.group(0)[:800])
    print(safe)
