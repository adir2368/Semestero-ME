const fs = require('fs');

// Simulate the exact code from app.js
const item = {
    course: { code: "104041", name: "חדוא 1", semester: 1, status: "available" },
    task: { id: "104041_h1", title: "תרגיל בית 1", type: "hw", xp: 50, completed: false },
    dueTime: Infinity
};

const t = item.task;
const organitCat = 'all';
console.log('Organit filter pass?', organitCat === 'all');

const activeStatusFilters = ['not_started', 'in_progress', 'done', 'submitted'];
const currentTaskStatus = t.status || 'not_started';
console.log('Status filter pass?', activeStatusFilters.includes(currentTaskStatus));

function getTaskNormalizedCategory(type) {
    if (!type) return 'hw';
    const t = String(type).toLowerCase();
    if (t === 'exam' || t === 'midterm' || t === 'moed_a' || t === 'moed_b' || t === 'moed_c') return 'exam';
    if (t === 'project' || t === 'lab' || t === 'work') return 'project';
    return 'hw';
}

const activeTypeFilters = ['hw', 'project', 'exam'];
const normCat = getTaskNormalizedCategory(t.type);
console.log('Type filter pass?', activeTypeFilters.includes(normCat), 'normCat:', normCat);
