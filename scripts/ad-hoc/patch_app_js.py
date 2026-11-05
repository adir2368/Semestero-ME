import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add getPangeaTaskUrl and getTaskNormalizedCategory helpers
helpers_code = '''
function getPangeaTaskUrl(courseCode, task) {
    if (task && task.pangeaUrl) return task.pangeaUrl;
    if (!courseCode) return null;
    const cleanCode = String(courseCode).trim().replace(/^0+/, '');
    const fullCode = String(courseCode).trim();
    const paddedCode = fullCode.padStart(8, '0');
    const directMap = (typeof PANGEA_COURSE_MAP !== 'undefined') ? PANGEA_COURSE_MAP : (window.PANGEA_COURSE_MAP || {});
    const mapped = directMap[fullCode] || directMap[cleanCode] || directMap[paddedCode];
    if (mapped) return mapped;
    return `https://idofangbentov.uk/?q=${encodeURIComponent(cleanCode || fullCode)}`;
}
window.getPangeaTaskUrl = getPangeaTaskUrl;

function getTaskNormalizedCategory(type) {
    if (!type) return 'hw';
    const t = String(type).toLowerCase();
    if (t === 'exam' || t === 'midterm' || t === 'moed_a' || t === 'moed_b' || t === 'moed_c') return 'exam';
    if (t === 'project' || t === 'lab' || t === 'work') return 'project';
    return 'hw';
}
window.getTaskNormalizedCategory = getTaskNormalizedCategory;
'''

target_render_fn = 'function renderNotionTasksTable() {'
assert target_render_fn in content, "renderNotionTasksTable not found"
content = content.replace(target_render_fn, helpers_code + '\n' + target_render_fn, 1)

# 2. Update renderNotionTasksTable gathering & filtering
old_gathering = '''    const courseFilterEl = document.getElementById("filter-course");
    const courseFilter = (courseFilterEl && courseFilterEl.value) ? courseFilterEl.value : "all";
    const activeStatusFilters = (typeof getActiveStatusFilters === 'function') ? getActiveStatusFilters() : [];
    const typeFilterEl = document.getElementById("filter-type");
    const typeFilter = (typeFilterEl && typeFilterEl.value) ? typeFilterEl.value : "all";
    const searchInput = document.getElementById("search-tasks");
    const searchQuery = (searchInput && searchInput.value) ? String(searchInput.value).trim().toLowerCase() : "";
    
    let allTasks = [];
    
    // Gather tasks and pre-compute timestamp for high-performance sorting
    Object.values(gameState.courses).forEach(course => {
        if (course.status !== 'active' && course.status !== 'mastered') return;
        if (courseFilter !== 'all' && course.code !== courseFilter) return;
        if (!Array.isArray(course.tasks)) course.tasks = [];
        if (window.MoodleSync && typeof window.MoodleSync.deduplicateCourseTasks === 'function') {
            window.MoodleSync.deduplicateCourseTasks(course);
        }
        course.tasks.forEach(task => {
            const dueTime = task.dueDate ? (Date.parse(task.dueDate) || Infinity) : Infinity;
            allTasks.push({
                course: course,
                task: task,
                dueTime: dueTime
            });
        });
    });'''

new_gathering = '''    const courseFilterEl = document.getElementById("filter-course");
    const courseFilter = (courseFilterEl && courseFilterEl.value) ? courseFilterEl.value : "all";
    const semesterFilterEl = document.getElementById("filter-semester");
    const semesterFilter = (semesterFilterEl && semesterFilterEl.value) ? semesterFilterEl.value : "active";
    const activeStatusFilters = (typeof getActiveStatusFilters === 'function') ? getActiveStatusFilters() : [];
    const activeTypeFilters = (typeof getActiveTypeFilters === 'function') ? getActiveTypeFilters() : ['hw', 'project', 'exam'];
    const searchInput = document.getElementById("search-tasks");
    const searchQuery = (searchInput && searchInput.value) ? String(searchInput.value).trim().toLowerCase() : "";
    
    let allTasks = [];
    
    // Gather tasks and pre-compute timestamp for high-performance sorting
    const curActiveSem = (gameState && gameState.currentActiveSemester) ? gameState.currentActiveSemester : 3;
    Object.values(gameState.courses).forEach(course => {
        if (course.status !== 'active' && course.status !== 'mastered' && course.status !== 'available') return;
        if (courseFilter !== 'all' && course.code !== courseFilter) return;
        
        // Semester Filter
        const cSem = course.semester || 1;
        if (semesterFilter === 'active') {
            if (cSem !== curActiveSem && (course.status === 'mastered' || cSem < curActiveSem)) {
                return; // Hide past completed semesters by default
            }
        } else if (semesterFilter !== 'all') {
            if (String(cSem) !== String(semesterFilter)) return;
        }

        if (!Array.isArray(course.tasks)) course.tasks = [];
        if (window.MoodleSync && typeof window.MoodleSync.deduplicateCourseTasks === 'function') {
            window.MoodleSync.deduplicateCourseTasks(course);
        }
        course.tasks.forEach(task => {
            const dueTime = task.dueDate ? (Date.parse(task.dueDate) || Infinity) : Infinity;
            allTasks.push({
                course: course,
                task: task,
                dueTime: dueTime
            });
        });
    });'''

