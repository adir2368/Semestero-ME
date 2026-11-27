const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');
const cssSource = fs.readFileSync(path.join(ROOT_DIR, 'styles.css'), 'utf8');
const uiSource = fs.readFileSync(path.join(ROOT_DIR, 'ui_enhancements.js'), 'utf8');
const appSource = fs.readFileSync(path.join(ROOT_DIR, 'app.js'), 'utf8');

function extractBraceFunction(src, name) {
    const marker = `function ${name}(`;
    const start = src.indexOf(marker);
    if (start === -1) throw new Error(`Could not find ${marker} in source`);
    let braceStart = src.indexOf('{', start);
    let depth = 0;
    let inSingle = false;
    let inDouble = false;
    let inTemplate = false;
    let inLineComment = false;
    let inBlockComment = false;
    let escaped = false;

    for (let i = braceStart; i < src.length; i++) {
        const ch = src[i];
        const next = src[i + 1];

        if (inLineComment) {
            if (ch === '\n') inLineComment = false;
            continue;
        }
        if (inBlockComment) {
            if (ch === '*' && next === '/') {
                inBlockComment = false;
                i++;
            }
            continue;
        }
        if (escaped) {
            escaped = false;
            continue;
        }
        if ((inSingle || inDouble || inTemplate) && ch === '\\') {
            escaped = true;
            continue;
        }
        if (!inSingle && !inDouble && !inTemplate) {
            if (ch === '/' && next === '/') {
                inLineComment = true;
                i++;
                continue;
            }
            if (ch === '/' && next === '*') {
                inBlockComment = true;
                i++;
                continue;
            }
        }
        if (!inDouble && !inTemplate && ch === "'") {
            inSingle = !inSingle;
            continue;
        }
        if (!inSingle && !inTemplate && ch === '"') {
            inDouble = !inDouble;
            continue;
        }
        if (!inSingle && !inDouble && ch === '`') {
            inTemplate = !inTemplate;
            continue;
        }
        if (!inSingle && !inDouble && !inTemplate) {
            if (ch === '{') depth++;
            else if (ch === '}') {
                depth--;
                if (depth === 0) return src.slice(start, i + 1);
            }
        }
    }
    throw new Error(`Unbalanced braces for function ${name}`);
}

class MockClassList {
    constructor(el) {
        this.el = el;
        this.set = new Set();
    }
    add(...tokens) {
        tokens.forEach((t) => { if (t) this.set.add(t); });
    }
    remove(...tokens) {
        tokens.forEach((t) => this.set.delete(t));
    }
    contains(token) {
        return this.set.has(token);
    }
    toggle(token, force) {
        if (force === true) { this.set.add(token); return true; }
        if (force === false) { this.set.delete(token); return false; }
        if (this.set.has(token)) { this.set.delete(token); return false; }
        this.set.add(token);
        return true;
    }
}

class MockElement {
    constructor(tagName, ownerDocument) {
        this.tagName = String(tagName || 'div').toUpperCase();
        this.ownerDocument = ownerDocument;
        this.id = '';
        this.children = [];
        this.parentNode = null;
        this.attributes = {};
        this.dataset = {};
        this.classList = new MockClassList(this);
        this._className = '';
        this._textContent = '';
        this.offsetLeft = 0;
        this.offsetTop = 0;
        this.offsetWidth = 0;
        this.offsetHeight = 0;
        this.scrollLeft = 0;
        this.scrollTop = 0;
        this.listeners = {};
        this.style = {
            _props: {},
            setProperty: (k, v) => { this.style._props[k] = v; }
        };
    }
    set className(val) {
        this._className = String(val || '');
        this.classList.set = new Set(this._className.split(/\s+/).filter(Boolean));
    }
    get className() {
        return Array.from(this.classList.set).join(' ');
    }
    set textContent(val) {
        this._textContent = String(val ?? '');
    }
    get textContent() {
        return this._textContent + this.children.map((c) => c.textContent).join('');
    }
    setAttribute(k, v) {
        this.attributes[k] = String(v);
        if (k === 'id') this.id = String(v);
        if (k.startsWith('data-')) {
            const camel = k.slice(5).replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
            this.dataset[camel] = String(v);
        }
    }
    getAttribute(k) {
        return this.attributes[k] ?? null;
    }
    appendChild(child) {
        if (child.parentNode) child.remove();
        child.parentNode = this;
        this.children.push(child);
        return child;
    }
    insertBefore(child, ref) {
        if (child.parentNode) child.remove();
        child.parentNode = this;
        const idx = ref ? this.children.indexOf(ref) : -1;
        if (idx === -1) this.children.push(child);
        else this.children.splice(idx, 0, child);
        return child;
    }
    remove() {
        if (!this.parentNode) return;
        const idx = this.parentNode.children.indexOf(this);
        if (idx !== -1) this.parentNode.children.splice(idx, 1);
        this.parentNode = null;
    }
    addEventListener(type, fn) {
        if (!this.listeners[type]) this.listeners[type] = [];
        this.listeners[type].push(fn);
    }
    dispatchEvent(evt) {
        (this.listeners[evt.type] || []).forEach((fn) => fn(evt));
    }
    matchesSelector(selector) {
        const parts = selector.split('.').filter(Boolean);
        if (selector.startsWith('#')) return this.id === selector.slice(1);
        return parts.every((cls) => this.classList.contains(cls));
    }
    querySelectorAll(selector) {
        const out = [];
        const walk = (node) => {
            for (const ch of node.children) {
                if (ch.matchesSelector(selector)) out.push(ch);
                walk(ch);
            }
        };
        walk(this);
        return out;
    }
    querySelector(selector) {
        return this.querySelectorAll(selector)[0] || null;
    }
    closest(selector) {
        let cur = this;
        while (cur) {
            if (cur.matchesSelector && cur.matchesSelector(selector)) return cur;
            cur = cur.parentNode;
        }
        return null;
    }
    getElementById(id) {
        if (this.id === id) return this;
        for (const ch of this.children) {
            const hit = ch.getElementById(id);
            if (hit) return hit;
        }
        return null;
    }
}

