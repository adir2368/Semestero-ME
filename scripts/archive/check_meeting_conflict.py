import sys

file_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\planner_catalog.js"
with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

pos = text.find("checkMeetingConflict")
if pos != -1:
    sys.stdout.reconfigure(encoding='utf-8')
    print(text[pos:pos+1500])
