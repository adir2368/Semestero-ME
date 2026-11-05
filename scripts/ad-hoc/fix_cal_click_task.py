with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. In cell.querySelectorAll(".cal-event-pill.exam-event")
old_pill_click = '''    // Exam event click listener -> Open task side peek if task exists, else course details
    cell.querySelectorAll(".cal-event-pill.exam-event").forEach(pill => {
        pill.addEventListener("click", (e) => {
            e.stopPropagation();
            const cCode = pill.dataset.courseCode;
            const tId = pill.dataset.taskId;
            if (cCode && tId && typeof openTaskSidePeek === 'function') {
                openTaskSidePeek(cCode, tId);
            } else if (cCode) {
                openCourseDetails(cCode);
            }
        });
    });'''

new_pill_click = '''    // Exam event click listener -> Open task side peek (always prioritize task over course)
    cell.querySelectorAll(".cal-event-pill.exam-event").forEach(pill => {
        pill.addEventListener("click", (e) => {
            e.stopPropagation();
            const cCode = pill.dataset.courseCode;
            let tId = pill.dataset.taskId;
            if (!tId && cCode && gameState.courses && gameState.courses[cCode]) {
                const c = gameState.courses[cCode];
                const examTask = (c.tasks || []).find(t => t.type === 'exam') || (c.tasks || [])[0];
                if (examTask) tId = examTask.id;
            }
            if (cCode && tId && typeof openTaskSidePeek === 'function') {
                openTaskSidePeek(cCode, tId);
            } else if (cCode) {
                openCourseDetails(cCode);
            }
        });
    });'''

if old_pill_click in content:
    content = content.replace(old_pill_click, new_pill_click)
    print("PASS: Updated exam pill click listener")
else:
    print("FAIL: old_pill_click not found")

# 2. In renderDayModalEventsList
old_modal_click = '''        if (item.isTaskEvent || item.isExamEvent) {
            itemRow.style.cursor = "pointer";
            itemRow.title = "לחץ לצפייה בפרטי המשימה";
            itemRow.addEventListener("click", (e) => {
                if (e.target.closest(".btn-del-modal-event")) return;
                closeCalendarDayModal();
                if (item.courseCode && item.taskId && typeof openTaskSidePeek === 'function') {
                    openTaskSidePeek(item.courseCode, item.taskId);
                } else if (item.courseCode) {
                    openCourseDetails(item.courseCode);
                }
            });
        }'''

new_modal_click = '''        if (item.isTaskEvent || item.isExamEvent) {
            itemRow.style.cursor = "pointer";
            itemRow.title = "לחץ לצפייה בפרטי המשימה";
            itemRow.addEventListener("click", (e) => {
                if (e.target.closest(".btn-del-modal-event")) return;
                closeCalendarDayModal();
                let tId = item.taskId;
                if (!tId && item.courseCode && gameState.courses && gameState.courses[item.courseCode]) {
                    const c = gameState.courses[item.courseCode];
                    const examTask = (c.tasks || []).find(t => t.type === 'exam') || (c.tasks || [])[0];
                    if (examTask) tId = examTask.id;
                }
                if (item.courseCode && tId && typeof openTaskSidePeek === 'function') {
                    openTaskSidePeek(item.courseCode, tId);
                } else if (item.courseCode) {
                    openCourseDetails(item.courseCode);
                }
            });
        }'''

if old_modal_click in content:
    content = content.replace(old_modal_click, new_modal_click)
    print("PASS: Updated modal event click listener")
else:
    print("FAIL: old_modal_click not found")

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done patching app.js calendar event click handlers!")
