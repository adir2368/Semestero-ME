with open(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\android\app\src\main\java\com\technion\semestero\MainActivity.java', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(100, 200):
    if i < len(lines):
        print(f"L{i+1}: {lines[i]}", end='')
