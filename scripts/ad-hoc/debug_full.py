with open('tests/verify_system_health.js', 'r', encoding='utf-8') as f:
    c = f.read()

target = '''                    tbodySnippet: tbody ? tbody.innerHTML.substring(0, 300) : 'NO_TBODY',
                    allTasksLen: (window.gameState && window.gameState.courses) ? Object.keys(window.gameState.courses).length : 0
                };'''

replacement = '''                    tbodySnippet: tbody ? tbody.innerHTML.substring(0, 300) : 'NO_TBODY',
                    allTasksLen: (window.gameState && window.gameState.courses) ? Object.keys(window.gameState.courses).length : 0,
                    currentActiveSemester: window.gameState ? window.gameState.currentActiveSemester : null,
                    coursesSample: coursesDebug.slice(0, 6),
                    typeFilters: (typeof window.getActiveTypeFilters === 'function') ? window.getActiveTypeFilters() : null
                };'''

assert target in c, "target not found in verify_system_health.js"
c = c.replace(target, replacement, 1)

with open('tests/verify_system_health.js', 'w', encoding='utf-8') as f:
    f.write(c)

print("Updated verify_system_health.js with full debug")
