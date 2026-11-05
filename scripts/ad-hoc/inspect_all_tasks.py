import json

with open('user_saved_state.json', 'r', encoding='utf-8') as f:
    state = json.load(f)

print('=== INSPECTING ALL TASKS IN USER_SAVED_STATE.JSON ===')
courses = state.get('courses', {})
for cid, c in courses.items():
    c_status = c.get('status')
    c_name = c.get('name') or c.get('title')
    c_sem = c.get('semester')
    tasks = c.get('tasks', [])
    for t in tasks:
        due = t.get('dueDate', '')
        title = t.get('title', '')
        ttype = t.get('type', '')
        tstatus = t.get('status', '')
        tcompleted = t.get('completed', '')
        print(f'Course {cid} ({c_name}, Sem {c_sem}, status={c_status}): Task "{title}" (type={ttype}, id={t.get("id")}, due={due}, status={tstatus})')
