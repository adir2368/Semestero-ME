import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'
with open(f'{ws}\\planner_module.js', 'r', encoding='utf-8') as f:
    text = f.read()

idx = text.find('function isAdirAuthenticated')
print(text[idx-50:idx+600])
