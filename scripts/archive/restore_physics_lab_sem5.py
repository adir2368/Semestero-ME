import json
import re
import os
import shutil

ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'
os.chdir(ws)

print("--- 1. Restoring preloaded_user_state.js, planner_catalog.js, user_saved_state.json ---")
# Restore preloaded_user_state.js, planner_catalog.js, user_saved_state.json from git
os.system('git checkout -- preloaded_user_state.js planner_catalog.js user_saved_state.json')
print("Restored catalog and preloaded states to authentic Semester 5 baseline.")

print("\n--- 2. Cleaning planner_module.js ---")
with open('planner_module.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Remove ensurePhysicsLab block
target_ensure = """        const hasPhysLab = ['01140032', '114032', '01140039', '114039'].some(k => allCodes.has(k));
        if (!hasPhysLab) {
            const sem4 = plan.find(s => s.semester === 4) || plan[3];
            if (sem4) {
                sem4.courses = sem4.courses || [];
                sem4.courses.push({
                    code: "01140032",
                    altCode: "114032",
                    name: "מעב' לפיזיקה 1 ח",
                    credits: 1.0,
                    type: "mandatory",
                    prereqs: ["01140051", "01140052"]
                });
                console.log('[Planner] Restored Physics Lab 1H to Semester 4');
            }
        }"""
text = text.replace(target_ensure, '')

# Remove adir_lab_move block
target_move = """        // Ensure Physics Lab (114032) is in Semester 4 for Adir
        if (isAdir && customPlan) {
            const isLab = c => c && (c.code === '01140032' || c.altCode === '114032' || c.code === '114032');
            const sem4 = customPlan.find(s => s.semester === 4);
            const sem5 = customPlan.find(s => s.semester === 5);
            let labItem = null;
            if (sem5 && Array.isArray(sem5.courses)) {
                const idx = sem5.courses.findIndex(isLab);
                if (idx !== -1) {
                    labItem = sem5.courses.splice(idx, 1)[0];
                    console.log('[Planner] Moved Physics Lab 1H from Semester 5 to Semester 4');
                }
            }
            if (!labItem && sem4 && !sem4.courses.some(isLab)) {
                labItem = {
                    code: "01140032",
                    altCode: "114032",
                    name: "מעב' לפיזיקה 1 ח",
                    credits: 1.0,
                    type: "mandatory",
                    prereqs: ["01140051", "01140052"]
                };
            }
            if (labItem && sem4 && !sem4.courses.some(isLab)) {
                sem4.courses.push(labItem);
            }
            if (global.gameState && global.gameState.courses && global.gameState.courses['114032']) {
                global.gameState.courses['114032'].semester = 4;
            }
        }\n\n"""
text = text.replace(target_move, '')

with open('planner_module.js', 'w', encoding='utf-8') as f:
    f.write(text)
print("planner_module.js cleaned.")

print("\n--- 3. Cleaning app.js ---")
with open('app.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Restore flowchart column mapping
sem4_cols_sem4 = """        // Semester 4 (5 courses: columns 0, 1, 2, 3, 5)
        "114032": 0, "034055": 1, "034032": 2, "034010": 3, "034030": 5,
        // Semester 5 (5 courses: columns 0, 1, 2, 4, 5)
        "034058": 0, "034041": 1, "034051": 2, "034040": 4, "034054": 5,"""

sem4_cols_sem5 = """        // Semester 4 (4 courses)
        "034055": 1, "034032": 2, "034010": 3, "034030": 5,
        // Semester 5 (6 courses)
        "034058": 0, "034041": 1, "034051": 2, "114032": 3, "034040": 4, "034054": 5,"""
text = text.replace(sem4_cols_sem4, sem4_cols_sem5)

# Restore radial constellation
text = text.replace('"114032": { sem: 4, angle: 150, branch: "math" }', '"114032": { sem: 5, angle: 150, branch: "math" }')

# Remove app_lab_move
app_lab_move = """                    // Ensure Physics Lab 1H (114032) is assigned to Semester 4
                    if (isAdir && gameState && gameState.courses && gameState.courses['114032']) {
                        gameState.courses['114032'].semester = 4;
                    }\n\n"""
text = text.replace(app_lab_move, '')

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(text)
print("app.js cleaned.")

print("\n--- 4. Syncing dist/ ---")
dist_app = r'dist\Semestero ME-win32-x64\resources\app'
if os.path.exists(dist_app):
    for fn in ['app.js', 'planner_module.js', 'planner_catalog.js', 'preloaded_user_state.js', 'user_saved_state.json', 'sw.js', 'index.html', 'package.json']:
        if os.path.exists(fn):
            shutil.copy2(fn, os.path.join(dist_app, fn))
    print(f"Synchronized updated files to {dist_app}")

print("\nRestoration of Physics Lab to Semester 5 completed successfully!")