assert old_gathering in content, "old_gathering not found in app.js"
content = content.replace(old_gathering, new_gathering, 1)

# 3. Update filter step inside allTasks.filter
old_filter_type = '''        // 2. Type Filter
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;'''

new_filter_type = '''        // 2. Multi-Select Type Filter
        const normCat = getTaskNormalizedCategory(t.type);
        if (activeTypeFilters.length > 0 && !activeTypeFilters.includes(normCat)) {
            return false;
        }'''

assert old_filter_type in content, "old_filter_type not found in app.js"
content = content.replace(old_filter_type, new_filter_type, 1)

# 4. Add Sequential Task Gating right after allTasks.filter
old_after_filter = '''        return true;
    });
    
    // Sort tasks: Pinned first, then incomplete first, then by pre-computed due date timestamp ascending'''

new_after_filter = '''        return true;
    });
    
    // Sequential Task Gating ("Next-Action Focus" / משימה רלוונטית בלבד)
    const focusBtn = document.getElementById("notion-focus-toggle-btn");
    const isFocusMode = focusBtn ? focusBtn.classList.contains("active") : (localStorage.getItem("semestero_notion_focus_mode") !== "false");
    if (isFocusMode && !searchQuery) {
        const uncompletedSeqSeen = new Set();
        allTasks.sort((a, b) => a.dueTime - b.dueTime);
        allTasks = allTasks.filter(item => {
            const isDone = item.task.status === 'done' || item.task.status === 'submitted';
            if (isDone) return true; // Allow completed history if status filter allows
            
            const cat = getTaskNormalizedCategory(item.task.type);
            const seqKey = `${item.course.code}:::${cat}`;
            if (uncompletedSeqSeen.has(seqKey)) {
                return false; // Gate subsequent uncompleted tasks in this sequence
            }
            uncompletedSeqSeen.add(seqKey);
            return true;
        });
    }
    
    // Sort tasks: Pinned first, then incomplete first, then by pre-computed due date timestamp ascending'''

assert old_after_filter in content, "old_after_filter not found in app.js"
content = content.replace(old_after_filter, new_after_filter, 1)

# 5. Update empty state colspan from 6 to 7
old_empty = 'tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">לא נמצאו משימות מתאימות.</td></tr>`;'
new_empty = 'tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">לא נמצאו משימות מתאימות.</td></tr>`;'
assert old_empty in content, "old_empty not found in app.js"
content = content.replace(old_empty, new_empty, 1)

