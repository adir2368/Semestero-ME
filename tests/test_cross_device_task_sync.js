/**
 * Unit Test Suite: Cross-Device Task Status Sync, U-06 Opened/Gray Status & L-07 Miluim Classification
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('================================================================');
console.log('🧪 TEST SUITE: CROSS-DEVICE TASK SYNC, U-06 GRAY & L-07 MILUIM');
console.log('================================================================\n');

function extractFunctionSource(source, fnName) {
    const marker = `function ${fnName}(`;
    const startIdx = source.indexOf(marker);
    if (startIdx === -1) {
        throw new Error(`Function ${fnName} not found in source`);
    }
    const braceStart = source.indexOf('{', startIdx);
    let depth = 0;
    let inSingle = false;
    let inDouble = false;
    let inTemplate = false;
    let inLineComment = false;
    let inBlockComment = false;
    let escaped = false;

    for (let i = braceStart; i < source.length; i++) {
        const ch = source[i];
        const next = source[i + 1];

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
        if (inSingle) {
            if (ch === '\\') escaped = true;
            else if (ch === "'") inSingle = false;
            continue;
        }
        if (inDouble) {
            if (ch === '\\') escaped = true;
            else if (ch === '"') inDouble = false;
            continue;
        }
        if (inTemplate) {
            if (ch === '\\') escaped = true;
            else if (ch === '`') inTemplate = false;
            continue;
        }

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
        if (ch === "'") { inSingle = true; continue; }
        if (ch === '"') { inDouble = true; continue; }
        if (ch === '`') { inTemplate = true; continue; }

        if (ch === '{') depth++;
        else if (ch === '}') {
            depth--;
            if (depth === 0) {
                return source.slice(startIdx, i + 1);
            }
        }
    }
    throw new Error(`Unclosed braces for ${fnName}`);
}

const rootDir = path.join(__dirname, '..');
const appCode = fs.readFileSync(path.join(rootDir, 'app.js'), 'utf8');

// =========================================================================
// TEST 1: autoUpdateTaskStatusesByDueDate (Never auto-flip not_started -> in_progress)
// =========================================================================
console.log('[Test 1] Verifying autoUpdateTaskStatusesByDueDate preserves not_started HW status...');
const autoUpdateSrc = extractFunctionSource(appCode, 'autoUpdateTaskStatusesByDueDate');
const twoDaysFromNow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const test1GameState = {
    courses: {
        '034053': {
            code: '034053',
            status: 'active',
            tasks: [
                {
                    id: 'hw_due_soon',
                    type: 'hw',
                    title: 'HW Due in 2 Days',
                    dueDate: twoDaysFromNow,
                    status: 'not_started',
                    completed: false
                },
                {
                    id: 'completed_stale_status',
                    type: 'hw',
                    title: 'Completed Task With Stale Status',
                    dueDate: threeDaysAgo,
                    status: 'in_progress',
                    completed: true
                }
            ]
        }
    }
};
const test1Ctx = vm.createContext({
    gameState: test1GameState,
    window: { _isInitialBootLoading: false },
    recalculateCourseStates: () => {},
    saveState: () => {},
    Date,
    console
});
const didChange = vm.runInContext(`${autoUpdateSrc}\nautoUpdateTaskStatusesByDueDate();`, test1Ctx);

assert.strictEqual(
    test1GameState.courses['034053'].tasks[0].status,
    'not_started',
    'not_started HW due <= 7 days must NEVER auto-flip to in_progress'
);
assert.strictEqual(
    test1GameState.courses['034053'].tasks[0].completed,
    false,
    'not_started HW must remain completed: false'
);
assert.strictEqual(
    test1GameState.courses['034053'].tasks[1].status,
    'done',
    'completed: true task with stale status should normalize to done'
);
assert.strictEqual(didChange, true, 'autoUpdateTaskStatusesByDueDate() should return true when normalizing completed task status');
console.log('  ✅ PASS: not_started HW stayed not_started while completed:true normalized to done.\n');

// =========================================================================
// TEST 2: U-06 calculateTimeRemaining isOpened logic
// =========================================================================
console.log('[Test 2] Verifying U-06 calculateTimeRemaining isOpened logic...');
const calcTimeSrc = extractFunctionSource(appCode, 'calculateTimeRemaining');
const test2Ctx = vm.createContext({
    Date,
    Math,
    parseInt,
    Number,
    isNaN,
    String
});
vm.runInContext(calcTimeSrc, test2Ctx);

const noDue = test2Ctx.calculateTimeRemaining('', false, { title: 'Unopened Manual Task' });
assert.strictEqual(noDue.isOpened, false, 'Task without dueDate must have isOpened === false');

const dueIn5Days = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const openedWindow = test2Ctx.calculateTimeRemaining(dueIn5Days, false, { title: 'HW Due Soon' });
assert.strictEqual(openedWindow.isOpened, true, 'Task due within 21 days must have isOpened === true');

const dueIn35Days = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const farFuture = test2Ctx.calculateTimeRemaining(dueIn35Days, false, { title: 'Far HW' });
assert.strictEqual(farFuture.isOpened, false, 'Task due in > 21 days without openDate must have isOpened === false');

const pastOpenDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const explicitOpenFar = test2Ctx.calculateTimeRemaining(dueIn35Days, false, { title: 'Opened Early HW', openDate: pastOpenDate });
assert.strictEqual(explicitOpenFar.isOpened, true, 'Task with openDate <= now must have isOpened === true');
console.log('  ✅ PASS: U-06 isOpened window behaves strictly as designed.\n');

// =========================================================================
// TEST 3 & 4: Load PRELOADED_USER_STATE, MoodleSync & AuthSync in global mock
// =========================================================================
console.log('[Test 3] Verifying L-07 Miluim classification & preloaded state hygiene...');
global.window = global;
global.localStorage = {
    _data: {},
    getItem(k) { return this._data[k] !== undefined ? this._data[k] : null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
};
global.sessionStorage = {
    _data: {},
    getItem(k) { return this._data[k] !== undefined ? this._data[k] : null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
};
global.document = {
    readyState: 'complete',
    getElementById: () => null,
    querySelectorAll: () => [],
    addEventListener: () => null
};
global.addEventListener = () => null;

let mockRemoteRow = null;
let upsertCalls = [];
let realtimeCallback = null;

global.window.supabase = {
    createClient() {
        return {
            from() {
                return {
                    select() {
                        return {
                            eq() {
                                return {
                                    async maybeSingle() {
                                        return { data: mockRemoteRow, error: null };
                                    }
                                };
                            }
                        };
                    },
                    async upsert(payload) {
                        upsertCalls.push(payload);
                        mockRemoteRow = {
                            user_id: payload.user_id,
                            user_email: payload.user_email,
                            user_name: payload.user_name,
                            state_json: JSON.parse(JSON.stringify(payload.state_json)),
                            updated_at: payload.updated_at
                        };
                        return { data: [mockRemoteRow], error: null };
                    }
                };
            },
            channel() {
                const ch = {
                    on(_evt, _filter, cb) {
                        realtimeCallback = cb;
                        return ch;
                    },
                    subscribe() { return ch; }
                };
                return ch;
            },
            removeChannel() {}
        };
    }
};

require('../preloaded_user_state.js');
require('../moodle_sync.js');
require('../auth_sync.js');

const MoodleSync = global.window.MoodleSync;
const AuthSync = global.window.AuthSync;
const PRELOADED = global.window.PRELOADED_USER_STATE;

assert.strictEqual(MoodleSync.isMiluimTask({ title: 'שאלון מילואימניקים (תאריך סגירת שאלון)' }), true, 'Non-final Mem "שאלון מילואימניקים" must classify as Miluim');
assert.strictEqual(MoodleSync.isMiluimTask({ title: 'העלאת אישור מילואים טופס 3010' }), true, 'Form 3010 must classify as Miluim');

const pre034053 = PRELOADED.courses['034053'];
const surveyTask = (pre034053.tasks || []).find(t => t.id === '034053_miluim_survey');
assert(surveyTask && surveyTask.isMiluim === true, 'PRELOADED 034053_miluim_survey must have isMiluim: true');
const pre114052 = PRELOADED.courses['114052'];
assert(!(pre114052.tasks || []).some(t => t.id === '114052_miluim_3010'), 'PRELOADED 114052 must not contain dismissed 114052_miluim_3010');
assert(PRELOADED.dismissedTaskRegistry && PRELOADED.dismissedTaskRegistry['moodle_uid:9572@moodle26.technion.ac.il'], 'PRELOADED dismissedTaskRegistry must lock 9572@moodle26.technion.ac.il');
console.log('  ✅ PASS: L-07 regex & PRELOADED_USER_STATE hygiene verified.\n');

(async () => {
    console.log('[Test 4] Verifying AuthSync bidirectional pull, statusUpdatedAt, dedup, dismissal lock & realtime updates...');
    localStorage.clear();
    const ok = await AuthSync.loginWithPassword('adir_moshe', 'BenchyTech1');
    assert.strictEqual(ok, true, 'loginWithPassword must succeed');

    const baseLocalState = {
        gpa: 86.2,
        lastModified: 10000,
        completedTaskRegistry: {
            'task_id:034053_reset': 4000
        },
        dismissedTaskRegistry: {
            'moodle_uid:9572@moodle26.technion.ac.il': 9000
        },
        deletedTaskIds: [],
        courses: {
            '104041': { code: '104041', grade: 88, status: 'completed', tasks: [] },
            '034053': {
                code: '034053',
                name: 'מכניקת מוצקים 2',
                status: 'active',
                tasks: [
                    {
                        id: '034053_h1',
                        title: 'HW 1 - Stress Tensor',
                        status: 'not_started',
                        completed: false,
                        statusUpdatedAt: 1000
                    },
                    {
                        id: '034053_hw2',
                        title: 'HW 2',
                        status: 'in_progress',
                        completed: false,
                        statusUpdatedAt: 5000
                    },
                    {
                        id: '034053_reset',
                        title: 'HW 4',
                        status: 'not_started',
                        completed: false,
                        statusUpdatedAt: 9000
                    }
                ]
            },
            '114052': {
                code: '114052',
                name: 'פיסיקה 2',
                status: 'active',
                tasks: [
                    {
                        id: '114052_miluim_3010',
                        title: 'טופס 3010',
                        moodleUid: '9572@moodle26.technion.ac.il',
                        status: 'not_started',
                        completed: false
                    }
                ]
            }
        }
    };

    mockRemoteRow = {
        user_id: 'adir_moshe',
        user_email: 'adir.m.2368@gmail.com',
        user_name: 'אדיר משה',
        updated_at: new Date(12000).toISOString(),
        state_json: {
            gpa: 86.2,
            lastModified: 12000,
            completedTaskRegistry: {
                'task_id:034053_reset': 4000
            },
            dismissedTaskRegistry: {},
            deletedTaskIds: ['114052_miluim_3010', '9572@moodle26.technion.ac.il'],
            courses: {
                '104041': { code: '104041', grade: 88, status: 'completed', tasks: [] },
                '034053': {
                    code: '034053',
                    name: 'מכניקת מוצקים 2',
                    status: 'active',
                    tasks: [
                        {
                            id: 'task_moodle_13215_1',
                            moodleUid: '13215@moodle26.technion.ac.il',
                            title: 'HW 1 - Stress Tensor',
                            status: 'done',
                            completed: true,
                            statusUpdatedAt: 2000,
                            completedAt: 2000
                        },
                        {
                            id: '034053_hw2',
                            title: 'HW 2',
                            status: 'not_started',
                            completed: false,
                            statusUpdatedAt: 1000
                        },
                        {
                            id: '034053_reset',
                            title: 'HW 4',
                            status: 'done',
                            completed: true,
                            statusUpdatedAt: 4000,
                            completedAt: 4000
                        }
                    ]
                },
                '114052': {
                    code: '114052',
                    name: 'פיסיקה 2',
                    status: 'active',
                    tasks: []
                }
            }
        }
    };

    global.window._isInitialBootLoading = true;
    const adirStorageKey = AuthSync.getUserStorageKey('adir_moshe');
    localStorage.setItem(adirStorageKey, JSON.stringify(baseLocalState));
    global.window.gameState = JSON.parse(JSON.stringify(baseLocalState));
    global.window.getGlobalGameState = () => global.window.gameState;
    global.window.setGlobalGameState = (s) => { global.window.gameState = s; };

    AuthSync.initSupabaseFromStorage();
    await AuthSync.pullLatestStateFromCloud(true);

    // Wait briefly for any async handlers
    const active = global.window.gameState;
    const tasks53 = active.courses['034053'].tasks;

    assert.strictEqual(tasks53.length, 3, 'Should match PRELOADED 034053_h1 with Moodle task without duplicating');
    const h1 = tasks53.find(t => t.id === 'task_moodle_13215_1');
    assert(h1 && h1.status === 'done' && h1.completed === true, 'Remote newer done at 2000 must beat local not_started at 1000');

    const hw2 = tasks53.find(t => t.id === '034053_hw2');
    assert(hw2 && hw2.status === 'in_progress' && hw2.completed === false && hw2.statusUpdatedAt === 5000, 'Local newer in_progress at 5000 must beat remote not_started at 1000');

    const resetTask = tasks53.find(t => t.id === '034053_reset');
    assert(resetTask && resetTask.status === 'not_started' && resetTask.completed === false, 'Local newer reset to not_started at 9000 must beat remote done at 4000');
    assert.strictEqual(active.completedTaskRegistry['task_id:034053_reset'], undefined, 'Reconcile must clear stale completedTaskRegistry entry for reset task');

    assert.strictEqual(active.courses['114052'].tasks.length, 0, 'Deleted/dismissed 114052_miluim_3010 must be stripped from merged courses');
    assert.strictEqual(upsertCalls.length, 0, 'Boot hydration must NOT echo-upload back to cloud');

    // Scenario 4b: Realtime update from another device
    global.window._isInitialBootLoading = false;
    assert(typeof realtimeCallback === 'function', 'Realtime listener must be registered');
    realtimeCallback({
        new: {
            updated_at: new Date(30000).toISOString(),
            state_json: {
                ...mockRemoteRow.state_json,
                lastModified: 30000,
                courses: {
                    ...mockRemoteRow.state_json.courses,
                    '034053': {
                        code: '034053',
                        name: 'מכניקת מוצקים 2',
                        status: 'active',
                        tasks: [
                            {
                                id: 'task_moodle_13215_1',
                                moodleUid: '13215@moodle26.technion.ac.il',
                                title: 'HW 1 - Stress Tensor',
                                status: 'in_progress',
                                completed: false,
                                statusUpdatedAt: 25000
                            },
                            {
                                id: '034053_hw2',
                                title: 'HW 2',
                                status: 'done',
                                completed: true,
                                statusUpdatedAt: 20000,
                                completedAt: 20000
                            }
                        ]
                    }
                }
            }
        }
    });

    const rtTasks = global.window.gameState.courses['034053'].tasks;
    const rtH1 = rtTasks.find(t => t.id === 'task_moodle_13215_1');
    const rtHw2 = rtTasks.find(t => t.id === '034053_hw2');
    assert.strictEqual(rtH1.status, 'in_progress', 'Realtime revert done -> in_progress must propagate to device');
    assert.strictEqual(rtH1.completed, false, 'Realtime revert must set completed = false');
    assert.strictEqual(rtHw2.status, 'done', 'Realtime progression in_progress -> done must propagate to device');
    assert.strictEqual(rtHw2.completed, true, 'Realtime progression must set completed = true');

    console.log('  ✅ PASS: Cross-device bidirectional statusUpdatedAt sync, dedup, dismissal lock & realtime verified.\n');
    console.log('================================================================');
    console.log('🎉 ALL CROSS-DEVICE TASK SYNC, U-06 & L-07 TESTS PASSED!');
    console.log('================================================================');
    process.exit(0);
})().catch((err) => {
    console.error('❌ TEST FAILED:', err);
    process.exit(1);
});
