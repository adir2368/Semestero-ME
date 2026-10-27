import sys

fp = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js"
with open(fp, "r", encoding="utf-8") as f:
    content = f.read()

# 1. escapeHtml definition before openCourseDetails
escape_html_def = """function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
if (typeof window !== 'undefined') window.escapeHtml = escapeHtml;

// Open and load details into Course Details Modal
function openCourseDetails(code) {"""

assert "// Open and load details into Course Details Modal\nfunction openCourseDetails(code) {" in content
content = content.replace(
    "// Open and load details into Course Details Modal\nfunction openCourseDetails(code) {",
    escape_html_def,
    1
)

# 2. Defensive init + try block
old_init = """    if (!course) return;

    currentSelectedCourse = course;

    // Header values"""

new_init = """    if (!course) return;

    // Defensive initialization of collections to prevent any downstream TypeError
    course.tasks = Array.isArray(course.tasks) ? course.tasks : [];
    course.prerequisites = Array.isArray(course.prerequisites) ? course.prerequisites : [];
    course.schedule = Array.isArray(course.schedule) ? course.schedule : [];

    currentSelectedCourse = course;

    try {
    // Header values"""

assert old_init in content
content = content.replace(old_init, new_init, 1)

# 3. catch and finally block at end of openCourseDetails
old_end = """    // UW Flow-style Peer Difficulty & Workload Consensus Section
    renderCoursePeerConsensus(course);

    // Render task items
    renderModalTaskList(course);

    // Show modal
    document.getElementById("course-modal").classList.add("active");
}"""

new_end = """    // UW Flow-style Peer Difficulty & Workload Consensus Section
    renderCoursePeerConsensus(course);

    // Render task items
    renderModalTaskList(course);
    } catch (err) {
        console.error("[openCourseDetails] Handled error rendering modal content:", err);
    } finally {
        // Show modal (guaranteed to execute even if sub-component has minor errors)
        const modal = document.getElementById("course-modal");
        if (modal) modal.classList.add("active");
    }
}"""

assert old_end in content
content = content.replace(old_end, new_end, 1)

# 4. deleteCourse enhancement
old_delete = """function deleteCourse(code) {
    const course = gameState.courses[code];
    if (!course) return;

    let xpRefund = 0;
    course.tasks.forEach(task => {
        if (task.completed) {
            xpRefund += task.xp;
        }
    });

    // Delete from tree
    delete gameState.courses[code];
    
    // Explicitly track in removedCourses so it is NEVER restored by curriculum templates!
    if (!gameState.removedCourses) gameState.removedCourses = [];
    if (!gameState.removedCourses.includes(code)) {
        gameState.removedCourses.push(code);
    }

    // Also remove from Degree Planner
    if (typeof DegreePlanner !== 'undefined' && DegreePlanner.removeCourse) {
        DegreePlanner.removeCourse(code);
    }

    // Remove from prerequisites of all other courses
    Object.keys(gameState.courses).forEach(cCode => {
        const c = gameState.courses[cCode];
        if (c.prerequisites) {
            c.prerequisites = c.prerequisites.filter(p => p !== code);
        }
    });

    gameState.lastModified = Date.now();

    recalculateCourseStates();
    if (xpRefund > 0) {
        addXp(-xpRefund); // subtract the XP gained from this course
    } else {
        saveState();
        renderUI();
    }
}"""

