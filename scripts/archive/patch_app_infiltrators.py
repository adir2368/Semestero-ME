import re

file_path = r'C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. At the beginning of loadSavedState()
load_target = """function loadSavedState() {
    let loadedFromAuthSync = false;"""

load_patch = """function loadSavedState() {
    let loadedFromAuthSync = false;

    // Self-healing cleanup for accidental QA test courses in Adir's local storage
    try {
        ['ast_custom_degree_plan_v2_adir', 'ast_custom_degree_plan_v2', 'academic_skill_tree_save'].forEach(k => {
            const raw = localStorage.getItem(k);
            if (raw && (raw.includes('03240269') || raw.includes('03940800') || raw.includes('03940808'))) {
                const parsed = JSON.parse(raw);
                let touched = false;
                if (Array.isArray(parsed.semesters)) {
                    parsed.semesters.forEach(s => {
                        if (s.semester === 4 && Array.isArray(s.courses)) {
                            s.courses = s.courses.filter(c => !['03240269', '03940800', '03940808'].includes(c.code) && !['03240269', '03940800', '03940808'].includes(c.altCode));
                            touched = true;
                        }
                    });
                }
                if (parsed.courses) {
                    ['03240269', '03940800', '03940808'].forEach(c => {
                        if (parsed.courses[c] && !parsed.courses[c].grade) {
                            delete parsed.courses[c];
                            touched = true;
                        }
                    });
                }
                if (touched) {
                    localStorage.setItem(k, JSON.stringify(parsed));
                }
            }
        });
    } catch (e) {}"""

assert load_target in content, "load_target not found in app.js!"
content = content.replace(load_target, load_patch, 1)

# 2. In loadSavedState() where saved state is parsed
saved_block = """                    Object.values(gameState.courses).forEach(course => {
                        if (course.status === 'mastered' && course.tasks) {
                            course.tasks.forEach(task => {
                                task.completed = true;
                                task.status = 'done';
                            });
                        }
                    });"""

saved_patch = """                    Object.values(gameState.courses).forEach(course => {
                        if (course.status === 'mastered' && course.tasks) {
                            course.tasks.forEach(task => {
                                task.completed = true;
                                task.status = 'done';
                            });
                        }
                    });

                    // Purge accidental QA test infiltrator courses for Adir
                    if (isAdir && gameState && gameState.courses) {
                        ['03240269', '03940800', '03940808'].forEach(code => {
                            if (gameState.courses[code] && !gameState.courses[code].grade && (gameState.courses[code].semester === 4 || !gameState.courses[code].semester)) {
                                delete gameState.courses[code];
                            }
                        });
                        if (Array.isArray(gameState.degreePlan)) {
                            gameState.degreePlan.forEach(sem => {
                                if (sem.semester === 4 && Array.isArray(sem.courses)) {
                                    sem.courses = sem.courses.filter(c => !['03240269', '03940800', '03940808'].includes(c.code) && !['03240269', '03940800', '03940808'].includes(c.altCode));
                                }
                            });
                        }
                    }"""

assert saved_block in content, "saved_block not found in app.js!"
content = content.replace(saved_block, saved_patch, 1)

# 3. In recovery block
recov_target = """    if (isAdirForRecovery && gameState && gameState.courses && preloadedForRecovery && preloadedForRecovery.courses) {
        let healed = false;"""

recov_patch = """    if (isAdirForRecovery && gameState && gameState.courses && preloadedForRecovery && preloadedForRecovery.courses) {
        let healed = false;
        // Purge accidental QA test infiltrator courses for Adir
        ['03240269', '03940800', '03940808'].forEach(code => {
            if (gameState.courses[code] && !gameState.courses[code].grade && (gameState.courses[code].semester === 4 || !gameState.courses[code].semester)) {
                delete gameState.courses[code];
                healed = true;
            }
        });
        if (Array.isArray(gameState.degreePlan)) {
            gameState.degreePlan.forEach(sem => {
                if (sem.semester === 4 && Array.isArray(sem.courses)) {
                    const origLen = sem.courses.length;
                    sem.courses = sem.courses.filter(c => !['03240269', '03940800', '03940808'].includes(c.code) && !['03240269', '03940800', '03940808'].includes(c.altCode));
                    if (sem.courses.length !== origLen) healed = true;
                }
            });
        }"""

assert recov_target in content, "recov_target not found in app.js!"
content = content.replace(recov_target, recov_patch, 1)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("app.js patched successfully!")
