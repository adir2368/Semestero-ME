import json
import sys

sys.stdout.reconfigure(encoding="utf-8")

with open(r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\user_saved_state.json", "r", encoding="utf-8") as f:
    state = json.load(f)

for k, v in state.get("courses", {}).items():
    for t in v.get("tasks", []):
        if t.get("source") == "moodle" or t.get("moodleEventId") or (t.get("id") and "moodle" in t.get("id")) or t.get("moodleUrl"):
            print(f"Course {k}: ID={t.get('id')} Title={t.get('title')} moodleUrl={t.get('moodleUrl')} moodleEventId={t.get('moodleEventId')}")
