import re

# 1. package.json
with open('C:/Users/user/.gemini/antigravity/scratch/academic-skill-tree/package.json', 'r', encoding='utf-8') as f:
    pj = f.read()
pj = re.sub(r'"version":\s*"2\.10\.0"', '"version": "2.10.1"', pj)
with open('C:/Users/user/.gemini/antigravity/scratch/academic-skill-tree/package.json', 'w', encoding='utf-8') as f:
    f.write(pj)
print('Updated package.json')

# 2. android/app/build.gradle
with open('C:/Users/user/.gemini/antigravity/scratch/academic-skill-tree/android/app/build.gradle', 'r', encoding='utf-8') as f:
    ag = f.read()
ag = re.sub(r'versionCode\s+52', 'versionCode 53', ag)
ag = re.sub(r'versionName\s+"2\.10\.0"', 'versionName "2.10.1"', ag)
with open('C:/Users/user/.gemini/antigravity/scratch/academic-skill-tree/android/app/build.gradle', 'w', encoding='utf-8') as f:
    f.write(ag)
print('Updated android/app/build.gradle')

# 3. android/wear/build.gradle
with open('C:/Users/user/.gemini/antigravity/scratch/academic-skill-tree/android/wear/build.gradle', 'r', encoding='utf-8') as f:
    wg = f.read()
wg = re.sub(r'versionCode\s+53', 'versionCode 54', wg)
wg = re.sub(r'versionName\s+"2\.10\.0"', 'versionName "2.10.1"', wg)
with open('C:/Users/user/.gemini/antigravity/scratch/academic-skill-tree/android/wear/build.gradle', 'w', encoding='utf-8') as f:
    f.write(wg)
print('Updated android/wear/build.gradle')

# 4. sw.js
with open('C:/Users/user/.gemini/antigravity/scratch/academic-skill-tree/sw.js', 'r', encoding='utf-8') as f:
    sw = f.read()
sw = re.sub(r'v2\.10\.0', 'v2.10.1', sw)
with open('C:/Users/user/.gemini/antigravity/scratch/academic-skill-tree/sw.js', 'w', encoding='utf-8') as f:
    f.write(sw)
print('Updated sw.js')

# 5. app.js
with open('C:/Users/user/.gemini/antigravity/scratch/academic-skill-tree/app.js', 'r', encoding='utf-8') as f:
    app = f.read()
app = re.sub(r'code:\s*"REV-2026\.11\.03-v2\.10\.0"', 'code: "REV-2026.11.04-v2.10.1"', app)
app = re.sub(r'version:\s*"2\.10\.0"', 'version: "2.10.1"', app)
app = re.sub(r'build:\s*"20261103_03"', 'build: "20261104_01"', app)
app = re.sub(r'date:\s*"2026-11-03 18:30"', 'date: "2026-11-04 00:00"', app)
with open('C:/Users/user/.gemini/antigravity/scratch/academic-skill-tree/app.js', 'w', encoding='utf-8') as f:
    f.write(app)
print('Updated app.js')

# 6. index.html
with open('C:/Users/user/.gemini/antigravity/scratch/academic-skill-tree/index.html', 'r', encoding='utf-8') as f:
    idx_html = f.read()
idx_html = idx_html.replace('?v=2.10.0', '?v=2.10.1')
idx_html = idx_html.replace('v2.10.0', 'v2.10.1')
with open('C:/Users/user/.gemini/antigravity/scratch/academic-skill-tree/index.html', 'w', encoding='utf-8') as f:
    f.write(idx_html)
print('Updated index.html')