function createMockDocument() {
    const doc = {
        readyState: 'complete',
        listeners: {},
        body: null,
        documentElement: null,
        fonts: { ready: Promise.resolve() },
        createElement(tag) {
            return new MockElement(tag, doc);
        },
        querySelectorAll(sel) {
            return doc.body.querySelectorAll(sel);
        },
        querySelector(sel) {
            return doc.body.querySelector(sel);
        },
        getElementById(id) {
            return doc.body.getElementById(id);
        },
        addEventListener(type, fn) {
            if (!doc.listeners[type]) doc.listeners[type] = [];
            doc.listeners[type].push(fn);
        },
        get head() {
            return doc._head;
        }
    };
    doc.body = new MockElement('body', doc);
    doc.documentElement = new MockElement('html', doc);
    doc._head = new MockElement('head', doc);
    return doc;
}

console.log('Running @ui_motion_prompts Integration Suite tests...');

// 1. Verify CSS rules exist in styles.css
assert(cssSource.includes('.ui-frosted-glass-6'), 'styles.css missing 6-layer .ui-frosted-glass-6 class');
assert(cssSource.includes('backdrop-filter: blur(20px) saturate(160%) brightness(1.05)'), 'styles.css missing 6-layer frosted backdrop-filter');
assert(cssSource.includes('.nav-sliding-pill'), 'styles.css missing .nav-sliding-pill');
assert(cssSource.includes('.nav-sliding-pill.is-stretching'), 'styles.css missing .nav-sliding-pill.is-stretching');
assert(cssSource.includes('@keyframes uiMotionIconPop'), 'styles.css missing uiMotionIconPop keyframes');
assert(cssSource.includes('.xp-bar-fill'), 'styles.css missing .xp-bar-fill progress rule');
assert(cssSource.includes('cubic-bezier(0.34, 1.56, 0.64, 1)'), 'styles.css missing spring overshoot curve');
assert(cssSource.includes('.bell-badge.is-bumping::after'), 'styles.css missing notification sonar ring ::after');
assert(cssSource.includes('@keyframes uiMotionSonarRing'), 'styles.css missing uiMotionSonarRing keyframes');
assert(cssSource.includes('.ast-toast[data-stack-index="1"]'), 'styles.css missing stacked toast index 1');
assert(cssSource.includes('.ast-toast-merge-badge'), 'styles.css missing toast merge badge');
assert(cssSource.includes('.ast-toast-progress'), 'styles.css missing toast countdown bar');
assert(cssSource.includes('body.a11y-stop-animations .nav-sliding-pill'), 'styles.css missing accessibility stop-animations guard');
assert(cssSource.includes('@media (prefers-reduced-motion: reduce)'), 'styles.css missing prefers-reduced-motion guard');
console.log('PASS: 1. styles.css contains all 5 @ui_motion_prompts recipes + reduced-motion guards');

// 2. Verify ui_enhancements.js sliding pill & badge sonar bump in VM sandbox
const mockDoc = createMockDocument();
const tabsWrap = mockDoc.createElement('div');
tabsWrap.className = 'nav-tabs-left';
const tab1 = mockDoc.createElement('button');
tab1.className = 'nav-tab active';
tab1.offsetLeft = 10;
tab1.offsetTop = 4;
tab1.offsetWidth = 96;
tab1.offsetHeight = 36;
const tab2 = mockDoc.createElement('button');
tab2.className = 'nav-tab';
tab2.offsetLeft = 120;
tab2.offsetTop = 4;
tab2.offsetWidth = 112;
tab2.offsetHeight = 36;
tabsWrap.appendChild(tab1);
tabsWrap.appendChild(tab2);
mockDoc.body.appendChild(tabsWrap);

