with open(r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\android\wear\build.gradle', 'r', encoding='utf-8') as f:
    text = f.read()

import re
m_vc = re.search(r'versionCode\s+(\d+)', text)
m_vn = re.search(r'versionName\s+["\']([^"\']+)["\']', text)
print("wear build.gradle:", m_vc.group(0) if m_vc else 'no vc', m_vn.group(0) if m_vn else 'no vn')
