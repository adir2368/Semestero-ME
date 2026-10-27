import re, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'
with open(f'{ws}\\app.js', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('function renderFlowchartTree')
idx2 = text.find('openCourseModal', idx)
print('openCourseModal in renderFlowchartTree at:', idx2)

end_idx = text.find('function ', idx + 30)
tree_body = text[idx:end_idx]

for m in re.finditer(r'(?:click|modal|cursor|select|openCourse|handleCourse)', tree_body, re.IGNORECASE):
    pos = m.start()
    print(tree_body[max(0, pos-40):min(len(tree_body), pos+100)].replace('\n', ' '))
