const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const assert = require('assert');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9500 + Math.floor(Math.random() * 400);
const PROFILE_DIR = path.join(os.tmpdir(), `chrome_qa_tasks_${Date.now()}`);
const TARGET_URL = `http://localhost:8080/?qa=${Date.now()}`;
const ARTIFACT_DIR = "C:/Users/user/.gemini/antigravity/brain/aa7d2a33-2de8-4eeb-b8bd-18c8fdd69b14";

function delay(ms) {
    return new Promise(res => setTimeout(res, ms));
}

function getJson(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

class CDPClient {
    constructor(wsUrl) {
        this.wsUrl = wsUrl;
        this.id = 1;
        this.callbacks = new Map();
        this.logs = [];
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.wsUrl);
            this.ws.onopen = () => resolve();
            this.ws.onerror = (err) => reject(err);
            this.ws.onmessage = (event) => {
                const msg = JSON.parse(event.data);
                if (msg.method === 'Runtime.consoleAPICalled') {
                    const text = msg.params.args.map(a => a.value !== undefined ? a.value : (a.description || '')).join(' ');
                    this.logs.push(`[Console ${msg.params.type}] ${text}`);
                } else if (msg.id && this.callbacks.has(msg.id)) {
                    const cb = this.callbacks.get(msg.id);
                    this.callbacks.delete(msg.id);
                    if (msg.error) cb.reject(msg.error);
                    else cb.resolve(msg.result);
                }
            };
        });
    }

    send(method, params = {}) {
        return new Promise((resolve, reject) => {
            const reqId = this.id++;
            this.callbacks.set(reqId, { resolve, reject });
            this.ws.send(JSON.stringify({ id: reqId, method, params }));
        });
    }

    async eval(expression) {
        const trimmed = expression.trim();
        const wrappedExpr = (trimmed.startsWith('(() =>') || trimmed.startsWith('(async () =>'))
            ? trimmed
            : `(() => { ${expression} })()`;
        try {
            const res = await this.send('Runtime.evaluate', {
                expression: wrappedExpr,
                returnByValue: true,
                awaitPromise: true
            });
            if (res.exceptionDetails) {
                console.error('[CDP Eval Exception]', JSON.stringify(res.exceptionDetails));
                throw new Error(`Eval failed: ${JSON.stringify(res.exceptionDetails)}`);
            }
            return res.result ? res.result.value : undefined;
        } catch (err) {
            if (err && (err.message || '').includes('navigated')) {
                console.log('   [CDP] Retrying evaluation after page navigation...');
                await delay(1200);
                return await this.eval(expression);
            }
            console.error('[CDP Eval Error]', err);
            throw err;
        }
    }

    async screenshot(filename) {
        const res = await this.send('Page.captureScreenshot', { format: 'png' });
        const buf = Buffer.from(res.data, 'base64');
        const savePath = path.join(ARTIFACT_DIR, filename);
        fs.writeFileSync(savePath, buf);
        console.log(`   📸 Screenshot saved: ${filename}`);
    }
}

