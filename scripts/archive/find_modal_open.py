import re, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'
with open(f'{ws}\\app.js', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('function openCourseDetails')
end_idx = text.find('function ', idx + 50)
details_body = text[idx:end_idx]

for m in re.finditer(r'(?:classList\.add|display\s*=\s*[\'"`]flex[\'"`]|\.showModal)', details_body):
    pos = m.start()
    print(details_body[max(0, pos-40):min(len(details_body), pos+100)].replace('\n', ' '))
