import json
import sys

with open('user_saved_state.json', 'r', encoding='utf-8') as f:
    d = json.load(f)

print('Root keys:', list(d.keys()))
courses = d.get('courses')
if isinstance(courses, list):
    for c in courses:
        for t in c.get('tasks', []):
            if 'moodleUrl' in t or 'moodleEventId' in t:
                print(f"{c.get('code')}: {t.get('title')} -> moodleUrl: {t.get('moodleUrl')}, eventId: {t.get('moodleEventId')}")
elif isinstance(courses, dict):
    for code, c in courses.items():
        if isinstance(c, dict):
            for t in c.get('tasks', []):
                if 'moodleUrl' in t or 'moodleEventId' in t:
                    print(f"{code}: {t.get('title')} -> moodleUrl: {t.get('moodleUrl')}, eventId: {t.get('moodleEventId')}")
