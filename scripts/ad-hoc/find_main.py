import os

for root, dirs, files in os.walk(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'):
    for f in files:
        if f in ['main.js', 'preload.js', 'capacitor.config.json', 'capacitor.config.ts']:
            print(os.path.join(root, f))
