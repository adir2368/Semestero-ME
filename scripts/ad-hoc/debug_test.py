with open('tests/verify_system_health.js', 'r', encoding='utf-8') as f:
    c = f.read()

target = '''                return {
                    hasSemSelect: !!semSelect,
                    semDefault: semSelect ? semSelect.value : null,
                    hasTypeBtn: !!typeBtn,
                    hasTypePopover: !!typePopover,
                    hasFocusBtn: !!focusBtn,
                    focusActive: focusBtn ? focusBtn.classList.contains('active') : false,
                    hasPangeaFn: pangeaFn,
                    hasPangeaPill: !!pangeaPill,
                    hasSemesterPill: !!semesterPill,
                    hasPdeRow: !!pdeH1
                };'''

debug_code = '''                if (typeof window.renderNotionTasksTable === 'function') {
                    window.renderNotionTasksTable();
                }
                const tbody = document.getElementById('notion-tasks-table-body');
                const pills = document.querySelectorAll('.notion-semester-pill');
                return {
                    hasSemSelect: !!semSelect,
                    semDefault: semSelect ? semSelect.value : null,
                    hasTypeBtn: !!typeBtn,
                    hasTypePopover: !!typePopover,
                    hasFocusBtn: !!focusBtn,
                    focusActive: focusBtn ? focusBtn.classList.contains('active') : false,
                    hasPangeaFn: pangeaFn,
                    hasPangeaPill: !!document.querySelector('.notion-pangea-link-btn'),
                    hasSemesterPill: pills.length > 0,
                    pillsCount: pills.length,
                    hasPdeRow: !!document.querySelector('tr[data-course-code="104228"]'),
                    tbodySnippet: tbody ? tbody.innerHTML.substring(0, 300) : 'NO_TBODY',
                    allTasksLen: (window.gameState && window.gameState.courses) ? Object.keys(window.gameState.courses).length : 0
                };'''

c = c.replace(target, debug_code)
with open('tests/verify_system_health.js', 'w', encoding='utf-8') as f:
    f.write(c)

print("Updated verify_system_health.js with debug return")
