import sys
sys.stdout.reconfigure(encoding='utf-8')

path = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\curriculum_template.js'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for l in lines:
    if '114071_ex' in l or '114075_ex' in l:
        skip = 2 # skip this line and next 2 lines ( ] and }, )
        continue
    if skip > 0:
        skip -= 1
        continue
    new_lines.append(l)

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print("Cleaned lines from curriculum_template.js")
