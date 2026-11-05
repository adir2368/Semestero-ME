with open('tests/verify_system_health.js', 'r', encoding='utf-8') as f:
    c = f.read()

target = '''                window.renderNotionTasksTable();
                const tbody = document.getElementById('notion-tasks-table-body');'''

replacement = '''                const activeStatus = (typeof getActiveStatusFilters === 'function') ? getActiveStatusFilters() : [];
                const activeTypes = (typeof getActiveTypeFilters === 'function') ? getActiveTypeFilters() : [];
                const sampleTask = window.gameState.courses['104041'].tasks[0];
                const sampleCat = getTaskNormalizedCategory(sampleTask.type);
                const sampleStatus = sampleTask.status || 'not_started';
                
                const filterFailReason = {
                    organitCat: window.activeOrganitCategory,
                    activeStatus,
                    sampleStatus,
                    statusMatch: activeStatus.includes(sampleStatus),
                    activeTypes,
                    sampleCat,
                    typeMatch: activeTypes.includes(sampleCat),
                    searchVal: document.getElementById("search-tasks")?.value
                };

                window.renderNotionTasksTable();
                const tbody = document.getElementById('notion-tasks-table-body');'''

assert target in c, "target not found in verify_system_health.js"
c = c.replace(target, replacement, 1)
c = c.replace('pillsCount: pills.length,', 'pillsCount: pills.length,\n                    filterFailReason,')

with open('tests/verify_system_health.js', 'w', encoding='utf-8') as f:
    f.write(c)

print("Added filterFailReason to verify_system_health.js")
