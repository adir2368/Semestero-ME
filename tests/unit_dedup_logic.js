function normalizeTaskTitle(title, courseName) {
    if (!title) return '';
    let t = String(title).trim().toLowerCase();
    if (courseName) {
        const cClean = String(courseName).trim().toLowerCase().replace(/[\s\-_:.,()״'"׳]+/g, ' ');
        t = t.replace(cClean, ' ');
    }
    t = t.replace(/^יש להגיש את\s*['"״׳]?/i, '');
    t = t.replace(/['"״׳]$/, '');
    t = t.replace(/^(מטלת בית|תרגיל בית|תרגיל|מטלה|שיעורי בית|hw|assignment|task|דו"ח|דוח מעבדה|דוח|מבחן|בחינה)\s*[:#-]?\s*/i, '');
    t = t.replace(/\(בונוס.*?\)/g, '');
    t = t.replace(/\(הארכה.*?\)/g, '');
    t = t.replace(/\(מתוקן.*?\)/g, '');
    t = t.replace(/[\s\-_:.,()״'"׳]+/g, ' ').trim();
    return t;
}

function extractMoodleId(task) {
    if (!task) return null;
    if (task.moodleEventId && /^\d+$/.test(String(task.moodleEventId).trim())) {
        return String(task.moodleEventId).trim();
    }
    if (task.moodleUid) {
        const m = String(task.moodleUid).match(/^(\d+)/);
        if (m) return m[1];
    }
    if (task.moodleUrl) {
        const m = String(task.moodleUrl).match(/[?&]id=(\d+)/);
        if (m) return m[1];
    }
    return null;
}

function areTasksDuplicates(t1, t2, courseName) {
    if (t1.id && t2.id && t1.id === t2.id) return true;
    
    // Check Moodle IDs
    const mId1 = extractMoodleId(t1);
    const mId2 = extractMoodleId(t2);
    if (mId1 && mId2 && mId1 === mId2) return true;
    
    // Check exact Moodle URLs
    if (t1.moodleUrl && t2.moodleUrl && t1.moodleUrl.trim().toLowerCase() === t2.moodleUrl.trim().toLowerCase()) {
        return true;
    }

    // Check Exam Moed match within same course
    const isExam1 = t1.type === 'exam' || /מועד\s*[אב]/i.test(t1.title);
    const isExam2 = t2.type === 'exam' || /מועד\s*[אב]/i.test(t2.title);
    if (isExam1 && isExam2) {
        const isMoedA1 = /מועד\s*א/i.test(t1.title) || (t1.id && t1.id.endsWith('_ex'));
        const isMoedA2 = /מועד\s*א/i.test(t2.title) || (t2.id && t2.id.endsWith('_ex'));
        if (isMoedA1 && isMoedA2) return true;

        const isMoedB1 = /מועד\s*ב/i.test(t1.title) || (t1.id && t1.id.endsWith('_ex_b'));
        const isMoedB2 = /מועד\s*ב/i.test(t2.title) || (t2.id && t2.id.endsWith('_ex_b'));
        if (isMoedB1 && isMoedB2) return true;
    }

    // Check Normalized Titles
    const norm1 = normalizeTaskTitle(t1.title, courseName);
    const norm2 = normalizeTaskTitle(t2.title, courseName);
    if (norm1 && norm2 && norm1 === norm2) {
        return true;
    }

    return false;
}

function mergeTaskPair(primary, secondary) {
    // Keep most detailed/up-to-date title
    const t1 = primary.title || '';
    const t2 = secondary.title || '';
    const chosenTitle = (t2.length > t1.length && !t1.includes('בונוס')) ? t2 : t1;

    // Date resolution: prefer non-empty date, or later date if both exist (extension/postponement)
    let chosenDate = primary.dueDate || secondary.dueDate || '';
    let chosenTimestamp = primary.dueTimestamp || secondary.dueTimestamp || 0;
    if (primary.dueDate && secondary.dueDate && primary.dueDate !== secondary.dueDate) {
        // Later date wins (postponement)
        const d1 = Date.parse(primary.dueDate) || 0;
        const d2 = Date.parse(secondary.dueDate) || 0;
        if (d2 > d1) {
            chosenDate = secondary.dueDate;
            chosenTimestamp = secondary.dueTimestamp || d2;
        } else {
            chosenDate = primary.dueDate;
            chosenTimestamp = primary.dueTimestamp || d1;
        }
    }

    // Completed status: completed wins
    const isDone = primary.completed === true || primary.status === 'done' || 
                   secondary.completed === true || secondary.status === 'done';

    return {
        id: primary.id || secondary.id,
        title: chosenTitle,
        type: primary.type || secondary.type || 'hw',
        dueDate: chosenDate,
        dueTimestamp: chosenTimestamp,
        xp: Math.max(primary.xp || 50, secondary.xp || 50),
        completed: isDone,
        status: isDone ? 'done' : (primary.status !== 'not_started' ? primary.status : secondary.status),
        moodleEventId: primary.moodleEventId || secondary.moodleEventId || extractMoodleId(secondary) || extractMoodleId(primary),
        moodleUid: primary.moodleUid || secondary.moodleUid,
        moodleUrl: primary.moodleUrl || secondary.moodleUrl,
        source: primary.source || secondary.source || (extractMoodleId(primary) ? 'moodle' : undefined),
        pinned: !!(primary.pinned || secondary.pinned)
    };
}

function deduplicateCourseTaskList(tasks, courseName) {
    if (!Array.isArray(tasks) || tasks.length <= 1) return tasks || [];

    const deduped = [];
    let removedCount = 0;

    for (let i = 0; i < tasks.length; i++) {
        const candidate = tasks[i];
        let mergedIndex = -1;

        for (let j = 0; j < deduped.length; j++) {
            if (areTasksDuplicates(deduped[j], candidate, courseName)) {
                mergedIndex = j;
                break;
            }
        }

        if (mergedIndex >= 0) {
            deduped[mergedIndex] = mergeTaskPair(deduped[mergedIndex], candidate);
            removedCount++;
        } else {
            deduped.push(Object.assign({}, candidate));
        }
    }

    return { tasks: deduped, removedCount };
}

// Test cases
const sampleTasks = [
    { id: '1', title: 'לומדת MATLAB', dueDate: '2026-11-10', completed: false },
    { id: '2', title: 'לומדת MATLAB (בונוס 2 נקודות לציון)', dueDate: '2026-11-19', moodleEventId: '43952', completed: true },
    { id: '3', title: 'חישוב מדעי והנדסי - מועד א\'', dueDate: '2027-02-11', type: 'exam' },
    { id: '4', title: 'מועד א\'', dueDate: '2027-02-10', type: 'exam' },
    { id: '5', title: 'תרגיל בית 1: מבוא', dueDate: '2026-11-05', completed: false },
    { id: '6', title: 'תרגיל 1: מבוא', dueDate: '2026-11-12', completed: false } // extension
];

const res = deduplicateCourseTaskList(sampleTasks, 'חישוב מדעי והנדסי');
console.log('Result count:', res.tasks.length, 'Removed:', res.removedCount);
res.tasks.forEach(t => console.log(' ->', t.title, '| Date:', t.dueDate, '| Done:', t.completed));
