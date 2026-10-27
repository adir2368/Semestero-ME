const fs = require('fs');

const cfContent = fs.readFileSync('cheesefork_database.js', 'utf8');
eval(cfContent);
const cfMap = {};
for (const c of global.CHEESEFORK_DB) {
    if (c.code6) cfMap[c.code6] = c;
    if (c.rawNum) cfMap[c.rawNum] = c;
}

global.window = global;
const curContent = fs.readFileSync('curriculum_template.js', 'utf8');
eval(curContent);
const courses = global.SAMPLE_ME_DEGREE;

// Map course aliases (e.g. 114051 <-> 114071, 114052 <-> 114075, 034022 <-> 034060, etc.)
const codeEquivalents = {
    '114051': '114071',
    '114071': '114051',
    '114052': '114075',
    '114075': '114052',
    '034022': '034060',
    '034060': '034022',
    '034029': '034053', // Old solids 2 <-> New solids 2
    '034042': '034061', // Old graphics <-> New graphics
    '034043': '034030', // Old manufacturing <-> New manufacturing
    '104016': '104065', // Old algebra <-> New algebra
    '104022': '104043', // Old calculus 2 <-> New calculus 2
    '104018': '104041', // Old calculus 1 <-> New calculus 1
    '104135': '104131', // Diff equations
    '104218': '104228', // PDE
    '234111': '234128', // Intro to CS
    '234112': '234128'
};

function normalizeToMeDegree(code) {
    if (courses[code]) return code;
    if (codeEquivalents[code] && courses[codeEquivalents[code]]) {
        return codeEquivalents[code];
    }
    return null;
}

const verifiedPrereqs = {};

for (const code of Object.keys(courses)) {
    const c = courses[code];
    let cf = cfMap[code] || cfMap[code.padStart(6, '0')];
    if (!cf && codeEquivalents[code]) {
        cf = cfMap[codeEquivalents[code]];
    }
    
    let rawPrereqs = cf ? (cf.prereqs || '') : '';
    let matches = rawPrereqs.match(/\d{6,8}/g) || [];
    let mapped = [];
    
    for (let m of matches) {
        let clean = m;
        if (m.length === 8) {
            if (cfMap[m] && cfMap[m].code6) clean = cfMap[m].code6;
            else if (m.startsWith('0034')) clean = '034' + m.slice(5);
            else if (m.startsWith('0104')) clean = '104' + m.slice(5);
            else if (m.startsWith('0114')) clean = '114' + m.slice(5);
            else if (m.startsWith('0125')) clean = '125' + m.slice(5);
            else if (m.startsWith('0234')) clean = '234' + m.slice(5);
            else if (m.startsWith('0314')) clean = '314' + m.slice(5);
            else clean = m.slice(-6);
        }
        let meCode = normalizeToMeDegree(clean);
        if (meCode && meCode !== code && !mapped.includes(meCode)) {
            mapped.push(meCode);
        }
    }
    
    verifiedPrereqs[code] = {
        name: c.name,
        semester: c.semester,
        currentInTemplate: c.prerequisites,
        cheeseForkRaw: rawPrereqs,
        suggested: mapped
    };
}

console.log(JSON.stringify(verifiedPrereqs, null, 2));