# 6. Update moodle link and add pangea link and semester cell
old_row_render = '''        let moodleUrl = t.moodleUrl || '';
        if (!moodleUrl && (t.moodleEventId || t.source === 'moodle')) {
            const evId = t.moodleEventId || (t.id && t.id.startsWith('task_moodle_') ? t.id.split('_')[2] : '');
            if (evId && /^\\d+$/.test(evId)) {
                const baseHost = (gameState.moodleCalendarUrl && gameState.moodleCalendarUrl.includes('moodle25')) ? 'https://moodle25.technion.ac.il' : 'https://moodle26.technion.ac.il';
                moodleUrl = `${baseHost}/calendar/view.php?view=event&id=${evId}`;
            }
        }
        const moodleLinkHtml = moodleUrl ? `
            <a href="${moodleUrl}" target="_blank" rel="noopener noreferrer" class="notion-moodle-link-btn" title="מעבר לכרטיס המטלה במודל (לחץ 'עבור לפעילות' להגשה ישירה)" onclick="event.stopPropagation();">
                <span>🎓 הגשה במודל ↗</span>
            </a>
        ` : '';

        const isSelected = window.selectedTasksMap && window.selectedTasksMap.has(`${c.code}:::${t.id}`);
        rowsHtml += `
            <tr data-course-code="${c.code}" data-task-id="${t.id}" class="${isPinned ? 'is-task-pinned' : ''} ${isSelected ? 'is-row-selected' : ''}">
                <td class="notion-table-select-cell"><input type="checkbox" class="notion-row-checkbox" data-course-code="${c.code}" data-task-id="${t.id}" title="בחר משימה לפעולות מרובות" ${isSelected ? 'checked' : ''}></td>
                <td>
                    <div class="notion-title-cell">
                        ${pinBtnHtml}
                        <span class="notion-course-tag">
                            ${taskBadgeHtml}
                            ${miluimBadgeHtml}
                            <span class="notion-title-editable" contenteditable="true" spellcheck="false" title="לחץ לעריכת שם המשימה">${t.title}</span>
                        </span>
                        ${moodleLinkHtml}
                        <button class="notion-open-peek-btn" title="פתח תצוגת צד">🔲 OPEN</button>
                    </div>
                </td>
                <td>
                    <span class="notion-course-tag" data-course-code="${c.code}" style="cursor: pointer;" title="לחץ לשינוי סמל וצבע הקורס">
                        ${getCachedIcon(c.code)}
                        <span>${c.name}</span>
                    </span>
                </td>
                <td class="notion-table-date-cell">
                    <input type="date" class="notion-inline-date-input" value="${toIsoDateOnly(t.dueDate)}" title="לחץ לעריכת תאריך הגשה">
                </td>
                <td><span class="time-remaining ${timeInfo.className}">${timeInfo.text}</span></td>
                <td style="position: relative;">
                    <span class="notion-status-pill ${statusClass}" title="שנה סטטוס ישירות מהרשימה">${displayLabel}</span>
                </td>
            </tr>
        `;'''

new_row_render = '''        let moodleUrl = t.moodleUrl || '';
        if (!moodleUrl && (t.moodleEventId || t.source === 'moodle')) {
            const evId = t.moodleEventId || (t.id && t.id.startsWith('task_moodle_') ? t.id.split('_')[2] : '');
            if (evId && /^\\d+$/.test(evId)) {
                const baseHost = (gameState.moodleCalendarUrl && gameState.moodleCalendarUrl.includes('moodle25')) ? 'https://moodle25.technion.ac.il' : 'https://moodle26.technion.ac.il';
                moodleUrl = `${baseHost}/calendar/event.php?id=${evId}`;
            }
        }
        const moodleLinkHtml = moodleUrl ? `
            <a href="${moodleUrl}" target="_blank" rel="noopener noreferrer" class="notion-moodle-link-btn" title="מעבר לכרטיס המטלה או דף הפעילות במודל" onclick="event.stopPropagation();">
                <span>🎓 הגשה במודל ↗</span>
            </a>
        ` : '';

        const pangeaUrl = getPangeaTaskUrl(c.code, t);
        const pangeaLinkHtml = pangeaUrl ? `
            <a href="${pangeaUrl}" target="_blank" rel="noopener noreferrer" class="notion-pangea-link-btn" title="מעבר ישיר לסיכומי הקורס, דפי נוסחאות וחומרי לימוד בפנגייה (Ido Fang Bentov)" onclick="event.stopPropagation();">
                <span>🌍 פנגיאה ↗</span>
            </a>
        ` : '';

        const semNum = c.semester || 1;
        const semHebrewMap = { 1: 'א׳', 2: 'ב׳', 3: 'ג׳', 4: 'ד׳', 5: 'ה׳', 6: 'ו׳', 7: 'ז׳', 8: 'ח׳' };
        const semLabel = `סמסטר ${semHebrewMap[semNum] || semNum}`;

        const isSelected = window.selectedTasksMap && window.selectedTasksMap.has(`${c.code}:::${t.id}`);
        rowsHtml += `
            <tr data-course-code="${c.code}" data-task-id="${t.id}" class="${isPinned ? 'is-task-pinned' : ''} ${isSelected ? 'is-row-selected' : ''}">
                <td class="notion-table-select-cell"><input type="checkbox" class="notion-row-checkbox" data-course-code="${c.code}" data-task-id="${t.id}" title="בחר משימה לפעולות מרובות" ${isSelected ? 'checked' : ''}></td>
                <td>
                    <div class="notion-title-cell">
                        ${pinBtnHtml}
                        <span class="notion-course-tag">
                            ${taskBadgeHtml}
                            ${miluimBadgeHtml}
                            <span class="notion-title-editable" contenteditable="true" spellcheck="false" title="לחץ לעריכת שם המשימה">${t.title}</span>
                        </span>
                        ${moodleLinkHtml}
                        ${pangeaLinkHtml}
                        <button class="notion-open-peek-btn" title="פתח תצוגת צד">🔲 OPEN</button>
                    </div>
                </td>
                <td>
                    <span class="notion-course-tag" data-course-code="${c.code}" style="cursor: pointer;" title="לחץ לשינוי סמל וצבע הקורס">
                        ${getCachedIcon(c.code)}
                        <span>${c.name}</span>
                    </span>
                </td>
                <td>
                    <span class="notion-semester-pill sem-${semNum}">${semLabel}</span>
                </td>
                <td class="notion-table-date-cell">
                    <input type="date" class="notion-inline-date-input" value="${toIsoDateOnly(t.dueDate)}" title="לחץ לעריכת תאריך הגשה">
                </td>
                <td><span class="time-remaining ${timeInfo.className}">${timeInfo.text}</span></td>
                <td style="position: relative;">
                    <span class="notion-status-pill ${statusClass}" title="שנה סטטוס ישירות מהרשימה">${displayLabel}</span>
                </td>
            </tr>
        `;'''

