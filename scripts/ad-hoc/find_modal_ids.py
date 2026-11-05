with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = re.findall(r'id=["\']([^"\']*(?:task|peek|modal)[^"\']*)["\']', text, re.IGNORECASE)
print(set(matches))
