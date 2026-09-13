import os
import json

log_path = os.path.expandvars(r'%LOCALAPPDATA%\Google\Chrome\User Data\Default\Local Storage\leveldb\043506.log')

with open(log_path, 'rb') as f:
    data = f.read()

idx = data.find(b'academic_skill_tree_save')
print("Found key at:", idx)

# Find start of UTF-16 JSON '{'
start_idx = data.find(b'{\x00"\x00c\x00h\x00a\x00r\x00a\x00c\x00t\x00e\x00r\x00C\x00l\x00a\x00s\x00s\x00', idx)
print("Start of JSON at:", start_idx)

# Let's decode UTF-16LE incrementally until valid JSON or parse by matching braces
chunk = data[start_idx:]

# Find the end of JSON by decoding utf-16-le characters
text_chars = []
brace_count = 0
in_str = False
escape = False
matched_json_str = None

for i in range(0, len(chunk) - 1, 2):
    pair = chunk[i:i+2]
    try:
        c = pair.decode('utf-16-le')
    except Exception:
        break
    
    text_chars.append(c)
    
    if escape:
        escape = False
        continue
    if c == '\\':
        escape = True
        continue
    if c == '"':
        in_str = not in_str
        continue
    if not in_str:
        if c == '{':
            brace_count += 1
        elif c == '}':
            brace_count -= 1
            if brace_count == 0:
                matched_json_str = "".join(text_chars)
                break

if matched_json_str:
    parsed = json.loads(matched_json_str)
    print("SUCCESSFULLY PARSED USER GAME STATE!")
    print(f"User Degree: {parsed.get('characterClass')}")
    print(f"Level: {parsed.get('level')}, XP: {parsed.get('xp')}")
    print(f"Credits: {parsed.get('credits')}")
    print(f"Completed courses: {parsed.get('completedCourses')}")
    print(f"GPA: {parsed.get('gpa')}")
    print(f"Total courses tracked: {len(parsed.get('courses', {}))}")
    
    # Save to user_saved_state.json in project dir
    out_file = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\user_saved_state.json"
    with open(out_file, "w", encoding="utf-8") as out:
        json.dump(parsed, out, ensure_ascii=False, indent=2)
    print("Saved clean user state to:", out_file)
else:
    print("Could not balance braces in UTF-16LE stream.")