assert old_row_render in content, "old_row_render not found in app.js"
content = content.replace(old_row_render, new_row_render, 1)

# 7. Update openTaskSidePeek
old_peek_moodle_code = '''    const moodleRow = document.getElementById("peek-property-moodle-row");
    const moodleLink = document.getElementById("peek-property-moodle-link");
    let resolvedMoodleUrl = task.moodleUrl || '';
    if (!resolvedMoodleUrl && (task.moodleEventId || task.source === 'moodle')) {
        const evId = task.moodleEventId || (task.id && task.id.startsWith('task_moodle_') ? task.id.split('_')[2] : '');
        if (evId && /^\\d+$/.test(evId)) {
            const baseHost = (gameState.moodleCalendarUrl && gameState.moodleCalendarUrl.includes('moodle25')) ? 'https://moodle25.technion.ac.il' : 'https://moodle26.technion.ac.il';
            resolvedMoodleUrl = `${baseHost}/calendar/view.php?view=event&id=${evId}`;
        }
    }
    if (moodleRow && moodleLink) {
        if (resolvedMoodleUrl) {
            moodleRow.style.display = "grid";
            moodleLink.href = resolvedMoodleUrl;
        } else {
            moodleRow.style.display = "none";
        }
    }'''

new_peek_moodle_code = '''    const moodleRow = document.getElementById("peek-property-moodle-row");
    const moodleLink = document.getElementById("peek-property-moodle-link");
    let resolvedMoodleUrl = task.moodleUrl || '';
    if (!resolvedMoodleUrl && (task.moodleEventId || task.source === 'moodle')) {
        const evId = task.moodleEventId || (task.id && task.id.startsWith('task_moodle_') ? task.id.split('_')[2] : '');
        if (evId && /^\\d+$/.test(evId)) {
            const baseHost = (gameState.moodleCalendarUrl && gameState.moodleCalendarUrl.includes('moodle25')) ? 'https://moodle25.technion.ac.il' : 'https://moodle26.technion.ac.il';
            resolvedMoodleUrl = `${baseHost}/calendar/event.php?id=${evId}`;
        }
    }
    if (moodleRow && moodleLink) {
        if (resolvedMoodleUrl) {
            moodleRow.style.display = "grid";
            moodleLink.href = resolvedMoodleUrl;
        } else {
            moodleRow.style.display = "none";
        }
    }

    const pangeaRow = document.getElementById("peek-property-pangea-row");
    const pangeaLink = document.getElementById("peek-property-pangea-link");
    const resolvedPangeaUrl = getPangeaTaskUrl(course.code, task);
    if (pangeaRow && pangeaLink) {
        if (resolvedPangeaUrl) {
            pangeaRow.style.display = "grid";
            pangeaLink.href = resolvedPangeaUrl;
        } else {
            pangeaRow.style.display = "none";
        }
    }'''

assert old_peek_moodle_code in content, "old_peek_moodle_code not found in app.js"
content = content.replace(old_peek_moodle_code, new_peek_moodle_code, 1)

