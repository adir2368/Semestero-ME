const fs = require('fs');
const assert = require('assert');

// Simulate the logic
function runSimulation() {
    console.log("Starting Manual Task Visibility Test Simulation...");

    const curActiveSem = 3;
    const activeSemesterFilters = new Set([3]); // User has Semester 3 filter active by default
    let isFocusMode = true; // Focus mode enabled

    // Course 1: Elective in Semester 5, but student has it active
    const courseElective = {
        code: "00360015",
        name: "שיטות אלמנטים סופיים בהנדסה 1",
        semester: 5,
        status: "active",
        tasks: []
    };

    // Course 2: Core Course in Semester 3, already has an uncompleted HW 1 from Moodle
    const courseCore = {
        code: "034033",
        name: "מבוא למערכות לינאריות",
        semester: 3,
        status: "active",
        tasks: [
            {
                id: "moodle_101",
                title: "שיעורי בית 1",
                type: "hw",
                dueDate: "2026-11-10",
                completed: false,
                status: "not_started",
                source: "moodle"
            }
        ]
    };

    // Course 3: Past course in Semester 2 (marked mastered), user adds a makeup task
    const coursePast = {
        code: "114051",
        name: "פיסיקה 1",
        semester: 2,
        status: "mastered",
        tasks: []
    };

    const gameState = {
        currentActiveSemester: 3,
        courses: {
            "00360015": courseElective,
            "034033": courseCore,
            "114051": coursePast
        }
    };

    // Scenario A: Add manual task to Elective (Semester 5, status active)
    const taskElective = {
        id: "task-elective-1",
        title: "תרגיל בית 1 - אלמנטים סופיים",
        type: "hw",
        dueDate: "2026-11-15",
        completed: false,
        status: "not_started",
        source: "manual"
    };
    courseElective.tasks.push(taskElective);

    // Scenario B: Add manual task to Core course that ALREADY has HW 1
    const taskCoreManual = {
        id: "task-core-2",
        title: "תרגיל בית 2 (ידני)",
        type: "hw",
        dueDate: "2026-11-20",
        completed: false,
        status: "not_started",
        source: "manual"
    };
    courseCore.tasks.push(taskCoreManual);

    // Scenario C: Add manual task to Past mastered course
    const taskPastManual = {
        id: "task-past-1",
        title: "הגשת פרויקט השלמה",
        type: "project",
        dueDate: "2026-11-25",
        completed: false,
        status: "not_started",
        source: "manual"
    };
    coursePast.tasks.push(taskPastManual);

    function getTaskNormalizedCategory(type) {
        if (!type) return 'hw';
        const t = String(type).toLowerCase();
        if (t === 'exam' || t === 'midterm' || t === 'moed_a' || t === 'moed_b') return 'exam';
        if (t === 'project' || t === 'lab') return 'project';
        return 'hw';
    }

    // NEW LOGIC
    function collectAndFilterTasks(filterSemActiveOnly = true, focusModeActive = true) {
        let allTasks = [];
        Object.values(gameState.courses).forEach(course => {
            const cSem = course.semester || 1;
            const isCourseActiveNow = (course.status === 'active');
            const hasPendingTasks = course.tasks && course.tasks.some(t => !t.completed && t.status !== 'done' && t.status !== 'submitted');

            if (filterSemActiveOnly && activeSemesterFilters) {
                // Course matches if its semester is in active filters, OR if it's currently active and current semester is selected, OR if it has pending manual/uncompleted tasks
                const matchesSem = activeSemesterFilters.has(cSem) || 
                                   (isCourseActiveNow && activeSemesterFilters.has(curActiveSem)) ||
                                   (hasPendingTasks && activeSemesterFilters.has(curActiveSem));
                if (!matchesSem) return;
            }

            course.tasks.forEach(task => {
                const dueTime = task.dueDate ? (Date.parse(task.dueDate) || Infinity) : Infinity;
                allTasks.push({ course, task, dueTime });
            });
        });

        // Focus mode filtering
        if (focusModeActive) {
            const uncompletedSeqSeen = new Set();
            allTasks.sort((a, b) => a.dueTime - b.dueTime);
            allTasks = allTasks.filter(item => {
                const isDone = item.task.status === 'done' || item.task.status === 'submitted';
                if (isDone) return true;

                // Manual tasks and pinned tasks are EXEMPT from gating!
                if (item.task.source === 'manual' || item.task.pinned) {
                    return true;
                }

                const cat = getTaskNormalizedCategory(item.task.type);
                const seqKey = `${item.course.code}:::${cat}`;
                if (uncompletedSeqSeen.has(seqKey)) {
                    return false;
                }
                uncompletedSeqSeen.add(seqKey);
                return true;
            });
        }

        return allTasks;
    }

    const tasks = collectAndFilterTasks(true, true);
    console.log("Visible tasks count:", tasks.length);
    tasks.forEach(t => console.log(` - [${t.course.code}] ${t.task.title} (source: ${t.task.source})`));

    // Assertions
    assert.strictEqual(tasks.some(t => t.task.id === "task-elective-1"), true, "Elective manual task must be visible!");
    assert.strictEqual(tasks.some(t => t.task.id === "task-core-2"), true, "Core course second manual task must be visible even with focus mode!");
    assert.strictEqual(tasks.some(t => t.task.id === "task-past-1"), true, "Past course manual task must be visible!");
    console.log("All assertions PASSED successfully! 🚀");
}

runSimulation();
