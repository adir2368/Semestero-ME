import json
import re
import os
import shutil

ws = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree'
os.chdir(ws)

print("--- 1. Updating preloaded_user_state.js ---")
with open('preloaded_user_state.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Update semester in courses["114032"]
text = re.sub(
    r'("114032":\s*\{[^}]*?"semester":\s*)5',
    r'\g<1>4',
    text
)

# In degreePlan: move 01140032 from semester 5 to semester 4
m = re.search(r'const\s+PRELOADED_USER_STATE\s*=\s*(\{.*?\n\s*\});\n', text, re.DOTALL)
if m:
    data = json.loads(m.group(1))
    plan = data.get('degreePlan', [])
    sem4 = next((s for s in plan if s.get('semester') == 4), None)
    sem5 = next((s for s in plan if s.get('semester') == 5), None)
    
    lab_course = None
    if sem5 and 'courses' in sem5:
        orig = sem5['courses']
        sem5['courses'] = [c for c in orig if c.get('code') not in ['01140032', '114032']]
        lab_course = next((c for c in orig if c.get('code') in ['01140032', '114032']), None)
        print("Removed lab from sem 5 in preloaded_user_state")

    if not lab_course:
        lab_course = {
            "code": "01140032",
            "altCode": "114032",
            "name": "מעב' לפיזיקה 1 ח",
            "credits": 1,
            "type": "mandatory",
            "prereqs": ["01140051", "01140052"]
        }

    if sem4 and 'courses' in sem4:
        if not any(c.get('code') in ['01140032', '114032'] for c in sem4['courses']):
            sem4['courses'].append(lab_course)
            print("Added lab to sem 4 in preloaded_user_state")

    # update data in text
    new_json_str = json.dumps(data, indent=2, ensure_ascii=False)
    text = text[:m.start(1)] + new_json_str + text[m.end(1):]

with open('preloaded_user_state.js', 'w', encoding='utf-8') as f:
    f.write(text)
print("preloaded_user_state.js updated successfully!")


print("\n--- 2. Updating user_saved_state.json ---")
with open('user_saved_state.json', 'r', encoding='utf-8') as f:
    saved_state = json.load(f)

if 'courses' in saved_state and '114032' in saved_state['courses']:
    saved_state['courses']['114032']['semester'] = 4
    print("Updated 114032 semester to 4 in user_saved_state.json courses")

if 'degreePlan' in saved_state:
    plan = saved_state['degreePlan']
    sem4 = next((s for s in plan if s.get('semester') == 4), None)
    sem5 = next((s for s in plan if s.get('semester') == 5), None)
    lab_course = None
    if sem5 and 'courses' in sem5:
        orig = sem5['courses']
        sem5['courses'] = [c for c in orig if c.get('code') not in ['01140032', '114032']]
        lab_course = next((c for c in orig if c.get('code') in ['01140032', '114032']), None)
    if not lab_course:
        lab_course = {
            "code": "01140032",
            "altCode": "114032",
            "name": "מעב' לפיזיקה 1 ח",
            "credits": 1,
            "type": "mandatory",
            "prereqs": ["01140051", "01140052"]
        }
    if sem4 and 'courses' in sem4:
        if not any(c.get('code') in ['01140032', '114032'] for c in sem4['courses']):
            sem4['courses'].append(lab_course)
            print("Added lab to sem 4 in user_saved_state.json degreePlan")

with open('user_saved_state.json', 'w', encoding='utf-8') as f:
    json.dump(saved_state, f, indent=2, ensure_ascii=False)
print("user_saved_state.json updated successfully!")


print("\n--- 3. Updating planner_catalog.js ---")
with open('planner_catalog.js', 'r', encoding='utf-8') as f:
    catalog_text = f.read()

# In SUGGESTED_MANDATORY_SYLLABUS_2024 (and 2025/2027 if appropriate), move 01140032 from sem 5 to sem 4
# Find sem 4 in SUGGESTED_MANDATORY_SYLLABUS_2024
lab_entry = '{ code: "01140032", altCode: "114032", name: "מעב\' לפיזיקה 1 ח", credits: 1.0, type: "mandatory", prereqs: ["01140051", "01140052"] },'

# Remove from sem 5 in SUGGESTED_MANDATORY_SYLLABUS_2024
sem5_match = re.search(r'(title:\s*"שנה ג׳ - סמסטר ה׳",\s*targetCredits:\s*[\d\.]+,\s*courses:\s*\[)([\s\S]*?)(\n\s*\]\s*\})', catalog_text)
if sem5_match:
    sem5_body = sem5_match.group(2)
    if '01140032' in sem5_body:
        # remove it
        new_sem5_body = re.sub(r'\s*\{\s*code:\s*"01140032"[\s\S]*?\},', '', sem5_body)
        catalog_text = catalog_text[:sem5_match.start(2)] + new_sem5_body + catalog_text[sem5_match.end(2):]
        print("Removed lab from sem 5 in SUGGESTED_MANDATORY_SYLLABUS_2024")

# Add to sem 4 in SUGGESTED_MANDATORY_SYLLABUS_2024
sem4_match = re.search(r'(title:\s*"שנה ב׳ - סמסטר ד׳",\s*targetCredits:\s*[\d\.]+,\s*courses:\s*\[)([\s\S]*?)(\n\s*\]\s*\})', catalog_text)
if sem4_match:
    sem4_body = sem4_match.group(2)
    if '01140032' not in sem4_body:
        new_sem4_body = sem4_body + '\n                ' + lab_entry
        catalog_text = catalog_text[:sem4_match.start(2)] + new_sem4_body + catalog_text[sem4_match.end(2):]
        print("Added lab to sem 4 in SUGGESTED_MANDATORY_SYLLABUS_2024")

with open('planner_catalog.js', 'w', encoding='utf-8') as f:
    f.write(catalog_text)
print("planner_catalog.js updated successfully!")


print("\n--- 4. Updating planner_module.js ---")
with open('planner_module.js', 'r', encoding='utf-8') as f:
    planner_text = f.read()

# Add Physics Lab ensuring in ensureEssentialCoursesInPlan()
ensure_target = """        const hasPhys2 = ['01140052', '114052', '01140075', '114075', '01140078', '114078'].some(k => allCodes.has(k));
        if (!hasPhys2) {
            const sem3 = plan.find(s => s.semester === 3) || plan[2];
            if (sem3) {
                sem3.courses = sem3.courses || [];
                sem3.courses.push({
                    code: "01140052",
                    altCode: "114052",
                    name: "פיזיקה 2",
                    credits: 3.5,
                    type: "mandatory",
                    variantGroupId: "physics_2",
                    prereqs: ["01140051", "01040041"]
                });
                console.log('[Planner] Restored Physics 2 to Semester 3');
            }
        }"""

ensure_replacement = """        const hasPhys2 = ['01140052', '114052', '01140075', '114075', '01140078', '114078'].some(k => allCodes.has(k));
        if (!hasPhys2) {
            const sem3 = plan.find(s => s.semester === 3) || plan[2];
            if (sem3) {
                sem3.courses = sem3.courses || [];
                sem3.courses.push({
                    code: "01140052",
                    altCode: "114052",
                    name: "פיזיקה 2",
                    credits: 3.5,
                    type: "mandatory",
                    variantGroupId: "physics_2",
                    prereqs: ["01140051", "01040041"]
                });
                console.log('[Planner] Restored Physics 2 to Semester 3');
            }
        }

        const hasPhysLab = ['01140032', '114032', '01140039', '114039'].some(k => allCodes.has(k));
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

if ensure_target in planner_text:
    planner_text = planner_text.replace(ensure_target, ensure_replacement, 1)
    print("Added Physics Lab 1H check to ensureEssentialCoursesInPlan in planner_module.js")

# In initPlannerState(): Ensure for Adir that Physics Lab is in Semester 4 (not 5)
adir_lab_move = """        // Ensure Physics Lab (114032) is in Semester 4 for Adir
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
        }"""

after_purging = """        // 1b. Purge accidental test infiltrator courses for Adir"""
if after_purging in planner_text:
    planner_text = planner_text.replace(after_purging, adir_lab_move + '\n\n' + after_purging, 1)
    print("Added Adir Physics Lab Semester 4 placement in initPlannerState in planner_module.js")