# 8. Add setupNotionTypeFilterPopover, getActiveTypeFilters, updateTypeFilterSummary, setupNotionFocusToggle
type_filter_impl = '''
// Setup Notion Type Filter Popover listeners
function setupNotionTypeFilterPopover() {
    const btn = document.getElementById("notion-type-filter-btn");
    const popover = document.getElementById("notion-type-filter-popover");
    const clearBtn = document.getElementById("notion-type-filter-clear-btn");
    
    if (!btn || !popover) return;
    
    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        popover.classList.toggle("show");
        btn.classList.toggle("active", popover.classList.contains("show"));
    });
    
    document.addEventListener("mousedown", (e) => {
        if (!popover.contains(e.target) && !btn.contains(e.target)) {
            popover.classList.remove("show");
            btn.classList.remove("active");
        }
    });
    
    const optCheckboxes = popover.querySelectorAll(".notion-filter-type-cb");
    optCheckboxes.forEach(optCb => {
        optCb.addEventListener("change", () => {
            updateTypeFilterSummary();
            renderNotionTasksTable();
        });
    });
    
    if (clearBtn) {
        clearBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            optCheckboxes.forEach(cb => cb.checked = false);
            updateTypeFilterSummary();
            renderNotionTasksTable();
        });
    }
}

function getActiveTypeFilters() {
    const popover = document.getElementById("notion-type-filter-popover");
    if (!popover) return ['hw', 'project', 'exam'];
    
    const checkedOpts = popover.querySelectorAll(".notion-filter-type-cb:checked");
    return Array.from(checkedOpts).map(cb => cb.dataset.type);
}

function updateTypeFilterSummary() {
    const summarySpan = document.getElementById("notion-type-filter-summary");
    if (!summarySpan) return;
    
    const activeFilters = getActiveTypeFilters();
    if (activeFilters.length === 3) {
        summarySpan.innerText = "הכל (3)";
    } else if (activeFilters.length === 0) {
        summarySpan.innerText = "ללא סוג";
    } else if (activeFilters.length === 1) {
        const labels = { hw: "ש״ב וגיליונות", project: "עבודה / פרויקט", exam: "מבחני סוף" };
        summarySpan.innerText = labels[activeFilters[0]] || "1 נבחר";
    } else if (activeFilters.length === 2) {
        if (activeFilters.includes('hw') && activeFilters.includes('project')) summarySpan.innerText = "ש״ב + פרויקט";
        else if (activeFilters.includes('hw') && activeFilters.includes('exam')) summarySpan.innerText = "ש״ב + מבחנים";
        else if (activeFilters.includes('project') && activeFilters.includes('exam')) summarySpan.innerText = "פרויקט + מבחן";
        else summarySpan.innerText = "2 נבחרו";
    } else {
        summarySpan.innerText = `${activeFilters.length} נבחרו`;
    }
}

function setupNotionFocusToggle() {
    const focusBtn = document.getElementById("notion-focus-toggle-btn");
    if (!focusBtn) return;
    
    const saved = localStorage.getItem("semestero_notion_focus_mode");
    const isFocus = saved !== "false";
    focusBtn.classList.toggle("active", isFocus);
    
    focusBtn.onclick = (e) => {
        e.stopPropagation();
        const nextState = !focusBtn.classList.contains("active");
        focusBtn.classList.toggle("active", nextState);
        localStorage.setItem("semestero_notion_focus_mode", nextState ? "true" : "false");
        renderNotionTasksTable();
    };
}
'''

target_status_fn_marker = 'function updateFilterSummary() {'
idx = content.find(target_status_fn_marker)
assert idx != -1, "updateFilterSummary marker not found"
idx_close = content.find('}\n\n\n', idx)
if idx_close == -1:
    idx_close = content.find('}', content.find('}', idx) + 1)
content = content[:idx_close+1] + '\n' + type_filter_impl + content[idx_close+1:]

# 9. Update wiring in setupMainTabListeners
old_tab_listeners = '''    // 3. Filter Change Listeners & Popover Setup
    const filterCourse = document.getElementById("filter-course");
    const filterType = document.getElementById("filter-type");
    const searchInput = document.getElementById("search-tasks");
    
    if (filterCourse) filterCourse.addEventListener("change", renderNotionTasksTable);
    if (filterType) filterType.addEventListener("change", renderNotionTasksTable);
    if (searchInput) searchInput.addEventListener("input", renderNotionTasksTable);
    
    setupNotionFilterPopover();'''

new_tab_listeners = '''    // 3. Filter Change Listeners & Popover Setup
    const filterCourse = document.getElementById("filter-course");
    const filterSemester = document.getElementById("filter-semester");
    const searchInput = document.getElementById("search-tasks");
    
    if (filterCourse) filterCourse.addEventListener("change", renderNotionTasksTable);
    if (filterSemester) filterSemester.addEventListener("change", renderNotionTasksTable);
    if (searchInput) searchInput.addEventListener("input", renderNotionTasksTable);
    
    setupNotionFilterPopover();
    setupNotionTypeFilterPopover();
    setupNotionFocusToggle();'''

assert old_tab_listeners in content, "old_tab_listeners not found in app.js"
content = content.replace(old_tab_listeners, new_tab_listeners, 1)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("app.js patched successfully!")
