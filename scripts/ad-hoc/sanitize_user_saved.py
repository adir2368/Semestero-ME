import json

with open('user_saved_state.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

cleared = 0
courses = data.get('courses', {})
for ccode, cdata in courses.items():
    if cdata.get('status') == 'mastered':
        for t in cdata.get('tasks', []):
            due = t.get('dueDate', '')
            if due and ('2026-11' in due or '2026-12' in due or '2027' in due):
                print(f"Clearing future due date '{due}' from mastered course {ccode} task '{t.get('title')}'")
                t['dueDate'] = ""
                cleared += 1

with open('user_saved_state.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Cleared {cleared} ghost due dates in user_saved_state.json")
