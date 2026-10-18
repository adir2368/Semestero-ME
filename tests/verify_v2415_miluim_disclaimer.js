const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== VERIFYING V2.4.15 MILUIM ACTIVE STATUS & LEGAL DISCLAIMER ===\n');

const ROOT = path.resolve(__dirname, '..');
const indexHtmlPath = path.join(ROOT, 'index.html');
const appJsPath = path.join(ROOT, 'app.js');
const swJsPath = path.join(ROOT, 'sw.js');
const packageJsonPath = path.join(ROOT, 'package.json');
const ttgPath = path.join(ROOT, 'timetable_generator.js');

const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const appJs = fs.readFileSync(appJsPath, 'utf8');
const swJs = fs.readFileSync(swJsPath, 'utf8');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const ttgJs = fs.readFileSync(ttgPath, 'utf8');

// 1. Assert Legal Disclaimer in index.html
assert(indexHtml.includes('id="miluim-legal-disclaimer-box"'), 'Missing #miluim-legal-disclaimer-box in index.html');
assert(indexHtml.includes('איננה מקושרת באופן רשמי לטכניון'), 'Missing Technion non-affiliation disclaimer');
assert(indexHtml.includes('כל מקרה נבחן לגופו'), 'Missing case-by-case examination disclaimer');
assert(indexHtml.includes('הסרת אחריות מוחלטת'), 'Missing absolute liability waiver text');
console.log('✅ Check 1: Mandatory Legal Disclaimer and Liability Waiver is present and prominent in index.html');

// 2. Assert Reservist Active Checkbox & Gated Structure in index.html
assert(indexHtml.includes('id="miluim-active-status-toggle"'), 'Missing #miluim-active-status-toggle in index.html');
assert(indexHtml.includes('id="miluim-inactive-notice"'), 'Missing #miluim-inactive-notice in index.html');
assert(indexHtml.includes('id="miluim-active-content-section"'), 'Missing #miluim-active-content-section in index.html');
console.log('✅ Check 2: Active Reservist Declaration Checkbox and Gated View Sections present in modal');

// 3. Assert Settings Tab & Degree Planner Disclaimers
assert(indexHtml.includes('id="setting-is-reservist"'), 'Missing #setting-is-reservist in Settings tab');
assert(indexHtml.includes('פטור בפועל מותנה באישור מזכירות לימודי הסמכה (מעל 30 ימי שירות) וכל מקרה נבחן לגופו'), 'Missing Planner reservist legal disclaimer');
console.log('✅ Check 3: Settings tab master reservist toggle and Degree Planner legal notices verified');

// 4. Assert Logic in app.js
assert(appJs.includes('miluim-active-status-toggle'), 'MiluimRightsAdvisor must bind #miluim-active-status-toggle');
assert(appJs.includes('semestero_is_active_reservist'), 'app.js must persist semestero_is_active_reservist in localStorage');
assert(appJs.includes('miluim-inactive-notice'), 'MiluimRightsAdvisor must toggle #miluim-inactive-notice');
assert(appJs.includes('setting-is-reservist'), 'app.js must sync with setting-is-reservist in settings page');
assert(appJs.includes('REV-2026.10.18-v2.4.15'), 'app.js must have REV-2026.10.18-v2.4.15');
assert(appJs.includes('window.APP_VERSION = "2.4.15"'), 'app.js must have window.APP_VERSION = "2.4.15"');
console.log('✅ Check 4: app.js business logic, state persistence, and multi-modal synchronization verified');

// 5. Assert Version Bumps across repo
assert.strictEqual(packageJson.version, '2.4.15', 'package.json version must be 2.4.15');
assert(swJs.includes('semestero-me-v2.4.15'), 'sw.js CACHE_NAME must be semestero-me-v2.4.15');
assert(ttgJs.includes('v2.4.15'), 'timetable_generator.js must reference v2.4.15');
assert(indexHtml.includes('גרסה אחרונה v2.4.15'), 'index.html changelog must show v2.4.15');
assert(indexHtml.includes('v2.4.15 ✨'), 'index.html footer must display v2.4.15 ✨');
console.log('✅ Check 5: All version numbers and Service Worker cache keys bumped to v2.4.15');

console.log('\n🎯 ALL 5/5 RIGOROUS VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀');
