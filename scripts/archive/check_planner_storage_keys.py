import re, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'
with open(f'{ws}\\planner_module.js', 'r', encoding='utf-8') as f:
    text = f.read()

keys = set(re.findall(r'localStorage\.(?:getItem|setItem|removeItem)\s*\(\s*[\'"`]([^\'"`]+)[\'"`]', text))
print("LocalStorage keys in planner_module.js:")
for k in sorted(keys):
    print(" ", k)

# Also check dynamic keys like PLANNER_STORAGE_KEY_V2
dyn_keys = re.findall(r'const\s+([A-Z0-9_]+_KEY(?:_V\d)?)\s*=\s*[\'"`]([^\'"`]+)[\'"`]', text)
print("\nConstant storage keys in planner_module.js:")
for var, val in dyn_keys:
    print(f"  {var} = {val}")
