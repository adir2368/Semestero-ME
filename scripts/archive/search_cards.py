import re, os

base_dir = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree"
pattern = re.compile(r'(נק"ז|נק״ז)')
for fn in ['app.js', 'planner_module.js', 'planner_catalog.js']:
    fpath = os.path.join(base_dir, fn)
    with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
        for idx, line in enumerate(f, 1):
            if pattern.search(line) and ('•' in line or 'card' in line or 'node' in line or 'נעול' in line):
                print(f"{fn}:{idx}: {line.strip()[:140]}")
