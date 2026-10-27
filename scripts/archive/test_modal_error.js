const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..', '..');

const elements = {};
function getOrCreateElement(id) {
    if (!elements[id]) {
        elements[id] = {
            id: id,
            innerText: '',
            innerHTML: '',
            style: {},
            classList: {
                _classes: new Set(),
                add(c) { this._classes.add(c); },
                remove(c) { this._classes.delete(c); },
                contains(c) { return this._classes.has(c); }
            },
            addEventListener() {},
            appendChild() {},
            dataset: {}
        };
    }
    return elements[id];
}

const documentMock = {
    getElementById(id) {
        return getOrCreateElement(id);
    },
    createElement(tag) {
        return getOrCreateElement('mock-' + Math.random());
    },
    addEventListener() {},
    removeEventListener() {},
    body: getOrCreateElement('body')
};

const context = {
    window: {
        location: { search: '?user=adir' },
        AuthSync: {
            init: () => {},
            isAdirActive: () => true,
            getActiveUser: () => ({ id: 'adir', username: 'adir_moshe' })
        },
        addEventListener() {}
    },
    document: documentMock,
    localStorage: { getItem() { return null; }, setItem() {}, length: 0, key() { return null; } },
    console: console,
    Date: Date,
    Math: Math,
    JSON: JSON,
    Set: Set,
    Array: Array,
    Object: Object,
    setTimeout() {},
    clearTimeout() {},
    setInterval() {},
    clearInterval() {}
};
context.global = context.window;
context.window.document = documentMock;
vm.createContext(context);

// Load preloaded_user_state.js
vm.runInContext(fs.readFileSync(path.join(root, 'preloaded_user_state.js'), 'utf-8'), context);
// Load cheesefork_database.js if exists
if (fs.existsSync(path.join(root, 'cheesefork_database.js'))) {
    vm.runInContext(fs.readFileSync(path.join(root, 'cheesefork_database.js'), 'utf-8'), context);
}
// Load app.js
vm.runInContext(fs.readFileSync(path.join(root, 'app.js'), 'utf-8'), context);

// Put the courses in gameState.courses
context.gameState.courses['03940800'] = { code: '03940800', name: 'כושר גופני וחדר כושר', semester: 4, type: 'sports', credits: 1 };
context.gameState.courses['03940808'] = { code: '03940808', name: 'פילאטיס ומתיחות', semester: 4, type: 'sports', credits: 1 };

console.log('Testing openCourseDetails("03940800")...');
try {
    context.window.openCourseDetails('03940800');
    console.log('openCourseDetails("03940800") succeeded without throwing!');
    const modal = documentMock.getElementById('course-modal');
    console.log('modal active?', modal.classList.contains('active'));
} catch (e) {
    console.error('ERROR in openCourseDetails("03940800"):', e);
}

console.log('Testing openCourseDetails("03940808")...');
try {
    context.window.openCourseDetails('03940808');
    console.log('openCourseDetails("03940808") succeeded without throwing!');
    const modal = documentMock.getElementById('course-modal');
    console.log('modal active?', modal.classList.contains('active'));
} catch (e) {
    console.error('ERROR in openCourseDetails("03940808"):', e);
}
