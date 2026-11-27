const assert = require('assert');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');
const Module = require('module');

const ROOT = path.join(__dirname, '..');

function httpGetRaw(targetPath) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: '127.0.0.1',
            port: 8080,
            path: targetPath,
            method: 'GET'
        }, (res) => {
            let body = '';
            res.on('data', chunk => { body += chunk; });
            res.on('end', () => resolve({ statusCode: res.statusCode, body }));
        });
        req.on('error', reject);
        req.end();
    });
}

function waitForServer(timeoutMs = 5000) {
    const started = Date.now();
    return new Promise((resolve, reject) => {
        const poll = () => {
            httpGetRaw('/package.json')
                .then(res => {
                    if (res.statusCode === 200) resolve();
                    else if (Date.now() - started > timeoutMs) reject(new Error('Server returned ' + res.statusCode));
                    else setTimeout(poll, 100);
                })
                .catch(err => {
                    if (Date.now() - started > timeoutMs) reject(err);
                    else setTimeout(poll, 100);
                });
        };
        poll();
    });
}

(async () => {
    console.log('Running Pass 0 Shared Core Hardening Regression Tests...');

    // 1. site_analytics.js: no select=*, guest cloud isolation, HTML escaping
    const analyticsPath = path.join(ROOT, 'site_analytics.js');
    const analyticsSrc = fs.readFileSync(analyticsPath, 'utf8');
    assert.strictEqual(analyticsSrc.includes('select=*'), false, 'site_analytics.js must not perform select=* scans');

    const fetchCalls = [];
    const origFetch = global.fetch;
    const origWindow = global.window;
    const origDocument = global.document;
    const origLocalStorage = global.localStorage;
    const origSessionStorage = global.sessionStorage;
    const origNavigator = global.navigator;

    try {
        global.fetch = async (url, opts) => {
            fetchCalls.push({ url, opts });
            return { ok: true, json: async () => [] };
        };
        global.localStorage = {
            _d: {},
            getItem(k) { return this._d[k] || null; },
            setItem(k, v) { this._d[k] = String(v); },
            removeItem(k) { delete this._d[k]; }
        };
        global.sessionStorage = {
            _d: {},
            getItem(k) { return this._d[k] || null; },
            setItem(k, v) { this._d[k] = String(v); }
        };
        const mockContainer = { innerHTML: '' };
        global.document = {
            addEventListener: () => {},
            getElementById: (id) => (id === 'site-analytics-content' ? mockContainer : null)
        };
        global.window = global;
        global.AuthSync = {
            isLoggedIn: () => false,
            getActiveUser: () => ({ id: 'guest', name: 'Guest' }),
            isAdirActive: () => false
        };

        delete require.cache[require.resolve(analyticsPath)];
        require(analyticsPath);

        await global.SiteAnalytics.fetchStats();
        assert.strictEqual(fetchCalls.length, 0, 'Guest / non-admin session must not fetch student stats');

        await global.SiteAnalytics.pingCloudTelemetry(true);
        assert.strictEqual(fetchCalls.length, 2, 'Guest session should issue GET + POST/PATCH for anonymous counter row only');
        assert.strictEqual(fetchCalls[0].url.includes('user_id=eq.__ast_site_telemetry__'), true, 'Telemetry GET must target __ast_site_telemetry__ only');
        assert.strictEqual(fetchCalls.some(c => c.url.includes('neq.__ast_site_telemetry__')), false, 'Guest telemetry must never query student rows');
        const guestWriteBody = JSON.parse(fetchCalls[1].opts.body);
        assert.strictEqual(guestWriteBody.user_id, '__ast_site_telemetry__');
        assert.strictEqual(guestWriteBody.state_json.total_visits, 1, 'Guest online ping must increment total_visits to 1');
        assert.strictEqual(guestWriteBody.state_json.guest_visits, 1, 'Guest online ping must increment guest_visits to 1');
        assert.strictEqual(guestWriteBody.state_json.offline_visits, 0, 'Guest online ping must keep offline_visits at 0');

        // Offline guest queue -> reconnect flush
        fetchCalls.length = 0;
        global.sessionStorage._d = {};
        Object.defineProperty(global, 'navigator', { value: { onLine: false }, configurable: true });
        global.SiteAnalytics.recordSession();
        assert.strictEqual(fetchCalls.length, 0, 'Offline session must not issue network requests');
        assert.strictEqual(global.SiteAnalytics.stats.localOfflineVisits, 1, 'Offline session must increment localOfflineVisits');
        assert.strictEqual(global.localStorage.getItem('ast_telemetry_pending_offline'), '1', 'Offline queue must record pending offline visit');
        assert.strictEqual(global.localStorage.getItem('ast_telemetry_pending_guest'), '1', 'Offline guest queue must record pending guest visit');

        global.fetch = async (url, opts) => {
            fetchCalls.push({ url, opts });
            if (!opts || !opts.method || opts.method === 'GET') {
                return {
                    ok: true,
                    json: async () => [{
                        user_id: '__ast_site_telemetry__',
                        state_json: { total_visits: 1, guest_visits: 1, offline_visits: 0 }
                    }]
                };
            }
            return { ok: true, json: async () => [] };
        };
        Object.defineProperty(global, 'navigator', { value: { onLine: true }, configurable: true });
        await global.SiteAnalytics.syncPendingOfflineVisits();
        assert.strictEqual(fetchCalls.length, 2, 'Reconnect flush should GET + PATCH anonymous counter row');
        assert.strictEqual(fetchCalls[1].opts.method, 'PATCH', 'Existing telemetry row should be updated via PATCH');
        assert.strictEqual(global.SiteAnalytics.stats.cloudTotalVisits, 2, 'Reconnect flush must increment total_visits to 2');
        assert.strictEqual(global.SiteAnalytics.stats.cloudGuestVisits, 2, 'Reconnect flush must increment guest_visits to 2');
        assert.strictEqual(global.SiteAnalytics.stats.cloudOfflineVisits, 1, 'Reconnect flush must increment offline_visits to 1');
        assert.strictEqual(global.localStorage.getItem('ast_telemetry_pending_offline'), '0', 'Pending offline counter must reset after sync');
        assert.strictEqual(global.localStorage.getItem('ast_telemetry_pending_guest'), '0', 'Pending guest counter must reset after sync');

        global.SiteAnalytics.stats.registeredUsers = [{
            id: '<img src=x onerror=alert(1)>',
            name: '<script>alert(1)</script>',
            email: '"evil"@test',
            updatedAt: '2026-11-24T12:00:00Z'
        }];
        global.SiteAnalytics.stats.registeredUsersCount = 1;
        global.SiteAnalytics.renderModal();
        assert.strictEqual(mockContainer.innerHTML.includes('<script>alert(1)</script>'), false, 'Script tags must be escaped');
        assert.strictEqual(mockContainer.innerHTML.includes('<img src=x onerror=alert(1)>'), false, 'Image XSS vector must be escaped');
        assert.strictEqual(mockContainer.innerHTML.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), true, 'Escaped script string must appear');
        console.log('[1/5] PASS: site_analytics.js guest isolation, column projection, and XSS escaping verified.');

        // 2. main.js: Electron fetch-moodle-feed SSRF allowlist
        const ipcHandlers = {};
        const origLoad = Module._load;
        Module._load = function (request, parent, isMain) {
            if (request === 'electron') {
                return {
                    app: { setName: () => {}, setAppUserModelId: () => {}, whenReady: () => new Promise(() => {}), on: () => {} },
                    BrowserWindow: function () {},
                    Menu: { setApplicationMenu: () => {} },
                    ipcMain: { handle: (name, fn) => { ipcHandlers[name] = fn; } },
                    shell: { openExternal: async () => {} }
                };
            }
            return origLoad.apply(this, arguments);
        };
        try {
            const mainPath = path.join(ROOT, 'main.js');
            delete require.cache[require.resolve(mainPath)];
            require(mainPath);
        } finally {
            Module._load = origLoad;
        }
        assert.strictEqual(typeof ipcHandlers['fetch-moodle-feed'], 'function', 'fetch-moodle-feed handler must register');

        const blockedLocal = await ipcHandlers['fetch-moodle-feed'](null, 'http://127.0.0.1:8080/secret');
        assert.strictEqual(blockedLocal.success, false);
        const blockedEvil = await ipcHandlers['fetch-moodle-feed'](null, 'https://evil.example.com/calendar/export_execute.php');
        assert.strictEqual(blockedEvil.success, false);

        global.fetch = async (url) => ({
            ok: true,
            status: 200,
            statusText: 'OK',
            text: async () => 'BEGIN:VCALENDAR\nEND:VCALENDAR'
        });
        const allowedMoodle = await ipcHandlers['fetch-moodle-feed'](null, 'https://moodle25.technion.ac.il/calendar/export_execute.php?userid=1');
        assert.strictEqual(allowedMoodle.success, true);
        assert.strictEqual(allowedMoodle.data.includes('BEGIN:VCALENDAR'), true);
        console.log('[2/5] PASS: main.js fetch-moodle-feed SSRF allowlist verified.');

        // 3. app.js + sentry_logger.js: APP_CURRENT_REVISION global & activeTab resolution
        const appSrc = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
        assert.strictEqual(appSrc.includes('window.APP_CURRENT_REVISION = APP_CURRENT_REVISION;'), true, 'app.js must expose window.APP_CURRENT_REVISION');

        global.APP_CURRENT_REVISION = { version: '3.1.16' };
        global.gameState = { activeTab: 'tasks' };
        global.innerWidth = 1440;
        global.innerHeight = 900;
        global.location = { href: 'http://localhost:8080/' };
        global.navigator = { userAgent: 'Pass0Test', onLine: true };
        const sentryPath = path.join(ROOT, 'sentry_logger.js');
        delete require.cache[require.resolve(sentryPath)];
        require(sentryPath);
        const crash = global.SemesteroSentry.recordCrash('error', new Error('pass0 test'));
        assert.strictEqual(crash.context.version, '3.1.16', 'Sentry context version must match APP_CURRENT_REVISION');
        assert.strictEqual(crash.context.activeTab, 'tasks', 'Sentry activeTab must resolve from gameState');
        global.SemesteroSentry.clearCrashReports();
        console.log('[3/5] PASS: sentry_logger.js + app.js version and activeTab context verified.');

        // 4. sw.js: GET-only & /api/ bypass guards
        const swSrc = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
        assert.strictEqual(swSrc.includes("event.request.method !== 'GET'"), true, 'sw.js must skip non-GET requests');
        assert.strictEqual(swSrc.includes("url.pathname.startsWith('/api/')"), true, 'sw.js must bypass /api/ proxy routes');
        console.log('[4/5] PASS: sw.js fetch method and /api/ bypass guards verified.');

        // 5. server.js: Path traversal & dotfile blocking on localhost:8080
        const serverProc = spawn('node', ['server.js'], { cwd: ROOT, stdio: 'ignore' });
        try {
            await waitForServer(5000);
            const travRes = await httpGetRaw('/%2e%2e/package.json');
            assert.strictEqual(travRes.statusCode, 403, 'Encoded parent traversal must return 403');
            const gitRes = await httpGetRaw('/.git/HEAD');
            assert.strictEqual(gitRes.statusCode, 403, '.git access must return 403');
            const badEncRes = await httpGetRaw('/%ZZ');
            assert.strictEqual(badEncRes.statusCode, 400, 'Malformed URI encoding must return 400');
            const okRes = await httpGetRaw('/package.json');
            assert.strictEqual(okRes.statusCode, 200, 'Normal root asset must return 200');
            console.log('[5/5] PASS: server.js path traversal, dotfile, and malformed-URL guards verified.');
        } finally {
            serverProc.kill();
            await new Promise(r => serverProc.once('exit', r));
        }

        console.log('\nALL PASS 0 SHARED CORE HARDENING TESTS PASSED!');
    } finally {
        global.fetch = origFetch;
        global.window = origWindow;
        global.document = origDocument;
        global.localStorage = origLocalStorage;
        global.sessionStorage = origSessionStorage;
        if (origNavigator !== undefined) {
            Object.defineProperty(global, 'navigator', { value: origNavigator, configurable: true });
        } else {
            delete global.navigator;
        }
    }
})().catch(err => {
    console.error('Pass 0 test failed:', err);
    process.exit(1);
});
