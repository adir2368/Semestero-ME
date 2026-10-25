/**
 * Semestero ME v2.6.2 Verification Test
 * Verifies Back-to-Top Button Ergonomics, Styling, Positioning, Scroll Targeting & Version Consistency
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('================================================================');
console.log('🚀 SEMESTERO ME v2.6.2 - BACK TO TOP & RELEASE VERIFICATION');
console.log('================================================================\n');

const ROOT = path.resolve(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const stylesCss = fs.readFileSync(path.join(ROOT, 'styles.css'), 'utf8');
const uiJs = fs.readFileSync(path.join(ROOT, 'ui_enhancements.js'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const swJs = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const gradle = fs.readFileSync(path.join(ROOT, 'android/app/build.gradle'), 'utf8');
const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`  ✅ PASS: ${name}`);
        passCount++;
    } catch (err) {
        console.error(`  ❌ FAIL: ${name}`);
        console.error(`     Error: ${err.message}`);
        failCount++;
    }
}

// -------------------------------------------------------------
// 1. Back-to-Top DOM Element in index.html
// -------------------------------------------------------------
console.log('--- 1. Back-to-Top Static Button in DOM ---');

test('id="btn-back-to-top" is statically embedded in index.html', () => {
    assert(indexHtml.includes('id="btn-back-to-top"'), 'Missing #btn-back-to-top in index.html');
    assert(indexHtml.includes('class="btn-back-to-top"'), 'Missing .btn-back-to-top in index.html');
    assert(indexHtml.includes('stroke="#e9d5ff"'), 'SVG arrow should have lilac/purple stroke');
    assert(indexHtml.includes('aria-label="חזרה לראש העמוד"'), 'Button must have accessible aria-label');
});

// -------------------------------------------------------------
// 2. Styling & Positioning in styles.css
// -------------------------------------------------------------
console.log('\n--- 2. Styling & Ergonomics in styles.css ---');

test('Button is positioned at bottom-right (right: 28px, left: auto)', () => {
    assert(stylesCss.includes('right: 28px;'), 'Missing right: 28px for desktop positioning');
    assert(stylesCss.includes('left: auto !important;'), 'Missing left: auto to avoid left side');
});

test('Button has purple semi-transparent glass styling', () => {
    assert(stylesCss.includes('rgba(139, 92, 246, 0.35)'), 'Missing purple glass background (rgba 139, 92, 246, 0.35)');
    assert(stylesCss.includes('backdrop-filter: blur(12px)'), 'Missing blur backdrop filter');
    assert(stylesCss.includes('rgba(192, 132, 252, 0.5)'), 'Missing purple border highlight');
});

test('Mobile layout places button at bottom-right with safe-area offset', () => {
    assert(stylesCss.includes('right: 18px !important;'), 'Missing mobile right: 18px');
    assert(stylesCss.includes('bottom: calc(88px + env(safe-area-inset-bottom, 0px)) !important;'), 'Missing mobile bottom offset');
});

test('Mobile workspaces have generous padding-bottom to prevent element overlap', () => {
    assert(stylesCss.includes('padding-bottom: calc(140px + env(safe-area-inset-bottom, 0px)) !important;'), 
        'Mobile workspaces must have 140px padding-bottom so content scrolls above button without overlap');
});

// -------------------------------------------------------------
// 3. Strict Main Screen Scroll Logic in ui_enhancements.js
// -------------------------------------------------------------
console.log('\n--- 3. Strict Scroll Target Logic in ui_enhancements.js ---');

test('getActiveMainScrollContainer returns only main workspaces and excludes small inner scrolls', () => {
    assert(uiJs.includes('getActiveMainScrollContainer'), 'Missing getActiveMainScrollContainer function');
    assert(uiJs.includes("if (activeTab === 'curriculum') {\n                return null;"), 'Flowchart tree must always return null');
    assert(uiJs.includes("document.getElementById('settings-workspace')"), 'Must target settings-workspace');
    assert(uiJs.includes("document.getElementById('notion-tasks-workspace')"), 'Must target notion-tasks-workspace');
    assert(uiJs.includes("document.getElementById('timetable-workspace')"), 'Must target timetable-workspace');
    assert(uiJs.includes("document.getElementById('planner-workspace')"), 'Must target planner-workspace');
});

test('Scroll threshold is strictly > 220px on the main screen', () => {
    assert(uiJs.includes('scrollTop > 220'), 'Must require scrollTop > 220 to avoid premature triggering');
});

test('Curriculum flowchart tab never shows button unless modal is open', () => {
    assert(uiJs.includes("if (activeTab === 'curriculum' && !activeModal) {\n                btn.classList.remove('visible');"),
        'Curriculum tab must explicitly remove visible class when no modal is open');
});

// -------------------------------------------------------------
// 4. Version Consistency
// -------------------------------------------------------------
console.log('\n--- 4. Version Consistency across Project ---');

const curVer = packageJson.version;

test(`package.json version is ${curVer}`, () => {
    assert(curVer && curVer.startsWith('2.6.'), `Invalid package version: ${curVer}`);
});

test(`sw.js cache name matches v${curVer}`, () => {
    assert(swJs.includes(`CACHE_NAME = 'semestero-me-v${curVer}'`), 'sw.js CACHE_NAME mismatch');
});

test(`android/app/build.gradle matches versionName "${curVer}"`, () => {
    assert(gradle.includes(`versionName "${curVer}"`), `Gradle versionName must be "${curVer}"`);
});

test(`app.js revision matches v${curVer}`, () => {
    assert(appJs.includes(`v${curVer}`), 'app.js APP_REVISION mismatch');
});

test(`index.html script and link assets carry ?v=${curVer}`, () => {
    assert(indexHtml.includes(`styles.css?v=${curVer}`), `styles.css missing ?v=${curVer}`);
    assert(indexHtml.includes(`ui_enhancements.js?v=${curVer}`), `ui_enhancements.js missing ?v=${curVer}`);
    assert(indexHtml.includes(`app.js?v=${curVer}`), `app.js missing ?v=${curVer}`);
});

console.log('\n================================================================');
console.log(`SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
console.log('================================================================');

if (failCount > 0) {
    process.exit(1);
}