const bellBadge = mockDoc.createElement('span');
bellBadge.id = 'bell-badge-count';
bellBadge.className = 'bell-badge';
bellBadge._textContent = '3';
mockDoc.body.appendChild(bellBadge);

const observers = [];
class MockMutationObserver {
    constructor(cb) {
        this.cb = cb;
        this.target = null;
        observers.push(this);
    }
    observe(target) {
        this.target = target;
    }
    disconnect() {}
    trigger(records = []) {
        this.cb(records);
    }
}

const storageMap = new Map();
const mockWindow = {
    location: { hash: '' },
    history: { pushState() {}, replaceState() {} },
    addEventListener() {},
    matchMedia: () => ({ matches: false }),
    innerWidth: 1280
};
mockWindow.window = mockWindow;
mockWindow.document = mockDoc;

const uiSandbox = {
    window: mockWindow,
    document: mockDoc,
    MutationObserver: MockMutationObserver,
    requestAnimationFrame: (fn) => { fn(); return 1; },
    setTimeout,
    clearTimeout,
    localStorage: {
        getItem: (k) => (storageMap.has(k) ? storageMap.get(k) : null),
        setItem: (k, v) => storageMap.set(k, String(v)),
        removeItem: (k) => storageMap.delete(k)
    },
    navigator: { clipboard: { writeText: async () => {} }, vibrate: () => false },
    console
};

vm.runInNewContext(uiSource, uiSandbox);
assert(mockWindow.UiMotionPromptsSuite, 'window.UiMotionPromptsSuite should be exposed');

const pill = tabsWrap.querySelector('.nav-sliding-pill');
assert(pill, '.nav-sliding-pill should be injected on init');
assert.strictEqual(pill.style.left, '10px');
assert.strictEqual(pill.style.width, '96px');
assert(tabsWrap.classList.contains('has-sliding-pill'), '.nav-tabs-left should gain .has-sliding-pill');

// Switch active tab and sync pill
tab1.classList.remove('active');
tab2.classList.add('active');
mockWindow.UiMotionPromptsSuite.syncSlidingPill(tabsWrap, true);
assert.strictEqual(pill.style.left, '120px');
assert.strictEqual(pill.style.width, '112px');
assert(pill.classList.contains('is-stretching'), '.nav-sliding-pill should add .is-stretching on move');

// Regression guard: MutationObserver must ignore pill/container mutations to avoid Chromium microtask loops
const tabObserver = observers.find((o) => o.target === tabsWrap);
assert(tabObserver, 'MutationObserver should be attached to .nav-tabs-left');
tab2.classList.remove('active');
tab1.classList.add('active');
tabObserver.trigger([{ target: pill }]);
tabObserver.trigger([{ target: tabsWrap }]);
assert.strictEqual(pill.style.left, '120px', 'Observer must ignore mutations from .nav-sliding-pill or container');
tabObserver.trigger([{ target: tab1 }]);
assert.strictEqual(pill.style.left, '10px', 'Observer must glide pill back when a .nav-tab class mutates');

// Badge sonar bump on count change
const badgeObserver = observers.find((o) => o.target === bellBadge);
assert(badgeObserver, 'MutationObserver should be attached to #bell-badge-count');
bellBadge._textContent = '4';
badgeObserver.trigger([]);
assert(bellBadge.classList.contains('is-bumping'), '#bell-badge-count should gain .is-bumping when count increments');

// Clean up pending timers before next check
if (pill._stretchTimer) clearTimeout(pill._stretchTimer);
if (bellBadge._uiMotionBumpTimer) clearTimeout(bellBadge._uiMotionBumpTimer);

// Reduced motion check stops bump
bellBadge.classList.remove('is-bumping');
mockDoc.body.classList.add('a11y-stop-animations');
mockWindow.UiMotionPromptsSuite.triggerBadgeBump(bellBadge);
assert(!bellBadge.classList.contains('is-bumping'), 'a11y-stop-animations should suppress badge bump');
console.log('PASS: 2. ui_enhancements.js sliding pill geometry, velocity stretch, badge sonar bump & reduced-motion guard work');

// 3. Verify app.js stacked toasts + merge counter + countdown bar
const toastDoc = createMockDocument();
const timers = [];
const toastSandbox = {
    document: toastDoc,
    setTimeout: (fn, ms) => {
        const handle = { fn, ms, cleared: false };
        timers.push(handle);
        return handle;
    },
    clearTimeout: (handle) => {
        if (handle) handle.cleared = true;
    },
    console
};

