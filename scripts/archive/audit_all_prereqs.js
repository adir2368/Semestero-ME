const fs = require('fs');

const cfContent = fs.readFileSync('cheesefork_database.js', 'utf8');
eval(cfContent);
const cfMap = {};
for (const c of global.CHEESEFORK_DB) {
    if (c.code6) {
        cfMap[c.code6] = c;
        cfMap[c.code6.padStart(6, '0')] = c;
    }
}

global.window = global;
const curContent = fs.readFileSync('curriculum_template.js', 'utf8');
eval(curContent);
const templateCourses = global.SAMPLE_ME_DEGREE;

const savedState = JSON.parse(fs.readFileSync('user_saved_state.json', 'utf8'));
const savedCourses = savedState.courses || {};

function normalizeRawCode(raw) {
    if (raw.length === 8) {
        if (cfMap[raw] && cfMap[raw].code6) return cfMap[raw].code6;
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

console.log('=== AUDITING ALL CURRICULUM COURSES PREREQUISITES ===');
const allCodes = Object.keys(templateCourses);

for (const code of allCodes) {
    const tCourse = templateCourses[code];
    const sCourse = savedCourses[code];
    const code6 = code.padStart(6, '0');
    const cf = cfMap[code6] || cfMap[code];
    const cfRaw = cf ? (cf.prereqs || '') : '';
    const cfCodes = parsePrereqCodes(cfRaw);
    
    // CF codes that are in the ME curriculum
    const relevantCf = cfCodes.filter(c => allCodes.includes(c) || allCodes.includes(c.padStart(6, '0')));
    
    console.log(`\n--------------------------------------------------`);
    console.log(`Course: [${code}] ${tCourse.name} (Sem ${tCourse.semester})`);
    console.log(`  Template prereqs:    `, JSON.stringify(tCourse.prerequisites || []));
    console.log(`  Saved state prereqs: `, JSON.stringify(sCourse ? (sCourse.prerequisites || []) : 'NOT IN SAVED'));
    console.log(`  CheeseFork Raw:      `, cfRaw || '(none)');
    console.log(`  CheeseFork Parsed:   `, JSON.stringify(cfCodes));
    console.log(`  Relevant ME Prereqs: `, JSON.stringify(relevantCf));
}
