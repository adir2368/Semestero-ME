const fs = require('fs');

const cfContent = fs.readFileSync('cheesefork_database.js', 'utf8');
eval(cfContent); // populates global.CHEESEFORK_DB
const cfMap = {};
for (const c of global.CHEESEFORK_DB) {
    if (c.code6) {
        cfMap[c.code6] = c;
        cfMap[c.code6.padStart(6, '0')] = c;
        cfMap[c.code6.replace(/^0+/, '')] = c;
    }
    if (c.rawNum) {
        cfMap[c.rawNum] = c;
    }
}

global.window = global;
const curContent = fs.readFileSync('curriculum_template.js', 'utf8');
eval(curContent);
const courses = Object.values(global.SAMPLE_ME_DEGREE || SAMPLE_ME_DEGREE);

console.log('Total curriculum courses:', courses.length);

function normalizeRawCode(raw) {
    // raw can be 8 digits like 01040041 or 00340028 or 01040131
    if (raw.length === 8) {
        // Check if cfMap has it directly
        if (cfMap[raw] && cfMap[raw].code6) return cfMap[raw].code6;
        // Faculty prefix: if starts with 0034 -> 034...
        // 0104 -> 104...
        // 0114 -> 114...
        // 0125 -> 125...
        // 0234 -> 234...
        // 0314 -> 314...
        const prefix = raw.slice(0, 4);
        const rest = raw.slice(4);
        if (prefix === '0034') return '034' + rest.slice(1);
        if (prefix.startsWith('0')) return prefix.slice(1) + rest.slice(1);
    }
    return raw;
}

function parsePrereqCodes(prereqStr) {
    if (!prereqStr) return [];
    const matches = prereqStr.match(/\d{6,8}/g) || [];
    const normalized = matches.map(m => {
        if (cfMap[m] && cfMap[m].code6) return cfMap[m].code6;
        return normalizeRawCode(m);
    });
    return [...new Set(normalized)];
}

for (const c of courses) {
    const code6 = c.code.padStart(6, '0');
    const cf = cfMap[code6] || cfMap[c.code];
    const cfPrereqRaw = cf ? (cf.prereqs || '') : '';
    const cfCodes = parsePrereqCodes(cfPrereqRaw);
    
    // Check which CF codes are in SAMPLE_ME_DEGREE
    const relevantCfCodes = cfCodes.filter(cd => global.SAMPLE_ME_DEGREE[cd] || global.SAMPLE_ME_DEGREE[cd.replace(/^0+/, '')]);

    console.log(`\n========================================`);
    console.log(`[${c.code}] ${c.name} (Semester: ${c.semester})`);
    console.log(`Current in template:`, c.prerequisites);
    console.log(`CheeseFork raw:`, cfPrereqRaw || '(NONE)');
    console.log(`Parsed all CF codes:`, cfCodes);
    console.log(`Relevant to ME degree:`, relevantCfCodes);
}
