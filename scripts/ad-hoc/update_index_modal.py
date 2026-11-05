with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

target = 'id="update-modal-version-text">גרסה חדשה זמינה: v1.9.7</div>'
rep = 'id="update-modal-version-text">גרסה v2.10.0 (העדכנית ביותר) ✓</div>'

target2 = 'id="update-modal-current-text">גרסה מותקנת אצלך: v1.9.6</div>'
rep2 = 'id="update-modal-current-text">מערכת שעות CheeseFork 1:1, טיהור מבחנים, וניקוי מפת קורסים</div>'

if target in content and target2 in content:
    content = content.replace(target, rep).replace(target2, rep2)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Updated index.html modal version header')
else:
    print('Target not found')
