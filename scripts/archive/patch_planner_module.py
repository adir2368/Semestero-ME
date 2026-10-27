import re

fp = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\planner_module.js"
with open(fp, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update QA_INFILTRATOR_CODES
old_infiltrators = """    // Test Infiltrator Courses (Accidental QA additions to be purged from student plan)
    const QA_INFILTRATOR_CODES = new Set([
        '03240269', '3240269',
        '03940800', '3940800',
        '03940808', '3940808'
    ]);"""

new_infiltrators = """    // Test Infiltrator Courses (Accidental QA additions / invalid sports / malag in semester 4)
    const QA_INFILTRATOR_CODES = new Set([
        '03240269', '3240269',
        '03940800', '3940800', '0394800', '394800',
        '03940808', '3940808', '0394808', '394808'
    ]);"""

assert old_infiltrators in content, "old_infiltrators not found"
content = content.replace(old_infiltrators, new_infiltrators, 1)

# 2. Update init infiltrator purge
old_init_purge = """        // 1b. Purge accidental test infiltrator courses for Adir
        if (isAdir && customPlan) {
            customPlan.forEach(sem => {
                if (sem.semester === 4) {
                    sem.courses = (sem.courses || []).filter(c => {
                        const keys = getNormalizedCodes(c.code, c.altCode);
                        return !keys.some(k => QA_INFILTRATOR_CODES.has(k));
                    });
                }
            });
            if (global.gameState && global.gameState.courses) {
                QA_INFILTRATOR_CODES.forEach(code => {
                    const c = global.gameState.courses[code];
                    if (c && !c.grade && (c.semester === 4 || !c.semester)) {
                        delete global.gameState.courses[code];
                    }
                });
            }
        }"""

new_init_purge = """        // 1b. Unconditional purge of accidental test infiltrator courses & sports from semester 4
        if (customPlan && Array.isArray(customPlan)) {
            let touchedPlan = false;
            customPlan.forEach(sem => {
                if (sem.semester === 4) {
                    const origLen = (sem.courses || []).length;
                    sem.courses = (sem.courses || []).filter(c => {
                        if (!c) return false;
                        const keys = getNormalizedCodes(c.code, c.altCode);
                        if (keys.some(k => QA_INFILTRATOR_CODES.has(k))) return false;
                        if (c.type === 'sports' || c.list === 'SPORTS') return false;
                        const codeStr = String(c.code || '');
                        if (codeStr.startsWith('0394') || codeStr.startsWith('394')) return false;
                        if (codeStr.startsWith('0324') || codeStr.startsWith('324')) return false;
                        return true;
                    });
                    if (sem.courses.length !== origLen) touchedPlan = true;
                }
            });
            if (touchedPlan) {
                try {
                    this.saveCustomPlan();
                } catch (e) {}
            }
            if (global.gameState && global.gameState.courses) {
                QA_INFILTRATOR_CODES.forEach(code => {
                    const c = global.gameState.courses[code];
                    if (c && !c.grade && (c.semester === 4 || !c.semester)) {
                        delete global.gameState.courses[code];
                    }
                });
            }
        }"""

assert old_init_purge in content, "old_init_purge not found"
content = content.replace(old_init_purge, new_init_purge, 1)

# 3. Update syncPlannerToTree infiltrators
old_sync_purge = """            // 1. Purge accidental 8-digit duplicate courses and purged courses from gameState.courses
            const PURGED_TREE_CODES = new Set(['035044', '035026', '35026', '01140071', '114071']);
            if (isAdirAuthenticated()) {
                QA_INFILTRATOR_CODES.forEach(code => PURGED_TREE_CODES.add(code));
            }"""

new_sync_purge = """            // 1. Purge accidental duplicate courses and purged courses from gameState.courses
            const PURGED_TREE_CODES = new Set(['035044', '035026', '35026', '01140071', '114071']);
            QA_INFILTRATOR_CODES.forEach(code => PURGED_TREE_CODES.add(code));"""

assert old_sync_purge in content, "old_sync_purge not found"
content = content.replace(old_sync_purge, new_sync_purge, 1)

old_sem4_sync = """                    if (isAdirAuthenticated() && semNum === 4) {
                        const cKeys = getNormalizedCodes(c.code, c.altCode);
                        if (cKeys.some(k => QA_INFILTRATOR_CODES.has(k))) return;
                    }"""

new_sem4_sync = """                    if (semNum === 4) {
                        const cKeys = getNormalizedCodes(c.code, c.altCode);
                        if (cKeys.some(k => QA_INFILTRATOR_CODES.has(k))) return;
                        if (c.type === 'sports' || c.list === 'SPORTS') return;
                        const codeStr = String(c.code || '');
                        if (codeStr.startsWith('0394') || codeStr.startsWith('394')) return;
                        if (codeStr.startsWith('0324') || codeStr.startsWith('324')) return;
                    }"""

assert old_sem4_sync in content, "old_sem4_sync not found"
content = content.replace(old_sem4_sync, new_sem4_sync, 1)

# Ensure global.escapeHtml is assigned
if "global.escapeHtml = escapeHtml;" not in content:
    content = content.replace(
        "function escapeHtml(str) {",
        "function escapeHtml(str) {\n        if (typeof global !== 'undefined') global.escapeHtml = escapeHtml;\n        if (typeof window !== 'undefined') window.escapeHtml = escapeHtml;",
        1
    )

with open(fp, "w", encoding="utf-8") as f:
    f.write(content)

print("Successfully patched planner_module.js!")
