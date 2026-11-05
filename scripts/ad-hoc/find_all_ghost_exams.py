import json

def check_file(fname):
    print("=== Checking", fname, "===")
    with open(fname, 'r', encoding='utf-8') as f:
        data = json.load(f)
    courses = data.get('courses', {})
    for ccode, cdata in courses.items():
        if cdata.get('status') == 'mastered':
            tasks = cdata.get('tasks', [])
            for t in tasks:
                due = t.get('dueDate', '')
                if due and ('2026-11' in due or '2026-12' in due or '2027' in due):
                    print(f"Mastered Course {ccode} ({cdata.get('name')}): Task '{t.get('title')}' (id: {t.get('id')}) has future dueDate: '{due}'")

check_file('user_saved_state.json')
