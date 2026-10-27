import re

ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'

# 1. Update app.js
with open(f'{ws}\\app.js', 'r', encoding='utf-8') as f:
    app_text = f.read()

ensure_sem5_lab = """                    // Ensure Physics Lab 1H (114032) belongs strictly to Semester 5
                    if (isAdir && gameState && gameState.courses && gameState.courses['114032']) {
                        gameState.courses['114032'].semester = 5;
                    }"""

target_pos = """                    // Purge accidental QA test infiltrator courses for Adir"""
if ensure_sem5_lab not in app_text and target_pos in app_text:
    app_text = app_text.replace(target_pos, ensure_sem5_lab + '\n\n' + target_pos, 1)
    with open(f'{ws}\\app.js', 'w', encoding='utf-8') as f:
        f.write(app_text)
    print("Updated app.js with ensure Physics Lab in Semester 5")

# 2. Update planner_module.js
with open(f'{ws}\\planner_module.js', 'r', encoding='utf-8') as f:
    planner_text = f.read()

ensure_planner_lab = """        // Ensure Physics Lab (114032) belongs strictly to Semester 5 (not Semester 4)
        if (isAdir && customPlan) {
            const isLab = c => c && (c.code === '01140032' || c.altCode === '114032' || c.code === '114032');
            const sem4 = customPlan.find(s => s.semester === 4);
            const sem5 = customPlan.find(s => s.semester === 5);
            if (sem4 && Array.isArray(sem4.courses)) {
                const labIdx = sem4.courses.findIndex(isLab);
                if (labIdx !== -1) {
                    const labItem = sem4.courses.splice(labIdx, 1)[0];
                    if (sem5 && Array.isArray(sem5.courses) && !sem5.courses.some(isLab)) {
                        sem5.courses.push(labItem);
                    }
                }
            }
            if (global.gameState && global.gameState.courses && global.gameState.courses['114032']) {
                global.gameState.courses['114032'].semester = 5;
            }
        }"""

planner_target = """        // 1b. Purge accidental test infiltrator courses for Adir"""
if ensure_planner_lab not in planner_text and planner_target in planner_text:
    planner_text = planner_text.replace(planner_target, ensure_planner_lab + '\n\n' + planner_target, 1)
    with open(f'{ws}\\planner_module.js', 'w', encoding='utf-8') as f:
        f.write(planner_text)
    print("Updated planner_module.js with ensure Physics Lab in Semester 5")
