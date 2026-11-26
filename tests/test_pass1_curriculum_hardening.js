const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

function makeElement(tag = 'div', id = '') {
    const listeners = {};
    const el = {
        tagName: tag.toUpperCase(),
        id,
        className: '',
        dataset: {},
        style: {},
        value: '',
        innerText: '',
        _innerHTML: '',
        children: [],
        classList: {
            _set: new Set(),
            add(c) { this._set.add(c); },
            remove(c) { this._set.delete(c); },
            toggle(c, f) { if (f === undefined ? !this._set.has(c) : f) this._set.add(c); else this._set.delete(c); },
            contains(c) { return this._set.has(c); }
        },
        setAttribute() {},
        getAttribute() { return null; },
        addEventListener(ev, fn) {
            if (!listeners[ev]) listeners[ev] = [];
            listeners[ev].push(fn);
        },
        trigger(ev, eventObj = {}) {
            (listeners[ev] || []).forEach(fn => fn(Object.assign({ target: el, stopPropagation() {}, preventDefault() {} }, eventObj)));
        },
        click() {
            (listeners.click || []).forEach(fn => fn({ target: el, stopPropagation() {} }));
        },
        focus() {},
        scrollIntoView() {},
        appendChild(child) {
            this.children.push(child);
            if (child && child.id) registry[child.id] = child;
            return child;
        },
        removeChild(child) {
            this.children = this.children.filter(c => c !== child);
        },
        querySelectorAll(sel) {
            if (sel === '.command-palette-item') {
                return this._cmdItems || [];
            }
            return [];
        },
        querySelector() { return null; }
    };
    Object.defineProperty(el, 'innerHTML', {
        configurable: true,
        get() { return this._innerHTML; },
        set(val) {
            this._innerHTML = String(val);
            if (this.id === 'command-palette-results') {
                const matches = [];
                const re = /class="command-palette-item[^"]*"\s+data-index="(\d+)"/g;
                let m;
                while ((m = re.exec(this._innerHTML)) !== null) {
                    const item = makeElement('div');
                    item.dataset.index = m[1];
                    matches.push(item);
                }
                this._cmdItems = matches;
            }
        }
    });
    return el;
}

const registry = {};
function getOrCreate(id) {
    if (!registry[id]) registry[id] = makeElement('div', id);
    return registry[id];
}

console.log('Running Pass 1 Curriculum Window Hardening Tests...');

// 1. Static assertions across ui_enhancements.js, app.js, pangea_knowledge_hub.js
const uiSrc = fs.readFileSync(path.join(ROOT, 'ui_enhancements.js'), 'utf8');
assert.strictEqual(uiSrc.includes('item.action.toString()'), false, 'ui_enhancements.js must not stringify closures into onclick');
assert.strictEqual(uiSrc.includes('openCourseDetailsModal'), false, 'ui_enhancements.js must not call non-existent openCourseDetailsModal');

const appSrc = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
assert.strictEqual(appSrc.includes('scrollWrap.scrollLeft = 0'), true, 'app.js initFlowchartZoom must reset horizontal scroll');

const pangeaSrc = fs.readFileSync(path.join(ROOT, 'pangea_knowledge_hub.js'), 'utf8');
assert.strictEqual(pangeaSrc.includes("modal.style.zIndex = '2000000'"), true, 'Pangea reader must keep zIndex 2000000');
assert.strictEqual(pangeaSrc.includes("modal.style.zIndex = '1999990'"), true, 'Pangea search modal must sit below reader');

// 2. Command Palette runtime test (6-digit match + click without ReferenceError + XSS escaping)
let openedCourseCode = null;
const storage = {};
const sandbox = {
    console,
    setTimeout,
    clearTimeout,
    addEventListener: () => {},
    removeEventListener: () => {},
    matchMedia: () => ({ matches: false, addEventListener: () => {} }),
    requestAnimationFrame: (fn) => fn(),
    scrollY: 0,
    innerWidth: 1440,
    innerHeight: 900,
    history: { pushState: () => {}, replaceState: () => {} },
    MutationObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL: () => {} },
    Blob: function (parts) { this.parts = parts; },
    localStorage: {
        getItem: (k) => (k in storage ? storage[k] : null),
        setItem: (k, v) => { storage[k] = String(v); },
        removeItem: (k) => { delete storage[k]; }
    },
    navigator: { userAgent: 'Pass1Test' },
    document: {
        readyState: 'complete',
        documentElement: { scrollTop: 0, style: { setProperty: () => {} } },
        head: { appendChild: () => {} },
        body: Object.assign(makeElement('body'), { style: {}, scrollTop: 0 }),
        createElement: (tag) => makeElement(tag),
        getElementById: (id) => {
            if (id === 'command-palette-modal' || id === 'command-palette-input' || id === 'command-palette-results') {
                return registry[id] || null;
            }
            return getOrCreate(id);
        },
        querySelector: () => null,
        querySelectorAll: (sel) => {
            if (sel === '.command-palette-item' && registry['command-palette-results']) {
                return registry['command-palette-results']._cmdItems || [];
            }
            return [];
        },
        addEventListener: () => {}
    },
    CHEESEFORK_DB: [
        { rawNum: '00340053', code6: '034053', name: 'מכניקת מוצקים 2מ', credits: 4 }
    ],
    gameState: {
        courses: {
            '034053': { code: '034053', name: 'מכניקת מוצקים 2מ', credits: 4, semester: 3, status: 'active' },
            '104041': { code: '104041', name: '<img src=x onerror=alert(1)>', credits: 5, semester: 1, status: 'mastered', grade: 90 }
        },
        notionTasks: []
    },
    openCourseDetails: (code) => { openedCourseCode = code; },
    AuthSync: {
        isLoggedIn: () => false,
        isAdirActive: () => false,
        getActiveUser: () => ({ id: 'guest', name: 'אורח' })
    }
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const utilsCode = fs.readFileSync(path.join(ROOT, 'utils.js'), 'utf8');
vm.runInContext(utilsCode, sandbox);
console.log('[1/3] PASS: ui_enhancements.js, app.js & pangea_knowledge_hub.js static assertions verified.');

