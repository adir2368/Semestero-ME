import json, re, sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'

with open(f'{ws}\\preloaded_user_state.js', 'r', encoding='utf-8') as f:
    text = f.read()

m = re.search(r'const\s+PRELOADED_USER_STATE\s*=\s*(\{.*?\n\s*\});\n', text, re.DOTALL)
if m:
    data = json.loads(m.group(1))
    print("=== PRELOADED_USER_STATE Courses by Semester ===")
    courses = data.get('courses', {})
    by_sem = {}
    for code, info in courses.items():
        sem = info.get('semester', 'unassigned')
        by_sem.setdefault(sem, []).append((code, info.get('name'), info.get('grade'), info.get('type')))
    
    for sem in sorted(by_sem.keys(), key=lambda x: str(x)):
        print(f"\n--- Semester {sem} ({len(by_sem[sem])} courses) ---")
        for c in by_sem[sem]:
            print(f"  {c[0]}: {c[1]} | grade: {c[2]} | type: {c[3]}")

    plan = data.get('degreePlan', [])
    print(f"\n=== PRELOADED degreePlan semesters: {len(plan)} ===")
    for s in plan:
        sem_num = s.get('semester')
        cs = [f"{x.get('code')}:{x.get('name')}" for x in s.get('courses', [])]
        print(f"  Sem {sem_num}: {cs}")
else:
    print("Could not match PRELOADED_USER_STATE regex")
