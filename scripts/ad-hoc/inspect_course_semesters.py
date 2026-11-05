import json

with open('user_saved_state.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

for code, c in d.get('courses', {}).items():
    if isinstance(c, dict):
        print(f"{code}: semester={c.get('semester')}, status={c.get('status')}, name={c.get('name')}")
