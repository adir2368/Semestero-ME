import os
import struct
import json

log_path = os.path.expandvars(r'%LOCALAPPDATA%\Google\Chrome\User Data\Default\Local Storage\leveldb\043506.log')

with open(log_path, 'rb') as f:
    raw_data = f.read()

BLOCK_SIZE = 32768
pos = 0
reassembled_records = []
current_record = bytearray()

while pos < len(raw_data):
    block_end = min(pos + BLOCK_SIZE, len(raw_data))
    block = raw_data[pos:block_end]
    bpos = 0
    
    while bpos + 7 <= len(block):
        crc, length, rtype = struct.unpack('<IHB', block[bpos:bpos+7])
        if rtype == 0 and length == 0:
            break
        
        payload_start = bpos + 7
        payload_end = payload_start + length
        if payload_end > len(block):
            break
        
        payload = block[payload_start:payload_end]
        
        if rtype == 1: # FULL
            reassembled_records.append(bytes(payload))
        elif rtype == 2: # FIRST
            current_record = bytearray(payload)
        elif rtype == 3: # MIDDLE
            current_record.extend(payload)
        elif rtype == 4: # LAST
            current_record.extend(payload)
            reassembled_records.append(bytes(current_record))
            current_record = bytearray()
            
        bpos = payload_end
        
    pos += BLOCK_SIZE

print(f"Reassembled {len(reassembled_records)} complete records.")

# Search for academic_skill_tree_save in reassembled records
found_state = None
for r in reassembled_records:
    if b'academic_skill_tree_save' in r:
        idx = r.find(b'{\x00"\x00c\x00h\x00a\x00r\x00a\x00c\x00t\x00e\x00r\x00C\x00l\x00a\x00s\x00s\x00')
        if idx != -1:
            json_bytes = r[idx:]
            # Decode UTF-16LE
            try:
                json_str = json_bytes.decode('utf-16-le')
                # Find the matching closing brace
                brace_count = 0
                end_pos = -1
                in_str = False
                escape = False
                for i, c in enumerate(json_str):
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
                                end_pos = i + 1
                                break
                if end_pos != -1:
                    clean_json = json_str[:end_pos]
                    parsed = json.loads(clean_json)
                    found_state = parsed
                    print("SUCCESS! Found valid state!")
                    break
            except Exception as e:
                print("Decode error:", e)

if found_state:
    out_file = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\user_saved_state.json"
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(found_state, f, ensure_ascii=False, indent=2)
    print("Exported user_saved_state.json successfully!")
    print(f"Summary: Level {found_state.get('level')}, Credits: {found_state.get('credits')}, Completed: {found_state.get('completedCourses')}, GPA: {found_state.get('gpa')}")
else:
    print("Could not parse valid state from records.")
