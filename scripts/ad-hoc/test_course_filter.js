const fs = require('fs');

const userSaved = JSON.parse(fs.readFileSync('user_saved_state.json', 'utf8'));
console.log('user_saved_state currentActiveSemester:', userSaved.currentActiveSemester);

let matched = 0;
for (const code in userSaved.courses) {
    const course = userSaved.courses[code];
    const cSem = course.semester || 1;
    const curActiveSem = userSaved.currentActiveSemester || 3;
    
    if (course.status !== 'active' && course.status !== 'mastered' && course.status !== 'available') continue;
    
    if (cSem !== curActiveSem && (course.status === 'mastered' || cSem < curActiveSem)) {
        continue;
    }
    
    console.log(`Matched course: ${code} (${course.name}), sem: ${cSem}, status: ${course.status}, tasks: ${(course.tasks||[]).length}`);
    matched++;
}
console.log('Total matched courses:', matched);
