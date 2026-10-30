const assert = require('assert');

// Mock browser DOM and environment
function createMockEnvironment() {
    const storage = {};
    global.localStorage = {
        getItem: (k) => storage[k] || null,
        setItem: (k, v) => { storage[k] = String(v); },
        removeItem: (k) => { delete storage[k]; },
        clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
    };

    const sessionStorageStore = {};
    global.sessionStorage = {
        getItem: (k) => sessionStorageStore[k] || null,
        setItem: (k, v) => { sessionStorageStore[k] = String(v); },
        removeItem: (k) => { delete sessionStorageStore[k]; }
    };

    global.window = {
        localStorage: global.localStorage,
        sessionStorage: global.sessionStorage,
        location: { search: '', protocol: 'http:' },
        gameState: {
            courses: {
                '104041': { name: 'חדו"א 1מ', grade: 84, semester: 1 },
                '034010': { name: 'דינמיקה', grade: 85, semester: 3 }
            },
            gpa: 86.04,
            currentActiveSemester: 3,
            userProfile: { phone: '050-1234567' }
        },
        MoodleSync: {
            config: { url: '' },
            saveConfig: () => {},
            sync: () => {}
        }
    };
    global.gameState = global.window.gameState;

    // Minimal DOM elements
    const elements = {};
    global.document = {
        getElementById: (id) => {
            if (!elements[id]) {
                elements[id] = {
                    id,
                    value: '',
                    innerText: '',
                    innerHTML: '',
                    style: { display: 'none' },
                    classList: {
                        contains: (c) => false,
                        add: () => {},
                        remove: () => {}
                    },
                    focus: function() { this.focused = true; },
                    scrollIntoView: function() {},
                    select: function() {}
                };
            }
            return elements[id];
        },
        querySelectorAll: () => []
    };

    // Toasts
    global.showToastNotification = (msg, type) => {
        global.lastToast = { msg, type };
    };
    global.showHudToast = (msg, type) => {
        global.lastToast = { msg, type };
    };
    global.window.showToastNotification = global.showToastNotification;
    global.window.showHudToast = global.showHudToast;
}

