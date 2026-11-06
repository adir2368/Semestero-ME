import json, re

with open('package.json', 'r', encoding='utf-8') as f:
    pkg = json.load(f)
print('package.json version:', pkg.get('version'))

with open('app.js', 'r', encoding='utf-8') as f:
    txt = f.read()
m = re.search(r'APP_CURRENT_REVISION\s*=\s*[\'"]([^\'"]+)[\'"]', txt)
print('app.js revision:', m.group(1) if m else 'not found')

with open('sw.js', 'r', encoding='utf-8') as f:
    txt = f.read()
m = re.search(r'CACHE_NAME\s*=\s*[\'"]([^\'"]+)[\'"]', txt)
print('sw.js CACHE_NAME:', m.group(1) if m else 'not found')

with open('index.html', 'r', encoding='utf-8') as f:
    txt = f.read()
m = re.search(r'APP_VERSION\s*=\s*[\'"]([^\'"]+)[\'"]', txt)
print('index.html APP_VERSION:', m.group(1) if m else 'not found')

with open('android/app/build.gradle', 'r', encoding='utf-8') as f:
    txt = f.read()
m_vc = re.search(r'versionCode\s+(\d+)', txt)
m_vn = re.search(r'versionName\s+[\'"]([^\'"]+)[\'"]', txt)
print('android/app versionCode:', m_vc.group(1) if m_vc else 'not found', 'versionName:', m_vn.group(1) if m_vn else 'not found')
