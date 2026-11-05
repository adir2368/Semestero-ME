with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
m = re.search(r'<div[^>]*id=["\']task-side-peek["\'][^>]*>.*?(?:</div>\s*</div>)', text, re.DOTALL)
if m:
    print(m.group(0)[:800])
