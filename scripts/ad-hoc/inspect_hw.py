import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\google_calendars_snapshot.json', 'r', encoding='utf-8') as f:
    snap = json.load(f)

for hw in snap.get('homework', []):
    print(hw.get('courseCode'), hw.get('title'), hw.get('moodleUrl', ''))
