with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = re.findall(r'(?:checkForUpdate|updateApp|downloadUpdate|versionCheck|newVersion|showUpdateModal)[a-zA-Z0-9_]*', text)
print(set(matches))
