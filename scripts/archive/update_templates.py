import os
import json

ROOT = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree"

# 1. Update curriculum_template.js
curr_path = os.path.join(ROOT, "curriculum_template.js")
with open(curr_path, "r", encoding="utf-8") as f:
    text = f.read()

# Replace in 034053
old_53 = '''        tasks: [
            { id: "034053_h1", title: "תרגיל בית 1: כפיפת קורות מאמצים משולבים", type: "hw", xp: 60, completed: false },
            { id: "034053_ex", title: "מבחן סוף", type: "exam", xp: 550, completed: false }
        ]'''
new_53 = '''        tasks: [
            { id: "034053_h1", title: "תרגיל בית 1: כפיפת קורות ומאמצים משולבים (הגשת PDF בכתב יד)", type: "hw", xp: 60, completed: false },
            { id: "034053_ex", title: "מבחן סוף", type: "exam", xp: 550, completed: false }
        ]'''

# Replace in 034056
old_56 = '''        tasks: [
            { id: "034056_h1", title: "תרגיל בית 1: פתרון משוואות לא ליניאריות בפייתון", type: "hw", xp: 50, completed: false },
            { id: "034056_p1", title: "פרוייקט חישובי: אנליזה של מערכת מכנית מורכבת", type: "project", xp: 200, completed: false },
            { id: "034056_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]'''
new_56 = '''        tasks: [
            { id: "034056_matlab_bonus", title: "לומדת MATLAB (בונוס 2 נקודות לציון)", type: "assignment", xp: 75, completed: false },
            { id: "034056_h1", title: "תרגיל בית 1: פתרון משוואות לא ליניאריות בפייתון", type: "hw", xp: 50, completed: false },
            { id: "034056_p1", title: "פרוייקט חישובי: אנליזה של מערכת מכנית מורכבת", type: "project", xp: 200, completed: false },
            { id: "034056_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]'''

# Replace in 034035
old_35 = '''        tasks: [
            { id: "034035_h1", title: "תרגיל בית 1: החוק הראשון של התרמודינמיקה", type: "hw", xp: 50, completed: false },
            { id: "034035_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]'''
new_35 = '''        tasks: [
            { id: "034035_midterm", title: "בוחן אמצע מגן (20% מגן)", type: "exam", xp: 150, completed: false },
            { id: "034035_h1", title: "תרגיל בית 1: החוק הראשון של התרמודינמיקה", type: "hw", xp: 50, completed: false },
            { id: "034035_ex", title: "מבחן סוף", type: "exam", xp: 500, completed: false }
        ]'''

# Handle both CRLF and LF
for old, new in [(old_53, new_53), (old_56, new_56), (old_35, new_35)]:
    if old in text:
        text = text.replace(old, new)
    elif old.replace("\n", "\r\n") in text:
        text = text.replace(old.replace("\n", "\r\n"), new.replace("\n", "\r\n"))

with open(curr_path, "w", encoding="utf-8") as f:
    f.write(text)
print("curriculum_template.js updated!")

# 2. Update preloaded_user_state.js
user_path = os.path.join(ROOT, "preloaded_user_state.js")
with open(user_path, "r", encoding="utf-8") as f:
    u_text = f.read()

prefix = 'const PRELOADED_USER_STATE = '
p_start = u_text.find(prefix) + len(prefix)
marker = ';\n\n    window.PRELOADED_USER_STATE = PRELOADED_USER_STATE;'
p_end = u_text.rfind(marker)
is_crlf = False
if p_end == -1:
    marker = ';\r\n\r\n    window.PRELOADED_USER_STATE = PRELOADED_USER_STATE;'
    p_end = u_text.rfind(marker)
    is_crlf = True

json_str = u_text[p_start:p_end].strip()
data = json.loads(json_str)

# Update courses
courses = data.get("courses", {})

# 034035 (Thermodynamics 1)
if "034035" in courses:
    t_list = courses["034035"].get("tasks", [])
    if not any(t["id"] == "034035_midterm" for t in t_list):
        t_list.insert(0, {
            "id": "034035_midterm",
            "xp": 150,
            "type": "exam",
            "title": "בוחן אמצע מגן (20%)",
            "status": "not_started",
            "dueDate": "2026-12-16",
            "completed": False
        })
    courses["034035"]["tasks"] = t_list

# 034056 (Intro to Scientific & Eng Computation)
if "034056" in courses:
    t_list = courses["034056"].get("tasks", [])
    if not any(t["id"] == "034056_matlab_bonus" for t in t_list):
        t_list.insert(0, {
            "id": "034056_matlab_bonus",
            "xp": 75,
            "type": "assignment",
            "title": "לומדת MATLAB (בונוס 2 נק׳ לציון הסופי)",
            "status": "done",
            "dueDate": "2026-11-19",
            "completed": True
        })
    courses["034056"]["tasks"] = t_list

# 034053 (Mechanics of Solids 2M)
if "034053" in courses:
    for t in courses["034053"].get("tasks", []):
        if t["id"] == "034053_h1":
            t["title"] = "תרגיל בית 1: כפיפת קורות ומאמצים משולבים (הגשת PDF בכתב יד)"

# Re-serialize JSON formatted nicely
new_json_str = json.dumps(data, indent=2, ensure_ascii=False)
if is_crlf:
    new_json_str = new_json_str.replace("\n", "\r\n")

new_u_text = u_text[:p_start] + new_json_str + u_text[p_end:]

with open(user_path, "w", encoding="utf-8") as f:
    f.write(new_u_text)
print("preloaded_user_state.js updated!")
