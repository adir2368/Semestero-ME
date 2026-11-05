import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

app_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js"
with open(app_path, "r", encoding="utf-8") as f:
    text = f.read()

# Add the new Semester and Course filter popover setup functions right before setupNotionTypeFilterPopover
target_after_type = "function setupNotionTypeFilterPopover() {"

filter_functions = """// ==========================================
// Notion Multi-Select Semester Filter Popover
// ==========================================
function setupNotionSemesterFilterPopover() {
    const btn = document.getElementById("notion-semester-filter-btn");
    const popover = document.getElementById("notion-semester-filter-popover");
    const selectAllBtn = document.getElementById("notion-semester-select-all");
    
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
    
    const semCheckboxes = popover.querySelectorAll(".notion-sem-opt-cb");
    semCheckboxes.forEach(cb => {
        cb.addEventListener("change", () => {
            updateSemesterFilterSummary();
            renderNotionTasksTable();
        });
    });
    
    if (selectAllBtn) {
        selectAllBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const allChecked = Array.from(semCheckboxes).every(cb => cb.checked);
            semCheckboxes.forEach(cb => cb.checked = !allChecked);
            selectAllBtn.innerText = allChecked ? "בחר הכל" : "בטל הכל";
            updateSemesterFilterSummary();
            renderNotionTasksTable();
        });
    }
}

function getActiveSemesterFilters() {
    const popover = document.getElementById("notion-semester-filter-popover");
    if (!popover) return null;
    const checkedOpts = popover.querySelectorAll(".notion-sem-opt-cb:checked");
    if (checkedOpts.length === 0) return new Set();
    const sems = new Set();
    checkedOpts.forEach(cb => {
        const val = parseInt(cb.getAttribute("data-sem"), 10);
        if (!isNaN(val)) sems.add(val);
    });
    return sems;
}

function updateSemesterFilterSummary() {
    const summary = document.getElementById("notion-semester-filter-summary");
    const popover = document.getElementById("notion-semester-filter-popover");
    const hiddenSelect = document.getElementById("filter-semester");
    if (!summary || !popover) return;
    
    const checkboxes = popover.querySelectorAll(".notion-sem-opt-cb");
    const checked = popover.querySelectorAll(".notion-sem-opt-cb:checked");
    
    const semHebrewMap = { 1: 'א׳', 2: 'ב׳', 3: 'ג׳', 4: 'ד׳', 5: 'ה׳', 6: 'ו׳' };
    
    if (checked.length === checkboxes.length) {
        summary.innerText = "כל הסמסטרים";
        if (hiddenSelect) hiddenSelect.value = "all";
    } else if (checked.length === 0) {
        summary.innerText = "ללא סמסטר (0)";
        if (hiddenSelect) hiddenSelect.value = "none";
    } else if (checked.length === 1) {
        const sem = checked[0].getAttribute("data-sem");
        summary.innerText = `סמסטר ${semHebrewMap[sem] || sem}${sem === '3' ? ' (נוכחי)' : ''}`;
        if (hiddenSelect) hiddenSelect.value = sem;
    } else {
        const names = Array.from(checked).map(cb => semHebrewMap[cb.getAttribute("data-sem")] || cb.getAttribute("data-sem"));
        summary.innerText = `סמסטר ` + names.join(', ');
        if (hiddenSelect) hiddenSelect.value = checked[0].getAttribute("data-sem");
    }
}

// ==========================================
// Notion Multi-Select Course Filter Popover
// ==========================================
function setupNotionCourseFilterPopover() {
    const btn = document.getElementById("notion-course-filter-btn");
    const popover = document.getElementById("notion-course-filter-popover");
    const selectAllBtn = document.getElementById("notion-course-select-all");
    
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
    
    if (selectAllBtn) {
        selectAllBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const courseCbs = popover.querySelectorAll(".notion-course-opt-cb");
            const allChecked = Array.from(courseCbs).every(cb => cb.checked);
            courseCbs.forEach(cb => cb.checked = !allChecked);
            selectAllBtn.innerText = allChecked ? "בחר הכל" : "בטל הכל";
            updateCourseFilterSummary();
            renderNotionTasksTable();
        });
    }
}

function getActiveCourseFilters() {
    const popover = document.getElementById("notion-course-filter-popover");
    if (!popover) return null;
    const all = popover.querySelectorAll(".notion-course-opt-cb");
    const checked = popover.querySelectorAll(".notion-course-opt-cb:checked");
    if (all.length === 0 || checked.length === all.length) return null; // null means all allowed
    const courses = new Set();
    checked.forEach(cb => courses.add(cb.getAttribute("data-course-code")));
    return courses;
}

function updateCourseFilterSummary() {
    const summary = document.getElementById("notion-course-filter-summary");
    const popover = document.getElementById("notion-course-filter-popover");
    const hiddenSelect = document.getElementById("filter-course");
    if (!summary || !popover) return;
    
    const checkboxes = popover.querySelectorAll(".notion-course-opt-cb");
    const checked = popover.querySelectorAll(".notion-course-opt-cb:checked");
    
    if (checkboxes.length === 0 || checked.length === checkboxes.length) {
        summary.innerText = "הכל (כל הקורסים)";
        if (hiddenSelect) hiddenSelect.value = "all";
    } else if (checked.length === 0) {
        summary.innerText = "ללא קורסים (0)";
        if (hiddenSelect) hiddenSelect.value = "none";
    } else if (checked.length <= 2) {
        const names = Array.from(checked).map(cb => {
            const code = cb.getAttribute("data-course-code");
            return (typeof COURSE_SHORT_NAMES !== 'undefined' && COURSE_SHORT_NAMES[code]) || code;
        });
        summary.innerText = names.join(', ');
        if (hiddenSelect) hiddenSelect.value = checked[0].getAttribute("data-course-code");
    } else {
        summary.innerText = `${checked.length} קורסים נבחרו`;
        if (hiddenSelect) hiddenSelect.value = checked[0].getAttribute("data-course-code");
    }
}

"""

