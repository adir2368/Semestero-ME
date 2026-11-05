with open('preloaded_user_state.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = re.findall(r'(\{[^}]*?(?:125013|01250013)[^}]*?\})', text)
for m in matches:
    print('Match in preloaded_user_state:', m)