// 3. GradeSheet Guest PII isolation & HTML escaping
const gsSrc = fs.readFileSync(path.join(ROOT, 'grade_sheet.js'), 'utf8');
vm.runInContext(gsSrc, sandbox);

const GS = sandbox.window.GradeSheet;
assert(GS, 'GradeSheet must load');
assert.notStrictEqual(GS.studentInfo.id, '318942516', 'Guest GradeSheet must never default to Adir ID');
assert.notStrictEqual(GS.studentInfo.name, 'אדיר משה', 'Guest GradeSheet must never default to Adir name');

GS.render();
const semWrap = getOrCreate('grade-sheet-semesters-container');
assert.strictEqual(semWrap.innerHTML.includes('<img src=x onerror=alert(1)>'), false, 'GradeSheet must escape course name HTML');
assert.strictEqual(semWrap.innerHTML.includes('&lt;img src=x onerror=alert(1)&gt;'), true, 'GradeSheet must render escaped course name');

let capturedCsv = '';
sandbox.window.Blob = function (parts) { capturedCsv = parts.join(''); };
GS.exportCSV();
assert.strictEqual(capturedCsv.includes('318942516'), false, 'Guest CSV export must not leak Adir ID');
assert.strictEqual(capturedCsv.includes('אדיר משה'), false, 'Guest CSV export must not leak Adir name');

getOrCreate('grade-sheet-student-name').innerText = 'דנה כהן';
getOrCreate('grade-sheet-student-id').innerText = '209998887';
GS.saveStudentInfo();
assert(storage['ast_grade_sheet_student_info_guest'], 'Student info must persist under guest-scoped key');
assert.strictEqual(storage['ast_grade_sheet_student_info'], undefined, 'Unscoped global key must not be used when AuthSync is present');
console.log('[2/3] PASS: grade_sheet.js guest PII isolation, scoped storage, and XSS escaping verified.');

// 4. Verify Command Palette search & click in fresh DOM-capturing context
const realElemsById = {};
const dom2 = {
    console, setTimeout, clearTimeout,
    addEventListener: () => {},
    removeEventListener: () => {},
    matchMedia: () => ({ matches: false, addEventListener: () => {} }),
    requestAnimationFrame: (fn) => fn(),
    scrollY: 0,
    innerWidth: 1440,
    innerHeight: 900,
    history: { pushState: () => {}, replaceState: () => {} },
    MutationObserver: function () { return { observe: () => {}, disconnect: () => {} }; },
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    localStorage: sandbox.localStorage,
    navigator: sandbox.navigator,
    CHEESEFORK_DB: sandbox.CHEESEFORK_DB,
    gameState: sandbox.gameState,
    openCourseDetails: (c) => { openedCourseCode = c; },
    AuthSync: sandbox.AuthSync,
    document: {
        readyState: 'complete',
        documentElement: { scrollTop: 0, style: { setProperty: () => {} } },
        head: { appendChild: () => {} },
        body: Object.assign(makeElement('body'), {
            appendChild(el) { if (el.id) realElemsById[el.id] = el; },
            style: {},
            scrollTop: 0
        }),
        createElement(tag) {
            const el = makeElement(tag);
            Object.defineProperty(el, 'innerHTML', {
                get() { return this._innerHTML; },
                set(v) {
                    this._innerHTML = String(v);
                    if (this.id === 'command-palette-modal') {
                        realElemsById['command-palette-input'] = makeElement('input', 'command-palette-input');
                        realElemsById['command-palette-results'] = makeElement('div', 'command-palette-results');
                    }
                    if (this.id === 'command-palette-results') {
                        const items = [];
                        const re = /class="command-palette-item[^"]*"\s+data-index="(\d+)"/g;
                        let m;
                        while ((m = re.exec(this._innerHTML)) !== null) {
                            const item = makeElement('div');
                            item.dataset.index = m[1];
                            items.push(item);
                        }
                        this._cmdItems = items;
                    }
                }
            });
            return el;
        },
        getElementById(id) { return realElemsById[id] || null; },
        querySelector() { return null; },
        querySelectorAll(sel) {
            if (sel === '.command-palette-item' && realElemsById['command-palette-results']) {
                return realElemsById['command-palette-results']._cmdItems || [];
            }
            return [];
        },
        addEventListener() {}
    }
};
dom2.window = dom2;
dom2.globalThis = dom2;
vm.createContext(dom2);
vm.runInContext(utilsCode, dom2);
vm.runInContext(uiSrc, dom2);

