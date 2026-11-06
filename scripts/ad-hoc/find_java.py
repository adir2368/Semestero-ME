import os

for root, dirs, files in os.walk(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\android\app\src\main\java'):
    for f in files:
        if f.endswith('.java') or f.endswith('.kt'):
            print(os.path.join(root, f))
