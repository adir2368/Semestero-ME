import os

exclude = {'.git', 'node_modules', 'android', 'dist', '.gradle', 'build'}
for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in exclude]
    for f in files:
        p = os.path.join(root, f)
        try:
            with open(p, 'r', encoding='utf-8') as fl:
                content = fl.read()
                if '2026-11-15' in content or '11/15/2026' in content or '15/11/2026' in content:
                    print(f"{p}: match found!")
        except:
            pass
