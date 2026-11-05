import os

for root, dirs, files in os.walk(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\android'):
    for f in files:
        if 'build.gradle' in f:
            print(os.path.join(root, f))
