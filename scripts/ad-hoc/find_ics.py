import os

for root, dirs, files in os.walk(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'):
    for f in files:
        if f.endswith('.ics') or 'moodle' in f.lower():
            print(os.path.join(root, f))
