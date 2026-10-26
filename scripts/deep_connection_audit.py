import os
import re

root_files = [
    'index.html',
    'app.js',
    'auth_sync.js',
    'moodle_sync.js',
    'timetable_generator.js',
    'technion_academic_calendar.js',
    'site_analytics.js',
    'interactive_tour.js',
    'widgets.html'
]

keywords = [
    r'סנכר[ןו]',
    r'מחובר',
    r'חיבור',
    r'ענן',
    r'גיבוי',
    r'Google',
    r'Drive',
    r'Calendar',
    r'Moodle',
    r'CheeseFork',
    r'Supabase',
    r'Sync',
    r'Connected',
    r'Login',
    r'Auth',
    r'Webhook',
    r'Gist',
    r'Grades',
    r'ציונים',
    r'טלפון',
    r'SMS',
    r'WhatsApp',
    r'Panopto',
    r'ASAT',
    r'Technion\+\+'
]

pattern = re.compile('|'.join(keywords), re.IGNORECASE)

print("Starting deep audit of all connection touchpoints...")

findings = {}
for fname in root_files:
    if not os.path.exists(fname):
        continue
    findings[fname] = []
    with open(fname, 'r', encoding='utf-8', errors='ignore') as f:
        for idx, line in enumerate(f):
            if pattern.search(line):
                findings[fname].append((idx + 1, line.strip()))

for fname, items in findings.items():
    print(f"\n======================================")
    print(f"File: {fname} (total matches: {len(items)})")
    print(f"======================================")
    for line_no, content in items[:50]:  # preview first 50
        print(f"L{line_no:5d}: {content[:130]}")
