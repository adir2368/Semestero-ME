import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

def bump_version():
    old_ver = "2.8.1"
    new_ver = "2.8.2"
    old_code = 37
    new_code = 38

    # 1. package.json
    with open('package.json', 'r', encoding='utf-8') as f:
        pkg = f.read()
    pkg = pkg.replace(f'"version": "{old_ver}"', f'"version": "{new_ver}"')
    with open('package.json', 'w', encoding='utf-8') as f:
        f.write(pkg)
    print(f"✓ Bumped package.json to {new_ver}")

    # 2. sw.js
    with open('sw.js', 'r', encoding='utf-8') as f:
        sw = f.read()
    sw = sw.replace(f'v{old_ver}', f'v{new_ver}')
    sw = sw.replace(f'semestero-me-v{old_ver}', f'semestero-me-v{new_ver}')
    with open('sw.js', 'w', encoding='utf-8') as f:
        f.write(sw)
    print(f"✓ Bumped sw.js to {new_ver}")

    # 3. app.js
    with open('app.js', 'r', encoding='utf-8') as f:
        app = f.read()
    app = app.replace(f'REV-2026.10.28-v{old_ver}', f'REV-2026.10.28-v{new_ver}')
    app = app.replace(f'REV-2026.10.27-v{old_ver}', f'REV-2026.10.28-v{new_ver}')
    app = app.replace(f'version: "{old_ver}"', f'version: "{new_ver}"')
    app = app.replace(f'APP_CURRENT_REVISION.version) || "{old_ver}"', f'APP_CURRENT_REVISION.version) || "{new_ver}"')
    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(app)
    print(f"✓ Bumped app.js to {new_ver}")

    # 4. android/app/build.gradle
    with open('android/app/build.gradle', 'r', encoding='utf-8') as f:
        gradle = f.read()
    gradle = gradle.replace(f'versionCode {old_code}', f'versionCode {new_code}')
    gradle = gradle.replace(f'versionName "{old_ver}"', f'versionName "{new_ver}"')
    with open('android/app/build.gradle', 'w', encoding='utf-8') as f:
        f.write(gradle)
    print(f"✓ Bumped build.gradle to versionCode {new_code}, versionName {new_ver}")

    # 5. index.html
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()
    html = html.replace(f'?v={old_ver}', f'?v={new_ver}')
    html = html.replace(f'id="display-system-version">v{old_ver}</span>', f'id="display-system-version">v{new_ver}</span>')
    html = html.replace(f'(v{old_ver})"', f'(v{new_ver})"')
    html = html.replace(f'>v{old_ver} 🚀</button>', f'>v{new_ver} 🚀</button>')

    # Add changelog item for v2.8.2
    changelog_entry = f'''                            <li><strong>v{new_ver} (28/10/2026):</strong> סנכרון מושלם ומדויק מול CheeseFork: פענוח מפתחות בחירת קבוצות לפי סוג שיעור (הרצאה, תרגול, מעבדה, ספורט), מניעת כפילויות ותרגולים שלא נבחרו, ביטול דריסת הרצאות על ידי העשרת חדרים, וטעינת מערכת השעות האותנטית של סמסטר חורף תשפ״ז במלואה.</li>
'''
    old_changelog_anchor = f'<li><strong>v{old_ver}'
    html = html.replace(old_changelog_anchor, changelog_entry + '                            ' + old_changelog_anchor)

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"✓ Bumped index.html to {new_ver}")

if __name__ == '__main__':
    bump_version()
