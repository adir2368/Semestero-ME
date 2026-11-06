import json
with open(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\package.json', 'r', encoding='utf-8') as f:
    pkg = json.load(f)
for k, v in pkg.get('scripts', {}).items():
    print(f"{k}: {v}")
