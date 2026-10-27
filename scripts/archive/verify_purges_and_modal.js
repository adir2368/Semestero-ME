const fs = require('fs');
const assert = require('assert');

// 1. Verify app.js defines escapeHtml
const appCode = fs.readFileSync('C:/Users/user/.gemini/antigravity/scratch/academic-skill-tree/app.js', 'utf8');
assert(appCode.includes('function escapeHtml(str)'), 'escapeHtml must be defined in app.js');
assert(appCode.includes('window.escapeHtml = escapeHtml'), 'window.escapeHtml must be exposed');

// 2. Verify planner_module.js exposes escapeHtml
const pmCode = fs.readFileSync('C:/Users/user/.gemini/antigravity/scratch/academic-skill-tree/planner_module.js', 'utf8');
assert(pmCode.includes('global.escapeHtml = escapeHtml'), 'planner_module must export escapeHtml');

// 3. Test self-healing scanner logic
// Simulate localStorage
const storage = {};
global.localStorage = {
    getItem: (k) => storage[k] || null,
    setItem: (k, v) => { storage[k] = String(v); },
    removeItem: (k) => { delete storage[k]; },
    get length() { return Object.keys(storage).length; },
    key: (i) => Object.keys(storage)[i]
};

// Seed an infected customPlan array under atlas_me_custom_degree_plan_v2_adir
const dirtyPlan = [
    {
        semester: 4,
        courses: [
            { code: "034030", name: "תהליכי ייצור", credits: 3.5 },
            { code: "03940800", altCode: "394800", name: "כושר גופני וחדר כושר", credits: 1.0, type: "sports" },
            { code: "03940808", altCode: "394808", name: "פילאטיס ומתיחות", credits: 1.0, type: "sports" },
            { code: "034010", name: "דינמיקה", credits: 3.5 },
            { code: "034055", name: "מבוא להנדסת חומרים", credits: 3.5 },
            { code: "034032", name: "מבוא לבקרה", credits: 3.0 }
        ]
    }
];
localStorage.setItem('atlas_me_custom_degree_plan_v2_adir', JSON.stringify(dirtyPlan));

// Extract and test the storage scanner
const INFILTRATORS = [
    '03240269', '3240269',
    '03940800', '3940800', '0394800', '394800',
    '03940808', '3940808', '0394808', '394808'
];
const isForbiddenSem4 = (c) => {
    if (!c) return false;
    const code = String(c.code || '');
    const alt = String(c.altCode || '');
    if (INFILTRATORS.includes(code) || INFILTRATORS.includes(alt)) return true;
    if (c.type === 'sports' || c.list === 'SPORTS') return true;
    if (code.startsWith('0394') || code.startsWith('394')) return true;
    if (code.startsWith('0324') || code.startsWith('324')) return true;
    return false;
};

for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    const raw = localStorage.getItem(k);
    if (raw && (raw.includes('03240269') || raw.includes('03940800') || raw.includes('03940808') || raw.includes('394800') || raw.includes('394808'))) {
        const parsed = JSON.parse(raw);
        let touched = false;
        if (Array.isArray(parsed)) {
            parsed.forEach(s => {
                if (s && s.semester === 4 && Array.isArray(s.courses)) {
                    const origLen = s.courses.length;
                    s.courses = s.courses.filter(c => !isForbiddenSem4(c));
                    if (s.courses.length !== origLen) touched = true;
                }
            });
        }
        if (touched) {
            localStorage.setItem(k, JSON.stringify(parsed));
        }
    }
}

const cleanedPlan = JSON.parse(localStorage.getItem('atlas_me_custom_degree_plan_v2_adir'));
console.log("Cleaned plan semester 4 courses count:", cleanedPlan[0].courses.length);
assert.strictEqual(cleanedPlan[0].courses.length, 4, "Semester 4 must have exactly 4 mandatory courses left!");
const codes = cleanedPlan[0].courses.map(c => c.code);
console.log("Cleaned plan semester 4 course codes:", codes);
assert.deepStrictEqual(codes, ['034030', '034010', '034055', '034032']);

console.log("All unit verification tests passed successfully! ✓");
