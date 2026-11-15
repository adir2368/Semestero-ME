const assert = require('assert');

console.log('🧪 Running Mobile Back Navigation Shield Tests...');

// Setup minimal DOM simulation environment
class MockElement {
    constructor(id = '', className = '') {
        this.id = id;
        this.className = className;
        this.classList = {
            _classes: new Set(className.split(' ').filter(Boolean)),
            contains: (c) => this.classList._classes.has(c),
            add: (c) => this.classList._classes.add(c),
            remove: (c) => this.classList._classes.delete(c)
        };
        this.style = {};
        this.hidden = false;
        this.children = [];
    }
    setAttribute() {}
    getAttribute() { return ''; }
    appendChild() {}
    addEventListener() {}
    removeEventListener() {}
    querySelector(sel) {
        if (sel.includes('.modal-close') && this._closeBtn) return this._closeBtn;
        return null;
    }
    click() {
        if (typeof this.onclick === 'function') this.onclick();
    }
}

const mockElements = {
    'pangea-reader-modal': new MockElement('pangea-reader-modal', 'modal-overlay'),
    'pangea-search-modal': new MockElement('pangea-search-modal', 'modal-overlay'),
    'notif-drawer-overlay': new MockElement('notif-drawer-overlay', 'drawer-overlay'),
    'modal-attendance-hub': new MockElement('modal-attendance-hub', 'modal-overlay'),
    'modal-grade-sheet': new MockElement('modal-grade-sheet', 'modal-overlay'),
    'analytics-modal': new MockElement('analytics-modal', 'modal-overlay'),
    'analytics-section-deep': new MockElement('analytics-section-deep', ''),
    'course-modal': new MockElement('course-modal', 'modal-overlay')
};

// Set initially closed
Object.values(mockElements).forEach(el => {
    el.style.display = 'none';
});

global.window = {
    _tabHistoryStack: [],
    currentActiveTab: 'tasks',
    setActiveMainTab: function(tab, isNavBack) {
        this.currentActiveTab = tab;
    },
    InteractiveTour: {
        _active: false,
        isActive: function() { return this._active; },
        endTour: function() { this._active = false; }
    },
    PangeaHub: {
        closeQuickPeek: function() { mockElements['pangea-reader-modal'].style.display = 'none'; },
        closeGlobalSearch: function() { mockElements['pangea-search-modal'].style.display = 'none'; }
    },
    AttendanceHub: {
        close: function() { mockElements['modal-attendance-hub'].style.display = 'none'; }
    },
    switchAnalyticsTab: function(tab) {
        this._currentAnalyticsTab = tab;
        mockElements['analytics-section-deep'].style.display = tab === 'deep' ? 'block' : 'none';
    },
    closeAnalyticsModal: function() {
        mockElements['analytics-modal'].style.display = 'none';
        mockElements['analytics-modal'].classList.remove('active');
    },
    GradeSheet: {
        returnTarget: null,
        closeModal: function() {
            mockElements['modal-grade-sheet'].style.display = 'none';
            mockElements['modal-grade-sheet'].classList.remove('active');
        },
        goBack: function() {
            const target = this.returnTarget;
            this.returnTarget = null;
            this.closeModal();
            if (target && typeof target.restore === 'function') {
                target.restore();
            }
        }
    },
    history: {
        replaceState: () => {},
        pushState: () => {}
    },
    addEventListener: () => {}
};

global.document = {
    getElementById: (id) => mockElements[id] || null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: (tag) => new MockElement('', tag),
    addEventListener: () => {},
    documentElement: { style: { setProperty: () => {} } },
    body: { style: {}, setAttribute: () => {}, appendChild: () => {} }
};
global.MutationObserver = class {
    observe() {}
    disconnect() {}
};
global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
};

// Load ui_enhancements.js to register MobileBackNavigationManager
require('../ui_enhancements.js');

const navManager = global.window.MobileBackNavigationManager;
assert(navManager, 'MobileBackNavigationManager must be registered on window');
console.log('✅ Test 1: MobileBackNavigationManager successfully initialized.');