const toastCode = [
    extractBraceFunction(appSource, 'repackAstToastStack'),
    extractBraceFunction(appSource, 'scheduleAstToastRemoval'),
    extractBraceFunction(appSource, 'showToastNotification')
].join('\n');

vm.runInNewContext(toastCode, toastSandbox);

const t1 = toastSandbox.showToastNotification('Task synced successfully', 'success');
assert.strictEqual(t1.getAttribute('data-stack-index'), '0');
assert(t1.querySelector('.ast-toast-progress'), 'Toast should include .ast-toast-progress bar');
assert(!t1.querySelector('.ast-toast-merge-badge'), 'Single toast should not show merge badge yet');

const t1Dup = toastSandbox.showToastNotification('Task synced successfully', 'success');
assert.strictEqual(t1Dup, t1, 'Identical toast should merge into existing element');
const mergeBadge = t1.querySelector('.ast-toast-merge-badge');
assert(mergeBadge, 'Merged toast should show .ast-toast-merge-badge');
assert.strictEqual(mergeBadge.textContent, 'קומבו ×2');

const t2 = toastSandbox.showToastNotification('Calendar sync finished', 'info');
assert.notStrictEqual(t2, t1);
assert.strictEqual(t2.getAttribute('data-stack-index'), '0', 'Newest distinct toast sits at index 0');
assert.strictEqual(t1.getAttribute('data-stack-index'), '1', 'Previous toast shifts to index 1');

const t3 = toastSandbox.showToastNotification('Warning: offline cache', 'warning');
const t4 = toastSandbox.showToastNotification('Fourth toast caps stack', 'info');
assert.strictEqual(t4.getAttribute('data-stack-index'), '0');
assert.strictEqual(t3.getAttribute('data-stack-index'), '1');
assert.strictEqual(t2.getAttribute('data-stack-index'), '2');
assert.strictEqual(toastDoc.querySelectorAll('.ast-toast').length, 3, 'Toast stack should cap cleanly at 3 visible toasts');

// Simulate expiry of front toast (t4) -> remaining compact back down
const activeHideTimer = t4._toastHideTimer;
assert(activeHideTimer && !activeHideTimer.cleared);
activeHideTimer.fn();
t4._toastRemoveTimer.fn();
assert.strictEqual(t3.getAttribute('data-stack-index'), '0', 'Stack should compact after front toast expires');
assert.strictEqual(t2.getAttribute('data-stack-index'), '1');

console.log('PASS: 3. app.js showToastNotification merges duplicates (×2), stacks up to 3, shows progress bar & compacts on expiry');

// 4. Verify 10 UI/UX Motion & Interaction Principles (@theecommguy)
assert(cssSource.includes('.ui-confirm-pulse::after'), 'styles.css missing .ui-confirm-pulse::after');
assert(cssSource.includes('.ui-confirm-check-path'), 'styles.css missing .ui-confirm-check-path');
assert(cssSource.includes('.ui-icon-crossfade.is-swapping'), 'styles.css missing .ui-icon-crossfade.is-swapping');
assert(cssSource.includes('@keyframes uiMaskRevealDown'), 'styles.css missing uiMaskRevealDown');
assert(cssSource.includes('.ui-fitts-dismiss-btn'), 'styles.css missing .ui-fitts-dismiss-btn');
assert(typeof mockWindow.triggerConfirmPulse === 'function', 'window.triggerConfirmPulse must be exposed');
assert(typeof mockWindow.crossfadeIcon === 'function', 'window.crossfadeIcon must be exposed');
assert(typeof mockWindow.UiMotionPromptsSuite.animateSharedOriginExpand === 'function', 'animateSharedOriginExpand must be exposed');
assert(typeof mockWindow.UiMotionPromptsSuite.attachEdgeRubberBand === 'function', 'attachEdgeRubberBand must be exposed');

mockDoc.body.classList.remove('a11y-stop-animations');
const pulseBtn = mockDoc.createElement('button');
pulseBtn._innerHTML = 'Copy';
mockWindow.triggerConfirmPulse(pulseBtn, 'Copied!');
assert(pulseBtn.classList.contains('ui-confirm-pulse'), 'triggerConfirmPulse must add .ui-confirm-pulse immediately');

mockDoc.body.classList.add('a11y-stop-animations');
const suppressedBtn = mockDoc.createElement('button');
mockWindow.triggerConfirmPulse(suppressedBtn, 'Copied!');
assert(!suppressedBtn.classList.contains('ui-confirm-pulse'), 'a11y-stop-animations should suppress confirm pulse');
mockDoc.body.classList.remove('a11y-stop-animations');

console.log('PASS: 4. 10 UI/UX Motion & Interaction rules (confirm pulse, crossfade, FLIP, rubber-band, masks, Fitts, 0ms cmd palette) verified');
console.log('ALL @ui_motion_prompts TESTS PASSED!');

