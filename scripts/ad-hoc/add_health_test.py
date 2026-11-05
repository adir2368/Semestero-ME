with open('tests/verify_system_health.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''            assert(plannerState.hasCatalogSkeleton, 'renderCatalogSkeletons is not defined');
            assert(plannerState.hasPool, 'planner-available-electives-list pool container missing');
        });'''

new_test = '''            assert(plannerState.hasCatalogSkeleton, 'renderCatalogSkeletons is not defined');
            assert(plannerState.hasPool, 'planner-available-electives-list pool container missing');
        });

        await test('Notion Tasks Board Overhaul: Semester Column, Focus Mode, Multi-Type Filter & Pangea Linking', async () => {
            const result = await cdp.evaluate(`(() => {
                if (typeof window.setActiveMainTab === 'function') {
                    window.setActiveMainTab('tasks');
                }
                const semSelect = document.getElementById('filter-semester');
                const typeBtn = document.getElementById('notion-type-filter-btn');
                const typePopover = document.getElementById('notion-type-filter-popover');
                const focusBtn = document.getElementById('notion-focus-toggle-btn');
                const pangeaFn = typeof window.getPangeaTaskUrl === 'function';
                const pangeaPill = document.querySelector('.notion-pangea-link-btn');
                const semesterPill = document.querySelector('.notion-semester-pill');
                const pdeH1 = document.querySelector('tr[data-course-code="104228"]');
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
                    hasPdeRow: !!pdeH1
                };
            })()`);
            assert(result.hasSemSelect, 'filter-semester dropdown missing');
            assert.strictEqual(result.semDefault, 'active', 'filter-semester should default to active');
            assert(result.hasTypeBtn, 'notion-type-filter-btn missing');
            assert(result.hasTypePopover, 'notion-type-filter-popover missing');
            assert(result.hasFocusBtn, 'notion-focus-toggle-btn missing');
            assert(result.hasPangeaFn, 'window.getPangeaTaskUrl function missing');
            assert(result.hasSemesterPill, 'notion-semester-pill element missing in table');
        });'''

assert target in content, "target not found in tests/verify_system_health.js"
content = content.replace(target, new_test, 1)

with open('tests/verify_system_health.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Test added to tests/verify_system_health.js successfully!")