new_delete = """function deleteCourse(code) {
    if (!code) return;
    const clean = String(code).replace(/^0+/, '');
    const course = gameState.courses[code] || gameState.courses[clean] || gameState.courses['0' + clean];

    let xpRefund = 0;
    if (course && course.tasks && Array.isArray(course.tasks)) {
        course.tasks.forEach(task => {
            if (task.completed) {
                xpRefund += task.xp;
            }
        });
    }

    // Delete from tree under all possible code representations
    delete gameState.courses[code];
    delete gameState.courses[clean];
    delete gameState.courses['0' + clean];
    if (course && course.altCode) {
        delete gameState.courses[course.altCode];
        delete gameState.courses[String(course.altCode).replace(/^0+/, '')];
    }
    
    // Explicitly track in removedCourses so it is NEVER restored by curriculum templates!
    if (!gameState.removedCourses) gameState.removedCourses = [];
    if (!gameState.removedCourses.includes(code)) {
        gameState.removedCourses.push(code);
    }
    if (clean && !gameState.removedCourses.includes(clean)) {
        gameState.removedCourses.push(clean);
    }

    // Also remove from Degree Planner
    if (typeof DegreePlanner !== 'undefined' && DegreePlanner.removeCourse) {
        DegreePlanner.removeCourse(code);
        if (clean !== code) DegreePlanner.removeCourse(clean);
        if (course && course.altCode) DegreePlanner.removeCourse(course.altCode);
    }

    // Remove from prerequisites of all other courses
    Object.keys(gameState.courses).forEach(cCode => {
        const c = gameState.courses[cCode];
        if (c && c.prerequisites) {
            c.prerequisites = c.prerequisites.filter(p => p !== code && p !== clean);
        }
    });

    gameState.lastModified = Date.now();

    recalculateCourseStates();
    if (xpRefund > 0) {
        addXp(-xpRefund); // subtract the XP gained from this course
    } else {
        saveState();
        renderUI();
    }
}"""

assert old_delete in content
content = content.replace(old_delete, new_delete, 1)

# 5. loadSavedState cleanup scanner
old_load_scanner = """    // Comprehensive self-healing cleanup for accidental QA test courses across ALL storage keys
    try {
        const INFILTRATORS = ['03240269', '3240269', '03940800', '3940800', '03940808', '3940808'];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (!k) continue;
            const raw = localStorage.getItem(k);
            if (raw && (raw.includes('03240269') || raw.includes('03940800') || raw.includes('03940808'))) {
                try {
                    const parsed = JSON.parse(raw);
                    let touched = false;
                    if (Array.isArray(parsed.semesters)) {
                        parsed.semesters.forEach(s => {
                            if (s.semester === 4 && Array.isArray(s.courses)) {
                                const origLen = s.courses.length;
                                s.courses = s.courses.filter(c => !INFILTRATORS.includes(c.code) && !INFILTRATORS.includes(c.altCode));
                                if (s.courses.length !== origLen) touched = true;
                            }
                        });
                    }
                    if (Array.isArray(parsed.degreePlan)) {
                        parsed.degreePlan.forEach(s => {
                            if (s.semester === 4 && Array.isArray(s.courses)) {
                                const origLen = s.courses.length;
                                s.courses = s.courses.filter(c => !INFILTRATORS.includes(c.code) && !INFILTRATORS.includes(c.altCode));
                                if (s.courses.length !== origLen) touched = true;
                            }
                        });
                    }
                    if (parsed.courses) {
                        INFILTRATORS.forEach(c => {
                            if (parsed.courses[c] && !parsed.courses[c].grade) {
                                delete parsed.courses[c];
                                touched = true;
                            }
                        });
                    }
                    if (touched) {
                        localStorage.setItem(k, JSON.stringify(parsed));
                    }
                } catch (e) {}
            }
        }
    } catch (e) {}"""

