import json, sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'
with open(f'{ws}\\user_saved_state.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print('Courses in user_saved_state.json degreePlan:')
plan = data.get('degreePlan', [])
for sem in plan:
    s_num = sem.get('semester')
    c_list = [f"{c.get('code')}:{c.get('name')}" for c in sem.get('courses', [])]
    print(f'Sem {s_num}: {c_list}')