if target_after_type in text and "setupNotionSemesterFilterPopover" not in text:
    text = text.replace(target_after_type, filter_functions + target_after_type, 1)
    print("Added Notion semester and course filter functions to app.js")

# Hook them up in init
init_call_target = "setupNotionTypeFilterPopover();"
init_call_replacement = """setupNotionTypeFilterPopover();
    setupNotionSemesterFilterPopover();
    setupNotionCourseFilterPopover();"""

if init_call_target in text and "setupNotionSemesterFilterPopover();" not in text:
    text = text.replace(init_call_target, init_call_replacement, 1)
    print("Hooked up popovers in app initialization")

# Update populateNotionCourseFilter
target_pop_filter = """function populateNotionCourseFilter() {
    const select = document.getElementById("filter-course");
    if (!select) return;
    
    const currentVal = select.value || "all";
    select.innerHTML = '<option value="all">הכל (כל הקורסים)</option>';

    Object.values(gameState.courses).forEach(course => {
        if (course.status === 'active') {
            const opt = document.createElement("option");
            opt.value = course.code;
            const shortName = COURSE_SHORT_NAMES[course.code] || course.name;
            opt.innerText = `${shortName} - ${course.name} (${course.code.toUpperCase()})`;
            select.appendChild(opt);
        }
    });

    select.value = currentVal;
}"""

