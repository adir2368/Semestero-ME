import os

for root, dirs, files in os.walk('.'):
    # skip node_modules, .git, android, dist-electron
    if any(p in root for p in ['node_modules', '.git', 'android', 'dist-electron', 'dist_electron']):
        continue
    for f in files:
        if f.endswith('.js'):
            print(os.path.join(root, f))
