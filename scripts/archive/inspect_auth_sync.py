import re, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'
with open(f'{ws}\\auth_sync.js', 'r', encoding='utf-8') as f:
    text = f.read()

print("Functions in auth_sync.js:")
funcs = re.findall(r'function\s+([a-zA-Z0-9_]+)\s*\(', text)
print(funcs[:30])

# Check loadActiveUserState
idx = text.find('loadActiveUserState')
if idx != -1:
    print("\nloadActiveUserState:")
    print(text[idx:idx+800])
