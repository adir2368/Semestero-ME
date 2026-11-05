import sys
sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

def print_range(start, end):
    print(f"=== Lines {start} to {end} ===")
    for i in range(start-1, min(end, len(lines))):
        print(f"L{i+1}: {lines[i]}", end='')

print_range(17170, 17200)
print_range(17370, 17400)
print_range(17575, 17610)
