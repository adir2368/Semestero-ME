import json, sys

sys.stdout.reconfigure(encoding='utf-8')

# Run build_drive_map logic and get dictionary
import os, urllib.parse

drive_dir = os.path.join(r"C:\Users\user\OneDrive - Technion", "Mechanichal Info TSA's files - Mechanical Engineering Drive", "General Drive")

course_map = {}
if os.path.exists(drive_dir):
    for sem in os.listdir(drive_dir):
        sem_path = os.path.join(drive_dir, sem)
        if not os.path.isdir(sem_path):
            continue
        for course_folder in os.listdir(sem_path):
            full_path = os.path.join(sem_path, course_folder)
            if not os.path.isdir(full_path):
                continue
            import re
            m = re.search(r'(\d{5,8})', course_folder)
            if not m:
                continue
            code = m.group(1)
            clean_code = code.lstrip('0')
            
            subdirs = [s for s in os.listdir(full_path) if os.path.isdir(os.path.join(full_path, s))]
            ref_sub = next((s for s in subdirs if 'רפרנס' in s or 'פתרונות' in s or 'שב' in s), '')
            
            rel_path = f"General Drive/{sem}/{course_folder}"
            if ref_sub:
                rel_ref = f"{rel_path}/{ref_sub}"
            else:
                rel_ref = rel_path
                
            sp_base = "/personal/mech_info_asat_technion_ac_il/Documents/Mechanical Engineering Drive"
            sp_web_id = f"{sp_base}/{rel_ref}"
            web_url = f"https://technionmail-my.sharepoint.com/personal/mech_info_asat_technion_ac_il/_layouts/15/onedrive.aspx?id={urllib.parse.quote(sp_web_id)}"
            
            course_map[code] = web_url
            course_map[clean_code] = web_url

print(f"Exported {len(course_map)} course drive entries")

with open(r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\scripts\ad-hoc\drive_map_export.json", "w", encoding="utf-8") as f:
    json.dump(course_map, f, indent=2, ensure_ascii=False)
