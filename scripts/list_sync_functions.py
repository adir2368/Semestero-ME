import os, re

files = ['index.html', 'app.js', 'auth_sync.js', 'moodle_sync.js', 'timetable_generator.js', 'technion_academic_calendar.js', 'site_analytics.js']

for fname in files:
    if not os.path.exists(fname): continue
    with open(fname, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # find functions with sync in name
    funcs = re.findall(r'(?:function\s+([a-zA-Z0-9_]*sync[a-zA-Z0-9_]*)|([a-zA-Z0-9_]*sync[a-zA-Z0-9_]*)\s*[:=]\s*(?:async\s*)?function|\b([a-zA-Z0-9_]*sync[a-zA-Z0-9_]*)\s*\()', content, re.IGNORECASE)
    names = set()
    for tup in funcs:
        for item in tup:
            if item:
                names.add(item)
    print(f"\n{fname} has {len(names)} sync-related functions/calls:")
    for n in sorted(names):
        print(f"  - {n}")
