import json, re, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'

with open(f'{ws}\\preloaded_user_state.js', 'r', encoding='utf-8') as f:
    text = f.read()
m = re.search(r'"114032":\s*\{[^}]*?"semester":\s*(\d+)', text)
print('preloaded_user_state 114032 semester:', m.group(1) if m else 'none')

with open(f'{ws}\\user_saved_state.json', 'r', encoding='utf-8') as f:
    st = json.load(f)
print('user_saved_state 114032 semester:', st['courses']['114032']['semester'])

with open(f'{ws}\\app.js', 'r', encoding='utf-8') as f:
    app_text = f.read()

m_col = re.search(r'// Semester 5[^\n]+\n[^\n]*"114032":\s*(\d+)', app_text)
print('app.js Sem 5 col mapping for 114032:', m_col.group(1) if m_col else 'none')

# Check Sem 4 in app.js
m_sem4 = re.search(r'// Semester 4[^\n]+\n([^\n]+)', app_text)
print('app.js Sem 4 line:', m_sem4.group(1) if m_sem4 else 'none')

# Check Sem 5 in app.js
m_sem5 = re.search(r'// Semester 5[^\n]+\n([^\n]+)', app_text)
print('app.js Sem 5 line:', m_sem5.group(1) if m_sem5 else 'none')
