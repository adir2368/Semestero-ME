import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

core_files = [
    os.path.join(ROOT, 'auth_sync.js'),
    os.path.join(ROOT, 'app.js'),
    os.path.join(ROOT, 'index.html'),
    os.path.join(ROOT, 'preloaded_user_state.js'),
    os.path.join(ROOT, 'user_saved_state.json'),
    os.path.join(ROOT, 'widgets.html'),
]

keywords = [
    'adir', 'moshe', 'adir2368', 'isadir', 'cheesefork', 'gist', 'webcal',
    'drive.google', 'calendar.google', '43774', 'd4bh8', '71ec3', 'benchy'
]

output_lines = []

for file_path in core_files:
    if not os.path.exists(file_path):
        continue
    rel = os.path.relpath(file_path, ROOT)
    output_lines.append(f"\n==========================================")
    output_lines.append(f"FILE: {rel}")
    output_lines.append(f"==========================================")
    
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        for idx, line in enumerate(f, 1):
            lower = line.lower()
            matched_kw = [kw for kw in keywords if kw in lower]
            if matched_kw:
                output_lines.append(f"L{idx:5d} [{','.join(matched_kw)}]: {line.strip()}")

report_path = os.path.join(ROOT, 'personal_data_audit_report.txt')
with open(report_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(output_lines))

print(f"Report written to personal_data_audit_report.txt ({len(output_lines)} lines)")