with open('planner_module.js', 'w', encoding='utf-8') as f:
    f.write(planner_text)
print("planner_module.js updated successfully!")


print("\n--- 5. Updating app.js ---")
with open('app.js', 'r', encoding='utf-8') as f:
    app_text = f.read()

# Update flowchart column position for Semester 4 and 5:
# Old:
# "034055": 1, "034032": 2, "034010": 3, "034030": 5,
# "034058": 0, "034041": 1, "034051": 2, "114032": 3, "034040": 4, "034054": 5,
old_cols = """        // Semester 4 (4 courses)
        "034055": 1, "034032": 2, "034010": 3, "034030": 5,
        // Semester 5 (6 courses)
        "034058": 0, "034041": 1, "034051": 2, "114032": 3, "034040": 4, "034054": 5,"""

new_cols = """        // Semester 4 (5 courses: columns 0, 1, 2, 3, 5)
        "114032": 0, "034055": 1, "034032": 2, "034010": 3, "034030": 5,
        // Semester 5 (5 courses: columns 0, 1, 2, 4, 5)
        "034058": 0, "034041": 1, "034051": 2, "034040": 4, "034054": 5,"""

if old_cols in app_text:
    app_text = app_text.replace(old_cols, new_cols, 1)
    print("Updated flowchart column mapping in app.js for Sem 4 & 5")
else:
    print("Warning: old_cols not found in app.js!")

# Update radial tree mapping:
# "114032": { sem: 5, angle: 150, branch: "math" }, // מעבדה בפיזיקה
app_text = re.sub(
    r'"114032":\s*\{\s*sem:\s*5,\s*angle:\s*150,\s*branch:\s*"math"\s*\}',
    r'"114032": { sem: 4, angle: 150, branch: "math" }',
    app_text
)

# In INITIAL_STATE:
app_text = re.sub(
    r'("114032":\s*\{[^}]*?"semester":\s*)5',
    r'\g<1>4',
    app_text
)

# In loadSavedState(): ensure 114032 is in semester 4
app_lab_move = """                    // Ensure Physics Lab 1H (114032) is assigned to Semester 4
                    if (isAdir && gameState && gameState.courses && gameState.courses['114032']) {
                        gameState.courses['114032'].semester = 4;
                    }"""

find_purged_app = """                    // Purge accidental QA test infiltrator courses for Adir"""
if find_purged_app in app_text:
    app_text = app_text.replace(find_purged_app, app_lab_move + '\n\n' + find_purged_app, 1)
    print("Added 114032 semester 4 ensure in loadSavedState in app.js")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(app_text)
print("app.js updated successfully!")

print("\n--- 6. Syncing dist and mobile bundle ---")
dist_app = r'dist\Semestero ME-win32-x64\resources\app'
if os.path.exists(dist_app):
    for fn in ['app.js', 'planner_module.js', 'planner_catalog.js', 'preloaded_user_state.js', 'user_saved_state.json', 'sw.js', 'index.html', 'package.json']:
        if os.path.exists(fn):
            shutil.copy2(fn, os.path.join(dist_app, fn))
    print(f"Synchronized updated files to {dist_app}")

print("\nAll Physics Lab Semester 4 updates completed successfully!")
