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
    'grade-sheet-modal': new MockElement('grade-sheet-modal', 'modal-overlay'),
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

// Test 9: Root reached -> returns false (allows normal app exit or backgrounding)
handled = navManager.handleBack();
assert.strictEqual(handled, false, 'handleBack should return false when at root with no modals');
console.log('✅ Test 9: At root state, handleBack gracefully returns false.');

console.log('🎉 All Mobile Back Navigation Shield tests passed successfully!');
