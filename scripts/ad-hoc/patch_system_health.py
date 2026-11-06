import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('tests/verify_system_health.js', 'r', encoding='utf-8') as f:
    txt = f.read()

target = """            assert(result.hasSemesterPill, 'notion-semester-pill element missing in table');
            assert(result.hasPangeaPill, 'notion-pangea-link-btn element missing in table');
        });"""

replacement = """            assert(result.hasSemesterPill, 'notion-semester-pill element missing in table');
            assert(result.hasPangeaPill, 'notion-pangea-link-btn element missing in table');
        });

        // Test 12: Homework Policy Tracker (Macro Strip & Micro Modal 12-Sheet Grid)
        await test('Homework Policy Tracker: Macro Strip & Micro Modal 12-Sheet Grid', async () => {
            const result = await cdp.eval(`(() => {
                const strip = document.getElementById('notion-hw-policy-strip');
                if (typeof window.renderNotionHomeworkPolicyStrip === 'function') {
                    window.renderNotionHomeworkPolicyStrip();
                }
                const capsules = strip ? strip.querySelectorAll('.course-hw-capsule') : [];
                const solidsCapsule = Array.from(capsules).find(c => c.textContent.includes('מוצקים 2') || c.textContent.includes('034053'));
                
                // Open modal micro view
                if (typeof window.openCourseHomeworkDetail === 'function') {
                    window.openCourseHomeworkDetail('034053');
                }
                const modalHw = document.getElementById('modal-hw-policy-section');
                const sheetCards = modalHw ? modalHw.querySelectorAll('.hw-sheet-card') : [];
                const dualRows = modalHw ? modalHw.querySelectorAll('.hw-component-row') : [];

                return {
                    hasStrip: !!strip,
                    capsulesCount: capsules.length,
                    hasSolidsCapsule: !!solidsCapsule,
                    hasModalHw: !!modalHw && modalHw.style.display !== 'none',
                    sheetCardsCount: sheetCards.length,
                    hasDualComponents: dualRows.length >= 24
                };
            })()`);
            assert(result.hasStrip, 'notion-hw-policy-strip element missing');
            assert(result.capsulesCount >= 1, 'Should render at least 1 active homework capsule');
            assert(result.hasSolidsCapsule, 'Solid Mechanics 2 capsule missing');
            assert(result.hasModalHw, 'modal-hw-policy-section missing in course modal');
            assert.strictEqual(result.sheetCardsCount, 12, 'Must render exactly 12 sheets for 034053');
            assert(result.hasDualComponents, 'Must render dual components for 034053');
        });"""

if target in txt:
    txt = txt.replace(target, replacement, 1)
    print("Replaced LF")
else:
    target_crlf = target.replace('\n', '\r\n')
    replacement_crlf = replacement.replace('\n', '\r\n')
    if target_crlf in txt:
        txt = txt.replace(target_crlf, replacement_crlf, 1)
        print("Replaced CRLF")
    else:
        print("NOT FOUND")
        sys.exit(1)

with open('tests/verify_system_health.js', 'w', encoding='utf-8') as f:
    f.write(txt)
print("Updated verify_system_health.js")