new_load_scanner = """    // Comprehensive self-healing cleanup for accidental QA test courses across ALL storage keys
    try {
        const INFILTRATORS = [
            '03240269', '3240269',
            '03940800', '3940800', '0394800', '394800',
            '03940808', '3940808', '0394808', '394808'
        ];
        const isForbiddenSem4 = (c) => {
            if (!c) return false;
            const code = String(c.code || '');
            const alt = String(c.altCode || '');
            if (INFILTRATORS.includes(code) || INFILTRATORS.includes(alt)) return true;
            if (c.type === 'sports' || c.list === 'SPORTS') return true;
            if (code.startsWith('0394') || code.startsWith('394')) return true;
            if (code.startsWith('0324') || code.startsWith('324')) return true;
            return false;
        };

        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (!k) continue;
            const raw = localStorage.getItem(k);
            if (raw && (raw.includes('03240269') || raw.includes('03940800') || raw.includes('03940808') || raw.includes('394800') || raw.includes('394808'))) {
                try {
                    const parsed = JSON.parse(raw);
                    let touched = false;

                    // Case A: parsed is directly an Array of semesters (e.g. DegreePlanner customPlan)
                    if (Array.isArray(parsed)) {
                        parsed.forEach(s => {
                            if (s && s.semester === 4 && Array.isArray(s.courses)) {
                                const origLen = s.courses.length;
                                s.courses = s.courses.filter(c => !isForbiddenSem4(c));
                                if (s.courses.length !== origLen) touched = true;
                            }
                        });
                    }

                    // Case B: parsed has semesters array
                    if (parsed && Array.isArray(parsed.semesters)) {
                        parsed.semesters.forEach(s => {
                            if (s && s.semester === 4 && Array.isArray(s.courses)) {
                                const origLen = s.courses.length;
                                s.courses = s.courses.filter(c => !isForbiddenSem4(c));
                                if (s.courses.length !== origLen) touched = true;
                            }
                        });
                    }

                    // Case C: parsed has degreePlan array
                    if (parsed && Array.isArray(parsed.degreePlan)) {
                        parsed.degreePlan.forEach(s => {
                            if (s && s.semester === 4 && Array.isArray(s.courses)) {
                                const origLen = s.courses.length;
                                s.courses = s.courses.filter(c => !isForbiddenSem4(c));
                                if (s.courses.length !== origLen) touched = true;
                            }
                        });
                    }

                    // Case D: parsed has courses object
                    if (parsed && parsed.courses) {
                        INFILTRATORS.forEach(c => {
                            if (parsed.courses[c] && !parsed.courses[c].grade) {
                                delete parsed.courses[c];
                                touched = true;
                            }
                        });
                    }

                    if (touched) {
                        localStorage.setItem(k, JSON.stringify(parsed));
                        console.log(`[StorageSelfHeal] Purged infiltrators from localStorage key: ${k}`);
                    }
                } catch (e) {}
            }
        }
    } catch (e) {}"""

assert old_load_scanner in content
content = content.replace(old_load_scanner, new_load_scanner, 1)

# 6. Flowchart tree PURGED_FLOWCHART_CODES and semester 4 sports rejection
old_fc_purged = """    const PURGED_FLOWCHART_CODES = new Set([
        '035026', '35026', '035044', '01140071', '114071',
        '03240269', '3240269', '03940800', '3940800', '03940808', '3940808'
    ]);"""

new_fc_purged = """    const PURGED_FLOWCHART_CODES = new Set([
        '035026', '35026', '035044', '01140071', '114071',
        '03240269', '3240269',
        '03940800', '3940800', '0394800', '394800',
        '03940808', '3940808', '0394808', '394808'
    ]);"""

assert old_fc_purged in content
content = content.replace(old_fc_purged, new_fc_purged, 1)

old_fc_push = """        if (!semesterCourses[sem]) semesterCourses[sem] = [];
        semesterCourses[sem].push(course);"""

new_fc_push = """        if (!semesterCourses[sem]) semesterCourses[sem] = [];
        // Strict guard: sports courses or Malag infiltrators must NEVER enter semester 4 in flowchart!
        if (sem === 4) {
            const cKeys = [course.code, course.altCode, String(course.code).replace(/^0+/, '')];
            if (cKeys.some(k => PURGED_FLOWCHART_CODES.has(k))) return;
            if (course.type === 'sports' || course.list === 'SPORTS') return;
            const cStr = String(course.code || '');
            if (cStr.startsWith('0394') || cStr.startsWith('394')) return;
            if (cStr.startsWith('0324') || cStr.startsWith('324')) return;
        }
        semesterCourses[sem].push(course);"""

assert old_fc_push in content
content = content.replace(old_fc_push, new_fc_push, 1)

with open(fp, "w", encoding="utf-8") as f:
    f.write(content)

print("Successfully patched app.js!")
