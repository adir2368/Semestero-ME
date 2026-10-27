import re, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'
with open(f'{ws}\\preloaded_user_state.js', 'r', encoding='utf-8') as f:
    text = f.read()

m = re.search(r'"114032":\s*\{[^}]*?"semester":\s*(\d+)', text)
if m:
    print("In preloaded_user_state.js, 114032 semester is:", m.group(1))
else:
    print("Could not find semester in 114032 in preloaded_user_state.js")
