import sys, re
sys.stdout.reconfigure(encoding='utf-8')
with open('C:/Users/user/.gemini/antigravity/scratch/academic-skill-tree/app.js', 'r', encoding='utf-8') as f:
    text = f.read()

matches = re.findall(r'room:\s*["\']([^"\']+)["\']', text)
for r in sorted(set(matches)):
    print('Room:', r)
