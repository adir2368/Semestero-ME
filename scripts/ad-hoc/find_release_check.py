import os, re

for root, dirs, files in os.walk('.'):
    if '.git' in root or 'node_modules' in root:
        continue
    for f in files:
        if f.endswith('.js') or f.endswith('.html'):
            p = os.path.join(root, f)
            try:
                with open(p, 'r', encoding='utf-8') as fl:
                    content = fl.read()
                    if 'api.github.com' in content or 'release' in content.lower():
                        for m in re.finditer(r'(https://api\.github\.com[^\s\'"]+)', content):
                            print(f"{p}: {m.group(1)}")
            except:
                pass
