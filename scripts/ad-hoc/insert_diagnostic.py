with open('tests/verify_system_health.js', 'r', encoding='utf-8') as f:
    c = f.read()

target = '''        await test('Notion Tasks Board Overhaul: Semester Column, Focus Mode, Multi-Type Filter & Pangea Linking', async () => {
            const result = await cdp.eval(`(() => {
                if (typeof window.setActiveMainTab === 'function') {
                    window.setActiveMainTab('tasks');
                }'''

replacement = '''        await test('Notion Tasks Board Overhaul: Semester Column, Focus Mode, Multi-Type Filter & Pangea Linking', async () => {
            const result = await cdp.eval(`(() => {
                if (typeof window.setActiveMainTab === 'function') {
                    window.setActiveMainTab('tasks');
                }
                const semSelect = document.getElementById('filter-semester');
                const courseFilterEl = document.getElementById("filter-course");
                const curActiveSem = (window.gameState && window.gameState.currentActiveSemester) ? window.gameState.currentActiveSemester : 3;
                
                let gathered = 0;
                let gatheredCourses = [];
                Object.values(window.gameState.courses || {}).forEach(course => {
                    const cSem = course.semester || 1;
                    if (cSem < curActiveSem && course.status === 'mastered') return;
                    if (cSem > curActiveSem && course.status !== 'active' && course.status !== 'available') return;
                    gathered += (course.tasks || []).length;
                    gatheredCourses.push({ code: course.code, sem: cSem, status: course.status, tasks: (course.tasks||[]).length });
                });

                window.renderNotionTasksTable();
                const tbody = document.getElementById('notion-tasks-table-body');
                const pills = document.querySelectorAll('.notion-semester-pill');
                return {
                    gathered,
                    gatheredCourses: gatheredCourses.slice(0, 5),
                    semSelectVal: semSelect ? semSelect.value : null,
                    courseFilterVal: courseFilterEl ? courseFilterEl.value : null,
                    pillsCount: pills.length,
                    tbodyHtml: tbody ? tbody.innerHTML.substring(0, 200) : null
                };
            })()`);
            console.log('DIAGNOSTIC RESULT:', JSON.stringify(result, null, 2));
            assert(result.pillsCount > 0, 'No semester pills found in tasks table');
        });'''

idx = c.find("await test('Notion Tasks Board Overhaul")
idx_end = c.find("assert(result.hasSemesterPill, 'notion-semester-pill element missing in table');\n        });")
idx_end += len("assert(result.hasSemesterPill, 'notion-semester-pill element missing in table');\n        });")
c = c[:idx] + replacement + c[idx_end:]

with open('tests/verify_system_health.js', 'w', encoding='utf-8') as f:
    f.write(c)

print("Diagnostic inserted into verify_system_health.js")