// Test 2: Active tour is closed on back
global.window.InteractiveTour._active = true;
let handled = navManager.handleBack();
assert.strictEqual(handled, true, 'handleBack should return true when tour is active');
assert.strictEqual(global.window.InteractiveTour._active, false, 'Tour should be ended');
console.log('✅ Test 2: Guided tour intercepted and safely closed on back.');

// Test 3: Pangea reader modal is closed on back
mockElements['pangea-reader-modal'].style.display = 'flex';
handled = navManager.handleBack();
assert.strictEqual(handled, true, 'handleBack should return true when Pangea reader is open');
assert.strictEqual(mockElements['pangea-reader-modal'].style.display, 'none', 'Pangea reader should be closed');
console.log('✅ Test 3: Pangea QuickPeek Reader intercepted and closed on back.');

// Test 4: Pangea global search modal is closed on back
mockElements['pangea-search-modal'].style.display = 'flex';
handled = navManager.handleBack();
assert.strictEqual(handled, true, 'handleBack should return true when Pangea search is open');
assert.strictEqual(mockElements['pangea-search-modal'].style.display, 'none', 'Pangea search should be closed');
console.log('✅ Test 4: Pangea Global Search intercepted and closed on back.');

// Test 5: Attendance Hub modal is closed on back
mockElements['modal-attendance-hub'].style.display = 'flex';
handled = navManager.handleBack();
assert.strictEqual(handled, true, 'handleBack should return true when Attendance Hub is open');
assert.strictEqual(mockElements['modal-attendance-hub'].style.display, 'none', 'Attendance Hub should be closed');
console.log('✅ Test 5: Attendance Hub modal intercepted and closed on back.');

// Test 5b: Grade Sheet modal (#modal-grade-sheet) is closed on back and restores parent Performance Hub if opened from there
let analyticsRestored = false;
global.window.GradeSheet.returnTarget = {
    id: 'analytics-modal',
    restore: () => {
        analyticsRestored = true;
        mockElements['analytics-modal'].style.display = 'flex';
        mockElements['analytics-modal'].classList.add('active');
    }
};
mockElements['modal-grade-sheet'].style.display = 'flex';
handled = navManager.handleBack();
assert.strictEqual(handled, true, 'handleBack should return true when Grade Sheet modal is open');
assert.strictEqual(mockElements['modal-grade-sheet'].style.display, 'none', 'Grade Sheet modal should be closed');
assert.strictEqual(analyticsRestored, true, 'Grade Sheet back should restore parent Performance Hub');
console.log('✅ Test 5b: Grade Sheet modal intercepted on back and returned to Performance Hub.');

// Test 5c: Performance Hub steps back from deep analytics sub-tab -> summary -> closed
global.window._currentAnalyticsTab = 'deep';
mockElements['analytics-section-deep'].style.display = 'block';
handled = navManager.handleBack();
assert.strictEqual(handled, true, 'handleBack should step back from deep analytics sub-tab');
assert.strictEqual(global.window._currentAnalyticsTab, 'summary', 'Performance Hub should return to summary sub-tab first');
assert.strictEqual(mockElements['analytics-modal'].style.display, 'flex', 'Performance Hub should remain open on summary sub-tab');

handled = navManager.handleBack();
assert.strictEqual(handled, true, 'Second handleBack should close Performance Hub');
assert.strictEqual(mockElements['analytics-modal'].style.display, 'none', 'Performance Hub should now be closed');
console.log('✅ Test 5c: Performance Hub stepped back deep -> summary -> closed.');

// Test 6: Course details modal is closed on back
mockElements['course-modal'].classList.add('active');
mockElements['course-modal'].style.display = 'block';
handled = navManager.handleBack();
assert.strictEqual(handled, true, 'handleBack should return true when course modal is open');
assert(!mockElements['course-modal'].classList.contains('active'), 'Course modal should lose active class');
console.log('✅ Test 6: Course Details modal intercepted and closed on back.');