replacement_pop_filter = """function populateNotionCourseFilter() {
    const select = document.getElementById("filter-course");
    if (select) {
        const currentVal = select.value || "all";
        select.innerHTML = '<option value="all">הכל (כל הקורסים)</option>';
        Object.values(gameState.courses).forEach(course => {
            if (course.status === 'active') {
                const opt = document.createElement("option");
                opt.value = course.code;
                const shortName = (typeof COURSE_SHORT_NAMES !== 'undefined' && COURSE_SHORT_NAMES[course.code]) || course.name;
                opt.innerText = `${shortName} - ${course.name} (${course.code.toUpperCase()})`;
                select.appendChild(opt);
            }
        });
        select.value = currentVal;
    }

    const courseFilterBody = document.getElementById("notion-course-filter-body");
    if (courseFilterBody) {
        courseFilterBody.innerHTML = '';
        const activeCourses = Object.values(gameState.courses).filter(c => c.status === 'active');
        activeCourses.forEach(course => {
            const shortName = (typeof COURSE_SHORT_NAMES !== 'undefined' && COURSE_SHORT_NAMES[course.code]) || course.name;
            const row = document.createElement("div");
            row.className = "notion-filter-item-row flat";
            row.innerHTML = `
                <label for="filter-course-${course.code}" style="cursor: pointer; display: flex; align-items: center; gap: 8px; flex: 1; font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <span class="course-color-dot" style="width: 8px; height: 8px; border-radius: 50%; background: ${course.color || '#38bdf8'}; display: inline-block; flex-shrink: 0;"></span>
                    <span title="${course.name} (${course.code})">${shortName} (${course.code})</span>
                </label>
                <input type="checkbox" id="filter-course-${course.code}" class="notion-filter-cb notion-course-opt-cb" data-course-code="${course.code}" checked>
            `;
            courseFilterBody.appendChild(row);
        });
        
        courseFilterBody.querySelectorAll(".notion-course-opt-cb").forEach(cb => {
            cb.addEventListener("change", () => {
                updateCourseFilterSummary();
                renderNotionTasksTable();
            });
        });
        updateCourseFilterSummary();
    }
}"""

if target_pop_filter in text:
    text = text.replace(target_pop_filter, replacement_pop_filter, 1)
    print("Updated populateNotionCourseFilter with notion-course-filter-body population")
else:
    print("Warning: target_pop_filter not found in app.js")

# Update renderNotionTasksTable filtering logic
target_render_filter = """    const courseFilterEl = document.getElementById("filter-course");
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
        if (courseFilter !== 'all' && course.code !== courseFilter) return;
        
        // Semester Filter
        const cSem = course.semester || 1;
        if (semesterFilter === 'active') {
            if (cSem !== curActiveSem && course.status !== 'active') return;
        } else if (semesterFilter !== 'all' && String(cSem) !== String(semesterFilter)) {
            return;
        }"""

replacement_render_filter = """    const courseFilterEl = document.getElementById("filter-course");
    const courseFilter = (courseFilterEl && courseFilterEl.value) ? courseFilterEl.value : "all";
    const semesterFilterEl = document.getElementById("filter-semester");
    const semesterFilter = (semesterFilterEl && semesterFilterEl.value) ? semesterFilterEl.value : "active";
    const activeStatusFilters = (typeof getActiveStatusFilters === 'function') ? getActiveStatusFilters() : [];
    const activeTypeFilters = (typeof getActiveTypeFilters === 'function') ? getActiveTypeFilters() : ['hw', 'project', 'exam'];
    const activeSemesterFilters = (typeof getActiveSemesterFilters === 'function') ? getActiveSemesterFilters() : null;
    const activeCourseFilters = (typeof getActiveCourseFilters === 'function') ? getActiveCourseFilters() : null;
    const searchInput = document.getElementById("search-tasks");
    const searchQuery = (searchInput && searchInput.value) ? String(searchInput.value).trim().toLowerCase() : "";
    
    let allTasks = [];
    
    // Gather tasks and pre-compute timestamp for high-performance sorting
    const curActiveSem = (gameState && gameState.currentActiveSemester) ? gameState.currentActiveSemester : 3;
    Object.values(gameState.courses).forEach(course => {
        // Course Multi-select Filter
        if (activeCourseFilters && activeCourseFilters.size > 0) {
            if (!activeCourseFilters.has(course.code)) return;
        } else if (courseFilter !== 'all' && course.code !== courseFilter) {
            return;
        }
        
        // Semester Multi-select Filter
        const cSem = course.semester || 1;
        if (activeSemesterFilters) {
            if (!activeSemesterFilters.has(cSem)) return;
        } else if (semesterFilter === 'active') {
            if (cSem !== curActiveSem && course.status !== 'active') return;
        } else if (semesterFilter !== 'all' && String(cSem) !== String(semesterFilter)) {
            return;
        }"""

if target_render_filter in text:
    text = text.replace(target_render_filter, replacement_render_filter, 1)
    print("Updated renderNotionTasksTable with multi-select semester and course filters")
else:
    print("Warning: target_render_filter not found in app.js")

with open(app_path, "w", encoding="utf-8") as f:
    f.write(text)
print("app.js updated successfully with all filter enhancements!")
