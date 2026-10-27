import sys, re

file_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js"
with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

# find end of openCourseDetails
match = re.search(r"function openCourseDetails\(", text)
if match:
    start_pos = match.start()
    start_line = text[:start_pos].count("\n") + 1
    print(f"openCourseDetails starts at line {start_line}")
    
    # Let's search for modal.classList.add or course-modal after start_pos
    sub = text[start_pos:start_pos+60000]
    for m in re.finditer(r"course-modal", sub):
        pos = start_pos + m.start()
        line = text[:pos].count("\n") + 1
        print(f"course-modal at line {line}: {text[pos-30:pos+70]}")
    
    for m in re.finditer(r"classList\.add\([\'\"]active[\'\"]\)", sub):
        pos = start_pos + m.start()
        line = text[:pos].count("\n") + 1
        print(f"classList.add active at line {line}: {text[pos-30:pos+70]}")
