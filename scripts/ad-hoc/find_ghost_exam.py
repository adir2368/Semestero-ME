import os, re

for fname in ['app.js', 'preloaded_user_state.js', 'google_calendars_snapshot.json']:
    if os.path.exists(fname):
        with open(fname, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        for i, line in enumerate(lines):
            if '2026-11-15' in line or ('104043' in line and 'exam' in line):
                print(f"{fname}:{i+1}: {line.strip()[:100]}")
