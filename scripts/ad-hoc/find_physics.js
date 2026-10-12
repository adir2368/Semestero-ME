const fs = require('fs');

const courses = JSON.parse(fs.readFileSync('cheesefork_courses_2025_200.min.js', 'utf8').replace(/^[^{]*\{/, '{').replace(/;?\s*$/, ''));
for (const [id, c] of Object.entries(courses)) {
    if (c.name && (c.name.includes('פיזיקה 1') || c.name.includes('פיזיקה 2') || c.name.includes('פיזיקה ת'))) {
        console.log(id, c.name, c.credits);
    }
}