// Test 7: Tab history navigation when NO modal is open
global.window._tabHistoryStack = ['curriculum', 'planner'];
global.window.currentActiveTab = 'tasks';
handled = navManager.handleBack();
assert.strictEqual(handled, true, 'handleBack should return true when navigating back in tab history');
assert.strictEqual(global.window.currentActiveTab, 'planner', 'Current active tab should now be planner');
assert.deepStrictEqual(global.window._tabHistoryStack, ['curriculum'], 'Tab history stack should have popped planner');
console.log('✅ Test 7: Tab history stepped back to previous tab ("planner").');

handled = navManager.handleBack();
assert.strictEqual(handled, true, 'handleBack should return true when stepping back to curriculum');
assert.strictEqual(global.window.currentActiveTab, 'curriculum', 'Current active tab should now be curriculum');
assert.strictEqual(global.window._tabHistoryStack.length, 0, 'Tab history stack should now be empty');
console.log('✅ Test 8: Tab history stepped back to root tab ("curriculum").');

// Test 8b: Fallback from non-home tab to curriculum even if _tabHistoryStack is empty
global.window._tabHistoryStack = [];
global.window.currentActiveTab = 'tasks';
handled = navManager.handleBack();
assert.strictEqual(handled, true, 'handleBack should return true on non-home tab even when history stack is empty');
assert.strictEqual(global.window.currentActiveTab, 'curriculum', 'Non-home tab fallback should return to curriculum');
console.log('✅ Test 8b: Non-home tab safely falls back to root curriculum tab.');

// Test 9: Root reached -> returns false (allows double-back confirmation exit)
handled = navManager.handleBack();
assert.strictEqual(handled, false, 'handleBack should return false when at root curriculum with no modals');
console.log('✅ Test 9: At root state, handleBack gracefully returns false.');

// Test 10: Regression checks for official wording, undefined standing card, honors obsession removal & MainActivity back callback
const fs = require('fs');
const path = require('path');
const rootDir = path.resolve(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const gradeSheetJs = fs.readFileSync(path.join(rootDir, 'grade_sheet.js'), 'utf8');
const appJs = fs.readFileSync(path.join(rootDir, 'app.js'), 'utf8');
const uiEnhJs = fs.readFileSync(path.join(rootDir, 'ui_enhancements.js'), 'utf8');
const mainActivityJava = fs.readFileSync(path.join(rootDir, 'android/app/src/main/java/com/technion/semestero/MainActivity.java'), 'utf8');

assert(!indexHtml.includes('id="grade-sheet-academic-standing"'), 'Removed מעמד אקדמי field must not exist');
assert(!indexHtml.includes('id="analytics-honors-card"'), 'Removed analytics honors card must not exist');
assert(!indexHtml.includes('id="gs-kpi-honors"'), 'Removed grade sheet honors KPI must not exist');
assert(!gradeSheetJs.includes('HONORS_MIN_CREDITS'), 'Honors classification threshold must be removed from grade_sheet.js');
assert(!gradeSheetJs.includes('Cum Laude'), 'Cum Laude wording must be removed from grade_sheet.js');
assert(!gradeSheetJs.includes('גיליון ציונים אקדמי רשמי'), 'Grade Sheet CSV export must not say רשמי');
assert(!uiEnhJs.includes('גיליון ציונים אקדמי רשמי'), 'Command palette must not label Grade Sheet as רשמי');
assert(!appJs.includes('renderHonorsStandingAndForecaster'), 'Honors forecaster must be removed from app.js');
assert(!appJs.includes('מצטיין נשיא') && !appJs.includes('מצטיין דיקן'), 'Widget GPA badge must not claim Dean/President honors');
assert(indexHtml.includes('btn-back-grade-sheet') && indexHtml.includes('openGradeSheetFromAnalytics'), 'Performance Hub <-> Grade Sheet return navigation must be wired');
assert(mainActivityJava.includes('OnBackPressedCallback') && mainActivityJava.includes('handleAppBackNavigation'), 'Android MainActivity must intercept hardware Back presses');
console.log('✅ Test 10: Static parity & UI/honors/back-navigation assertions passed.');

console.log('🎉 All Mobile Back Navigation & Grade Sheet Cleanup tests passed successfully!');
