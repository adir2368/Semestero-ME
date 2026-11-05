with open('tests/verify_system_health.js', 'r', encoding='utf-8') as f:
    c = f.read()

target = 'const pills = document.querySelectorAll(\'.notion-semester-pill\');'
replacement = '''const pills = document.querySelectorAll('.notion-semester-pill');
                const coursesDebug = Object.values(window.gameState.courses || {}).map(c => ({
                    code: c.code,
                    sem: c.semester,
                    status: c.status,
                    tasks: (c.tasks||[]).length
                }));'''

c = c.replace(target, replacement)
c = c.replace('"allTasksLen": (window.gameState && window.gameState.courses) ? Object.keys(window.gameState.courses).length : 0', '"allTasksLen": (window.gameState && window.gameState.courses) ? Object.keys(window.gameState.courses).length : 0,\n                    "currentActiveSemester": window.gameState.currentActiveSemester,\n                    "coursesSample": coursesDebug.slice(0, 8)')

with open('tests/verify_system_health.js', 'w', encoding='utf-8') as f:
    f.write(c)

print("Added coursesDebug to verify_system_health.js")
