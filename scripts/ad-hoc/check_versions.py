import json, re

# package.json
with open(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\package.json', 'r', encoding='utf-8') as f:
    pkg = json.load(f)
print("package.json version:", pkg.get('version'))

# app.js
with open(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js', 'r', encoding='utf-8') as f:
    app_text = f.read()
m = re.search(r'APP_CURRENT_REVISION\s*=\s*\{([^}]+)\}', app_text)
if m:
    print("app.js revision:", m.group(1).strip())
m_ver = re.search(r'APP_VERSION\s*=\s*[\'"]([^\'"]+)[\'"]', app_text)
if m_ver:
    print("app.js APP_VERSION:", m_ver.group(1))

# sw.js
with open(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\sw.js', 'r', encoding='utf-8') as f:
    sw_text = f.read()
m_sw = re.search(r'CACHE_NAME\s*=\s*[\'"]([^\'"]+)[\'"]', sw_text)
if m_sw:
    print("sw.js CACHE_NAME:", m_sw.group(1))

# android/app/build.gradle
try:
    with open(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\android\app\build.gradle', 'r', encoding='utf-8') as f:
        bg_text = f.read()
    m_vc = re.search(r'versionCode\s+(\d+)', bg_text)
    m_vn = re.search(r'versionName\s+["\']([^"\']+)["\']', bg_text)
    print("android/app/build.gradle:", m_vc.group(0) if m_vc else 'no vc', m_vn.group(0) if m_vn else 'no vn')
except Exception as e:
    print("android error:", e)
