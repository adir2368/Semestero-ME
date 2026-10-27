import json, re, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'
with open(f'{ws}\\preloaded_user_state.js', 'r', encoding='utf-8') as f:
    text = f.read()

m = re.search(r'const\s+PRELOADED_USER_STATE\s*=\s*(\{.*?\n\s*\});\n', text, re.DOTALL)
if m:
    data = json.loads(m.group(1))
    plan = data.get('degreePlan', [])
    for sem in plan:
        if sem.get('semester') in [4, 5]:
            print(f"Sem {sem.get('semester')}:", [c.get('code') + ' ' + c.get('name') for c in sem.get('courses', [])])
