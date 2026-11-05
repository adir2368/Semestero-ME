with open('curriculum_template.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = re.findall(r'["\'](114071|114075|01140071|01140075)["\']:\s*\{[^}]+\}', text)
for m in matches:
    print(m)

# Also check 125013
m2 = re.search(r'["\']125013["\']:\s*\{[^}]+\}', text)
if m2:
    print('125013:', m2.group(0))
