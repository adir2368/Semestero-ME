import json, re, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'

def check_file(filepath):
    print(f"=== {filepath} ===")
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    courses = data.get('courses', {})
    for code, info in sorted(courses.items()):
        if str(info.get('semester')) == '4':
            print(f"  {code}: {info.get('name')} | credits: {info.get('credits')} | sem: {info.get('semester')}")

check_file(f"{ws}\\user_saved_state.json")
check_file(f"{ws}\\backups\\adir_moshe_personal_state_v1.4.4.json")
