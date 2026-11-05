with open('tests/verify_system_health.js', 'r', encoding='utf-8') as f:
    c = f.read()

idx = c.find("await test('Notion Tasks Board Overhaul")
idx_end = c.find("assert(result.pillsCount > 0, 'No semester pills found in tasks table');\n        });")
idx_end += len("assert(result.pillsCount > 0, 'No semester pills found in tasks table');\n        });")

clean_test = '''        await test('Notion Tasks Board Overhaul: Semester Column, Focus Mode, Multi-Type Filter & Pangea Linking', async () => {
            const result = await cdp.eval(`(() => {
                if (typeof window.setActiveMainTab === 'function') {
                    window.setActiveMainTab('tasks');
                }
                const semSelect = document.getElementById('filter-semester');
                const typeBtn = document.getElementById('notion-type-filter-btn');
                const typePopover = document.getElementById('notion-type-filter-popover');
                const focusBtn = document.getElementById('notion-focus-toggle-btn');
                const pangeaFn = typeof window.getPangeaTaskUrl === 'function';

                if (typeof window.renderNotionTasksTable === 'function') {
                    window.renderNotionTasksTable();
                }

                const semesterPill = document.querySelector('.notion-semester-pill');
                const pangeaPill = document.querySelector('.notion-pangea-link-btn');
                const pdeRow = document.querySelector('tr[data-course-code="104228"]');

                return {
                    hasSemSelect: !!semSelect,
                    semDefault: semSelect ? semSelect.value : null,
                    hasTypeBtn: !!typeBtn,
                    hasTypePopover: !!typePopover,
                    hasFocusBtn: !!focusBtn,
                    focusActive: focusBtn ? focusBtn.classList.contains('active') : false,
                    hasPangeaFn: pangeaFn,
                    hasPangeaPill: !!pangeaPill,
                    hasSemesterPill: !!semesterPill,
                    hasPdeRow: !!pdeRow
                };
            })()`);
            assert(result.hasSemSelect, 'filter-semester dropdown missing');
            assert.strictEqual(result.semDefault, 'active', 'filter-semester should default to active');
            assert(result.hasTypeBtn, 'notion-type-filter-btn missing');
            assert(result.hasTypePopover, 'notion-type-filter-popover missing');
            assert(result.hasFocusBtn, 'notion-focus-toggle-btn missing');
            assert(result.hasPangeaFn, 'window.getPangeaTaskUrl function missing');
            assert(result.hasSemesterPill, 'notion-semester-pill element missing in table');
            assert(result.hasPangeaPill, 'notion-pangea-link-btn element missing in table');
        });'''

c = c[:idx] + clean_test + c[idx_end:]

with open('tests/verify_system_health.js', 'w', encoding='utf-8') as f:
    f.write(c)

print("verify_system_health.js cleaned up successfully!")
