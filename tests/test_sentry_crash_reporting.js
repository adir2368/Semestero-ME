const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Running Sentry & Crash Diagnostics Suite Tests...\n');

// Mock browser globals for Node test environment
global.localStorage = {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
};
global.navigator = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SemesteroTest',
    onLine: true
};
global.location = { href: 'http://localhost:8080/Semestero-ME/' };
global.innerWidth = 1920;
global.innerHeight = 1080;
global.document = {
    addEventListener: () => {},
    createElement: () => ({ setAttribute: () => {} }),
    head: { appendChild: () => {} }
};
global.window = global;

// 1. Require sentry_logger.js
const loggerPath = path.join(__dirname, '..', 'sentry_logger.js');
assert.strictEqual(fs.existsSync(loggerPath), true, 'sentry_logger.js must exist');
require(loggerPath);

assert.strictEqual(typeof global.SemesteroSentry, 'object', 'SemesteroSentry must be exposed globally');
console.log('[Test 1] ✓ PASS: SemesteroSentry global module loaded.');

// 2. Test Breadcrumb Recording
global.SemesteroSentry.addBreadcrumb('navigation', 'Switched to planner tab', { tab: 'planner' });
global.SemesteroSentry.addBreadcrumb('user_action', 'Clicked course 034053', { courseId: '034053' });

// 3. Test Crash Recording
const simulatedError = new Error('Test unhandled exception in calculations');
simulatedError.stack = 'Error: Test\n    at calculateGpa (app.js:100:15)';
const report = global.SemesteroSentry.recordCrash('uncaught_error', simulatedError, { filename: 'app.js', lineno: 100 });

assert.strictEqual(typeof report.id, 'string', 'Crash report must have a generated ID');
assert.strictEqual(report.message, 'Test unhandled exception in calculations');
assert.strictEqual(report.type, 'uncaught_error');
assert.strictEqual(report.context.platform, 'web-pwa');
assert.strictEqual(report.context.viewport.width, 1920);
assert.strictEqual(Array.isArray(report.breadcrumbs), true, 'Report must include breadcrumbs');
assert.strictEqual(report.breadcrumbs.length >= 2, true, 'Report must contain recorded breadcrumbs');
console.log('[Test 2] ✓ PASS: Crash recording with rich context & breadcrumbs verified.');

// 4. Test Stored Reports & Export
const stored = global.SemesteroSentry.getCrashReports();
assert.strictEqual(stored.length >= 1, true, 'Stored reports must contain recorded crash');
assert.strictEqual(stored[stored.length - 1].id, report.id);

const exportedJson = global.SemesteroSentry.exportJson();
assert.strictEqual(typeof exportedJson, 'string');
const parsed = JSON.parse(exportedJson);
assert.strictEqual(Array.isArray(parsed), true);
console.log('[Test 3] ✓ PASS: Local storage persistence and JSON export verified.');

// 5. Test DSN configuration
global.SemesteroSentry.setDsn('https://testkey@o12345.ingest.sentry.io/67890');
assert.strictEqual(global.SemesteroSentry.getDsn(), 'https://testkey@o12345.ingest.sentry.io/67890');
global.SemesteroSentry.setDsn('');
assert.strictEqual(global.SemesteroSentry.getDsn(), '');
console.log('[Test 4] ✓ PASS: DSN configuration getter and setter verified.');

// 6. Test Test Error Trigger
const testTriggered = global.SemesteroSentry.triggerTestError();
assert.strictEqual(testTriggered.type, 'test_error');
assert.strictEqual(testTriggered.message.includes('Semestero ME Sentry Test Crash'), true);
console.log('[Test 5] ✓ PASS: Test crash trigger verified.');

// 7. Test Clear Reports
global.SemesteroSentry.clearCrashReports();
assert.strictEqual(global.SemesteroSentry.getCrashReports().length, 0);
console.log('[Test 6] ✓ PASS: Clear crash reports verified.');

console.log('\n🎉 ALL SENTRY & CRASH DIAGNOSTICS TESTS PASSED SUCCESSFULLY!\n');
