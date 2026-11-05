import os, re

exclude = {'.git', 'node_modules', 'android', 'dist', '.gradle', 'build'}
for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in exclude]
    for f in files:
        if f.endswith('.js') or f.endswith('.html'):
            p = os.path.join(root, f)
            try:
                with open(p, 'r', encoding='utf-8') as fl:
                    content = fl.read()
                    if 'api.github.com' in content:
                        for m in re.finditer(r'(https://api\.github\.com[^\s\'"]+)', content):
                            print(f"{p}: {m.group(1)}")
            except:
                pass
