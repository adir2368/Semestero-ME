import os
import re
import json

db_dir = os.path.expandvars(r'%LOCALAPPDATA%\Google\Chrome\User Data\Default\Local Storage\leveldb')

all_matches = []

for fname in os.listdir(db_dir):
    fpath = os.path.join(db_dir, fname)
    if not os.path.isfile(fpath):
        continue
    try:
        with open(fpath, 'rb') as f:
            data = f.read()
            # Search for academic_skill_tree_save
            idx = 0
            while True:
                idx = data.find(b'academic_skill_tree_save', idx)
                if idx == -1:
                    break
                
                # Check around this index
                sub = data[idx:idx+200000]
                # Look for JSON starting with { and containing "courses"
                json_start = sub.find(b'{"courses"')
                if json_start == -1:
                    json_start = sub.find(b'{"xp"')
                if json_start == -1:
                    json_start = sub.find(b'{"level"')

                if json_start != -1:
                    # Let's see if it's UTF-8 or UTF-16
                    candidate = sub[json_start:]
                    # Try to parse valid JSON by scanning brace balancing
                    brace_count = 0
                    in_string = False
                    escape = False
                    end_idx = -1
                    for i, b in enumerate(candidate):
                        char = chr(b) if b < 128 else '?'
                        if escape:
                            escape = False
                            continue
                        if char == '\\':
                            escape = True
                            continue
                        if char == '"':
                            in_string = not in_string
                            continue
                        if not in_string:
                            if char == '{':
                                brace_count += 1
                            elif char == '}':
                                brace_count -= 1
                                if brace_count == 0:
                                    end_idx = i + 1
                                    break
                    
                    if end_idx != -1:
                        raw_json_bytes = candidate[:end_idx]
                        try:
                            parsed = json.loads(raw_json_bytes.decode('utf-8'))
                            all_matches.append((len(raw_json_bytes), parsed, fname))
                        except Exception as e:
                            try:
                                parsed = json.loads(raw_json_bytes.decode('utf-16-le'))
                                all_matches.append((len(raw_json_bytes), parsed, fname))
                            except Exception as e2:
                                pass
                
                # Also check UTF-16 encoded JSON
                idx += 1
    except Exception as err:
        print("Error reading", fname, err)

# Sort matches by size (largest = most complete state)
all_matches.sort(key=lambda x: x[0], reverse=True)

if all_matches:
    best_len, best_parsed, best_file = all_matches[0]
    print(f"Successfully extracted save state from {best_file} (length: {best_len})")
    print(f"Credits: {best_parsed.get('credits')}, Level: {best_parsed.get('level')}, Completed: {best_parsed.get('completedCourses')}, GPA: {best_parsed.get('gpa')}")
    
    # Save to extracted_user_save.json
    out_file = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\extracted_user_save.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(best_parsed, f, ensure_ascii=False, indent=2)
    print("Saved to", out_file)
else:
    print("No valid JSON match found in leveldb files!")
