import re

ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'

with open(f'{ws}\\planner_catalog.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Look at SUGGESTED_MANDATORY_SYLLABUS
m = re.search(r'SUGGESTED_MANDATORY_SYLLABUS\s*=\s*\{([^;]+)\};', text)
if m:
    syllabus = m.group(1)
    # find semester 4
    sem4_m = re.search(r'4:\s*\[([^\]]+)\]', syllabus)
    if sem4_m:
        print("Semester 4 in SUGGESTED_MANDATORY_SYLLABUS:")
        print(sem4_m.group(1))

# Check DEFAULT_CURRICULUM_DATA or similar in app.js
with open(f'{ws}\\app.js', 'r', encoding='utf-8') as f:
    app_text = f.read()

# Find all courses with semester: 4
sem4_courses = re.findall(r'(\d{6,8})[\'\"]?:\s*\{[^\}]*?semester:\s*4[^\}]*?name:\s*[\'\"]([^\'\"]+)', app_text)
print("\nSemester 4 courses in app.js:")
for c, n in sem4_courses:
    print(c, n)
