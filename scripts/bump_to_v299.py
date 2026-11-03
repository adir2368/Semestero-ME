# -*- coding: utf-8 -*-
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

def bump():
    old_ver = "2.9.8"
    new_ver = "2.9.9"
    app_code_old = 51
    app_code_new = 52
    wear_code_old = 52
    wear_code_new = 53

    # 1. package.json
    with open('package.json', 'r', encoding='utf-8') as f:
        pkg = f.read()
    pkg = pkg.replace(f'"version": "{old_ver}"', f'"version": "{new_ver}"')
    with open('package.json', 'w', encoding='utf-8') as f:
        f.write(pkg)
    print(f"[OK] Bumped package.json to {new_ver}")

    # 2. android/app/build.gradle
    with open('android/app/build.gradle', 'r', encoding='utf-8') as f:
        app_gradle = f.read()
    app_gradle = app_gradle.replace(f'versionCode {app_code_old}', f'versionCode {app_code_new}')
    app_gradle = app_gradle.replace(f'versionName "{old_ver}"', f'versionName "{new_ver}"')
    with open('android/app/build.gradle', 'w', encoding='utf-8') as f:
        f.write(app_gradle)
    print(f"[OK] Bumped android/app/build.gradle to code {app_code_new}, version {new_ver}")

    # 3. android/wear/build.gradle
    with open('android/wear/build.gradle', 'r', encoding='utf-8') as f:
        wear_gradle = f.read()
    wear_gradle = wear_gradle.replace(f'versionCode {wear_code_old}', f'versionCode {wear_code_new}')
    wear_gradle = wear_gradle.replace(f'versionName "{old_ver}"', f'versionName "{new_ver}"')
    with open('android/wear/build.gradle', 'w', encoding='utf-8') as f:
        f.write(wear_gradle)
    print(f"[OK] Bumped android/wear/build.gradle to code {wear_code_new}, version {new_ver}")

    # 4. app.js
    with open('app.js', 'r', encoding='utf-8') as f:
        app_js = f.read()
    app_js = app_js.replace(f'REV-2026.11.03-v{old_ver}', f'REV-2026.11.03-v{new_ver}')
    app_js = app_js.replace(f'version: "{old_ver}"', f'version: "{new_ver}"')
    app_js = app_js.replace(
        'גרסה 2.9.8: שדרוג שעון Galaxy Watch 8 לקרוסלת 3 מסכים (רדאר, לו״ז, משימות), התראות בדיקה ישירות מהטלפון לשעון עם רטט מותאם וסנכרון מיידי',
        'גרסה 2.9.9: עיצוב Tile של השעון 1:1 לפי הרדאר, הוספת Watch Face Complication לפינות המסך (רבע/חוגה) ותיקון סופי למניעת קפיצה מוקדמת למחר'
    )
    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(app_js)
    print(f"[OK] Bumped app.js to {new_ver}")

    # 5. sw.js
    with open('sw.js', 'r', encoding='utf-8') as f:
        sw = f.read()
    sw = sw.replace(f'v{old_ver}', f'v{new_ver}')
    sw = sw.replace(f'semestero-me-v{old_ver}', f'semestero-me-v{new_ver}')
    with open('sw.js', 'w', encoding='utf-8') as f:
        f.write(sw)
    print(f"[OK] Bumped sw.js to {new_ver}")

    # 6. index.html
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()
    html = html.replace(f'?v={old_ver}', f'?v={new_ver}')
    html = html.replace(f'id="display-system-version">v{old_ver}</span>', f'id="display-system-version">v{new_ver}</span>')
    html = html.replace(f'id="footer-version-badge" title="מערכת סמסטרו ME (v{old_ver})" aria-label="גרסת המערכת סמסטרו ME" style="cursor: pointer;">v{old_ver} 🚀</button>',
                        f'id="footer-version-badge" title="מערכת סמסטרו ME (v{new_ver})" aria-label="גרסת המערכת סמסטרו ME" style="cursor: pointer;">v{new_ver} 🚀</button>')
    html = html.replace(f'>v2.9.7 🚀</button>', f'>v{new_ver} 🚀</button>')
    html = html.replace(f'>v{old_ver} 🚀</button>', f'>v{new_ver} 🚀</button>')
    html = html.replace(f'גרסה אחרונה v{old_ver}', f'גרסה אחרונה v{new_ver}')

    # Add changelog item
    changelog_entry = f'''                        <li><strong>v{new_ver} (03/11/2026):</strong> שדרוג ווידג׳ט Tile של השעון לעיצוב רדאר מודרני עם פילרים וטיפוגרפיה תואמת, הוספת שירות Watch Face Complication (תמיכה בפינות השעון ובחוגות לצד סוללה וצעדים), ותיקון תזמון הלו״ז וההתראות בשעון.</li>\n'''
    anchor = '<ul class="whats-new-list"'
    if anchor in html:
        pos = html.find(anchor)
        end_tag = html.find('>', pos) + 1
        html = html[:end_tag] + '\n' + changelog_entry + html[end_tag:]
        print("[OK] Added changelog entry to index.html")
    else:
        print("[WARN] Could not find whats-new-list anchor")

    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"[OK] Bumped index.html to {new_ver}")

if __name__ == '__main__':
    bump()
