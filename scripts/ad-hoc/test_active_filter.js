const fs = require('fs');

const userSaved = JSON.parse(fs.readFileSync('user_saved_state.json', 'utf8'));
const curActiveSem = userSaved.currentActiveSemester || 3;

let tasksCount = 0;
for (const code in userSaved.courses) {
    const course = userSaved.courses[code];
    const cSem = course.semester || 1;
    
    // Semester Filter: active
    if (cSem < curActiveSem && course.status === 'mastered') {
        continue;
    }
    if (cSem > curActiveSem && course.status !== 'active' && course.status !== 'available') {
        continue;
    }
    
    const tasks = course.tasks || [];
    tasksCount += tasks.length;
    console.log(`Course ${code} (${course.name}): sem ${cSem}, status ${course.status}, tasks: ${tasks.length}`);
}
console.log('Total tasks shown for active semester:', tasksCount);
