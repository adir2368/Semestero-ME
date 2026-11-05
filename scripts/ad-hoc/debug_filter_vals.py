with open('tests/verify_system_health.js', 'r', encoding='utf-8') as f:
    c = f.read()

target = '''                if (typeof window.renderNotionTasksTable === 'function') {
                    window.renderNotionTasksTable();
                }'''

replacement = '''                let debugInfo = {};
                if (typeof window.renderNotionTasksTable === 'function') {
                    const cFilterEl = document.getElementById("filter-course");
                    const sFilterEl = document.getElementById("filter-semester");
                    debugInfo.cFilterVal = cFilterEl ? cFilterEl.value : 'NO_EL';
                    debugInfo.sFilterVal = sFilterEl ? sFilterEl.value : 'NO_EL';
                    debugInfo.activeStatusFilters = (typeof getActiveStatusFilters === 'function') ? getActiveStatusFilters() : 'NO_FN';
                    debugInfo.activeTypeFilters = (typeof getActiveTypeFilters === 'function') ? getActiveTypeFilters() : 'NO_FN';
                    
                    window.renderNotionTasksTable();
                }'''

assert target in c, "target not found in verify_system_health.js"
c = c.replace(target, replacement, 1)
c = c.replace('"coursesSample": coursesDebug.slice(0, 6),', '"coursesSample": coursesDebug.slice(0, 6),\n                    "debugInfo": debugInfo,')

with open('tests/verify_system_health.js', 'w', encoding='utf-8') as f:
    f.write(c)

print("Updated verify_system_health.js with debugInfo")