dom2.window.openCommandPalette();
const cmdInput = realElemsById['command-palette-input'];
const cmdResults = realElemsById['command-palette-results'];
assert(cmdInput && cmdResults, 'Command palette input and results must exist');

// Simulate typing XSS payload first, then '034053', and clicking the course match
cmdInput.value = '<script>alert(1)</script>';
cmdInput.trigger('input', { target: cmdInput });
assert.strictEqual(cmdResults.innerHTML.includes('<script>alert(1)</script>'), false, 'Command Palette must escape XSS query');
assert.strictEqual(cmdResults.innerHTML.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), true, 'Escaped query must appear');

cmdInput.value = '034053';
cmdInput.trigger('input', { target: cmdInput });
const itemsAfter = cmdResults._cmdItems || [];
assert(itemsAfter.length >= 1, '6-digit query 034053 must match 00340053 entry');
itemsAfter[0].click();
assert.strictEqual(openedCourseCode, '034053', 'Clicking Smart Search course must open course details without ReferenceError');
console.log('[3/3] PASS: Command Palette DOM wiring, XSS escaping, and 6-digit openCourseDetails click verified.');

// 5. Pass 1b assertions: ExamReadinessHub onclick escaping, Course Comparator localization + ModalHelp, app.js catalog fallback & histogram detail
const examSrc = fs.readFileSync(path.join(ROOT, 'exam_readiness_hub.js'), 'utf8');
const examContainer = makeElement('div', 'modal-exam-readiness-container');
const examSandbox = {
    console,
    window: null,
    gameState: { examPrep: {} },
    PangeaHub: {
        getCourseData: () => ({
            exams: [{ name: "2025 חורף - מועד א'", displayTitle: "2025 חורף - מועד א'", url: "https://idofangbentov.uk/exam'test" }]
        })
    },
    __semesteroUtils: sandbox.__semesteroUtils
};
examSandbox.window = examSandbox;
vm.createContext(examSandbox);
vm.runInContext(examSrc, examSandbox);
examSandbox.ExamReadinessHub.renderExamReadinessCard('034053', examContainer);
const onclickMatch = examContainer.innerHTML.match(/onclick="([^"]*openQuickPeek[^"]*)"/);
assert(onclickMatch && onclickMatch[1], 'ExamReadinessHub must render Pangea QuickPeek button');
const decodedOnclick = onclickMatch[1]
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
assert.doesNotThrow(() => new vm.Script(decodedOnclick), 'Decoded ExamReadinessHub Pangea onclick must compile with zero SyntaxError');

const modalHelpSrc = fs.readFileSync(path.join(ROOT, 'modal_help.js'), 'utf8');
assert.strictEqual(modalHelpSrc.includes("'course-comparison-modal'"), true, 'ModalHelp must include course-comparison-modal');

assert.strictEqual(appSrc.includes('adaptPlannerCatalogCourseForLookup'), true, 'app.js must provide PLANNER_CATALOG fallback in add-course lookup');
assert.strictEqual(appSrc.includes('analytics-histogram-detail'), true, 'app.js must render interactive histogram detail drill-down');

// Verify CourseComparator renders Hebrew for type: 'elective'
const compTable = makeElement('div', 'comparison-table-container');
const sel1 = Object.assign(makeElement('select', 'compare-select-1'), { value: '035008' });
const sel2 = Object.assign(makeElement('select', 'compare-select-2'), { value: '036013' });
realElemsById['comparison-table-container'] = compTable;
realElemsById['compare-select-1'] = sel1;
realElemsById['compare-select-2'] = sel2;
dom2.PLANNER_CATALOG = {
    ALL_COURSES_MAP: {
        '035008': { code: '035008', name: 'קורס בדיקה א', credits: 3, type: 'elective' },
        '036013': { code: '036013', name: 'קורס בדיקה ב', credits: 3, type: 'core' }
    }
};
dom2.window.renderComparisonTable();
assert.strictEqual(compTable.innerHTML.includes('קורס בחירה פקולטי'), true, 'Course Comparator must translate raw elective to Hebrew');
assert.strictEqual(compTable.innerHTML.includes('>elective<'), false, 'Course Comparator must not display raw English elective');
console.log('[4/4] PASS: Pass 1b ExamReadinessHub onclick SyntaxError fix, Comparator Hebrew/Help, and app.js lookup/histogram verified.');

console.log('\nALL PASS 1 + 1b CURRICULUM HARDENING TESTS PASSED!');
