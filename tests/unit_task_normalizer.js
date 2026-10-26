function normalizeTaskTitle(title, courseName) {
    if (!title) return '';
    let t = String(title).trim().toLowerCase();
    if (courseName) {
        const cClean = String(courseName).trim().toLowerCase().replace(/[\s\-_:.,()״'"׳]+/g, ' ');
        t = t.replace(cClean, ' ');
    }
    // Remove Moodle boilerplate
    t = t.replace(/^יש להגיש את\s*['"״׳]?/i, '');
    t = t.replace(/['"״׳]$/, '');
    // Remove common prefixes
    t = t.replace(/^(מטלת בית|תרגיל בית|תרגיל|מטלה|שיעורי בית|hw|assignment|task|דו"ח|דוח מעבדה|דוח|מבחן|בחינה)\s*[:#-]?\s*/i, '');
    // Remove bonus and extension annotations
    t = t.replace(/\(בונוס.*?\)/g, '');
    t = t.replace(/\(הארכה.*?\)/g, '');
    t = t.replace(/\(מתוקן.*?\)/g, '');
    // Strip extra punctuation and spaces
    t = t.replace(/[\s\-_:.,()״'"׳]+/g, ' ').trim();
    return t;
}

console.log('Exam match:', normalizeTaskTitle("חישוב מדעי והנדסי - מועד א'", "חישוב מדעי והנדסי") === normalizeTaskTitle("מועד א'", "חישוב מדעי והנדסי"));
console.log('HW match:', normalizeTaskTitle("לומדת MATLAB (בונוס 2 נקודות לציון)") === normalizeTaskTitle("לומדת MATLAB"));
console.log('Prefix match:', normalizeTaskTitle("תרגיל בית 1: גבולות") === normalizeTaskTitle("תרגיל 1: גבולות"));
