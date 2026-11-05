import os
import re

pattern = re.compile(r'["\'](0?11400?71|0?11400?75)["\']\s*:')
repo = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'

for root, dirs, files in os.walk(repo):
    if any(k in root for k in ['node_modules', '.git', 'dist', 'build', 'intermediates']):
        continue
    for f in files:
        if f.endswith('.js') or f.endswith('.json'):
            path = os.path.join(root, f)
            try:
                with open(path, 'r', encoding='utf-8') as fh:
                    content = fh.read()
                matches = list(pattern.finditer(content))
                if matches:
                    print(f'{path}: {len(matches)} matches')
                    for m in matches:
                        idx = m.start()
                        print('  ', content[idx:idx+120].replace('\n', ' '))
            except Exception as e:
                pass