async function runTasksQaSuite() {
    console.log('================================================================');
    console.log('📋 QA SUITE: TASKS MULTI-SELECT, BULK ACTIONS & CONTEXT MENU');
    console.log('================================================================\n');

    // 1. Static Checks
    console.log('[Test 1] Static Code Integrity Checks...');
    const htmlCode = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf-8');
    const cssCode = fs.readFileSync(path.join(__dirname, '..', 'styles.css'), 'utf-8');
    const appCode = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf-8');
    const uiCode = fs.readFileSync(path.join(__dirname, '..', 'ui_enhancements.js'), 'utf-8');

    assert(htmlCode.includes('id="tasks-bulk-actions-bar"'), 'ERROR: tasks-bulk-actions-bar missing in index.html!');
    assert(htmlCode.includes('id="task-context-menu"'), 'ERROR: task-context-menu missing in index.html!');
    assert(htmlCode.includes('id="task-move-modal"'), 'ERROR: task-move-modal missing in index.html!');
    assert(cssCode.includes('.tasks-bulk-actions-bar'), 'ERROR: .tasks-bulk-actions-bar missing in styles.css!');
    assert(cssCode.includes('.task-context-menu'), 'ERROR: .task-context-menu missing in styles.css!');
    assert(cssCode.includes('.is-row-selected'), 'ERROR: .is-row-selected missing in styles.css!');
    assert(appCode.includes('updateTasksBulkToolbar()'), 'ERROR: updateTasksBulkToolbar missing in app.js!');
    assert(appCode.includes('duplicateSelectedTasks()'), 'ERROR: duplicateSelectedTasks missing in app.js!');
    assert(appCode.includes('deleteSelectedTasks()'), 'ERROR: deleteSelectedTasks missing in app.js!');
    assert(appCode.includes('openMoveTasksModal('), 'ERROR: openMoveTasksModal missing in app.js!');
    assert(uiCode.includes('window.duplicateSelectedTasks()'), 'ERROR: duplicateSelectedTasks shortcut missing in ui_enhancements.js!');
    console.log('✓ PASS: All static code assertions passed.\n');

    // 2. Launch Chrome
    console.log('[Test 2] Launching Chrome on dynamic port ' + PORT + '...');
    const chromeProc = spawn(CHROME_PATH, [
        `--remote-debugging-port=${PORT}`,
        `--user-data-dir=${PROFILE_DIR}`,
        '--headless=new',
        '--disable-gpu',
        '--no-first-run',
        '--no-default-browser-check',
        '--window-size=1280,850',
        TARGET_URL
    ]);

    let chromeAlive = true;
    chromeProc.on('exit', () => { chromeAlive = false; });

    try {
        let wsUrl = null;
        for (let i = 0; i < 30; i++) {
            await delay(400);
            try {
                const versionData = await getJson(`http://127.0.0.1:${PORT}/json/version`);
                if (versionData && versionData.webSocketDebuggerUrl) {
                    wsUrl = versionData.webSocketDebuggerUrl;
                    break;
                }
            } catch (e) {}
        }

        if (!wsUrl) throw new Error('Failed to connect to Chrome remote debugging port');
        console.log('✓ Chrome CDP connected:', wsUrl);

        const list = await getJson(`http://127.0.0.1:${PORT}/json/list`);
        const pageTarget = list.find(t => t.type === 'page');
        if (!pageTarget) throw new Error('No page target found');

        const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
        await cdp.connect();
        await cdp.send('Page.enable');
        await cdp.send('Runtime.enable');

        await cdp.eval(`sessionStorage.setItem('sw_last_controller_reload', String(Date.now()));`);
        await delay(2500);

        // 3. Navigate to Tasks Tab
        console.log('\n[Test 3] Navigating to Tasks Tab...');
        await cdp.eval(`
            (() => {
                if (!window.gameState) window.gameState = { courses: {} };
                if (!window.gameState.courses) window.gameState.courses = {};
                
                // Ensure at least two active courses with tasks for testing
                window.gameState.courses['001001'] = {
                    code: '001001',
                    name: 'חדו״א 1ת',
                    status: 'active',
                    tasks: [
                        { id: 'task-test-1', title: 'תרגיל בית 1', type: 'hw', status: 'not_started', dueDate: '2026-11-01', weight: 10 },
                        { id: 'task-test-2', title: 'תרגיל בית 2', type: 'hw', status: 'not_started', dueDate: '2026-11-08', weight: 10 },
                        { id: 'task-test-3', title: 'פרויקט אמצע', type: 'project', status: 'in_progress', dueDate: '2026-11-15', weight: 20 },
                    ]
                };
                window.gameState.courses['001002'] = {
                    code: '001002',
                    name: 'אלגברה לינארית',
                    status: 'active',
                    tasks: [
                        { id: 'task-test-4', title: 'תרגיל להגשה 1', type: 'hw', status: 'not_started', dueDate: '2026-11-05', weight: 5 }
                    ]
                };
                if (typeof saveState === 'function') saveState();

                if (window.switchTab) window.switchTab('tasks');
                else document.getElementById('tab-tasks')?.click();

                if (typeof renderNotionTasksTable === 'function') renderNotionTasksTable();
            })()
        `);
        await delay(1000);

        const activeTabInfo = await cdp.eval(`
            (() => {
                const tab = document.getElementById('tab-tasks');
                const workspace = document.getElementById('notion-tasks-workspace');
                const rows = document.querySelectorAll('#notion-tasks-table-body tr[data-task-id]');
                return {
                    isTabActive: tab && tab.classList.contains('active'),
                    isWorkspaceVisible: workspace && window.getComputedStyle(workspace).display !== 'none',
                    rowCount: rows.length
                };
            })()
        `);
        console.log('   Tasks Tab State:', activeTabInfo);
        assert.strictEqual(activeTabInfo.isWorkspaceVisible, true, 'Tasks workspace should be visible!');
        assert(activeTabInfo.rowCount > 0, 'Should render tasks rows in table!');
        console.log('   ✓ PASS: Tasks tab is active with ' + activeTabInfo.rowCount + ' tasks.');

        // 4. Test Single & Multi Selection
        console.log('\n[Test 4] Testing Checkbox Row Selection...');
        const selectResult = await cdp.eval(`
            (() => {
                const rows = Array.from(document.querySelectorAll('#notion-tasks-table-body tr[data-task-id]'));
                const firstRow = rows[0];
                const cb1 = firstRow.querySelector('.notion-row-checkbox');
                cb1.click(); // trigger selection change

                const bar = document.getElementById('tasks-bulk-actions-bar');
                const countText = document.getElementById('bulk-selected-count-text');

                return {
                    firstRowSelected: firstRow.classList.contains('is-row-selected'),
                    barActive: bar && bar.classList.contains('active'),
                    countText: countText ? (countText.innerText || countText.textContent).trim() : ''
                };
            })()
        `);
        console.log('   Select 1 Task Result:', selectResult);
        assert.strictEqual(selectResult.firstRowSelected, true, 'First row should have is-row-selected!');
        assert.strictEqual(selectResult.barActive, true, 'Bulk bar should be active!');
        assert.strictEqual(selectResult.countText, 'נבחרה משימה אחת', 'Count text should say 1 task selected!');
        console.log('   ✓ PASS: Single task selection works and displays bulk toolbar.');

        // Select second task
        const select2Result = await cdp.eval(`
            (() => {
                const rows = Array.from(document.querySelectorAll('#notion-tasks-table-body tr[data-task-id]'));
                const secondRow = rows[1];
                const cb2 = secondRow.querySelector('.notion-row-checkbox');
                cb2.click();

                const countText = document.getElementById('bulk-selected-count-text');
                return {
                    countText: countText ? (countText.innerText || countText.textContent).trim() : '',
                    selectedCount: window.selectedTasksMap ? window.selectedTasksMap.size : 0
                };
            })()
        `);
        console.log('   Select 2 Tasks Result:', select2Result);
        assert.strictEqual(select2Result.selectedCount, 2, '2 tasks should be in selectedTasksMap!');
        assert.strictEqual(select2Result.countText, 'נבחרו 2 משימות', 'Count text should say 2 tasks selected!');
        console.log('   ✓ PASS: Multi-task selection works.');

        // 5. Test Duplicate in Parallel
        console.log('\n[Test 5] Testing Duplicate Tasks in Parallel...');
        const dupResult = await cdp.eval(`
            (() => {
                const initialTotal = document.querySelectorAll('#notion-tasks-table-body tr[data-task-id]').length;
                window.duplicateSelectedTasks();
                const afterTotal = document.querySelectorAll('#notion-tasks-table-body tr[data-task-id]').length;
                const bar = document.getElementById('tasks-bulk-actions-bar');
                const newTitles = Array.from(document.querySelectorAll('.notion-title-editable')).map(el => el.innerText);
                const hasCopy = newTitles.some(t => t.includes('(העתק)'));

                return {
                    initialTotal,
                    afterTotal,
                    hasCopy,
                    barActiveAfter: bar && bar.classList.contains('active'),
                    selectionCleared: window.selectedTasksMap.size === 0
                };
            })()
        `);
        console.log('   Duplicate Result:', dupResult);
        assert.strictEqual(dupResult.afterTotal, dupResult.initialTotal + 2, 'Task count should increase by 2!');
        assert.strictEqual(dupResult.hasCopy, true, 'Duplicated task title should include (העתק)!');
        assert.strictEqual(dupResult.barActiveAfter, false, 'Bulk bar should hide after duplication!');
        assert.strictEqual(dupResult.selectionCleared, true, 'Selection should be cleared!');
        console.log('   ✓ PASS: Parallel duplication works flawlessly.');

        // 6. Test Context Menu (Directly matching user screenshot)
        console.log('\n[Test 6] Testing Notion Context Menu (Right-click on task)...');
        const ctxResult = await cdp.eval(`
            (() => {
                const row = document.querySelector('#notion-tasks-table-body tr[data-task-id]');
                const cCode = row.dataset.courseCode;
                const tId = row.dataset.taskId;

                // Trigger contextmenu
                window.showTaskContextMenu({ clientX: 250, clientY: 200 }, cCode, tId);

                const menu = document.getElementById('task-context-menu');
                const itemDup = document.getElementById('ctx-task-duplicate');
                const itemMove = document.getElementById('ctx-task-move');
                const itemDel = document.getElementById('ctx-task-delete');

                return {
                    menuVisible: menu && menu.style.display === 'flex',
                    dupText: itemDup ? itemDup.querySelector('.ctx-label')?.innerText : '',
                    dupKey: itemDup ? itemDup.querySelector('.ctx-shortcut')?.innerText : '',
                    moveText: itemMove ? itemMove.querySelector('.ctx-label')?.innerText : '',
                    moveKey: itemMove ? itemMove.querySelector('.ctx-shortcut')?.innerText : '',
                    delText: itemDel ? itemDel.querySelector('.ctx-label')?.innerText : '',
                    delKey: itemDel ? itemDel.querySelector('.ctx-shortcut')?.innerText : ''
                };
            })()
        `);
        console.log('   Context Menu State:', ctxResult);
        assert.strictEqual(ctxResult.menuVisible, true, 'Context menu should be visible!');
        assert.strictEqual(ctxResult.dupText, 'Duplicate', 'Context menu should have Duplicate!');
        assert.strictEqual(ctxResult.dupKey, 'Ctrl+D', 'Duplicate shortcut should be Ctrl+D!');
        assert.strictEqual(ctxResult.moveText, 'Move to', 'Context menu should have Move to!');
        assert.strictEqual(ctxResult.moveKey, 'Ctrl+⇧+P', 'Move shortcut should be Ctrl+⇧+P!');
        assert.strictEqual(ctxResult.delText, 'Move to Trash', 'Context menu should have Move to Trash!');
        assert.strictEqual(ctxResult.delKey, 'Del', 'Delete shortcut should be Del!');
        console.log('   ✓ PASS: Context menu matches user screenshot exactly.');

        // Capture screenshot of the context menu & selected row
        await cdp.screenshot('qa_tasks_bulk_actions_verified.png');

        // 7. Test Move to Course Modal
        console.log('\n[Test 7] Testing Move to Course Modal...');
        const moveModalResult = await cdp.eval(`
            (() => {
                window.openMoveTasksModal();
                const modal = document.getElementById('task-move-modal');
                const coursesList = document.getElementById('task-move-courses-list');
                const countCourses = coursesList ? coursesList.querySelectorAll('.task-move-course-btn').length : 0;
                return {
                    isModalOpen: modal && modal.style.display === 'flex',
                    coursesAvailable: countCourses
                };
            })()
        `);
        console.log('   Move Modal Result:', moveModalResult);
        assert.strictEqual(moveModalResult.isModalOpen, true, 'Move modal should open!');
        assert(moveModalResult.coursesAvailable > 0, 'Should display active courses to move to!');
        console.log('   ✓ PASS: Move to course modal is operational.');

        // Close move modal
        await cdp.eval(`window.closeTaskMoveModal()`);

        // 8. Test Delete Selected Tasks (Move to Trash)
        console.log('\n[Test 8] Testing Parallel Delete (Move to Trash)...');
        const deleteResult = await cdp.eval(`
            (() => {
                window.confirm = () => true; // auto-confirm delete
                if (window.clearTasksSelection) window.clearTasksSelection();
                const initialTotal = document.querySelectorAll('#notion-tasks-table-body tr[data-task-id]').length;
                
                // Select 2 tasks to delete
                const rows = Array.from(document.querySelectorAll('#notion-tasks-table-body tr[data-task-id]'));
                const r1 = rows[0];
                const r2 = rows[1];
                r1.querySelector('.notion-row-checkbox').click();
                r2.querySelector('.notion-row-checkbox').click();

                const selectedBefore = window.selectedTasksMap.size;
                window.deleteSelectedTasks();
                const afterTotal = document.querySelectorAll('#notion-tasks-table-body tr[data-task-id]').length;

                return {
                    initialTotal,
                    selectedBefore,
                    afterTotal,
                    selectionCleared: window.selectedTasksMap.size === 0
                };
            })()
        `);
        console.log('   Delete Result:', deleteResult);
        assert.strictEqual(deleteResult.selectedBefore, 2, '2 tasks should have been selected!');
        assert.strictEqual(deleteResult.afterTotal, deleteResult.initialTotal - 2, 'Total tasks should decrease by 2!');
        assert.strictEqual(deleteResult.selectionCleared, true, 'Selection should be cleared after delete!');
        console.log('   ✓ PASS: Parallel delete works smoothly.');

        console.log('\n================================================================');
        console.log('🎉 ALL TASKS SELECTION, BULK ACTIONS & CONTEXT MENU TESTS PASSED!');
        console.log('================================================================');
    } finally {
        if (chromeAlive) {
            chromeProc.kill('SIGKILL');
        }
    }
}

runTasksQaSuite().catch(err => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
