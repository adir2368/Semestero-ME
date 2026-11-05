with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''    // Gather tasks and pre-compute timestamp for high-performance sorting
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
        }'''

replacement = '''    // Gather tasks and pre-compute timestamp for high-performance sorting
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
        } else if (semesterFilter !== 'all') {
            if (String(cSem) !== String(semesterFilter)) return;
        }'''

assert target in content, "target not found in app.js"
content = content.replace(target, replacement, 1)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("app.js gathering patched successfully!")
