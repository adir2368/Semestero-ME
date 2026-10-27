const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..', '..');

// Mock browser environment
const localStorageMock = {
    _data: {
        'ast_custom_degree_plan_v2_adir': JSON.stringify({
            semesters: [
                { semester: 1, courses: [{ code: '01040041' }, { code: '01140051' }] },
                { semester: 2, courses: [{ code: '01250013' }] },
                { semester: 3, courses: [{ code: '03940805' }] },
                {
                    semester: 4,
                    courses: [
                        { code: '034030', altCode: '034030', name: 'תהליכי ייצור', credits: 3.5 },
                        { code: '03240269', altCode: '03240269', name: 'מל"ג - אתיקה בפעולה', credits: 2.0 },
                        { code: '03940800', altCode: '03940800', name: 'כושר גופני וחדר כושר', credits: 1.0 },
                        { code: '03940808', altCode: '03940808', name: 'פילאטיס ומתיחות', credits: 1.0 }
                    ]
                }
            ],
            unassigned: []
        }),
        'academic_skill_tree_save': JSON.stringify({
            courses: {
                '034030': { code: '034030', name: 'תהליכי ייצור', semester: 4 },
                '03240269': { code: '03240269', name: 'מל"ג - אתיקה בפעולה', semester: 4 },
                '03940800': { code: '03940800', name: 'כושר גופני וחדר כושר', semester: 4 },
                '03940808': { code: '03940808', name: 'פילאטיס ומתיחות', semester: 4 }
            }
        })
    },
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
};

const context = {
    window: {
        localStorage: localStorageMock,
        location: { search: '?user=adir' },
        AuthSync: {
            init: () => {},
            isAdirActive: () => true,
            getActiveUser: () => ({ id: 'adir', username: 'adir_moshe' }),
            loadActiveUserState: () => null
        }
    },
    localStorage: localStorageMock,
    console: console,
    Date: Date,
    Math: Math,
    JSON: JSON,
    Set: Set,
    Array: Array,
    Object: Object
};
context.global = context.window;
vm.createContext(context);

// Load preloaded_user_state.js
const preloadedCode = fs.readFileSync(path.join(root, 'preloaded_user_state.js'), 'utf-8');
vm.runInContext(preloadedCode, context);

// Load planner_catalog.js
const catalogCode = fs.readFileSync(path.join(root, 'planner_catalog.js'), 'utf-8');
vm.runInContext(catalogCode, context);

// Load planner_module.js
const plannerCode = fs.readFileSync(path.join(root, 'planner_module.js'), 'utf-8');
vm.runInContext(plannerCode, context);

// Test initPlannerState
context.window.DegreePlanner.init(true);

const plan = context.window.DegreePlanner.getCustomPlan();
const sem4 = plan.find(s => s.semester === 4);
console.log('--- Verification: Semester 4 Courses in Degree Planner ---');
const sem4Codes = sem4.courses.map(c => c.code);
console.log('Sem 4 Course Codes:', sem4Codes);

const forbidden = ['03240269', '03940800', '03940808'];
const foundForbidden = sem4Codes.filter(c => forbidden.includes(c));
if (foundForbidden.length > 0) {
    console.error('FAIL: Found forbidden infiltrator courses in Semester 4:', foundForbidden);
    process.exit(1);
} else {
    console.log('SUCCESS: All 3 infiltrator courses purged cleanly from Semester 4!');
}

if (!sem4Codes.includes('034030') && !sem4Codes.includes('00340030')) {
    console.error('FAIL: Legitimate course 034030 was removed!');
    process.exit(1);
} else {
    console.log('SUCCESS: Legitimate course 034030 (תהליכי ייצור) is intact and present!');
}
