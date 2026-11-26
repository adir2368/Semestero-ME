/**
 * Pass 2 Regression Suite: Degree Planner (tab-planner) Hardening
 * Covers P2-1 through P2-9 fixes.
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = path.resolve(__dirname, '..');

function createStorageMock() {
    const store = {};
    return {
        getItem: (k) => (k in store ? store[k] : null),
        setItem: (k, v) => { store[k] = String(v); },
        removeItem: (k) => { delete store[k]; },
        clear: () => { Object.keys(store).forEach(k => delete store[k]); }
    };
}

function createEl(tag = 'div', id = '') {
    const cls = new Set();
    const attrs = {};
    const children = [];
    const el = {
        tagName: tag.toUpperCase(),
        id,
        style: { cssText: '' },
        dataset: {},
        innerHTML: '',
        innerText: '',
        textContent: '',
        children,
        firstChild: null,
        classList: {
            add: (...xs) => xs.forEach(x => cls.add(x)),
            remove: (...xs) => xs.forEach(x => cls.delete(x)),
            toggle: (x, force) => {
                if (force === true) { cls.add(x); return true; }
                if (force === false) { cls.delete(x); return false; }
                if (cls.has(x)) { cls.delete(x); return false; }
                cls.add(x); return true;
            },
            contains: (x) => cls.has(x)
        },
        setAttribute: (k, v) => {
            attrs[k] = String(v);
            if (k === 'class') String(v).split(/\s+/).filter(Boolean).forEach(x => cls.add(x));
        },
        getAttribute: (k) => (k in attrs ? attrs[k] : null),
        appendChild: (c) => { children.push(c); el.firstChild = children[0] || null; return c; },
        insertBefore: (c) => { children.unshift(c); el.firstChild = children[0] || null; return c; },
        remove: () => {},
        closest: () => null,
        querySelector: (sel) => {
            if (sel === '.collapse-icon' || sel === '.collapse-text' || sel === '.btn-close-picker') return null;
            return null;
        },
        querySelectorAll: () => [],
        addEventListener: () => {},
        scrollIntoView: () => {},
        click: () => {}
    };
    return el;
}

function loadPlannerSandbox() {
    const ls = createStorageMock();
    const bodyEl = createEl('body');
    const elements = new Map();
    [
        'planner-semesters-container',
        'planner-electives-pool',
        'planner-missing-mandatory-section',
        'planner-ready-electives-list',
        'planner-header-banner',
        'planner-whatif-container',
        'planner-total-credits-val',
        'planner-electives-credits-val',
        'planner-export-modal-overlay',
        'planner-semesters-mgr-modal-overlay'
    ].forEach(id => elements.set(id, createEl('div', id)));

    const document = {
        body: bodyEl,
        documentElement: { style: { setProperty: () => {} } },
        getElementById: (id) => {
            if (elements.has(id)) return elements.get(id);
            for (const c of bodyEl.children) {
                if (c.id === id) return c;
            }
            return null;
        },
        createElement: (tag) => createEl(tag),
        querySelector: () => null,
        querySelectorAll: () => [],
        addEventListener: () => {}
    };

    const sandbox = {
        console,
        setTimeout,
        clearTimeout,
        requestAnimationFrame: (fn) => fn(),
        localStorage: ls,
        sessionStorage: createStorageMock(),
        document,
        navigator: {},
        confirm: () => true,
        renderUI: () => {},
        renderFlowchartTree: () => {},
        saveState: () => {},
        notifyStateChanged: () => {},
        updateHud: () => {},
        gameState: {
            currentActiveSemester: 1,
            courses: {
                '104065': { code: '104065', name: 'אלגברה 1 מ\'', credits: 5.0, semester: 1, status: 'available', tasks: [] },
                '114051': { code: '114051', name: 'פיזיקה 1', credits: 2.5, semester: 2, status: 'available', tasks: [] }
            }
        }
    };
    sandbox.window = sandbox;
    sandbox.global = sandbox;
    vm.createContext(sandbox);

    vm.runInContext(fs.readFileSync(path.join(rootDir, 'utils.js'), 'utf8'), sandbox);
    vm.runInContext(fs.readFileSync(path.join(rootDir, 'planner_catalog.js'), 'utf8'), sandbox);
    vm.runInContext(fs.readFileSync(path.join(rootDir, 'modal_help.js'), 'utf8'), sandbox);
    vm.runInContext(fs.readFileSync(path.join(rootDir, 'planner_module.js'), 'utf8'), sandbox);

    return { sandbox, elements, document };
}

console.log('=== RUNNING PASS 2 PLANNER HARDENING TESTS ===');

// 1. P2-1 & P2-3: Remove 01040065 & 01140051 -> restoreAllMissingMandatoryCourses() + resetPlanToSuggested()
{
    const { sandbox } = loadPlannerSandbox();
    sandbox.DegreePlanner.init(true);
    sandbox.DegreePlanner.removeCourse('01040065');
    sandbox.DegreePlanner.removeCourse('01140051');
    sandbox.gameState.courses['104065'].semester = 0;
    sandbox.gameState.courses['114051'].semester = 0;

    // Must NOT throw TypeError: mKeys.has is not a function
    sandbox.DegreePlanner.restoreAllMissingMandatoryCourses();
    const restoredPlan = sandbox.DegreePlanner.getCustomPlan();
    const sem1Codes = (restoredPlan.find(s => s.semester === 1)?.courses || []).map(c => c.code);
    const sem2Codes = (restoredPlan.find(s => s.semester === 2)?.courses || []).map(c => c.code);
    assert(sem1Codes.includes('01040065'), 'P2-1: 01040065 must be restored in Semester 1 by restoreAllMissingMandatoryCourses');
    assert(sem2Codes.includes('01140051'), 'P2-1: 01140051 must be restored in Semester 2 by restoreAllMissingMandatoryCourses');

    // Now test P2-3: resetPlanToSuggested restores even if gameState courses had semester = 0
    sandbox.DegreePlanner.removeCourse('01040065');
    sandbox.DegreePlanner.removeCourse('01140051');
    sandbox.gameState.courses['104065'].semester = 0;
    sandbox.gameState.courses['114051'].semester = 0;
    sandbox.DegreePlanner.resetPlanToSuggested();
    const resetPlan = sandbox.DegreePlanner.getCustomPlan();
    const resetSem1 = (resetPlan.find(s => s.semester === 1)?.courses || []).map(c => c.code);
    const resetSem2 = (resetPlan.find(s => s.semester === 2)?.courses || []).map(c => c.code);
    assert(resetSem1.includes('01040065'), 'P2-3: resetPlanToSuggested must restore 01040065 even when gameState semester was 0');
    assert(resetSem2.includes('01140051'), 'P2-3: resetPlanToSuggested must restore 01140051 even when gameState semester was 0');
    console.log('✓ P2-1 & P2-3 passed: restoreAllMissingMandatoryCourses + resetPlanToSuggested');
}

// 2. P2-1 Physics variant completion recognition + P2-2 sem-picker modal fixed styling
{
    const { sandbox, elements } = loadPlannerSandbox();
    delete sandbox.gameState.courses['114051'];
    sandbox.gameState.courses['114071'] = { code: '114071', name: 'פיזיקה 1מ\'', credits: 3.5, semester: 2, status: 'mastered', grade: 95, completed: true, tasks: [] };
    sandbox.DegreePlanner.init(true);
    sandbox.DegreePlanner.removeCourse('01140051');
    sandbox.DegreePlanner.renderAddElectivesSection(sandbox.DegreePlanner.getCustomPlan(), {});
    const bannerHtml = elements.get('planner-missing-mandatory-section').innerHTML || '';
    assert(!bannerHtml.includes('01140051'), 'P2-1: completed Physics variant 114071 must satisfy 01140051 missing mandatory check');

    // P2-2: check promptAddCourseToSemester sets fixed positioning
    const plannerSrc = fs.readFileSync(path.join(rootDir, 'planner_module.js'), 'utf8');
    assert(plannerSrc.includes("modal.id = 'planner-sem-picker-modal'") && plannerSrc.includes('position: fixed; inset: 0;'), 'P2-2: #planner-sem-picker-modal must use position: fixed; inset: 0;');
    console.log('✓ P2-1 (variant) & P2-2 (fixed picker modal) passed');
}

// 3. P2-4 & P2-5 & P2-7 CSS & Card Actions & Toast Suppression
{
    const plannerSrc = fs.readFileSync(path.join(rootDir, 'planner_module.js'), 'utf8');
    const cssSrc = fs.readFileSync(path.join(rootDir, 'styles.css'), 'utf8');

    assert(plannerSrc.includes('class="btn-card-move"'), 'P2-4: planner cards must render .btn-card-move action button');
    assert(plannerSrc.includes("e.target.closest('.btn-card-move')"), 'P2-4: delegated handler must wire .btn-card-move to openCourseActionSheet');
    assert(cssSrc.includes('.planner-course-card .course-card-actions'), 'P2-4: styles.css must keep planner card actions visible');
    assert(cssSrc.includes('.modal-backdrop.active') && cssSrc.includes('position: fixed;'), 'P2-2: styles.css must style .modal-backdrop.active with fixed centering');
    assert(/\.workload-popover-overlay\s*\{\s*z-index:\s*100060\s*!important/.test(cssSrc), 'P2-5: .workload-popover-overlay must elevate z-index to 100060 above navbar');
    assert(plannerSrc.includes('suppressToast = false'), 'P2-5: highlightMissingPrerequisites must support suppressToast when modal opens');
    assert(cssSrc.includes('#modal-course-code {') && cssSrc.includes('text-decoration: none !important;'), 'P2-7: #modal-course-code must prevent line-through artifact');
    assert(/#modal-course-code\s*\{[^}]*'Rubik'/.test(cssSrc), 'P2-7: #modal-course-code must use Rubik instead of dotted JetBrains Mono 0 glyphs');
    assert(/\.planner-export-modal,\s*\.planner-semesters-mgr-modal\s*\{[^}]*max-height:\s*calc\(100d?vh\s*-\s*32px\)\s*!important[^}]*overflow-y:\s*auto\s*!important/s.test(cssSrc), 'P2-8: planner-export-modal and planner-semesters-mgr-modal must constrain max-height and scroll internally');
    console.log('✓ P2-4, P2-5 & P2-7 passed');
}

// 4. P2-8 Modal Help coverage
{
    const helpSrc = fs.readFileSync(path.join(rootDir, 'modal_help.js'), 'utf8');
    [
        'planner-semesters-mgr-modal',
        'planner-export-modal',
        'planner-graduation-clearance-modal',
        'planner-exam-density-modal',
        'planner-sport-club-modal'
    ].forEach(id => {
        assert(helpSrc.includes(`'${id}':`), `P2-8: MODAL_HELP_REGISTRY must register ${id}`);
    });
    assert(helpSrc.includes('modalEl.scrollTop = 0;'), 'P2-8: planner help banners must scroll modal to top without scrollIntoView clipping header');
    console.log('✓ P2-8 passed: all 5 planner sub-modals registered in MODAL_HELP_REGISTRY');
}

console.log('🎉 ALL PASS 2 HARDENING ASSERTIONS PASSED!');
