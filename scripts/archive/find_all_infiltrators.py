import json
import re
import os

ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'

print("--- 1. Checking preloaded_user_state.js ---")
with open(os.path.join(ws, 'preloaded_user_state.js'), 'r', encoding='utf-8') as f:
    content = f.read()

# find courses object
courses_match = re.search(r'courses:\s*(\{.*?\n\s*\})', content, re.DOTALL)
if courses_match:
    lines = courses_match.group(1).splitlines()
    for l in lines:
        if ':' in l and ('semester' in l or 'grade' in l or 'name' in l or '03' in l or '10' in l or '11' in l):
            print(l.strip()[:100])

print("\n--- 2. Checking user_saved_state.json ---")
with open(os.path.join(ws, 'user_saved_state.json'), 'r', encoding='utf-8') as f:
    state = json.load(f)
    print("Keys in user_saved_state.json:", list(state.keys()))
    courses = state.get('courses', {})
    print(f"Total courses: {len(courses)}")
    for code, c in sorted(courses.items()):
        print(f"{code}: {c.get('name')} | sem: {c.get('semester')} | completed: {c.get('completed')} | grade: {c.get('grade')}")

print("\n--- 3. Checking all occurrences of sports (0394) and malag (0324) across the codebase ---")
for root, dirs, files in os.walk(ws):
    if 'node_modules' in root or '.git' in root or 'dist' in root:
        continue
    for file in files:
        if file.endswith(('.js', '.json', '.html')):
            fpath = os.path.join(root, file)
            with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
                txt = f.read()
                matches = re.findall(r'(0394\d{4}|0324\d{4})', txt)
                if matches:
                    unique_matches = set(matches)
                    print(f"File {file}: found codes {unique_matches}")
