import json, sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\google_calendars_snapshot.json', 'r', encoding='utf-8') as f:
    snap = json.load(f)

print(f"Snapshot has {len(snap)} keys")
# Let's check any tasks in snap
if isinstance(snap, dict):
    for k, v in list(snap.items())[:5]:
        print(k, type(v))
