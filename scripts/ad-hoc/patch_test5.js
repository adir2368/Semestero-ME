const fs = require('fs');
const path = require('path');
const targetFile = path.resolve(__dirname, '../../tests/verify_system_health.js');
let content = fs.readFileSync(targetFile, 'utf8');
content = content.replace(
    /assert\(sem4Info\.count === 4 \|\| sem4Info\.count === 5,.*?\);/,
    'assert(sem4Info.count === 4 || sem4Info.count === 5, `Semester 4 expected 4 or 5 courses (4 for Adir with Chem Lab in Sem 2, 5 for standard curriculum), but has ${sem4Info.count}: ${sem4Info.courses.join(", ")}`);'
);
fs.writeFileSync(targetFile, content, 'utf8');
console.log('[OK] Successfully patched test 5 in verify_system_health.js');
