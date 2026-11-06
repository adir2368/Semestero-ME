import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if 'id="course-modal"' in line:
        print(f"Found course-modal at line {i+1}:")
        for j in range(i, min(i + 80, len(lines))):
            print(f"{j+1}: {lines[j].rstrip()}")
        break
