import json
from datetime import datetime

with open('user_saved_state.json', 'r', encoding='utf-8') as f:
    state = json.load(f)

print('=== ALL UPCOMING TASKS & EXAMS (from 2026-11-01 onwards) ===')
courses = state.get('courses', {})
events = []

for cid, c in courses.items():
    c_status = c.get('status')
    c_name = c.get('name')
    tasks = c.get('tasks', [])
    for t in tasks:
        due = t.get('dueDate')
        if not due:
            continue
        # Check if due is >= 2026-11-01
        due_date = due.split(' ')[0]
        if due_date >= '2026-11-01':
            events.append({
                'date': due,
                'courseId': cid,
                'courseName': c_name,
                'courseStatus': c_status,
                'title': t.get('title'),
                'type': t.get('type'),
                'status': t.get('status'),
                'completed': t.get('completed')
            })

events.sort(key=lambda x: x['date'])
for e in events:
    print(f"{e['date']} | [{e['courseStatus']}] {e['courseId']} ({e['courseName']}): {e['type']} - {e['title']} (status={e['status']}, done={e['completed']})")

print('\n=== CHECKING PAST EXAM SCHEDULE ===')
for pe in state.get('pastExamSchedule', []):
    d = pe.get('date', '')
    if d >= '2026-11-01':
        print(f"PastExam: {d} | {pe.get('course')} - {pe.get('title')}")

print('\n=== CHECKING CUSTOM CALENDAR EVENTS ===')
for ce in state.get('customCalendarEvents', []):
    d = ce.get('date', '')
    if d >= '2026-11-01':
        print(f"CustomEvent: {d} | {ce.get('title')}")
