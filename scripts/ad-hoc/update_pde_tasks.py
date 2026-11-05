import json

# 1. Update user_saved_state.json
with open('user_saved_state.json', 'r', encoding='utf-8') as f:
    saved_state = json.load(f)

course_104228 = saved_state.get('courses', {}).get('104228', {})
tasks = course_104228.get('tasks', [])

# Update or add 104228_h1
h1 = next((t for t in tasks if t.get('id') == '104228_h1'), None)
if h1:
    h1['title'] = 'תרגיל אלקטרוני 1 - סיווג מד״ח'
    h1['dueDate'] = '2026-11-09T23:59:00'
    h1['moodleUrl'] = 'https://moodle26.technion.ac.il/mod/scorm/view.php?id=95378'
    h1['pangeaUrl'] = 'https://idofangbentov.uk/Technion/PDE1/PDE1_000-104228-%D7%9E%D7%93%D7%97-%D7%9E'
    h1['status'] = 'in_progress'
    h1['completed'] = False
else:
    tasks.insert(0, {
        'id': '104228_h1',
        'xp': 50,
        'type': 'hw',
        'title': 'תרגיל אלקטרוני 1 - סיווג מד״ח',
        'status': 'in_progress',
        'dueDate': '2026-11-09T23:59:00',
        'moodleUrl': 'https://moodle26.technion.ac.il/mod/scorm/view.php?id=95378',
        'pangeaUrl': 'https://idofangbentov.uk/Technion/PDE1/PDE1_000-104228-%D7%9E%D7%93%D7%97-%D7%9E',
        'completed': False
    })

# Add 104228_h2 if not present
h2 = next((t for t in tasks if t.get('id') == '104228_h2'), None)
if not h2:
    idx_h1 = next(i for i, t in enumerate(tasks) if t.get('id') == '104228_h1')
    tasks.insert(idx_h1 + 1, {
        'id': '104228_h2',
        'xp': 50,
        'type': 'hw',
        'title': 'תרגיל אלקטרוני 2',
        'status': 'not_started',
        'dueDate': '2026-11-16T23:59:00',
        'moodleUrl': 'https://moodle26.technion.ac.il/course/view.php?id=643',
        'pangeaUrl': 'https://idofangbentov.uk/Technion/PDE1/PDE1_000-104228-%D7%9E%D7%93%D7%97-%D7%9E',
        'completed': False
    })

course_104228['tasks'] = tasks
saved_state['courses']['104228'] = course_104228

with open('user_saved_state.json', 'w', encoding='utf-8') as f:
    json.dump(saved_state, f, ensure_ascii=False, indent=2)

print("Updated user_saved_state.json successfully!")

# 2. Update preloaded_user_state.js
with open('preloaded_user_state.js', 'r', encoding='utf-8') as f:
    preloaded = f.read()

# Replace 104228_h1 in preloaded_user_state.js
target_h1_block = '''        {
          "id": "104228_h1",
          "xp": 50,
          "type": "hw",
          "title": "תרגיל בית 1: משוואות מסדר ראשון ומאפיינים",
          "status": "not_started",
          "dueDate": "",
          "completed": false
        },'''

new_h1_h2_block = '''        {
          "id": "104228_h1",
          "xp": 50,
          "type": "hw",
          "title": "תרגיל אלקטרוני 1 - סיווג מד״ח",
          "status": "in_progress",
          "dueDate": "2026-11-09T23:59:00",
          "moodleUrl": "https://moodle26.technion.ac.il/mod/scorm/view.php?id=95378",
          "pangeaUrl": "https://idofangbentov.uk/Technion/PDE1/PDE1_000-104228-%D7%9E%D7%93%D7%97-%D7%9E",
          "completed": false
        },
        {
          "id": "104228_h2",
          "xp": 50,
          "type": "hw",
          "title": "תרגיל אלקטרוני 2",
          "status": "not_started",
          "dueDate": "2026-11-16T23:59:00",
          "moodleUrl": "https://moodle26.technion.ac.il/course/view.php?id=643",
          "pangeaUrl": "https://idofangbentov.uk/Technion/PDE1/PDE1_000-104228-%D7%9E%D7%93%D7%97-%D7%9E",
          "completed": false
        },'''

if target_h1_block in preloaded:
    preloaded = preloaded.replace(target_h1_block, new_h1_h2_block)
    with open('preloaded_user_state.js', 'w', encoding='utf-8') as f:
        f.write(preloaded)
    print("Updated preloaded_user_state.js successfully!")
else:
    print("Notice: target_h1_block not matched in preloaded_user_state.js, checking alternate matches...")

print("All PDE task updates completed!")
