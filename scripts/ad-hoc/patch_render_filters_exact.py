import sys

sys.stdout.reconfigure(encoding="utf-8")

app_path = r"C:\Users\user\.gemini\antigravity\scratch\academic-skill-tree\app.js"
with open(app_path, "r", encoding="utf-8") as f:
    text = f.read()

target = """    const courseFilterEl = document.getElementById("filter-course");
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
            if (cSem < curActiveSem && course.status === 'mastered') {
                return; // Hide past completed semesters by default
            }
            if (cSem > curActiveSem && course.status !== 'active' && course.status !== 'available') {
                return; // Hide future semesters unless active or available
            }
        } else if (semesterFilter !== 'all' && String(cSem) !== String(semesterFilter)) {
            return;
        }"""

replacement = """    const courseFilterEl = document.getElementById("filter-course");
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
            if (cSem < curActiveSem && course.status === 'mastered') {
                return; // Hide past completed semesters by default
            }
            if (cSem > curActiveSem && course.status !== 'active' && course.status !== 'available') {
                return; // Hide future semesters unless active or available
            }
        } else if (semesterFilter !== 'all' && String(cSem) !== String(semesterFilter)) {
            return;
        }"""

if target in text:
    text = text.replace(target, replacement)
    with open(app_path, "w", encoding="utf-8") as f:
        f.write(text)
    print("renderNotionTasksTable successfully updated with multi-select semester and course filters!")
else:
    print("target not found")
