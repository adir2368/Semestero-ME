const fs = require('fs');
const cfContent = fs.readFileSync('cheesefork_database.js', 'utf8');
eval(cfContent);
const matches = global.CHEESEFORK_DB.filter(c => 
    (c.code6 && (c.code6.includes('34060') || c.code6.includes('34382') || c.code6.includes('34380') || c.code6.includes('34383') || c.code6.includes('034379') || c.code6.includes('034371'))) ||
    (c.name && (c.name.includes('מכטרוניקה') || c.name.includes('פרויקט גמר') || c.name.includes('מתודולוגיות')))
);
console.log(matches.map(m => ({ code: m.code6, name: m.name, prereqs: m.prereqs, syllabus: m.syllabus ? m.syllabus.slice(0, 100) : '' })));
