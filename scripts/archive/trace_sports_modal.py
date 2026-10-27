import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'
with open(f'{ws}\\app.js', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('function openCourseDetails')
end_idx = text.find('function deleteCourse', idx)
body = text[idx:end_idx]

import re
matches = re.findall(r'[^\n]+(?:sport|0394|moodle|syllabus|cfUrl)[^\n]+', body, re.IGNORECASE)
for m in matches[:20]:
    print(m.strip()[:140])