async function runTests() {
    console.log('Testing Integrations Hub & Unconnected Jumps...');
    createMockEnvironment();

    // Load auth_sync
    delete require.cache[require.resolve('../auth_sync.js')];
    require('../auth_sync.js');
    const AuthSync = global.window.AuthSync;

    assert(AuthSync, 'AuthSync must be defined');
    assert.strictEqual(typeof global.window.openConnectModal, 'function', 'window.openConnectModal must be exported');
    assert.strictEqual(typeof AuthSync.toggleIntegrationsHub, 'function', 'AuthSync.toggleIntegrationsHub must be a function');
    assert.strictEqual(typeof AuthSync.saveCheeseForkUrl, 'function', 'AuthSync.saveCheeseForkUrl must be a function');
    assert.strictEqual(typeof AuthSync.saveMoodleUrl, 'function', 'AuthSync.saveMoodleUrl must be a function');
    console.log('✓ Test 1 Passed: Global and AuthSync integration methods exist');

    // Test 2: toggleIntegrationsHub toggles display
    const content = global.document.getElementById('integrations-hub-content');
    const arrow = global.document.getElementById('integrations-hub-toggle-arrow');
    const text = global.document.getElementById('integrations-hub-toggle-text');

    content.style.display = 'none';
    const isOpen1 = AuthSync.toggleIntegrationsHub();
    assert.strictEqual(isOpen1, true, 'toggle should open closed hub');
    assert.strictEqual(content.style.display, 'block');

    const isOpen2 = AuthSync.toggleIntegrationsHub();
    assert.strictEqual(isOpen2, false, 'toggle should close open hub');
    assert.strictEqual(content.style.display, 'none');

    const isOpen3 = AuthSync.toggleIntegrationsHub(true);
    assert.strictEqual(isOpen3, true, 'forceOpen true should open hub');
    assert.strictEqual(content.style.display, 'block');
    console.log('✓ Test 2 Passed: toggleIntegrationsHub works with toggle and forceOpen');

    // Test 3: renderAuthModal in logged-in state renders Collapsible Hub
    await AuthSync.loginWithPassword('adir_moshe', 'BenchyTech1');

    const container = global.document.getElementById('auth-modal-content-container');
    AuthSync.renderAuthModal();
    assert(container.innerHTML.includes('id="integrations-hub-container"'), 'Should render integrations-hub-container');
    assert(container.innerHTML.includes('id="integrations-hub-content"'), 'Should render integrations-hub-content');
    assert(container.innerHTML.includes('צ\'יזפורק הטכניון (CheeseFork)'), 'Should include CheeseFork card');
    assert(container.innerHTML.includes('מודל הטכניון (Moodle Technion)'), 'Should include Moodle card');
    assert(container.innerHTML.includes('יומן גוגל (Google Calendar / Apple)'), 'Should include Google Calendar card');
    assert(container.innerHTML.includes('התראות ותזכורות לנייד'), 'Should include Phone Alerts card');
    console.log('✓ Test 3 Passed: Logged-in profile renders collapsible Integrations Center with all 4 services');

    // Test 4: Save CheeseFork URL updates storage, state, and UI badges
    const sampleCfUrl = 'https://cheesefork.cf/s/technion-202601-adir';
    const cfInput = global.document.getElementById('integrations-cheesefork-url');
    cfInput.value = sampleCfUrl;

    const saveSuccess = await AuthSync.saveCheeseForkUrl();
    assert.strictEqual(saveSuccess, true, 'saveCheeseForkUrl should succeed');
    assert.strictEqual(global.localStorage.getItem('ast_cheesefork_url'), sampleCfUrl);
    assert.strictEqual(global.window.gameState.userProfile.cheeseforkUrl, sampleCfUrl);
    assert(global.lastToast.msg.includes('CheeseFork נשמר בהצלחה'), 'Success toast should be shown');
    console.log('✓ Test 4 Passed: saveCheeseForkUrl updates storage, gameState, and displays success notification');

    // Test 5: Save Moodle URL updates MoodleSync, storage, and state
    const sampleMoodleUrl = 'https://moodle26.technion.ac.il/calendar/export_execute.php?userid=123&authtoken=abc';
    const moodleInput = global.document.getElementById('integrations-moodle-url');
    moodleInput.value = sampleMoodleUrl;

    const moodleSaveSuccess = await AuthSync.saveMoodleUrl();
    assert.strictEqual(moodleSaveSuccess, true, 'saveMoodleUrl should succeed');
    assert.strictEqual(global.localStorage.getItem('ast_moodle_calendar_url'), sampleMoodleUrl);
    assert.strictEqual(global.window.MoodleSync.config.url, sampleMoodleUrl);
    assert(global.lastToast.msg.includes('מודל הטכניון נשמר בהצלחה'), 'Moodle success toast should be shown');
    console.log('✓ Test 5 Passed: saveMoodleUrl updates MoodleSync, storage, and displays success notification');

    // Test 6: openConnectModal opens modal, expands hub, and focuses target input
    let modalOpened = false;
    const authModal = global.document.getElementById('auth-modal');
    authModal.classList.add = (c) => { if (c === 'active') modalOpened = true; };

    AuthSync.openConnectModal('cheesefork');
    assert.strictEqual(modalOpened, true, 'openConnectModal should open auth-modal');
    assert.strictEqual(content.style.display, 'block', 'openConnectModal should expand integrations-hub-content');
    console.log('✓ Test 6 Passed: openConnectModal activates auth modal and expands integrations hub');

    // Test 7: Standalone guest integrations modal (activeTab === 'integrations')
    AuthSync.logout(true); // guest
    AuthSync.renderAuthModal('integrations');
    assert(container.innerHTML.includes('מרכז חיבורים ואינטגרציות'), 'Guest modal should render header');
    assert(container.innerHTML.includes('id="integration-card-cheesefork"'), 'Guest modal should render CheeseFork card directly');
    console.log('✓ Test 7 Passed: Guest mode supports direct integrations hub view without prior login');

    console.log('\n🎉 ALL 7 INTEGRATIONS HUB TESTS PASSED FLAWLESSLY!');
}

runTests().catch(err => {
    console.error('Test Failed:', err);
    process.exit(1);
});
