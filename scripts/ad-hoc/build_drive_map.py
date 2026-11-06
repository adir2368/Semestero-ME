import os, sys, json, urllib.parse
sys.stdout.reconfigure(encoding='utf-8')

drive_dir = os.path.join(r"C:\Users\user\OneDrive - Technion", "Mechanichal Info TSA's files - Mechanical Engineering Drive", "General Drive")

course_drive_map = {}

sem_dirs = [d for d in os.listdir(drive_dir) if os.path.isdir(os.path.join(drive_dir, d))]

for sem in sem_dirs:
    sem_path = os.path.join(drive_dir, sem)
    for course_folder in os.listdir(sem_path):
        full_course_path = os.path.join(sem_path, course_folder)
        if not os.path.isdir(full_course_path):
            continue
        
        # extract course code (6 or 5 or 8 digits)
        import re
        m = re.search(r'(\d{5,8})', course_folder)
        if not m:
            continue
        code = m.group(1)
        clean_code = code.lstrip('0')
        
        # find references subfolder
        subdirs = [s for s in os.listdir(full_course_path) if os.path.isdir(os.path.join(full_course_path, s))]
        ref_sub = next((s for s in subdirs if 'רפרנס' in s or 'פתרונות' in s or 'שב' in s), '')
        
        relative_path = f"General Drive/{sem}/{course_folder}"
        if ref_sub:
            relative_ref_path = f"General Drive/{sem}/{course_folder}/{ref_sub}"
        else:
            relative_ref_path = relative_path
            
        sp_base = "/personal/mech_info_asat_technion_ac_il/Documents/Mechanical Engineering Drive"
        sp_web_id = f"{sp_base}/{relative_ref_path}"
        web_url = f"https://technionmail-my.sharepoint.com/personal/mech_info_asat_technion_ac_il/_layouts/15/onedrive.aspx?id={urllib.parse.quote(sp_web_id)}"
        
        entry = {
            "code": code,
            "cleanCode": clean_code,
            "semester": sem,
            "folderName": course_folder,
            "refSubfolder": ref_sub,
            "relativeRefPath": relative_ref_path,
            "webUrl": web_url,
            "localPath": os.path.join(drive_dir, sem, course_folder, ref_sub if ref_sub else '')
        }
        course_drive_map[code] = entry
        course_drive_map[clean_code] = entry

print(f"Generated drive map for {len(course_drive_map)} keys:")
for c in ['104228', '034035', '034053', '034056', '034010', '114052']:
    if c in course_drive_map:
        print(f"Code {c}: {course_drive_map[c]['folderName']} -> ref: {course_drive_map[c]['refSubfolder']}")
        print(f"  URL: {course_drive_map[c]['webUrl'][:120]}...")
